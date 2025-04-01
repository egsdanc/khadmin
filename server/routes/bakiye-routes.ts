import { Router } from 'express';
import { bakiyeService } from '../services/bakiye-service';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { db } from "@db";
import { bakiye_komisyonlar, companies, bayiler } from "@db/schema";
import { eq, and, sql, count } from "drizzle-orm";

const router = Router();

router.use(requireAuth);

// Bayi bakiye raporu query validation
const bayiBakiyeQuerySchema = z.object({
  ay: z.string().transform(val => parseInt(val)),
  yil: z.string().transform(val => parseInt(val))
});

// Bayi bakiye raporu endpoint'i
router.get("/bayi-bakiye", async (req, res) => {
  try {
    console.log('Raw query parameters:', req.query);

    const validation = bayiBakiyeQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Geçersiz ay/yıl parametreleri",
        errors: validation.error.errors
      });
    }

    const { ay, yil } = validation.data;
    console.log('Parsed parameters:', { ay, yil });

    const result = await bakiyeService.getAylikBayiBakiyeRaporu(ay, yil);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Bayi bakiye raporu hatası:', error);
    res.status(500).json({ 
      success: false,
      message: "Bayi bakiye raporu alınırken bir hata oluştu",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Bakiye hareketleri query validation
const hareketlerQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  bayiler: z.string().optional(),
  firmalar: z.string().optional(),
  minTutar: z.string().optional(),
  maxTutar: z.string().optional(),
  siralama: z.string().optional(),
  page: z.string().transform(val => parseInt(val || '1')),
  limit: z.string().transform(val => parseInt(val || '10'))
});

// Bakiye hareketleri endpoint'i
router.get("/hareketler", async (req, res) => {
  try {
    console.log('Raw query parameters:', req.query);

    const validation = hareketlerQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Geçersiz filtre parametreleri",
        errors: validation.error.errors
      });
    }

    // Kullanıcı rolünü ve bayi_id'yi query parametrelerinden al
    const userRole = req.query.userRole || '';
    const bayi_id = req.query.bayi_id || '';

    // Sadece belirli roller erişebilir
    if (!['Super Admin', 'Admin', 'Bayi'].includes(userRole)) {
      return res.status(403).json({ 
        message: "Bu işlemi gerçekleştirmek için yetkiniz bulunmamaktadır" 
      });
    }

    const { startDate, endDate, bayiler, firmalar, minTutar, maxTutar, siralama, page, limit } = validation.data;
    console.log('Parsed parameters:', { startDate, endDate, bayiler, firmalar, minTutar, maxTutar, siralama, page, limit });

    let bayilerFilter = bayiler ? bayiler.split(',').map(Number) : undefined;
    
    // Eğer Bayi rolü ise, sadece kendi bayisinin verilerini görebilmeli
    if (userRole === 'Bayi' && bayi_id) {
      const bayiIdNum = parseInt(bayi_id, 10);
      // Bayi ID'sini filtre olarak kullan, diğer bayi filtrelerini yoksay
      bayilerFilter = [bayiIdNum];
    }
    // Admin ve Super Admin için filtre değişikliği yapmıyoruz

    const result = await bakiyeService.getBakiyeHareketleri(
      (userRole === 'Bayi' && bayi_id) ? parseInt(bayi_id, 10) : null, // Bayi için bayi_id, diğerleri için null
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      page,
      limit,
      {
        bayiler: bayilerFilter,
        firmalar: firmalar ? firmalar.split(',').map(Number) : undefined,
        minTutar: minTutar ? parseFloat(minTutar) : undefined,
        maxTutar: maxTutar ? parseFloat(maxTutar) : undefined,
        siralama
      }
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Bakiye hareketleri listeleme hatası:', error);
    res.status(500).json({ 
      message: "Bakiye hareketleri listelenirken bir hata oluştu",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Bakiye yükleme request validation
const bakiyeYukleSchema = z.object({
  bayi_id: z.string().or(z.number()).transform(val => Number(val)),
  miktar: z.string().or(z.number()).transform(val => Number(val)).refine(val => val > 0, {
    message: "Miktar 0'dan büyük olmalıdır"
  })
});

// Bakiye yükleme endpoint'i
router.post("/yukle", async (req, res) => {
  try {
    const validation = bakiyeYukleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Geçersiz bakiye yükleme bilgileri",
        errors: validation.error.errors
      });
    }

    const { bayi_id, miktar } = validation.data;
    console.log('Bakiye yükleme isteği:', { bayi_id, miktar });

    await bakiyeService.bakiyeYukle(bayi_id, miktar);

    res.json({ 
      success: true, 
      message: "Bakiye yükleme işlemi başarıyla tamamlandı" 
    });
  } catch (error) {
    console.error('Bakiye yükleme hatası:', error);
    res.status(500).json({ 
      message: "Bakiye yükleme işlemi sırasında bir hata oluştu",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Komisyon özet raporu endpoint'i
router.get("/komisyon-ozet", async (req, res) => {
  try {
    const { firma_id, bayi_id, ay, yil } = req.query;
    console.log('Gelen filtre parametreleri:', { firma_id, bayi_id, ay, yil });

    let whereConditions = ["b.deleted_at IS NULL"];
    const params: any[] = [];

    if (firma_id && firma_id !== 'all') {
      whereConditions.push("f.id = ?");
      params.push(firma_id);
    }

    if (bayi_id && bayi_id !== 'all') {
      whereConditions.push("b.id = ?");
      params.push(bayi_id);
    }

    if (ay && yil) {
      whereConditions.push("MONTH(bk.created_at) = ? AND YEAR(bk.created_at) = ?");
      params.push(parseInt(ay as string), parseInt(yil as string));
    }

    const query = `
      SELECT 
        f.name as firma_adi,
        b.ad as bayi_adi,
        b.aktif as bayi_aktif,
        COALESCE(SUM(bk.ucret), 0) as toplam_ucret,
        COALESCE(SUM(bk.komisyon_tutar), 0) as toplam_komisyon,
        COALESCE(b.bakiye, 0) as guncel_bakiye
      FROM bayiler b
      LEFT JOIN firmalar f ON b.firma = f.id
      LEFT JOIN bakiye_komisyonlar bk ON b.id = bk.bayi_id
      WHERE ${whereConditions.join(" AND ")}
      GROUP BY f.id, b.id, f.name, b.ad, b.aktif, b.bakiye
      ORDER BY f.name, b.ad
    `;

    console.log('Oluşturulan SQL sorgusu:', query);
    console.log('Parametre değerleri:', params);

    const result = await db.execute(query, params);
    const rows = result[0];

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Komisyon özet raporu hatası:', error);
    res.status(500).json({ 
      success: false,
      message: "Komisyon özet raporu alınırken bir hata oluştu",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Komisyon listesi endpoint'i
router.get("/komisyonlar", async (req, res) => {
  try {
    console.log('Komisyon listesi isteği alındı:', req.query);

    const page = parseInt(req.query.page?.toString() || '1');
    const limit = parseInt(req.query.limit?.toString() || '10');
    const firma_id = req.query.firma_id?.toString();
    const bayi_id = req.query.bayi_id?.toString();
    const start_date = req.query.start_date?.toString();
    const end_date = req.query.end_date?.toString();

    const whereConditions = [];

    // Silinen kayıtları hariç tut
    whereConditions.push(sql`${bakiye_komisyonlar.deleted_at} IS NULL`);

    if (firma_id && firma_id !== 'all') {
      whereConditions.push(eq(bakiye_komisyonlar.firma_id, parseInt(firma_id)));
    }

    if (bayi_id && bayi_id !== 'all') {
      whereConditions.push(eq(bakiye_komisyonlar.bayi_id, parseInt(bayi_id)));
    }

    if (start_date) {
      whereConditions.push(sql`DATE(${bakiye_komisyonlar.created_at}) >= DATE(${start_date})`);
    }

    if (end_date) {
      whereConditions.push(sql`DATE(${bakiye_komisyonlar.created_at}) <= DATE(${end_date})`);
    }

    const offset = (page - 1) * limit;

    const komisyonlar = await db
      .select({
        id: bakiye_komisyonlar.id,
        test_id: bakiye_komisyonlar.test_id,
        firma_id: bakiye_komisyonlar.firma_id,
        bayi_id: bakiye_komisyonlar.bayi_id,
        bayi_oran: bakiye_komisyonlar.bayi_oran,
        ucret: bakiye_komisyonlar.ucret,
        komisyon_tutar: bakiye_komisyonlar.komisyon_tutar,
        test_komisyon_tutar: bakiye_komisyonlar.test_komisyon_tutar,
        bakiye: bakiye_komisyonlar.bakiye,
        created_at: bakiye_komisyonlar.created_at,
        firma_name: companies.name,
        bayi_name: bayiler.ad,
      })
      .from(bakiye_komisyonlar)
      .leftJoin(companies, eq(bakiye_komisyonlar.firma_id, companies.id))
      .leftJoin(bayiler, eq(bakiye_komisyonlar.bayi_id, bayiler.id))
      .where(and(...whereConditions))
      .orderBy(sql`${bakiye_komisyonlar.created_at} DESC`)
      .limit(limit)
      .offset(offset);

    // Toplam kayıt sayısını al
    const countResult = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(bakiye_komisyonlar)
      .where(and(...whereConditions));

    const total = countResult[0]?.count || 0;

    console.log('Komisyon listesi alındı:', { total, komisyonlar });

    res.json({
      success: true,
      komisyonlar,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      params: { firma_id, bayi_id, start_date, end_date }
    });
  } catch (error) {
    console.error('Komisyon listesi hatası:', error);
    res.status(500).json({ 
      success: false,
      message: "Komisyon listesi alınırken bir hata oluştu",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get('/user-balance', async (req, res) => {
  try {
    // Parse the user object from query parameters
    const userParam = req.query.user as string;
    const user = JSON.parse(userParam);

    // Create base query
    let query = db
      .select({
        count: count(),
        totalBalance: sql<string>`COALESCE(SUM(bakiye), 0)`.mapWith(String)
      })
      .from(bayiler)
      .where(eq(bayiler.aktif, 1));

    // Apply role-based filtering
    if (user.role === 'Admin' || user.role === 'Super Admin') {
      // Admin veya Super Admin ise herhangi bir filtreleme yapma
      // Tüm veriler üzerinden istatistikler hesaplanacak
    } else if (user.role === 'Bayi') {
      // Bayi rolü için sadece kendi bayi_id'sine ait veriyi getir
      query = query.where(
        and(
          eq(bayiler.aktif, 1), 
          eq(bayiler.id, user.bayi_id)
        )
      );
    } else {
      // Tanımlanmamış roller için hata dönüşü
      return res.status(403).json({
        success: false,
        message: "Bu işlemi yapmaya yetkiniz yok"
      });
    }

    const result = await query;

    // Format the total balance
    const totalBalance = parseFloat(result[0].totalBalance || '0');
    const formattedTotalBalance = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(totalBalance);

    return res.json({
      success: true,
      data: {
        activeCount: result[0].count,
        totalBalance: totalBalance,
        formattedTotalBalance: `${formattedTotalBalance} ₺`
      }
    });
  } catch (error) {
    console.error('Error fetching user balance:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user balance'
    });
  }
});

export default router;