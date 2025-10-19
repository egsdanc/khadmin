import { Router } from "express";
import { db } from "../services/database-service";

const router = Router();

// Tüm program kullanıcılarını listele
router.get("/", async (req, res) => {
  let connection;
  try {
    console.log("Program kullanıcıları listesi istendi", {
      query: req.query,
      rawParams: req.query
    });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const firma_id = req.query.firma_id ? parseInt(req.query.firma_id as string) : undefined;
    const bayi_id = req.query.bayi ? parseInt(req.query.bayi as string) : undefined;
    const offset = (page - 1) * limit;

    connection = await db.getConnection();

    // Build WHERE clause based on filters
    let whereConditions = [];
    const queryParams: any[] = [];

    if (search) {
      whereConditions.push('(k.isim LIKE ? OR k.macAdress LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (firma_id !== undefined) {
      whereConditions.push('k.firma_id = ?');
      queryParams.push(firma_id);
    }

    if (bayi_id !== undefined) {
      whereConditions.push('k.bayi_id = ?');
      queryParams.push(bayi_id);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    console.log('SQL sorgusu parametreleri:', {
      whereClause,
      queryParams,
      offset,
      limit
    });

    // Get total count for pagination
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM kullanicilar k WHERE k.deleted_at IS NULL ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}`,
      queryParams
    );
    const total = (countResult as any)[0].total;

    // Get paginated results with relations
    const [results] = await connection.execute(`
      SELECT 
        k.id, 
        k.isim, 
        k.macAdress,
        k.sifre,
        k.firstlogin, 
        k.bayi_id,
        k.firma_id,
        f.name as firma_name,
        b.ad as bayi_name,
        b.aktif as bayi_aktif
      FROM kullanicilar k
      LEFT JOIN firmalar f ON k.firma_id = f.id
      LEFT JOIN bayiler b ON k.bayi_id = b.id
      WHERE k.deleted_at IS NULL
      ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      ORDER BY k.id ASC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    console.log("Program kullanıcıları sorgu sonucu:", results);

    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("Program kullanıcıları listelenirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Program kullanıcıları alınırken bir hata oluştu: " + (error as Error).message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Yeni program kullanıcısı ekle
router.post("/", async (req, res) => {
  let connection;
  try {
    console.log("Yeni kullanıcı ekleme isteği:", req.body);

    const { isim, sifre, macAdress, firstlogin, firma_id, bayi_id } = req.body;

    // Validate required fields - trim strings to check for empty spaces
    if (!isim?.trim() || !sifre?.trim() || !macAdress?.trim()) {
      return res.status(400).json({
        success: false,
        message: "İsim, şifre ve MAC adresi zorunlu alanlardır"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Check if MAC address is already in use
    const [existingUsers] = await connection.execute(
      'SELECT id FROM kullanicilar WHERE macAdress = ?',
      [macAdress]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bu MAC adresi zaten kullanımda"
      });
    }

    // Insert new user
    const [insertResult] = await connection.execute(
      'INSERT INTO kullanicilar (isim, sifre, macAdress, firstlogin, bayi_id, firma_id) VALUES (?, ?, ?, ?, ?, ?)',
      [isim.trim(), sifre.trim(), macAdress.trim(), firstlogin || 0, bayi_id || null, firma_id || null]
    );

    await connection.commit();

    res.json({
      success: true,
      message: "Kullanıcı başarıyla eklendi",
      data: { id: (insertResult as any)?.insertId }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Program kullanıcısı eklenirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı eklenirken bir hata oluştu: " + (error as Error).message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Program kullanıcısını güncelle
router.post("/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { isim, macAdress, firstlogin, bayi_id, firma_id } = req.body;

    console.log('Güncelleme isteği:', { id, body: req.body });

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID'si"
      });
    }

    if (!isim || !macAdress) {
      return res.status(400).json({
        success: false,
        message: "İsim ve MAC adresi gerekli"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const updateQuery = `
      UPDATE kullanicilar 
      SET isim = ?, 
          macAdress = ?,
          bayi_id = ?,
          firma_id = ?
      WHERE id = ?
    `;
    const params = [
      isim, 
      macAdress, 
      bayi_id || null,
      firma_id || null,
      parseInt(id)
    ];

    console.log('SQL sorgusu çalıştırılıyor:', updateQuery);
    console.log('Parametreler:', params);

    const [result] = await connection.execute(updateQuery, params);

    if ((result as any)?.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı"
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: "Kullanıcı başarıyla güncellendi"
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Program kullanıcısı güncellenirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı güncellenirken bir hata oluştu: " + (error as Error).message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Program kullanıcısını sil (soft delete)
router.delete("/:id", async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID'si"
      });
    }

    connection = await db.getConnection();
    
    // Önce kullanıcının VIN testleri var mı kontrol et
    const [vinTests] = await connection.execute(
      'SELECT COUNT(*) as count FROM vinreader WHERE usersid = ?',
      [id]
    );
    
    const hasVinTests = (vinTests as any)[0].count > 0;
    
    if (hasVinTests) {
      return res.status(400).json({
        success: false,
        message: "Bu kullanıcının VIN testleri bulunduğu için silinemez. Önce testleri silin veya kullanıcıyı pasif yapın."
      });
    }
    
    // Soft delete - deleted_at alanını doldur
    const [result] = await connection.execute(
      'UPDATE kullanicilar SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if ((result as any)?.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Kullanıcı başarıyla silindi"
    });
  } catch (error) {
    console.error("Program kullanıcısı silinirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Kullanıcı silinirken bir hata oluştu: " + (error as Error).message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;