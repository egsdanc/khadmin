import { Router, Request, Response, NextFunction } from "express";
import { db } from "../services/database-service";
import { bayiService } from '../services/bayi-service';

const router = Router();

router.get("/top-balance", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [results] = await connection.execute(
      `SELECT 
        b.id,
        b.ad as bayi_adi,
        b.bakiye,
        f.name as firma_adi
      FROM bayiler b
      LEFT JOIN firmalar f ON b.firma = f.id
      WHERE b.aktif = 1
      ORDER BY CAST(b.bakiye AS DECIMAL(10,2)) DESC
      LIMIT 5`
    );

    res.json({
      success: true,
      data: (results as any[]).map(row => ({
        name: row.bayi_adi,
        value: parseFloat(row.bakiye || '0'),
        firma: row.firma_adi
      }))
    });

  } catch (error) {
    console.error('En yüksek bakiyeli bayiler getirilirken hata:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    const {
      firmaId,
      aktif,
      page = '1',
      limit = '10',
      search = ''
    } = req.query;

    console.log('Query params:', { firmaId, aktif, page, limit, search });

    connection = await db.getConnection();

    // Let's first check total counts for debugging
    const [totalCountResult] = await connection.execute(
      'SELECT aktif, COUNT(*) as count FROM bayiler GROUP BY aktif'
    );
    console.log('Total counts by aktif status:', totalCountResult);

    // Base query
    let selectQuery = `
      SELECT 
        b.id, 
        b.ad, 
        b.firma,
        b.aktif,
        b.email,
        b.telefon,
        b.adres,
        b.il,
        b.ilce,
        b.bayi_oran,
        b.vergi_dairesi,
        b.vergi_no,
        COALESCE(f.name, 'Firma Bulunamadı') as firma_name
      FROM bayiler b
      LEFT JOIN firmalar f ON b.firma = f.id
      WHERE 1=1
    `;

    let whereConditions = [];
    const queryParams: any[] = [];

    // Add search filter
    if (search) {
      whereConditions.push('(b.ad LIKE ? OR b.email LIKE ? OR b.telefon LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add firma filter if provided
    if (firmaId) {
      whereConditions.push('b.firma = ?');
      queryParams.push(firmaId);
    }

    // Add aktif filter if provided
    if (aktif !== undefined && aktif !== null && aktif !== '') {
      const aktifValue = aktif === 'true' ? 1 : 0;
      if (aktifValue === 1) {
        // For active dealers, only show non-deleted ones
        whereConditions.push('(b.aktif = ? AND b.deleted_at IS NULL)');
      } else {
        // For inactive dealers, show all including deleted ones
        whereConditions.push('b.aktif = ?');
      }
      queryParams.push(aktifValue);
      console.log('Applying aktif filter:', aktifValue);
    } else {
      // By default, only show non-deleted records
      whereConditions.push('b.deleted_at IS NULL');
    }

    // Add WHERE conditions if any
    if (whereConditions.length > 0) {
      selectQuery += ' AND ' + whereConditions.join(' AND ');
    }

    // Add ordering
    selectQuery += ' ORDER BY b.ad ASC';

    // Add pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;
    selectQuery += ' LIMIT ? OFFSET ?';
    queryParams.push(limitNum, offset);

    // Count query for pagination
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM bayiler b 
      WHERE 1=1
    `;
    if (whereConditions.length > 0) {
      countQuery += ' AND ' + whereConditions.join(' AND ');
    }

    console.log('Final query:', selectQuery);
    console.log('Query params:', queryParams);

    const [results] = await connection.execute(selectQuery, queryParams);
    const [countResults] = await connection.execute(countQuery, queryParams.slice(0, -2));
    const total = (countResults as any)[0].total;

    console.log('Query results count:', (results as any[]).length);
    console.log('Total count:', total);
    console.log('First few results:', (results as any[]).slice(0, 2));

    res.json({
      success: true,
      data: results,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Bayiler getirilirken hata:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    const bayiId = parseInt(req.params.id);

    if (isNaN(bayiId)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz bayi ID'si"
      });
    }

    connection = await db.getConnection();
    const [bayiRows] = await connection.execute(
      `SELECT b.*, f.name as firma_name
       FROM bayiler b
       LEFT JOIN firmalar f ON b.firma = f.id
       WHERE b.id = ?`,
      [bayiId]
    );

    if (!bayiRows || !(bayiRows as any[]).length) {
      return res.status(404).json({
        success: false,
        message: "Bayi bulunamadı"
      });
    }

    res.json({
      success: true,
      data: (bayiRows as any[])[0]
    });

  } catch (error) {
    console.error('Bayi getirilirken hata:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    console.log('Yeni bayi ekleme isteği:', req.body);

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Insert new dealer
    const [result] = await connection.execute(
      `INSERT INTO bayiler (
        ad, firma, email, telefon, adres, 
        il, ilce, aktif, bayi_oran, 
        vergi_dairesi, vergi_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.ad,
        req.body.firma_id,
        req.body.email,
        req.body.telefon,
        req.body.adres,
        req.body.il,
        req.body.ilce,
        req.body.aktif ? 1 : 0,
        req.body.bayi_oran,
        req.body.vergi_dairesi,
        req.body.vergi_no
      ]
    );

    await connection.commit();

    // Get the newly created dealer with firma details
    const [newBayiRows] = await connection.execute(
      `SELECT b.*, f.name as firma_name
       FROM bayiler b
       LEFT JOIN firmalar f ON b.firma = f.id
       WHERE b.id = ?`,
      [(result as any).insertId]
    );

    res.status(201).json({
      success: true,
      message: "Bayi başarıyla eklendi",
      data: (newBayiRows as any[])[0]
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Bayi eklenirken hata:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    console.log('Bayi güncelleme isteği:', req.body);
    const bayiId = parseInt(req.params.id);

    if (isNaN(bayiId)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz bayi ID'si"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE bayiler 
       SET ad = ?, firma = ?, email = ?, telefon = ?, adres = ?, 
           il = ?, ilce = ?, aktif = ?, bayi_oran = ?, vergi_dairesi = ?, vergi_no = ?
       WHERE id = ?`,
      [
        req.body.ad || null,
        req.body.firma_id || null,
        req.body.email || null,
        req.body.telefon || null,
        req.body.adres || null,
        req.body.il || null,
        req.body.ilce || null,
        req.body.aktif ? 1 : 0,
        req.body.bayi_oran || null,
        req.body.vergi_dairesi || null,
        req.body.vergi_no || null,
        bayiId
      ]
    );

    await connection.commit();

    // Get updated dealer info
    const [updatedBayiRows] = await connection.execute(
      `SELECT b.*, f.name as firma_name
       FROM bayiler b
       LEFT JOIN firmalar f ON b.firma = f.id
       WHERE b.id = ?`,
      [bayiId]
    );

    res.json({
      success: true,
      message: "Bayi başarıyla güncellendi",
      data: (updatedBayiRows as any[])[0]
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Bayi güncellenirken hata:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    const bayiId = parseInt(req.params.id);

    if (isNaN(bayiId)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz bayi ID'si"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // First check dealer status
    const [bayiRows] = await connection.execute(
      'SELECT * FROM bayiler WHERE id = ?',
      [bayiId]
    );

    if (!bayiRows || !(bayiRows as any[]).length) {
      return res.status(404).json({
        success: false,
        message: "Bayi bulunamadı"
      });
    }

    // Check balance transactions
    const [bakiyeRows] = await connection.execute(
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
          WHEN test_komisyonu = 1 THEN 1 
          ELSE 0 
        END), 0) as komisyon_sayisi
      FROM bakiye_islemleri 
      WHERE bayi_id = ?`,
      [bayiId]
    );

    const islemBilgileri = (bakiyeRows as any[])[0];
    const hasTransactions = islemBilgileri.islem_sayisi > 0;

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

      // Even if there are transactions, we'll just deactivate the dealer
      await connection.execute(
        'UPDATE bayiler SET aktif = 0 WHERE id = ?',
        [bayiId]
      );
      await connection.commit();

      return res.json({
        success: true,
        message: `Bayi deaktif edildi. (İşlem geçmişi: ${mesajParcalari.join(", ")})`
      });
    }

    // If no transactions, still just deactivate
    await connection.execute(
      'UPDATE bayiler SET aktif = 0 WHERE id = ?',
      [bayiId]
    );
    await connection.commit();

    res.json({
      success: true,
      message: "Bayi başarıyla deaktif edildi"
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Bayi deaktif edilirken hata:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.get('/:id/name', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const name = await bayiService.getBayiNameById(id);
    res.json({ name });
  } catch (error) {
    console.error('Error fetching dealer name:', error);
    res.status(500).json({ error: 'Failed to fetch dealer name' });
  }
});

export default router;