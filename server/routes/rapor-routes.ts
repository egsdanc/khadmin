import { Router } from 'express';
import { raporService } from '../services/rapor-service';
import { requireAuth } from '../auth';
import { z } from 'zod';
import { db } from "@db";
import { bakiye_komisyonlar } from "@db/schema";
import { sql } from "drizzle-orm";

const router = Router();

// Auth middleware for all routes
router.use(requireAuth);

// Komisyon raporu için validation schema
const komisyonParamsSchema = z.object({
  firma_id: z.string().optional(),
  bayi_id: z.string().optional(),
  ay: z.string().transform(val => {
    const month = parseInt(val);
    if (isNaN(month) || month < 1 || month > 12) {
      return new Date().getMonth() + 1;
    }
    return month;
  }),
  yil: z.string().transform(val => {
    const year = parseInt(val);
    if (isNaN(year) || year < 2000 || year > 2100) {
      return new Date().getFullYear();
    }
    return year;
  }),
  role: z.string().optional(),
  user_bayi_id: z.string().optional(),

});

// Total commission endpoint for Panel page
router.post("/total-commission", async (req, res) => {
  try {
    const user = req.body.user; // Doğru nesneyi çekelim
    console.log("Gelen Kullanıcı:", user);

    // Kullanıcı verisi yoksa hata döndür
    if (!user || !user.role) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı bilgisi",
      });
    }

    let query = db
      .select({
        totalCommission: sql<number>`COALESCE(SUM(${bakiye_komisyonlar.komisyon_tutar}), 0)`,
      })
      .from(bakiye_komisyonlar)
      .where(sql`${bakiye_komisyonlar.deleted_at} IS NULL`);

    // Eğer kullanıcı 'Bayi' ise, sadece kendi bayi_id'sine ait verileri çek
    if (user.role === "Bayi" && user.bayi_id) {
      query = query.where(sql`${bakiye_komisyonlar.bayi_id} = ${user.bayi_id}`);
    }

    const result = await query;
    const totalCommission = result[0]?.totalCommission || 0;

    // Para formatlama
    const formattedTotalCommission =
      new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
        .format(totalCommission)
        .replace("₺", "") + " ₺";

    res.json({
      success: true,
      data: {
        totalCommission,
        formattedTotalCommission,
      },
    });
  } catch (error) {
    console.error("Toplam komisyon hesaplama hatası:", error);
    res.status(500).json({
      success: false,
      message: "Toplam komisyon hesaplanırken bir hata oluştu",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});



// Komisyon özet raporu endpoint'i
router.get("/komisyon-ozet", async (req, res) => {
  try {
    const params = komisyonParamsSchema.parse({
      firma_id: req.query.firma_id,
      bayi_id: req.query.bayi_id,
      ay: req.query.ay?.toString() || (new Date().getMonth() + 1).toString(),
      yil: req.query.yil?.toString() || new Date().getFullYear().toString(),
      role: req.query.role,
      user_bayi_id : req.query.user_bayi_id
    });

    console.log("pppp",params)

    const result = await raporService.getKomisyonOzet(params);

    res.json({
      success: true,
      data: result
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

export default router;