import { db } from './database-service';
import type { PoolConnection } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

interface Bayi extends RowDataPacket {
  id: number;
  ad: string;
  telefon: string | null;
  email: string | null;
  adres: string | null;
  il: string | null;
  ilce: string | null;
  aktif: number;
  firma: number | null;
  firma_adi: string | null;
  firma_unvan: string | null;
  sabit_ip: string | null;
  bayi_oran: number | null;
  deleted_at: Date | null;
}

interface GetBayilerParams {
  page?: number;
  limit?: number;
  search?: string;
  firmaId?: number;
  aktif?: boolean;
}

export class BayiService {
  async bayiSil(id: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Önce bayiyi kontrol et
      const [bayiRows]: any = await connection.execute(
        'SELECT * FROM bayiler WHERE id = ?',
        [id]
      );

      if (!bayiRows.length) {
        throw new Error("Bayi bulunamadı veya zaten silinmiş");
      }

      // Bakiye işlemlerini kontrol et
      const [bakiyeRows]: any = await connection.execute(
        `SELECT 
          COUNT(*) as islem_sayisi,
          COALESCE(SUM(CASE 
            WHEN manuel_yukleme = 1 THEN 1 
            ELSE 0 
          END), 0) as manuel_yukleme_sayisi,
          COALESCE(SUM(CASE 
            WHEN iyzico_yukleme = 1 THEN 1 
            ELSE 0 
          END), 0) as iyzico_yukleme_sayisi,
          COALESCE(SUM(CASE 
            WHEN test_komisyonu = 1 OR manuel_komisyon = 1 THEN 1 
            ELSE 0 
          END), 0) as komisyon_sayisi
        FROM bakiye_islemleri 
        WHERE bayi_id = ?`,
        [id]
      );

      const islemBilgileri = bakiyeRows[0];
      const hasTransactions = islemBilgileri.islem_sayisi > 0;

      let detayliMesaj = '';
      if (hasTransactions) {
        const mesajParcalari = [];
        if (islemBilgileri.manuel_yukleme_sayisi > 0) {
          mesajParcalari.push(`${islemBilgileri.manuel_yukleme_sayisi} manuel bakiye yükleme`);
        }
        if (islemBilgileri.iyzico_yukleme_sayisi > 0) {
          mesajParcalari.push(`${islemBilgileri.iyzico_yukleme_sayisi} iyzico ödemesi`);
        }
        if (islemBilgileri.komisyon_sayisi > 0) {
          mesajParcalari.push(`${islemBilgileri.komisyon_sayisi} komisyon işlemi`);
        }
        detayliMesaj = ` (${mesajParcalari.join(', ')})`;
      }

      // Bayi güncelleme sorgusu
      await connection.execute(
        'UPDATE bayiler SET aktif = 0 WHERE id = ?',
        [id]
      );

      await connection.commit();

      return {
        success: true,
        message: hasTransactions 
          ? `Bayi pasif duruma alındı. Bakiye işlem geçmişi korundu${detayliMesaj}`
          : 'Bayi başarıyla silindi.'
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Bayi silme hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bayi silme işlemi başarısız oldu'
      };
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async bayiEkle(bayiData: Partial<Bayi>) {
    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      // Aynı firmada aynı isimli bayi kontrolü
      const [kontrolRows]: any = await connection.execute(
        'SELECT COUNT(*) as sayi FROM bayiler WHERE firma = ? AND ad = ?',
        [bayiData.firma_id || bayiData.firma, bayiData.ad]
      );

      if (kontrolRows[0].sayi > 0) {
        return {
          success: false,
          message: 'Bu firmada aynı isimli aktif bir bayi zaten mevcut'
        };
      }

      const values = [
        bayiData.ad || null,
        bayiData.telefon || null,
        bayiData.email || null,
        bayiData.adres || null,
        bayiData.il || null,
        bayiData.ilce || null,
        bayiData.aktif ? 1 : 0,
        bayiData.firma_id || bayiData.firma || null, 
        typeof bayiData.bayi_oran === 'number' ? bayiData.bayi_oran : null
      ];

      const [result] = await connection.execute(
        `INSERT INTO bayiler (
          ad, telefon, email, adres, il, ilce,
          aktif, firma, bayi_oran
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );

      await connection.commit();

      return {
        success: true,
        data: result
      };

    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Bayi ekleme hatası:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bayi ekleme işlemi başarısız oldu'
      };
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async getBayiler(params: GetBayilerParams = {}) {
    const {
      page = 1,
      limit = 25,
      search = '',
      firmaId,
      aktif
    } = params;

    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();

      let whereConditions = [];
      const queryParams: any[] = [];

      // Search condition - case insensitive
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        whereConditions.push(`(
          b.ad LIKE ? OR 
          b.email LIKE ? OR 
          b.telefon LIKE ?
        )`);
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      // Company filter
      if (firmaId) {
        whereConditions.push('b.firma = ?');
        queryParams.push(firmaId);
      }

      // Active/Passive filter - only if explicitly specified
      if (typeof aktif === 'boolean') {
        whereConditions.push('b.aktif = ?');
        queryParams.push(aktif ? 1 : 0);
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      const offset = (page - 1) * limit;

      // Get total count
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM bayiler b ${whereClause}`,
        queryParams
      ) as [RowDataPacket[], any];

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Main query
      const query = `
        SELECT 
          b.*,
          f.firma_unvan as firma_adi,
          f.firma_unvan,
          f.id as firma_id
        FROM bayiler b
        LEFT JOIN firmalar f ON b.firma = f.id
        ${whereClause}
        ORDER BY b.ad ASC
        LIMIT ? OFFSET ?
      `;

      console.log('Raw query parameters:', params);
      console.log('Parsed parameters:', {
        page,
        limit,
        search,
        firmaId,
        aktif
      });

      const [rows] = await connection.execute(
        query,
        [...queryParams, limit, offset]
      ) as [Bayi[], any];

      return {
        success: true,
        data: rows.map(bayi => ({
          id: bayi.id,
          ad: bayi.ad || '',
          telefon: bayi.telefon || '',
          email: bayi.email || '',
          adres: bayi.adres || '',
          il: bayi.il || '',
          ilce: bayi.ilce || '',
          aktif: Boolean(bayi.aktif),
          firma_adi: bayi.firma_adi || '',
          firma_unvan: bayi.firma_unvan || '',
          firma_id: bayi.firma_id || bayi.firma || null,
          durum: Boolean(bayi.aktif) ? 'Aktif' : 'Pasif',
          sabit_ip: bayi.sabit_ip || '',
          bayi_oran: typeof bayi.bayi_oran === 'number' ? bayi.bayi_oran : 0
        })),
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit
        }
      };

    } catch (error) {
      console.error('Bayileri getirme hatası:', error);
      return {
        success: false,
        message: 'Bayiler listesi alınamadı'
      };
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async getBayiById(id: number) {
    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();

      const [rows] = await connection.execute(
        `SELECT 
          b.*,
          f.firma_unvan as firma_adi,
          f.firma_unvan
        FROM bayiler b
        LEFT JOIN firmalar f ON b.firma = f.id
        WHERE b.id = ?`,
        [id]
      ) as [Bayi[], any];

      if (!rows.length) {
        return {
          success: false,
          message: 'Bayi bulunamadı'
        };
      }

      const bayi = rows[0];
      return {
        success: true,
        data: {
          id: bayi.id,
          ad: bayi.ad || '',
          telefon: bayi.telefon || '',
          email: bayi.email || '',
          adres: bayi.adres || '',
          il: bayi.il || '',
          ilce: bayi.ilce || '',
          aktif: Boolean(bayi.aktif),
          firma_adi: bayi.firma_adi || '',
          firma_unvan: bayi.firma_unvan || '',
          firma_id: bayi.firma || null,
          durum: Boolean(bayi.aktif) ? 'Aktif' : 'Pasif',
          sabit_ip: bayi.sabit_ip || '',
          bayi_oran: typeof bayi.bayi_oran === 'number' ? bayi.bayi_oran : 0
        }
      };

    } catch (error) {
      console.error('Bayi getirme hatası:', error);
      return {
        success: false,
        message: 'Bayi bilgileri alınamadı'
      };
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
}

export const bayiService = new BayiService();