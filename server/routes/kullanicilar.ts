import { Router } from 'express';
import { db } from '../services/database-service';
import type { RowDataPacket } from 'mysql2';
import { hash } from 'bcrypt';

const router = Router();

// Yeni kullanıcı ekleme
router.post('/', async (req, res) => {
  const { isim, macAdress, firstlogin, bayi_id, firma_id, password } = req.body;

  console.log('Gelen form verileri:', {
    isim,
    macAdress,
    firstlogin,
    bayi_id,
    firma_id,
    passwordVar: !!password
  });

  if (!isim || !macAdress || !password) {
    console.log('Eksik veri kontrolü:', { isim, macAdress, passwordVar: !!password });
    return res.status(400).json({
      success: false,
      message: 'İsim, şifre ve MAC adresi zorunludur'
    });
  }

  let connection = null;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // MAC adresi kontrolü
    const [existingUser] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM kullanicilar WHERE macAdress = ?',
      [macAdress]
    );

    if (existingUser.length > 0) {
      throw new Error('Bu MAC adresi zaten kullanımda');
    }

    // Şifreyi hashle
    const hashedPassword = await hash(password, 10);

    // Yeni kullanıcı ekleme
    const [result] = await connection.execute(
      `INSERT INTO kullanicilar (
        isim, macAdress, firstlogin, bayi_id, firma_id, password
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [isim, macAdress, firstlogin || 0, bayi_id, firma_id, hashedPassword]
    );

    await connection.commit();

    // Eklenen kullanıcının detaylarını getir
    const [newUser] = await connection.execute<RowDataPacket[]>(
      `SELECT k.*, 
              b.ad as bayi_name, 
              f.firma_unvan as firma_name,
              b.aktif as bayi_aktif
       FROM kullanicilar k
       LEFT JOIN bayiler b ON k.bayi_id = b.id
       LEFT JOIN firmalar f ON k.firma_id = f.id
       WHERE k.id = ?`,
      [(result as any).insertId]
    );

    console.log('Yeni kullanıcı eklendi:', newUser[0]);

    return res.json({
      success: true,
      message: 'Kullanıcı başarıyla eklendi',
      data: newUser[0]
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Kullanıcı ekleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Kullanıcı eklenirken bir hata oluştu'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Kullanıcı güncelleme
router.post('/:id', async (req, res) => {
  const { id } = req.params;
  const { isim, macAdress, firstlogin, bayi_id, firma_id } = req.body;

  console.log('Kullanıcı güncelleme isteği:', {
    id,
    body: req.body,
    bayi_id_type: typeof bayi_id,
    bayi_id_value: bayi_id,
    method: req.method,
    headers: req.headers
  });

  let connection = null;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Kullanıcı kontrolü
    const [userRows] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM kullanicilar WHERE id = ?',
      [id]
    );

    if (!userRows.length) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // SQL güncelleme sorgusu
    const updateQuery = `
      UPDATE kullanicilar 
      SET isim = ?, 
          macAdress = ?,
          firstlogin = ?,
          bayi_id = ?,
          firma_id = ?
      WHERE id = ?
    `;

    const updateValues = [
      isim,
      macAdress,
      firstlogin || 0,
      bayi_id,
      firma_id,
      id
    ];

    console.log('SQL Güncelleme Sorgusu:', {
      query: updateQuery,
      values: updateValues
    });

    const [updateResult] = await connection.execute(updateQuery, updateValues);
    console.log('Güncelleme sonucu:', updateResult);

    await connection.commit();

    // Güncellenmiş veriyi getir
    const [updatedUser] = await connection.execute<RowDataPacket[]>(
      `SELECT k.*, 
              b.ad as bayi_name, 
              f.firma_unvan as firma_name,
              b.aktif as bayi_aktif
       FROM kullanicilar k
       LEFT JOIN bayiler b ON k.bayi_id = b.id
       LEFT JOIN firmalar f ON k.firma_id = f.id
       WHERE k.id = ?`,
      [id]
    );

    console.log('Güncellenmiş kullanıcı:', updatedUser[0]);

    return res.json({
      success: true,
      message: 'Kullanıcı başarıyla güncellendi',
      data: updatedUser[0]
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Kullanıcı güncelleme hatası:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Kullanıcı güncellenirken bir hata oluştu'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;