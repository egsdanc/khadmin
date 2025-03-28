import { executeQuery } from './connection';
import type { RowDataPacket } from 'mysql2';

interface KomisyonHesaplama {
  test_id: number;
  ucret: number;
}

interface KomisyonDetay {
  komisyon_tutar: number;
  bakiye: number;
}

interface KomisyonQuery {
  page?: number;
  limit?: number;
  firma_id?: number;
  bayi_id?: number;
  start_date?: string;
  end_date?: string;
}

interface KomisyonRowData extends RowDataPacket {
  id: number;
  test_id: string;
  firma_id: number;
  bayi_id: number;
  bayi_oran: string | number;
  ucret: number;
  komisyon_tutar: number;
  bakiye: number;
  created_at: string;
}

export class KomisyonService {
  async getKomisyonlar(params: KomisyonQuery) {
    try {
      const {
        page = 1,
        limit = 10,
        firma_id,
        bayi_id,
        start_date,
        end_date
      } = params;

      const offset = (page - 1) * limit;

      let mainQuery = `
        SELECT 
          bk.*,
          f.name as firma_name,
          b.ad as bayi_name
        FROM bakiye_komisyonlar bk
        LEFT JOIN bayiler b ON bk.bayi_id = b.id
        LEFT JOIN firmalar f ON bk.firma_id = f.id
        WHERE 1=1
      `;

      const values: any[] = [];

      if (firma_id) {
        mainQuery += ' AND bk.firma_id = ?';
        values.push(firma_id);
      }

      if (bayi_id) {
        mainQuery += ' AND bk.bayi_id = ?';
        values.push(bayi_id);
      }

      if (start_date) {
        mainQuery += ' AND DATE(bk.created_at) >= DATE(?)';
        values.push(start_date);
      }
      if (end_date) {
        mainQuery += ' AND DATE(bk.created_at) <= DATE(?)';
        values.push(end_date);
      }

      mainQuery += ' ORDER BY bk.created_at DESC LIMIT ? OFFSET ?';
      values.push(Number(limit), offset);

      const results = await executeQuery<KomisyonRowData[]>(mainQuery, values);

      let countQuery = mainQuery.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
      countQuery = countQuery.replace(/ORDER BY.*$/, '');

      const [countResult] = await executeQuery<RowDataPacket & { total: number }[]>(countQuery, values.slice(0, -2));
      const total = countResult.total;

      return {
        komisyonlar: results,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        params: { firma_id, bayi_id, start_date, end_date }
      };

    } catch (error) {
      console.error('Komisyon listesi alma hatası:', error);
      throw error;
    }
  }

  async hesaplaKomisyon(data: KomisyonHesaplama): Promise<KomisyonDetay> {
    try {
      const [testResult] = await executeQuery<RowDataPacket & {
        id: number;
        firma_id: number;
        usersid: number;
      }[]>(
        'SELECT t.*, pu.firma_id FROM testler t LEFT JOIN panel_users pu ON t.usersid = pu.id WHERE t.id = ?',
        [data.test_id]
      );

      if (!testResult) {
        throw new Error("Test bulunamadı");
      }

      const [firmaResult] = await executeQuery<RowDataPacket & {
        id: number;
        firma_oran: string | number;
        bayi_oran: string | number;
      }[]>(
        'SELECT * FROM firmalar WHERE id = ?',
        [testResult.firma_id]
      );

      if (!firmaResult) {
        throw new Error("Firma bulunamadı");
      }

      const firma_oran = parseFloat(String(firmaResult.firma_oran || '10'));
      const bayi_oran = parseFloat(String(firmaResult.bayi_oran || '10'));

      const komisyon_tutar = (data.ucret * firma_oran) / 100;
      const bakiye = komisyon_tutar;

      await executeQuery(
        `INSERT INTO bakiye_komisyonlar 
         (test_id, firma_id, bayi_id, bayi_oran, ucret, komisyon_tutar, bakiye) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.test_id, testResult.firma_id, testResult.usersid, bayi_oran, data.ucret, komisyon_tutar, bakiye]
      );

      return {
        komisyon_tutar,
        bakiye
      };
    } catch (error) {
      console.error('Komisyon hesaplama hatası:', error);
      throw error;
    }
  }
}

export const komisyonService = new KomisyonService();