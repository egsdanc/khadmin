import { db } from "./database-service";
import type { PoolConnection } from "mysql2/promise";
import { bayiler } from "@db/schema";
import { eq } from "drizzle-orm";

interface BakiyeHareketi {
  id: number;
  bayi_id: number;
  bayi_adi: string;
  firma_adi?: string;
  manuel_yukleme: number;
  iyzico_yukleme: number;
  miktar: number;
  bakiye_sonrasi: number;
  aciklama?: string;
  created_at: string;
  bayi_aktif: boolean;
}

interface BakiyeFilter {
  bayiler?: number[];
  firmalar?: number[];
  minTutar?: number;
  maxTutar?: number;
  siralama?: string;
}

export class BakiyeService {
  async bakiyeYukle(bayiId: number, miktar: number, yuklemeTipi: 'manual' | 'iyzico' = 'manual'): Promise<void> {
    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const [bayiRows]: any = await connection.execute(
        'SELECT bakiye FROM bayiler WHERE id = ?',
        [bayiId]
      );

      if (!bayiRows.length) {
        throw new Error("Bayi bulunamadı");
      }

      const mevcutBakiye = parseFloat(bayiRows[0].bakiye || '0');
      const yeniBakiye = mevcutBakiye + miktar;

      const formatNumberForDB = (num: number): string => {
        return num.toFixed(2); 
      };

      await connection.execute(
        `INSERT INTO bakiye_islemleri (
          bayi_id,
          miktar,
          bakiye_sonrasi,
          manuel_yukleme,
          iyzico_yukleme,
          aciklama
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          bayiId,
          formatNumberForDB(miktar),
          formatNumberForDB(yeniBakiye),
          yuklemeTipi === 'manual' ? "1.00" : '0.00',
          yuklemeTipi === 'iyzico' ? "1.00" : '0.00',
          yuklemeTipi === 'manual' ?
            `Manuel bakiye yükleme: ${miktar.toFixed(2)} TL` :
            `iyzico ile bakiye yükleme: ${miktar.toFixed(2)} TL`
        ]
      );

      await connection.execute(
        'UPDATE bayiler SET bakiye = ? WHERE id = ?',
        [formatNumberForDB(yeniBakiye), bayiId]
      );

      await connection.commit();
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }
      console.error('Bakiye yükleme hatası:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async getBakiyeHareketleri(
    bayiId: number | null = null,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10,
    filter?: BakiyeFilter
  ): Promise<{ hareketler: BakiyeHareketi[]; total: number; totalPages: number }> {
    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();

      const baseQuery = `
        FROM bakiye_islemleri bi 
        LEFT JOIN bayiler b ON b.id = bi.bayi_id
        LEFT JOIN firmalar f ON f.id = b.firma
        WHERE 1=1
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (bayiId !== null) {
        conditions.push('AND bi.bayi_id = ?');
        params.push(bayiId);
      }

      if (startDate && endDate) {
        conditions.push('AND DATE(bi.created_at) BETWEEN ? AND ?');
        params.push(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      }

      if (filter?.bayiler && filter.bayiler.length > 0) {
        conditions.push(`AND bi.bayi_id IN (${filter.bayiler.join(',')})`);
      }

      if (filter?.firmalar && filter.firmalar.length > 0) {
        conditions.push(`AND b.firma IN (${filter.firmalar.join(',')})`);
      }

      if (filter?.minTutar !== undefined) {
        conditions.push('AND bi.miktar >= ?');
        params.push(filter.minTutar);
      }

      if (filter?.maxTutar !== undefined) {
        conditions.push('AND bi.miktar <= ?');
        params.push(filter.maxTutar);
      }

      const whereClause = conditions.join(' ');

      // Toplam kayıt sayısını al
      const countQuery = `SELECT COUNT(bi.id) as total ${baseQuery} ${whereClause}`;
      
      const [countRows] = await connection.execute(countQuery, params);
      const total = (countRows as any[])[0].total;

      const offset = (page - 1) * limit;

      let orderClause = 'ORDER BY bi.created_at DESC';
      if (filter?.siralama) {
        switch (filter.siralama) {
          case 'tarih_asc':
            orderClause = 'ORDER BY bi.created_at ASC';
            break;
          case 'tutar_desc':
            orderClause = 'ORDER BY bi.miktar DESC';
            break;
          case 'tutar_asc':
            orderClause = 'ORDER BY bi.miktar ASC';
            break;
        }
      }

      const selectQuery = `
        SELECT 
          bi.id,
          bi.bayi_id,
          bi.miktar,
          bi.bakiye_sonrasi,
          bi.manuel_yukleme,
          bi.iyzico_yukleme,
          bi.aciklama,
          bi.created_at,
          b.ad as bayi_adi,
          b.aktif as bayi_aktif,
          f.name as firma_adi
        ${baseQuery}
        ${whereClause}
        ${orderClause}
        LIMIT ? OFFSET ?
      `;

      const queryParams = [...params, limit, offset];
      const [rows] = await connection.execute(selectQuery, queryParams);

      const hareketler = (rows as any[]).map((row: any) => ({
        id: Number(row.id),
        bayi_id: Number(row.bayi_id),
        bayi_adi: row.bayi_adi || 'Bilinmeyen Bayi',
        firma_adi: row.firma_adi || 'Firma Bulunamadı',
        bayi_aktif: Boolean(row.bayi_aktif),
        manuel_yukleme: Number(row.manuel_yukleme || 0),
        iyzico_yukleme: Number(row.iyzico_yukleme || 0),
        miktar: Number(row.miktar || 0),
        bakiye_sonrasi: Number(row.bakiye_sonrasi || 0),
        aciklama: row.aciklama,
        created_at: row.created_at
      }));

      return {
        hareketler,
        total,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('Bakiye hareketleri listeleme hatası:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
  async getAylikBayiBakiyeRaporu(ay: number, yil: number): Promise<any[]> {
    let connection: PoolConnection | null = null;
    try {
      connection = await db.getConnection();

      const query = `
        SELECT 
          b.id as bayi_id,
          b.ad as bayi_adi,
          f.name as firma_adi,
          COALESCE(
            (
              SELECT bakiye_sonrasi
              FROM bakiye_islemleri bi
              WHERE bi.bayi_id = b.id 
                AND MONTH(bi.created_at) = ?
                AND YEAR(bi.created_at) = ?
              ORDER BY bi.created_at DESC
              LIMIT 1
            ), 
            0
          ) as toplam_bakiye,
          COALESCE(
            (
              SELECT bakiye_sonrasi
              FROM bakiye_islemleri bi
              WHERE bi.bayi_id = b.id 
                AND (
                  DATE(bi.created_at) < DATE(?)
                )
              ORDER BY bi.created_at DESC
              LIMIT 1
            ),
            0
          ) as devir_bakiye,
          COALESCE(
            (
              SELECT SUM(
                CASE 
                  WHEN bi.manuel_yukleme > 0 THEN bi.manuel_yukleme
                  WHEN bi.iyzico_yukleme > 0 THEN bi.iyzico_yukleme
                  ELSE bi.miktar
                END
              )
              FROM bakiye_islemleri bi
              WHERE bi.bayi_id = b.id 
                AND MONTH(bi.created_at) = ?
                AND YEAR(bi.created_at) = ?
            ),
            0
          ) as aylik_bakiye
        FROM bayiler b
        LEFT JOIN firmalar f ON b.firma = f.id
        WHERE b.deleted_at IS NULL
        ORDER BY f.name, b.ad
      `;

      const ayBaslangic = `${yil}-${String(ay).padStart(2, '0')}-01`;

      const [rows] = await connection.execute(query, [ay, yil, ayBaslangic, ay, yil]);

      return (Array.isArray(rows) ? rows : []).map((row: any) => ({
        bayi_id: Number(row.bayi_id),
        bayi_adi: row.bayi_adi,
        firma_adi: row.firma_adi || 'Firma Bulunamadı',
        devir_bakiye: row.devir_bakiye,
        aylik_bakiye: row.aylik_bakiye,
        toplam_bakiye: row.toplam_bakiye,
        ay,
        yil
      }));

    } catch (error) {
      console.error('Aylık bayi bakiye raporu hatası:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  async getUserBalance(userId: number) {
    try {
      const result = await db
        .select({
          bakiye: bayiler.bakiye
        })
        .from(bayiler)
        .where(eq(bayiler.id, userId))
        .limit(1);

      return result[0]?.bakiye || 0;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      throw error;
    }
  }
}

export const bakiyeService = new BakiyeService();