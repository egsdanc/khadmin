import { Router } from "express";
import { db } from "../services/database-service";
import { requireAuth } from "../auth";

const router = Router();

// Panel kullanıcılarını listele
router.get("/", requireAuth, async (req, res) => {
  let connection;
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const role = req.query.role as string;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    // Get current user info
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "Kullanıcı bilgisi alınamadı"
      });
    }

    connection = await db.getConnection();

    // Build WHERE clause based on filters
    let whereConditions = ['p.deleted_at IS NULL'];
    const queryParams: any[] = [];

    // Role-based filtering
    if (currentUser.role === 'Admin') {
      // Admin users can see Bayi role users and themselves (not other admins or super admins)
      whereConditions.push('(p.role = ? OR p.id = ?)');
      queryParams.push('Bayi', currentUser.id);
    }
    // Super Admin can see all users (no additional filter)

    if (search) {
      whereConditions.push('(LOWER(p.name) LIKE LOWER(?) OR LOWER(p.lastname) LIKE LOWER(?) OR LOWER(p.email) LIKE LOWER(?))');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (role && role !== 'all') {
      whereConditions.push('p.role = ?');
      queryParams.push(role);
    }

    if (status && status !== 'all') {
      whereConditions.push('p.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM panel_users p ${whereClause}`,
      queryParams
    );
    const total = (countResult as any)[0].total;

    // Get paginated results with relations
    const [results] = await connection.execute(`
      SELECT 
        p.*,
        CONCAT(p.name, ' ', COALESCE(p.lastname, '')) as full_name,
        f.name as firma_name,
        f.firma_unvan,
        b.ad as bayi_name
      FROM panel_users p
      LEFT JOIN firmalar f ON p.firma_id = f.id
      LEFT JOIN bayiler b ON p.bayi_id = b.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

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
    console.error("Panel kullanıcıları listelenirken hata:", error);
    res.status(500).json({
      success: false,
      message: "Panel kullanıcıları alınırken bir hata oluştu: " + (error as Error).message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Firma listesini getir
router.get("/companies", async (req, res) => {
  let connection;
  try {
    console.log("Firma listesi istendi");
    connection = await db.getConnection();

    const [results] = await connection.execute(`
      SELECT id, name, firma_unvan
      FROM firmalar
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `);

    console.log("Firma listesi sorgu sonucu:", results);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Firma listesi alınırken hata:", error);
    res.status(500).json({
      success: false,
      message: "Firma listesi alınırken bir hata oluştu: " + (error as Error).message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Yeni panel kullanıcısı ekle
router.post("/", requireAuth, async (req, res) => {
  let connection;
  try {
    const { name, lastname, email, password, firma_id, bayi_id, role, status } = req.body;
    console.log("Yeni kullanıcı ekleme isteği:", { ...req.body, password: '***' });
    console.log("Parsed fields:", { name, lastname, email, firma_id, bayi_id, role, status });

    // Zorunlu alan kontrolü
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Ad alanı zorunludur"
      });
    }
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "E-posta ve Şifre alanları zorunludur"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // E-posta benzersizlik kontrolü
    const [existingUsers] = await connection.execute(
      'SELECT id FROM panel_users WHERE email = ? AND deleted_at IS NULL',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bu e-posta adresi zaten kullanılıyor"
      });
    }

    // Yeni kullanıcı ekleme
    console.log("INSERT parametreleri:", [
      name,
      lastname && lastname.trim() ? lastname.trim() : null,
      email,
      password,
      firma_id || null,
      bayi_id || null,
      role || 'Bayi',
      status || 'active'
    ]);
    
    const [insertResult] = await connection.execute(`
      INSERT INTO panel_users (
        name, lastname, email, password, firma_id, bayi_id, role, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      name,
      lastname && lastname.trim() ? lastname.trim() : null,
      email,
      password,
      firma_id || null,
      bayi_id || null,
      role || 'Bayi',
      status || 'active'
    ]);

    if (!insertResult || !(insertResult as any).insertId) {
      throw new Error("Kullanıcı eklenirken bir hata oluştu");
    }

    await connection.commit();

    // Eklenen kullanıcının detaylarını getir
    const [newUserResult] = await connection.execute(`
      SELECT 
        p.*,
        CONCAT(p.name, ' ', COALESCE(p.lastname, '')) as full_name,
        f.name as firma_name,
        f.firma_unvan,
        b.ad as bayi_name
      FROM panel_users p
      LEFT JOIN firmalar f ON p.firma_id = f.id
      LEFT JOIN bayiler b ON p.bayi_id = b.id
      WHERE p.id = ?
    `, [(insertResult as any).insertId]);

    if (!Array.isArray(newUserResult) || newUserResult.length === 0) {
      throw new Error("Yeni kullanıcı bilgileri alınamadı");
    }

    const newUser = newUserResult[0];
    console.log("Yeni kullanıcı eklendi:", { ...newUser, password: '***' });

    res.json({
      success: true,
      message: "Kullanıcı başarıyla eklendi",
      data: newUser
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Panel kullanıcısı eklenirken hata:", error);
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

// Panel kullanıcısı güncelle
router.put("/:id", requireAuth, async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    const { name, lastname, email, password, firma_id, bayi_id, role, status } = req.body;

    console.log("Kullanıcı güncelleme isteği:", { id, ...req.body, password: password ? '***' : undefined });

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz kullanıcı ID'si"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Mevcut kullanıcıyı kontrol et
    const [existingUsers] = await connection.execute(
      'SELECT id FROM panel_users WHERE id = ? AND deleted_at IS NULL',
      [id]
    );

    if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kullanıcı bulunamadı"
      });
    }

    // Güncelleme verilerini hazırla
    const updateFields = [];
    const updateValues = [];

    // Handle name fields
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (lastname !== undefined) {
      updateFields.push('lastname = ?');
      updateValues.push(lastname && lastname.trim() ? lastname.trim() : null);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (password) {
      updateFields.push('password = ?');
      updateValues.push(password);
    }
    if (firma_id !== undefined) {
      updateFields.push('firma_id = ?');
      updateValues.push(firma_id);
    }
    if (bayi_id !== undefined) {
      updateFields.push('bayi_id = ?');
      updateValues.push(bayi_id);
    }
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Güncellenecek veri bulunamadı"
      });
    }

    // Updated_at alanını güncelle
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Güncelleme sorgusunu oluştur ve çalıştır
    const updateQuery = `
      UPDATE panel_users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    console.log("Güncelleme sorgusu:", updateQuery);
    console.log("Sorgu parametreleri:", [...updateValues, id]);

    await connection.execute(updateQuery, [...updateValues, id]);
    await connection.commit();

    // Güncellenmiş kullanıcı bilgilerini getir
    const [updatedUserResult] = await connection.execute(`
      SELECT 
        p.*,
        CONCAT(p.name, ' ', COALESCE(p.lastname, '')) as full_name,
        f.name as firma_name,
        f.firma_unvan,
        b.ad as bayi_name
      FROM panel_users p
      LEFT JOIN firmalar f ON p.firma_id = f.id
      LEFT JOIN bayiler b ON p.bayi_id = b.id
      WHERE p.id = ?
    `, [id]);

    if (!Array.isArray(updatedUserResult) || updatedUserResult.length === 0) {
      throw new Error("Güncellenmiş kullanıcı bilgileri alınamadı");
    }

    const updatedUser = updatedUserResult[0];
    console.log("Güncellenmiş kullanıcı:", { ...updatedUser, password: '***' });

    res.json({
      success: true,
      message: "Kullanıcı başarıyla güncellendi",
      data: updatedUser
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Panel kullanıcısı güncellenirken hata:", error);
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

// Panel kullanıcısı sil (soft delete)
router.delete("/:id", requireAuth, async (req, res) => {
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
    const [result] = await connection.execute(
      'UPDATE panel_users SET deleted_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?',
      ['inactive', id]
    );

    if (!result || (result as any).affectedRows === 0) {
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
    console.error("Panel kullanıcısı silinirken hata:", error);
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