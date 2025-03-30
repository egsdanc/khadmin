import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database configuration
const dbConfig = {
  charset: 'utf8mb4',
  host: process.env.MYSQL_HOST || "your_host",
  user: process.env.MYSQL_USER || "your_user",
  password: process.env.MYSQL_PASSWORD || "your_password",
  database: process.env.MYSQL_DATABASE || "your_database",
};

console.log("Database config loaded", dbConfig);

// Create a database connection pool
const db = mysql.createPool(dbConfig);

// Depolama konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('public', 'uploads', 'blog-images');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadPath)){
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur
    const uniqueSuffix = Date.now() + '-' + 
      crypto.randomBytes(10).toString('hex');
    cb(null, `blog-image-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Dosya filtreleme
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Sadece resim dosyaları kabul et
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya türü. Sadece resim dosyaları yükleyebilirsiniz.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const router = Router();

// Blog ekleme endpoint'i
router.post('/', upload.single('coverImage'), async (req, res) => {
  let connection;
  try {
    const { title, content } = req.body;
    
    // Input validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Blog başlığı gereklidir' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Blog içeriği gereklidir' });
    }

    // Cover image check
    if (!req.file) {
      return res.status(400).json({ message: 'Kapak fotoğrafı gereklidir' });
    }

    // Sanitize and validate title and content length
    if (title.length > 255) {
      return res.status(400).json({ message: 'Blog başlığı 255 karakterden uzun olamaz' });
    }

    if (content.length > 65535) {  // Typical TEXT column limit
      return res.status(400).json({ message: 'Blog içeriği çok uzun' });
    }

    const coverImagePath = path.join('uploads', 'blog-images', path.basename(req.file.path));

    // Open a new connection to the database
    connection = await db.getConnection();

    // Create table query (with IF NOT EXISTS)
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS blogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        cover_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await connection.query(createTableQuery);

    // Insert blog post
    const insertQuery = `
      INSERT INTO blogs 
      (title, content, cover_image) 
      VALUES (?, ?, ?)
    `;
    const [result] = await connection.execute(insertQuery, [
      title, 
      content, 
      coverImagePath
    ]);

    res.status(201).json({
      message: 'Blog başarıyla eklendi',
      blogId: (result as any).insertId,
      coverImageUrl: `/${coverImagePath}`
    });
  } catch (error) {
    console.error('Blog ekleme hatası:', error);
    
    // More granular error handling
    if (error instanceof multer.MulterError) {
      // Multer-specific errors (file size, file type)
      return res.status(400).json({ 
        message: error.message || 'Dosya yükleme hatası' 
      });
    }

    if ((error as any).code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        message: 'Girilen veriler çok uzun' 
      });
    }

    // Database connection or other unexpected errors
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Dosya silme hatası:', unlinkError);
      }
    }

    res.status(500).json({ 
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.', 
      error: (error as Error).message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Blog listeleme endpoint'i
router.get('/', async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    
    const query = `
      SELECT id, title, content, cover_image, created_at 
      FROM blogs 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    
    res.status(200).json(rows);
  } catch (error) {
    console.error('Blog listeleme hatası:', error);
    res.status(500).json({ 
      message: 'Bloglar listelenirken bir hata oluştu',
      error: (error as Error).message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Blog güncelleme endpoint'i
router.put('/:id', upload.single('coverImage'), async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    // Input validation
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Blog başlığı gereklidir' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Blog içeriği gereklidir' });
    }

    // Sanitize and validate title and content length
    if (title.length > 255) {
      return res.status(400).json({ message: 'Blog başlığı 255 karakterden uzun olamaz' });
    }

    if (content.length > 65535) {
      return res.status(400).json({ message: 'Blog içeriği çok uzun' });
    }

    connection = await db.getConnection();

    // Check if blog exists
    const [existingBlog] = await connection.execute(
      'SELECT cover_image FROM blogs WHERE id = ?',
      [id]
    );

    if (!(existingBlog as any[]).length) {
      return res.status(404).json({ message: 'Blog bulunamadı' });
    }

    let coverImagePath = (existingBlog as any[])[0].cover_image;

    // If new image is uploaded
    if (req.file) {
      // Delete old image if exists
      if (coverImagePath) {
        const oldImagePath = path.join('public', coverImagePath);
        try {
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Eski resim silme hatası:', error);
        }
      }

      // Update with new image path
      coverImagePath = path.join('uploads', 'blog-images', path.basename(req.file.path));
    }

    // Update blog
    const updateQuery = `
      UPDATE blogs 
      SET title = ?, content = ?, cover_image = ?
      WHERE id = ?
    `;

    await connection.execute(updateQuery, [
      title,
      content,
      coverImagePath,
      id
    ]);

    res.status(200).json({
      message: 'Blog başarıyla güncellendi',
      coverImageUrl: coverImagePath ? `/${coverImagePath}` : null
    });
  } catch (error) {
    console.error('Blog güncelleme hatası:', error);
    
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ 
        message: error.message || 'Dosya yükleme hatası' 
      });
    }

    if ((error as any).code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        message: 'Girilen veriler çok uzun' 
      });
    }

    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Dosya silme hatası:', unlinkError);
      }
    }

    res.status(500).json({ 
      message: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
      error: (error as Error).message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Fotoğraf servisi
router.get('/getphoto/:imageName', async (req, res) => {
  const { imageName } = req.params;

  // Fotoğraf yolunu oluştur (mutlak yol)
  const filePath = path.resolve('public', 'uploads', 'blog-images', imageName);
  
  // Fotoğraf dosyasının var olup olmadığını kontrol et
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).json({ message: 'Fotoğraf bulunamadı' });
    }
    
    // Fotoğraf dosyasını yanıt olarak döndür
    res.sendFile(filePath);
  });
});

// Blog silme endpoint'i
router.delete('/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    
    connection = await db.getConnection();

    // Önce blog'un var olup olmadığını ve cover_image'ını kontrol et
    const [blog] = await connection.execute(
      'SELECT cover_image FROM blogs WHERE id = ?',
      [id]
    );

    if (!(blog as any[]).length) {
      return res.status(404).json({ message: 'Blog bulunamadı' });
    }

    // Cover image varsa dosyayı sil
    const coverImagePath = (blog as any[])[0].cover_image;
    if (coverImagePath) {
      const filePath = path.join('public', coverImagePath);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error('Dosya silme hatası:', error);
      }
    }

    // Blog'u veritabanından sil
    await connection.execute('DELETE FROM blogs WHERE id = ?', [id]);

    res.status(200).json({ message: 'Blog başarıyla silindi' });
  } catch (error) {
    console.error('Blog silme hatası:', error);
    res.status(500).json({ 
      message: 'Blog silinirken bir hata oluştu',
      error: (error as Error).message 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
