import { Router } from "express";
import { db } from "@db";
import { cihaz_satislari, companies, bayiler } from "@db/schema";
import { desc, sql, eq } from "drizzle-orm";

const router = Router();

// Tüm cihaz satışlarını getir
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const salesQuery = db
      .select({
        id: cihaz_satislari.id,
        firma_id: cihaz_satislari.firma_id,
        firma_adi: companies.name,
        bayi_id: cihaz_satislari.bayi_id,
        bayi_adi: bayiler.ad,
        toplam_tutar: cihaz_satislari.toplam_tutar,
        odenen_tutar: cihaz_satislari.odenen_tutar,
        kalan_tutar: cihaz_satislari.kalan_tutar,
        teslim_durumu: cihaz_satislari.teslim_durumu,
        aciklama: cihaz_satislari.aciklama,
        odeme_tarihi: cihaz_satislari.odeme_tarihi,
        kalan_odeme_tarihi: cihaz_satislari.kalan_odeme_tarihi,
        prim_yuzdesi: cihaz_satislari.prim_yuzdesi,
        prim_tutari: cihaz_satislari.prim_tutari,
        created_at: cihaz_satislari.created_at,
        updated_at: cihaz_satislari.updated_at
      })
      .from(cihaz_satislari)
      .leftJoin(companies, eq(cihaz_satislari.firma_id, companies.id))
      .leftJoin(bayiler, eq(cihaz_satislari.bayi_id, bayiler.id))
      .where(sql`${cihaz_satislari.deleted_at} IS NULL`)
      .orderBy(desc(cihaz_satislari.created_at))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(cihaz_satislari)
      .where(sql`${cihaz_satislari.deleted_at} IS NULL`);

    const [sales, [{ count }]] = await Promise.all([salesQuery, countQuery]);

    res.json({
      success: true,
      data: sales,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error("Cihaz satışları listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      message: "Cihaz satışları listesi alınırken bir hata oluştu"
    });
  }
});

// Toplam satış tutarını getir
router.get("/toplam", async (req, res) => {
  try {
    // Parse the user object from query parameters
    const userParam = req.query.user as string;
    const user = JSON.parse(userParam);
 console.log(user.user.role," ZSSSSSSS")
    // Create a base query
    let query = db
      .select({
        total: sql<number>`COALESCE(SUM(${cihaz_satislari.toplam_tutar}), 0)`,
      })
      .from(cihaz_satislari)
      .where(sql`${cihaz_satislari.deleted_at} IS NULL`);

    // Apply role-based filtering
    if (user.user.role === 'Admin' || user.user.role === 'Super Admin') {
      // Admin veya Super Admin ise herhangi bir filtreleme yapma
      // Tüm veriler üzerinden total hesaplanacak
    } else if (user.user.role === 'Bayi') {
      // Bayi rolü için sadece kendi bayi_id'sine ait verileri filtrele
      query = query.where(sql`${cihaz_satislari.bayi_id} = ${user.user.bayi_id}`);
      console.log("qqqq",query)
    } else {
      // Tanımlanmamış roller için hata dönüşü
      return res.status(403).json({
        success: false,
        message: "Bu işlemi yapmaya yetkiniz yok"
      });
    }

    const result = await query;

    const total = result[0]?.total || 0;
    const formattedTotal = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(total);

    res.json({
      success: true,
      data: {
        total,
        formattedTotal,
        userRole: user.user.role // Hata ayıklama için rol bilgisi
      }
    });
  } catch (error) {
    console.error("Toplam satış tutarı alınırken hata:", error);
    res.status(500).json({
      success: false,
      message: "Toplam satış tutarı alınırken bir hata oluştu"
    });
  }
});

// Yeni cihaz satışı ekle
router.post("/", async (req, res) => {
  try {
    const {
      firma_id,
      bayi_id,
      toplam_tutar,
      odenen_tutar,
      teslim_durumu,
      aciklama,
      odeme_tarihi,
      kalan_odeme_tarihi,
      prim_yuzdesi
    } = req.body;

    // Kalan tutarı hesapla
    const kalan_tutar = toplam_tutar - odenen_tutar;
    
    // Prim tutarını hesapla
    const prim_tutari = (toplam_tutar * prim_yuzdesi) / 100;

    const newSale = await db.insert(cihaz_satislari).values({
      firma_id,
      bayi_id,
      toplam_tutar,
      odenen_tutar,
      kalan_tutar,
      teslim_durumu,
      aciklama,
      odeme_tarihi: odeme_tarihi ? new Date(odeme_tarihi) : null,
      kalan_odeme_tarihi: kalan_odeme_tarihi ? new Date(kalan_odeme_tarihi) : null,
      prim_yuzdesi,
      prim_tutari
    });

    res.json({
      success: true,
      message: "Cihaz satışı başarıyla eklendi",
      data: newSale
    });
  } catch (error) {
    console.error("Cihaz satışı eklenirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Cihaz satışı eklenirken bir hata oluştu"
    });
  }
});

// Cihaz satışını güncelle
router.post("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firma_id,
      bayi_id,
      toplam_tutar,
      odenen_tutar,
      teslim_durumu,
      aciklama,
      odeme_tarihi,
      kalan_odeme_tarihi,
      prim_yuzdesi
    } = req.body;

    // Kalan tutarı hesapla
    const kalan_tutar = toplam_tutar - odenen_tutar;
    
    // Prim tutarını hesapla
    const prim_tutari = (toplam_tutar * prim_yuzdesi) / 100;

    await db
      .update(cihaz_satislari)
      .set({
        firma_id,
        bayi_id,
        toplam_tutar,
        odenen_tutar,
        kalan_tutar,
        teslim_durumu,
        aciklama,
        odeme_tarihi: odeme_tarihi ? new Date(odeme_tarihi) : null,
        kalan_odeme_tarihi: kalan_odeme_tarihi ? new Date(kalan_odeme_tarihi) : null,
        prim_yuzdesi,
        prim_tutari,
        updated_at: new Date()
      })
      .where(eq(cihaz_satislari.id, parseInt(id)));

    res.json({
      success: true,
      message: "Cihaz satışı başarıyla güncellendi"
    });
  } catch (error) {
    console.error("Cihaz satışı güncellenirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Cihaz satışı güncellenirken bir hata oluştu"
    });
  }
});

// Cihaz satışını sil
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .update(cihaz_satislari)
      .set({
        deleted_at: new Date()
      })
      .where(eq(cihaz_satislari.id, parseInt(id)));

    res.json({
      success: true,
      message: "Cihaz satışı başarıyla silindi"
    });
  } catch (error) {
    console.error("Cihaz satışı silinirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Cihaz satışı silinirken bir hata oluştu"
    });
  }
});

export default router;