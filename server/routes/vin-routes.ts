import { Router, Request, Response, NextFunction } from "express";
import { db } from "../services/database-service";
import { vinreader } from "@db/schema";
import { z } from 'zod';
import { executeQuery } from '../services/connection';

const router = Router();

// Add stats endpoint to get total VIN test count

router.get("/stats", async (req: Request, res: Response) => {
  let connection;
  try {
    // Kullanıcı bilgisini al ve parse et
    const { user: userRaw } = req.query;
    let userObj;

    try {
      userObj = userRaw ? JSON.parse(userRaw as string) : null;
      if (userObj?.user) {
        userObj = userObj.user; // Doğrudan user nesnesine eriş
      }
    } catch (e) {
      console.error("User parsing error:", e);
      return res.status(400).json({ success: false, error: "Geçersiz kullanıcı verisi" });
    }

    if (!userObj || !userObj.role) {
      return res.status(403).json({ success: false, error: "Yetkisiz erişim" });
    }

    connection = await db.getConnection();

    const isAdmin = userObj.role === "Admin" || userObj.role === "Super Admin";
    const isBayi = userObj.role === "Bayi" && userObj.bayi_id;

    if (!isAdmin && !isBayi) {
      return res.json({
        success: true,
        data: { totalTests: 0 },
      });
    }

    // Kullanıcı ID'lerini hazırla
    let userIds: number[] = [];

    if (isBayi) {
      console.log("İstatistikler için bayi filtreleniyor:", userObj.bayi_id);

      const [bayiKullanicilari] = await connection.execute(
        `SELECT id FROM kullanicilar WHERE bayi_id = ?`,
        [userObj.bayi_id]
      );

      if (Array.isArray(bayiKullanicilari) && bayiKullanicilari.length > 0) {
        userIds = (bayiKullanicilari as any[]).map((user) => user.id);
      } else {
        return res.json({
          success: true,
          data: { totalTests: 0 },
        });
      }
    } else if (isAdmin) {
      const [result] = await connection.execute(
        "SELECT COUNT(DISTINCT test_id) as total FROM vinreader"
      );

      return res.json({
        success: true,
        data: {
          totalTests: Array.isArray(result) && result.length > 0 ? (result[0] as any).total : 0,
        },
      });
    }

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: { totalTests: 0 },
      });
    }

    // IN operatörü için kullanıcı ID'leri placeholderlarını oluştur
    const userIdsPlaceholder = userIds.map(() => "?").join(",");

    const [result] = await connection.execute(
      `SELECT COUNT(DISTINCT test_id) as total FROM vinreader WHERE usersid IN (${userIdsPlaceholder})`,
      userIds
    );

    res.json({
      success: true,
      data: {
        totalTests: Array.isArray(result) && result.length > 0 ? (result[0] as any).total : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching VIN test stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch VIN test statistics",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


// Query validation schema
const querySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 25),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  plaka: z.string().optional(),
});

 

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  let connection;
  try {
    console.log("VIN kayıtları getiriliyor...", req.query);

    // Validate and parse query parameters
    const validation = querySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Geçersiz filtre parametreleri",
        errors: validation.error.errors
      });
    }
  const {user} = req.query
    const { page, limit, startDate, endDate, plaka } = validation.data;
    const offset = (page - 1) * limit;

    // Parse user string to object
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

    // Bağlantıyı başlat
    connection = await db.getConnection();

    // Filtreleme koşullarını oluştur
    let whereConditions = [];
    const queryParams: any[] = [];

    // Tarih filtrelemesi
    if (startDate && endDate) {
      whereConditions.push('v1.tarih BETWEEN ? AND ?');
      queryParams.push(new Date(startDate), new Date(endDate));
    }

    // Plaka filtrelemesi
    if (plaka) {
      whereConditions.push('v1.plaka LIKE ?');
      queryParams.push(`%${plaka}%`);
    }

    // Rol bazlı sorgu ekleme
    if (userObj.role === 'Admin' || userObj.role === 'Super Admin') {
      // Admin ve Super Admin için filtreleme yok, tüm kayıtları görebilirler
      console.log("Admin/Super Admin rolü: Tüm kayıtlar getiriliyor");
      // Hiçbir koşul eklenmeyecek - filtresiz sorgu için
    } 
    else if (userObj.role === 'Bayi') {
      // Bayi rolü için filtreleme:
      
      if (!userObj.bayi_id) {
        console.log("Bayi ID bulunamadı, boş sonuç dönülüyor");
        return res.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit
          }
        });
      }
      
      console.log("Bayi rolü: Sadece bayi kullanıcılarının kayıtları getiriliyor, bayi_id:", userObj.bayi_id);
      
      // 1. ADIM: Bu bayi_id'ye sahip kullanıcıları bul
      const [bayiUsers] = await connection.execute(
        'SELECT id FROM kullanicilar WHERE bayi_id = ? AND deleted_at IS NULL', 
        [userObj.bayi_id]
      );
      
      if (!Array.isArray(bayiUsers) || bayiUsers.length === 0) {
        console.log("Bayiye ait kullanıcı bulunamadı, boş sonuç dönülüyor");
        return res.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            totalPages: 0,
            currentPage: page,
            pageSize: limit
          }
        });
      }
      
      // Kullanıcı ID'lerini çıkar
      const userIds = bayiUsers.map(u => (u as any).id);
      console.log("Bayiye ait kullanıcı ID'leri:", userIds);
      
      // 2. ADIM: Bu kullanıcı ID'lerini kullanarak vinreader kayıtlarını filtrele
      whereConditions.push(`v1.usersid IN (${userIds.map(() => '?').join(',')})`);
      queryParams.push(...userIds);
    } 
    else {
      // Diğer roller için sadece kendi kayıtlarını görebilirler
      console.log("Standart kullanıcı: Sadece kendi kayıtları getiriliyor", userObj.id);
      whereConditions.push('v1.usersid = ?');
      queryParams.push(userObj.id);
    }

    // whereClause oluşturma - boş olması durumunu da ele almalıyız
    const whereClause = whereConditions.length ? whereConditions.join(' AND ') : '1=1';
    console.log("WHERE koşulu:", whereClause);
    console.log("Sorgu parametreleri:", queryParams);

    // Optimize edilmiş sorgu - alt sorgu ile en son test kayıtlarını al
    const baseQuery = `
      WITH LatestTests AS (
        SELECT 
          v1.test_id,
          v1.tarih,
          v1.plaka,
          v1.sase,
          v1.motor,
          v1.marka,
          v1.model,
          v1.yil,
          v1.gosterge_km,
          v1.paket,
          v1.ucret,
          v1.aciklama,
          v1.kontrolmod,
          v1.vin1,
          v1.vin2,
          v1.vin3,
          v1.usersid,
          ROW_NUMBER() OVER (PARTITION BY v1.test_id ORDER BY v1.tarih DESC) as rn
        FROM vinreader v1
        WHERE ${whereClause}
      )
      SELECT SQL_CALC_FOUND_ROWS 
        v.*,
        COALESCE(f.firma_unvan, '-') as firma_adi,
        COALESCE(b.ad, '-') as bayi_adi
      FROM LatestTests v
      INNER JOIN kullanicilar k ON v.usersid = k.id
      LEFT JOIN firmalar f ON k.firma_id = f.id AND f.deleted_at IS NULL
      LEFT JOIN bayiler b ON k.bayi_id = b.id AND b.deleted_at IS NULL
      WHERE v.rn = 1
      ORDER BY v.test_id DESC, v.tarih DESC
      LIMIT ? OFFSET ?
    `;

    // Ana sorguyu çalıştır
    const [rows] = await connection.execute(baseQuery, [...queryParams, limit, offset]);

    // Toplam kayıt sayısını al
    const [countResult] = await connection.execute('SELECT FOUND_ROWS() as total');
    const total = (countResult as any)[0].total;
    const totalPages = Math.ceil(total / limit);

    console.log("Sorgu sonuçları:", {
      rowCount: Array.isArray(rows) ? rows.length : 0,
      total,
      totalPages,
      currentPage: page,
      pageSize: limit,
      userRole: userObj.role
    });

    res.json({
      success: true,
      data: rows || [],
      pagination: {
        total,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error("VIN kayıtları getirilirken hata:", error);
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
    const testId = parseInt(req.params.id);
    console.log("VIN detayları getiriliyor:", testId);

    connection = await db.getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        v.*,
        COALESCE(f.firma_unvan, '-') as firma_adi,
        COALESCE(b.ad, '-') as bayi_adi
      FROM vinreader v
      INNER JOIN kullanicilar k ON v.usersid = k.id
      LEFT JOIN firmalar f ON k.firma_id = f.id AND f.deleted_at IS NULL
      LEFT JOIN bayiler b ON k.bayi_id = b.id AND b.deleted_at IS NULL
      WHERE v.test_id = ?
      ORDER BY v.kontrolmod ASC
    `, [testId]);

    console.log("Dönen VIN detayları:", rows);
    res.json({ success: true, data: rows || [] });
  } catch (error) {
    console.error("VIN detayları getirilirken hata:", error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;