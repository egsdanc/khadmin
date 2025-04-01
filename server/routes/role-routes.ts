import { Router } from "express";
import { db } from "../services/database-service";

const router = Router();

// Tüm rolleri getir
router.get("/", async (req, res) => {
  let connection;
  try {
    console.log("[Role Routes] GET /api/roles isteği alındı");

    connection = await db.getConnection();
    console.log("[Role Routes] Database bağlantısı başarılı");

    const [result] = await connection.query(`
      SELECT id, name, slug, permissions, 
             DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at,
             DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') as updated_at,
             description
      FROM roles
      ORDER BY created_at DESC
    `);

    console.log("[Role Routes] Sorgu sonucu:", { 
      resultLength: Array.isArray(result) ? result.length : 0,
      firstRow: Array.isArray(result) && result.length > 0 ? result[0] : null
    });

    return res.json({
      success: true,
      data: Array.isArray(result) ? result : [],
      count: Array.isArray(result) ? result.length : 0
    });
  } catch (error) {
    console.error("[Role Routes] Hata:", error);
    return res.status(500).json({ 
      success: false,
      message: "Roller getirilirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Role Routes] Database bağlantısı kapatıldı");
    }
  }
});

// Yeni rol ekle
router.post("/", async (req, res) => {
  let connection;
  try {
    console.log("[Role Routes] POST /api/roles isteği alındı:", req.body);

    const { name, description, permissions } = req.body;

    // Zorunlu alanların kontrolü
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Rol adı zorunludur"
      });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    connection = await db.getConnection();

    const [result] = await connection.execute(
      `INSERT INTO roles (name, slug, description, permissions, created_at, updated_at) 
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, slug, description || null, JSON.stringify(permissions || {})]
    );

    console.log("[Role Routes] Rol ekleme sonucu:", result);

    return res.status(201).json({
      success: true,
      message: "Rol başarıyla eklendi",
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error("[Role Routes] Rol ekleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Rol eklenirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Role Routes] Database bağlantısı kapatıldı");
    }
  }
});

// Rol güncelleme endpoint'i
router.put("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log("[Role Routes] PUT /api/roles/:id isteği alındı:", { id, body: req.body });

    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Rol adı zorunludur"
      });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    connection = await db.getConnection();

    // Önce rolün var olup olmadığını kontrol et
    const [checkResult] = await connection.query(
      "SELECT id FROM roles WHERE id = ?",
      [id]
    );

    if (!Array.isArray(checkResult) || checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Güncellenecek rol bulunamadı"
      });
    }

    console.log("[Role Routes] Güncellenecek permissions:", permissions);

    const [result] = await connection.execute(
      `UPDATE roles 
       SET name = ?, slug = ?, description = ?, permissions = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, slug, description || "", JSON.stringify(permissions || {}), id]
    );

    console.log("[Role Routes] Rol güncelleme sonucu:", result);

    return res.json({
      success: true,
      message: "Rol başarıyla güncellendi"
    });

  } catch (error) {
    console.error("[Role Routes] Rol güncelleme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Rol güncellenirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Role Routes] Database bağlantısı kapatıldı");
    }
  }
});

// Rol sil
router.delete("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log("[Role Routes] DELETE /api/roles/:id isteği alındı:", { id });

    connection = await db.getConnection();

    // Önce rolün var olup olmadığını kontrol et
    const [checkResult] = await connection.query(
      "SELECT id FROM roles WHERE id = ?",
      [id]
    );

    if (!Array.isArray(checkResult) || checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Silinecek rol bulunamadı"
      });
    }

    // Rolü sil
    const [result] = await connection.execute(
      `DELETE FROM roles WHERE id = ?`,
      [id]
    );

    console.log("[Role Routes] Rol silme sonucu:", result);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Rol silinirken bir hata oluştu"
      });
    }

    return res.json({
      success: true,
      message: "Rol başarıyla silindi"
    });

  } catch (error) {
    console.error("[Role Routes] Rol silme hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Rol silinirken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Role Routes] Database bağlantısı kapatıldı");
    }
  }
});

// Rol izinlerini kontrol et
router.get("/rolekontrol", async (req, res) => {
  let connection;
  try {
    const { role } = req.query;
    console.log("[Role Routes] GET /api/roles/rolekontrol isteği alındı:", { role });

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Rol parametresi zorunludur"
      });
    }

    connection = await db.getConnection();

    const [rows] = await connection.query(
      `SELECT permissions FROM roles WHERE name = ?`,
      [role]
    );

    console.log("[Role Routes] Rol kontrolü sonucu:", rows);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rol bulunamadı"
      });
    }

    // Parse the permissions JSON string
    let permissions;
    try {
      const row = rows[0] as { permissions: string };
      permissions = typeof row.permissions === 'string' 
        ? JSON.parse(row.permissions)
        : row.permissions;
    } catch (parseError) {
      console.error("[Role Routes] Permissions parse hatası:", parseError);
      return res.status(500).json({
        success: false,
        message: "Permissions verisi işlenirken hata oluştu"
      });
    }

    return res.json({
      success: true,
      data: permissions
    });

  } catch (error) {
    console.error("[Role Routes] Rol kontrolü hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Rol kontrolü yapılırken bir hata oluştu",
      error: error instanceof Error ? error.message : "Bilinmeyen hata"
    });
  } finally {
    if (connection) {
      connection.release();
      console.log("[Role Routes] Database bağlantısı kapatıldı");
    }
  }
});

export default router;