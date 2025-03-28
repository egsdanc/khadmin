import { Router, Request, Response } from "express";
import { db } from "../services/database-service";
import { z } from 'zod';

const router = Router();

// Ana GET endpoint'i - kilometre test kayıtlarını getir
router.get("/", async (req: Request, res: Response) => {
  let connection;
  try {
    console.log("Kilometre kayıtları getiriliyor...", req.query);

    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      plaka,
      usersid,
      user
    } = req.query;

    // User bilgisini JSON'dan parse et
    let userObj;
    try {
      userObj = user ? JSON.parse(user as string) : null;
    } catch (e) {
      console.error("User parsing error:", e);
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kullanıcı verisi'
      });
    }

    // Eğer user objesi yoksa veya geçerli bir role içermiyorsa, erişimi reddet
    if (!userObj || !userObj.role) {
      return res.status(403).json({
        success: false,
        error: 'Yetkisiz erişim'
      });
    }

    connection = await db.getConnection();

    // Role kontrolü - Admin veya Super Admin dışındaki roller için kısıtlamalar uygula
    const isAdmin = userObj.role === 'Admin' || userObj.role === 'Super Admin';
    const isBayi = userObj.role === 'Bayi';
    
    // 5. koşul: Role Bayi veya Admin/Super Admin değilse, hiçbir şey döndürme
    if (!isAdmin && !isBayi) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: Number(page),
          limit: Number(limit)
        }
      });
    }

    let whereConditions = [];
    const queryParams: any[] = [];

    // Tarih filtresi
    if (startDate) {
      whereConditions.push('DATE(t.tarih) >= DATE(?)');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(t.tarih) <= DATE(?)');
      queryParams.push(endDate);
    }

    // Plaka filtresi
    if (plaka) {
      whereConditions.push('t.plaka LIKE ?');
      queryParams.push(`%${plaka}%`);
    }

    // Kullanıcı filtresi (manuel olarak belirtilen)
    if (usersid) {
      whereConditions.push('t.usersid = ?');
      queryParams.push(usersid);
    }

    // Bayi rolü için ek filtreler - Admin/Super Admin için filtreleme yapmıyoruz
    if (isBayi && userObj.bayi_id) {
      // Bayiye ait kullanıcıları bul
      const [bayiKullanicilari] = await connection.execute(
        `SELECT id FROM kullanicilar WHERE bayi_id = ?`,
        [userObj.bayi_id]
      );
      
      if (Array.isArray(bayiKullanicilari) && bayiKullanicilari.length > 0) {
        const userIds = (bayiKullanicilari as any[]).map(user => user.id);
        
        if (userIds.length > 0) {
          // Bayiye ait kullanıcıların testlerini filtrele
          const userIdsStr = userIds.map(() => '?').join(',');
          whereConditions.push(`t.usersid IN (${userIdsStr})`);
          queryParams.push(...userIds);
        } else {
          // Eğer bayiye bağlı kullanıcı yoksa, hiçbir sonuç döndürme
          whereConditions.push('1=0');
        }
      } else {
        // Eğer bayiye bağlı kullanıcı yoksa, hiçbir sonuç döndürme
        whereConditions.push('1=0');
      }
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Ana sorgu - doğrudan testler tablosundan sorgula, alt sorguyu kaldır
    const baseQuery = `
    SELECT 
      t.test_id,
      t.tarih,
      t.plaka,
      t.marka,
      t.model,
      t.sase,
      t.motor,
      t.gosterge_km,
      t.yil,
      t.usersid,
      t.ucret,
      FORMAT(t.ucret, 2, 'tr_TR') as formatted_ucret,
      k.isim as kullanici_adi,
      COALESCE(f.firma_unvan, '') as firma_adi,
      COALESCE(b.ad, '') as bayi_adi
    FROM (
      SELECT t1.*
      FROM testler t1
      INNER JOIN (
        SELECT test_id, MAX(id) as max_id
        FROM testler
        GROUP BY test_id
      ) t2 ON t1.test_id = t2.test_id AND t1.id = t2.max_id
    ) t
    LEFT JOIN kullanicilar k ON t.usersid = k.id
    LEFT JOIN firmalar f ON k.firma_id = f.id
    LEFT JOIN bayiler b ON k.bayi_id = b.id
    ${whereClause}
    ORDER BY t.test_id DESC
  `;

    // Toplam kayıt sayısını al
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as counted`,
      queryParams
    );

    const total = ((countResult as any)[0]).total;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    // Sayfalanmış sonuçları al
    const [rows] = await connection.execute(
      `${baseQuery} LIMIT ? OFFSET ?`,
      [...queryParams, limitNum, offset]
    );

    console.log("Kilometre kayıtları sorgu sonucu:", rows);

    // Sonuçları formatla
    const formattedRows = Array.isArray(rows) ? (rows as any[]).map(row => ({
      ...row,
      ucret: row.formatted_ucret ? `${row.formatted_ucret} ₺` : '0,00 ₺'
    })) : [];

    res.json({
      success: true,
      data: formattedRows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limitNum),
        currentPage: pageNum,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error("Kilometre kayıtları getirilirken hata:", error);
    res.status(500).json({
      success: false,
      error: 'Kilometre kayıtları alınamadı'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// const baseQuery = `
//       SELECT 
//         t.test_id,
//         t.tarih,
//         t.plaka,
//         t.marka,
//         t.model,
//         t.sase,
//         t.motor,
//         t.gosterge_km,
//         t.yil,
//         t.usersid,
//         t.ucret,
//         FORMAT(t.ucret, 2, 'tr_TR') as formatted_ucret,
//         k.isim as kullanici_adi,
//         COALESCE(f.firma_unvan, '') as firma_adi,
//         COALESCE(b.ad, '') as bayi_adi
//       FROM (
//         SELECT t1.*
//         FROM testler t1
//         INNER JOIN (
//           SELECT test_id, MAX(id) as max_id
//           FROM testler
//           GROUP BY test_id
//         ) t2 ON t1.test_id = t2.test_id AND t1.id = t2.max_id
//       ) t
//       LEFT JOIN kullanicilar k ON t.usersid = k.id
//       LEFT JOIN firmalar f ON k.firma_id = f.id
//       LEFT JOIN bayiler b ON k.bayi_id = b.id
//       ${whereClause}
//       ORDER BY t.test_id DESC
//     `;


// Total-fees endpoint - test_id bazında toplam ücretleri hesapla
router.get("/total-fees", async (req: Request, res: Response) => {
  let connection;
  try {
    // Parse the user object from query parameters
    const userParam = req.query.user as string;
    const user = JSON.parse(userParam);

    connection = await db.getConnection();
    console.log(user.user.bayi_id, "dfghghff");

    // Base query for calculating total fees
    let query = `
      SELECT 
        FORMAT(SUM(t1.ucret), 2, 'tr_TR') as formatted_total_fees,
        SUM(t1.ucret) as total_fees,
        COUNT(DISTINCT t1.test_id) as total_tests
      FROM testler t1
      INNER JOIN (
        SELECT test_id, MAX(id) as max_id
        FROM testler
        GROUP BY test_id
      ) t2 ON t1.test_id = t2.test_id AND t1.id = t2.max_id
      WHERE t1.ucret IS NOT NULL AND t1.ucret != ''
    `;

    // Admin veya Super Admin için filtreleme yok
    if (user.user.role !== 'Admin' && user.user.role !== 'Super Admin') {
      if (user.user.role === 'Bayi') {
        // Kullanıcının bayi_id'sine sahip kullanıcıları al
        const [userIdsResult] = await connection.execute(
          `SELECT id FROM kullanicilar WHERE bayi_id = ?`, 
          [user.user.bayi_id]
        );

        const userIds = (userIdsResult as any[]).map(u => u.id);

        if (userIds.length > 0) {
          // Bu kullanıcıların testlerini filtrele
          query += ` AND t1.usersid IN (${userIds.join(',')})`;
        } else {
          // Eğer bayi_id'ye sahip hiç kullanıcı yoksa, boş sonuç döndür
          return res.json({
            success: true,
            data: {
              totalFees: 0,
              formattedTotalFees: "0,00 ₺",
              totalTests: 0,
              userRole: user.user.role
            }
          });
        }
      } else {
        // Tanımlanmamış roller için hata dönüşü
        return res.status(403).json({
          success: false,
          message: "Bu işlemi yapmaya yetkiniz yok"
        });
      }
    }

    const [result] = await connection.execute(query);

    console.log("Veritabanı sonucu (toplam test ücretleri):", result);

    res.json({
      success: true,
      data: { 
        totalFees: result && Array.isArray(result) && result.length > 0 ? 
          Number((result[0] as any).total_fees || 0) : 0,
        formattedTotalFees: (result[0] as any).formatted_total_fees ? 
          `${(result[0] as any).formatted_total_fees} ₺` : "0,00 ₺",
        totalTests: (result[0] as any).total_tests || 0,
        userRole: user.user.role // Hata ayıklama için rol bilgisi
      }
    });

  } catch (error) {
    console.error("Test ücretleri toplamı alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: 'Test ücretleri toplamı alınamadı'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


router.get("/stats", async (_req, res) => {
  const { user } = _req.query;
  let connection;

  try {
    let userObj;
    
    // User verisini çözme işlemi
    try {
      userObj = user ? JSON.parse(user as string) : null;
      console.log("uffuu", userObj);
      console.log("uffuu role:", userObj?.user?.role);

    } catch (e) {
      console.error("User parsing error:", e);
      return res.status(400).json({
        success: false,
        error: 'Geçersiz kullanıcı verisi'
      });
    }

    // Eğer user objesi yoksa veya geçerli bir role içermiyorsa, erişimi reddet
    if (!userObj || !userObj.user || !userObj.user.role) {
      return res.status(403).json({
        success: false,
        error: 'Yetkisiz erişim'
      });
    }

    // Veritabanı bağlantısını al
    connection = await db.getConnection();

    // Eğer kullanıcı Admin veya Super Admin ise, tüm verileri hesapla
    if (userObj.user.role === 'Admin' || userObj.user.role === 'Super Admin') {
      console.log("Admin giriş yaptı");

      // Tüm testlerin sayısını hesapla
      const [result] = await connection.execute(`
        SELECT COUNT(DISTINCT t1.test_id) as total_tests
        FROM testler t1
        INNER JOIN (
          SELECT test_id, MAX(id) as max_id
          FROM testler
          GROUP BY test_id
        ) t2 ON t1.test_id = t2.test_id AND t1.id = t2.max_id
      `);

      console.log("Kilometre stats sonucu:", result);

      res.json({
        success: true,
        data: {
          totalTests: result[0]?.total_tests || 0
        }
      });
    } 
    // Eğer kullanıcı Bayi ise, bayi'ye ait kullanıcıların test verilerini getir
    else if (userObj.user.role === 'Bayi' && userObj.user.bayi_id) {
      console.log("Bayi giriş yaptı, bayi_id:", userObj.user.bayi_id);
      
      // 1. ADIM: Bu bayi_id'ye sahip kullanıcıları bul
      // Tablo adını düzelttim: kullaniciler -> kullanicilar
      const [bayiUsers] = await connection.execute(`
        SELECT id
        FROM kullanicilar 
        WHERE bayi_id = ? AND deleted_at IS NULL
      `, [userObj.user.bayi_id]);

      if (!Array.isArray(bayiUsers) || bayiUsers.length === 0) {
        console.log("Bayiye ait kullanıcı bulunamadı, boş sonuç dönülüyor");
        return res.json({
          success: true,
          data: {
            totalTests: 0
          }
        });
      }

      // Kullanıcı ID'lerini çıkar
      const bayiUserIds = bayiUsers.map(u => (u as any).id);
      console.log("Bayiye ait kullanıcı ID'leri:", bayiUserIds);

      // IN sorgusunu düzgün formatta oluştur - IN operatörü için doğru format
      let userPlaceholders = bayiUserIds.map(() => '?').join(',');
      
      // 2. ADIM: Bu kullanıcıların test verilerini al - user_id yerine usersid olarak düzeltildi
      const [result] = await connection.execute(`
        SELECT COUNT(DISTINCT t1.test_id) as total_tests
        FROM testler t1
        INNER JOIN (
          SELECT test_id, MAX(id) as max_id
          FROM testler
          WHERE usersid IN (${userPlaceholders})
          GROUP BY test_id
        ) t2 ON t1.test_id = t2.test_id AND t1.id = t2.max_id
      `, [...bayiUserIds]);

      console.log("Bayi'ye ait kilometre stats sonucu:", result);

      res.json({
        success: true,
        data: {
          totalTests: result[0]?.total_tests || 0
        }
      });
    } else {
      res.status(403).json({
        success: false,
        error: 'Yetkisiz erişim'
      });
    }

  } catch (error) {
    console.error("Kilometre istatistikleri alınırken hata:", error);
    res.status(500).json({
      success: false,
      error: 'Kilometre istatistikleri alınamadı'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Get details of a specific test by ID
router.get("/:testId", async (req: Request, res: Response) => {
  let connection;
  try {
    const testId = req.params.testId;

    connection = await db.getConnection();

    // Get all test records for this test_id
    const [rows] = await connection.execute(`
      SELECT 
        t.id,
        t.test_id,
        t.tarih,
        t.plaka,
        t.marka,
        t.model,
        t.sase,
        t.motor,
        t.gosterge_km,
        t.yil,
        t.kontrolmod,
        t.km,
        t.ucret,
        t.aciklama,
        t.paket,
        FORMAT(t.ucret, 2, 'tr_TR') as formatted_ucret,
        k.isim as kullanici_adi,
        f.name as firma_adi,
        b.ad as bayi_adi
      FROM testler t
      LEFT JOIN kullanicilar k ON t.usersid = k.id
      LEFT JOIN firmalar f ON k.firma_id = f.id
      LEFT JOIN bayiler b ON k.bayi_id = b.id
      WHERE t.test_id = ?
      ORDER BY t.id ASC
    `, [testId]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Test bulunamadı'
      });
    }

    // Format the results - only use ₺ symbol, remove TL
    const formattedRows = rows.map(row => ({
      ...row,
      ucret: row.formatted_ucret ? `${row.formatted_ucret} ₺` : '0,00 ₺'
    }));

    res.json({
      success: true,
      data: formattedRows
    });

  } catch (error) {
    console.error("Test detayları getirilirken hata:", error);
    res.status(500).json({
      success: false,
      error: 'Test detayları alınamadı'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;