import { Router } from "express";
import { db } from "../services/database-service";
import { z } from "zod";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getFirmaNameById } from '../services/firma-service';

const router = Router();

// Validation schema for company data
const companySchema = z.object({
  name: z.string().min(1, "Firma adı zorunludur"),
  firma_unvan: z.string().min(1, "Firma ünvanı zorunludur"),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  telefon: z.string().nullable(),
  adres: z.string().min(1, "Adres zorunludur"),
  vergi_dairesi: z.string().nullable(),
  vergi_no: z.string().nullable(),
  tc_no: z.string().nullable(),
  iban: z.string().min(1, "IBAN zorunludur"),
  durum: z.enum(["active", "inactive"]).default("active"),
});

// GET /api/companies - Tüm aktif firmaları getir
router.get("/", async (_req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [result] = await connection.query<RowDataPacket[]>(`
      SELECT 
        id,
        name,
        firma_unvan,
        email,
        telefon,
        adres,
        vergi_dairesi,
        vergi_no,
        tc_no,
        iban,
        durum,
        created_at,
        updated_at
      FROM firmalar 
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("[Firma Routes] Hata:", error);
    return res.status(500).json({ 
      success: false,
      message: "Firmalar getirilirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// POST /api/companies - Yeni firma ekle
router.post("/", async (req, res) => {
  let connection;
  try {
    console.log("[Firma Routes] POST /api/companies isteği alındı:", req.body);

    const validatedData = companySchema.parse(req.body);

    connection = await db.getConnection();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO firmalar (
        name,
        firma_unvan,
        email,
        telefon,
        adres,
        vergi_dairesi,
        vergi_no,
        tc_no,
        iban,
        durum,
        test_sayisi,
        superadmin_oran,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 10, NOW(), NOW())`,
      [
        validatedData.name,
        validatedData.firma_unvan,
        validatedData.email,
        validatedData.telefon,
        validatedData.adres,
        validatedData.vergi_dairesi,
        validatedData.vergi_no,
        validatedData.tc_no,
        validatedData.iban,
        validatedData.durum
      ]
    );

    console.log("[Firma Routes] Firma ekleme sonucu:", result);

    return res.status(201).json({
      success: true,
      message: "Firma başarıyla eklendi",
      data: { id: result.insertId }
    });

  } catch (error) {
    console.error("[Firma Routes] Firma ekleme hatası:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz firma bilgileri",
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: "Firma eklenirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Firma Routes] Database bağlantısı kapatıldı");
    }
  }
});

// PUT /api/companies/:id - Firma güncelle
router.put("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log("[Firma Routes] PUT /api/companies/:id isteği alındı:", { id, body: req.body });

    const validatedData = companySchema.parse(req.body);

    connection = await db.getConnection();

    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE firmalar 
       SET 
        name = ?,
        firma_unvan = ?,
        email = ?,
        telefon = ?,
        adres = ?,
        vergi_dairesi = ?,
        vergi_no = ?,
        tc_no = ?,
        iban = ?,
        durum = ?,
        updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [
        validatedData.name,
        validatedData.firma_unvan,
        validatedData.email,
        validatedData.telefon,
        validatedData.adres,
        validatedData.vergi_dairesi,
        validatedData.vergi_no,
        validatedData.tc_no,
        validatedData.iban,
        validatedData.durum,
        id
      ]
    );

    console.log("[Firma Routes] Firma güncelleme sonucu:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek firma bulunamadı"
      });
    }

    return res.json({
      success: true,
      message: "Firma başarıyla güncellendi"
    });

  } catch (error) {
    console.error("[Firma Routes] Firma güncelleme hatası:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz firma bilgileri",
        errors: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      message: "Firma güncellenirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Firma Routes] Database bağlantısı kapatıldı");
    }
  }
});

// DELETE /api/companies/:id - Firma sil (soft delete)
router.delete("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log("[Firma Routes] DELETE /api/companies/:id isteği alındı:", { id });

    connection = await db.getConnection();

    // İlk önce firmanın var olup olmadığını ve silinmemiş olduğunu kontrol et
    const [checkResult] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM firmalar WHERE id = ? AND deleted_at IS NULL",
      [id]
    );

    if (!Array.isArray(checkResult) || checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Silinecek firma bulunamadı"
      });
    }

    // Soft delete işlemi - deleted_at alanını güncelle
    const [result] = await connection.query<ResultSetHeader>(
      `UPDATE firmalar 
       SET deleted_at = NOW(), 
           durum = 'inactive',
           updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );

    console.log("[Firma Routes] Firma silme sonucu:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Firma silinirken bir hata oluştu"
      });
    }

    return res.json({
      success: true,
      message: "Firma başarıyla silindi"
    });

  } catch (error) {
    console.error("[Firma Routes] Firma silme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Firma silinirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Firma Routes] Database bağlantısı kapatıldı");
    }
  }
});

// GET /api/companies/stats - Get company statistics
router.get("/stats", async (_req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [result] = await connection.query<RowDataPacket[]>(`
      SELECT COUNT(*) as activeCount 
      FROM firmalar 
      WHERE deleted_at IS NULL AND durum = 'active'
    `);

    return res.json({
      success: true,
      data: {
        activeCount: result[0].activeCount
      }
    });

  } catch (error) {
    console.error("[Firma Routes] İstatistik hatası:", error);
    return res.status(500).json({ 
      success: false,
      message: "Firma istatistikleri alınırken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// GET /api/companies/distribution - Get company-dealer distribution
router.get("/distribution", async (_req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    const [result] = await connection.query<RowDataPacket[]>(`
      SELECT 
        f.name as firma_name,
        COUNT(b.id) as bayi_count
      FROM firmalar f
      LEFT JOIN bayiler b ON f.id = b.firma AND b.aktif = 1
      WHERE f.deleted_at IS NULL AND f.durum = 'active'
      GROUP BY f.id, f.name
      ORDER BY bayi_count DESC
      LIMIT 10
    `);

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("[Firma Routes] Dağılım hatası:", error);
    return res.status(500).json({ 
      success: false,
      message: "Firma dağılım bilgileri alınırken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.get('/:id/name', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const name = await getFirmaNameById(id);
    res.json({ name });
  } catch (error) {
    console.error('Error fetching company name:', error);
    res.status(500).json({ error: 'Failed to fetch company name' });
  }
});

export default router;