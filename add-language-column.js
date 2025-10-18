const mysql = require('mysql2/promise');
require('dotenv').config();

async function addLanguageColumn() {
  let connection;
  try {
    // Veritabanı bağlantısı
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '149.202.76.5',
      user: 'kilometr_s',
      password: process.env.MYSQL_PASSWORD || 'oCJ0ibbD6Cu1',
      database: process.env.MYSQL_DATABASE || 'kilometr_yedek'
    });

    console.log('Veritabanına bağlanıldı...');

    // Önce alanın var olup olmadığını kontrol et
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.MYSQL_DATABASE || 'kilometr_yedek'}' 
      AND TABLE_NAME = 'panel_users' 
      AND COLUMN_NAME = 'language_preference'
    `);

    if (columns.length > 0) {
      console.log('language_preference alanı zaten mevcut!');
    } else {
      // Alanı ekle
      await connection.execute(`
        ALTER TABLE panel_users 
        ADD COLUMN language_preference VARCHAR(5) DEFAULT 'tr' 
        COMMENT 'Panel kullanıcı dil tercihi (tr, en)'
      `);
      console.log('language_preference alanı başarıyla eklendi!');
    }

    // Mevcut kullanıcılar için varsayılan değer
    await connection.execute(`
      UPDATE panel_users 
      SET language_preference = 'tr' 
      WHERE language_preference IS NULL
    `);
    console.log('Mevcut kullanıcılar için varsayılan dil tercihi ayarlandı!');

    console.log('✅ Dil tercihi alanı başarıyla eklendi!');
    
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addLanguageColumn();
