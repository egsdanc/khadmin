import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function migrate() {
  console.log("MySQL bağlantısı başlatılıyor...");
  console.log("Bağlantı detayları:", {
    host: process.env.MYSQL_HOST || '149.202.76.5',
    user: 'kilometr_s',
    database: process.env.MYSQL_DATABASE || 'kilometr_yedek',
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '149.202.76.5',
      user: 'kilometr_s',
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'kilometr_yedek',
      multipleStatements: true
    });

    console.log("MySQL bağlantısı başarılı");
    console.log("Bağlantı ID:", connection.threadId);

    try {
      console.log("Migration başlatılıyor...");

      // Mevcut firma alanının değerlerini yedekle
      await connection.execute(`
        ALTER TABLE kullanicilar 
        ADD COLUMN temp_firma VARCHAR(255);
      `);

      await connection.execute(`
        UPDATE kullanicilar 
        SET temp_firma = firma 
        WHERE firma IS NOT NULL;
      `);

      console.log("Mevcut firma değerleri yedeklendi");

      // firma_id kolonunu ekle
      await connection.execute(`
        ALTER TABLE kullanicilar 
        ADD COLUMN IF NOT EXISTS firma_id INT NULL;
      `);
      console.log("firma_id kolonu eklendi");

      // Mevcut firma değerlerini ID'ye dönüştür
      await connection.execute(`
        UPDATE kullanicilar u
        INNER JOIN firmalar f ON u.temp_firma = f.name
        SET u.firma_id = f.id;
      `);
      console.log("Firma ID'leri güncellendi");

      // Foreign key kısıtlamasını ekle
      await connection.execute(`
        ALTER TABLE kullanicilar
        ADD CONSTRAINT fk_kullanicilar_firma
        FOREIGN KEY (firma_id) REFERENCES firmalar(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log("Foreign key kısıtlaması eklendi");

      // İndeksi ekle
      await connection.execute(`
        ALTER TABLE kullanicilar
        ADD INDEX idx_firma_id (firma_id);
      `);
      console.log("İndeks eklendi");

      // Geçici ve eski kolonları temizle
      await connection.execute(`
        ALTER TABLE kullanicilar
        DROP COLUMN temp_firma;
      `);
      console.log("Geçici kolon temizlendi");

      console.log("Migration başarıyla tamamlandı");
    } catch (error) {
      console.error("Migration hatası:", error);
      throw error;
    } finally {
      await connection.end();
      console.log("MySQL bağlantısı kapatıldı");
    }
  } catch (error: any) {
    console.error("MySQL bağlantı hatası:", error);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("MySQL kullanıcı adı veya şifre hatalı");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("MySQL sunucusuna bağlanılamadı. Sunucunun çalıştığından ve bağlantı noktasının açık olduğundan emin olun.");
    } else if (error.code === 'ER_HOST_NOT_PRIVILEGED') {
      console.error("Bu IP adresinden bağlantıya izin verilmiyor. MySQL sunucusunda kullanıcıya erişim izni verilmeli.");
    } else {
      console.error("Beklenmedik bir hata oluştu:", error);
    }
    throw error;
  }
}

migrate().catch(console.error);