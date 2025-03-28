import { db } from "./index";

async function main() {
  console.log("Starting database migration...");

  try {
    // Companies tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS firmalar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name TEXT NOT NULL,
        firma_unvan TEXT NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) DEFAULT '',
        address TEXT,
        firma VARCHAR(255),
        vergi_dairesi VARCHAR(255) DEFAULT '',
        vergi_no VARCHAR(50) DEFAULT '',
        tc_no VARCHAR(20) DEFAULT '',
        iban VARCHAR(50) DEFAULT '',
        durum VARCHAR(20) DEFAULT 'active',
        test_sayisi INT DEFAULT 0,
        superadmin_oran DECIMAL(10, 2) DEFAULT 0,
        deleted_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Testler tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS testler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plaka VARCHAR(250),
        sase VARCHAR(250),
        motor VARCHAR(250),
        marka VARCHAR(100),
        model VARCHAR(100),
        kontrolmod VARCHAR(450),
        km VARCHAR(450),
        ucret DECIMAL(10, 2) DEFAULT 0,
        yil YEAR,
        gosterge_km INT,
        paket VARCHAR(250),
        aciklama VARCHAR(500),
        usersid INT,
        test_id INT,
        tarih DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Kullanıcılar tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS kullanicilar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        isim VARCHAR(150) NOT NULL,
        sifre VARCHAR(150) NOT NULL,
        macAdress VARCHAR(150) NOT NULL,
        firstlogin BOOLEAN NOT NULL DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME DEFAULT NULL,
        firma_id INT DEFAULT NULL,
        bayi_id INT DEFAULT NULL,
        FOREIGN KEY (firma_id) REFERENCES firmalar(id) ON DELETE SET NULL,
        FOREIGN KEY (bayi_id) REFERENCES firmalar(id) ON DELETE SET NULL
      );
    `);

    // Panel Users tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS panel_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        firma_id INT,
        bayi_id INT,
        role VARCHAR(50) NOT NULL DEFAULT 'Bayi',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        image TEXT,
        email_token VARCHAR(255),
        remember_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL,
        FOREIGN KEY (firma_id) REFERENCES firmalar(id) ON DELETE SET NULL,
        FOREIGN KEY (bayi_id) REFERENCES firmalar(id) ON DELETE SET NULL
      );
    `);

    // Bayiler tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS bayiler (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ad VARCHAR(255) NOT NULL,
        aktif INT NOT NULL DEFAULT 1,
        mail VARCHAR(100),
        tel VARCHAR(15),
        adres TEXT,
        sabit_ip VARCHAR(15),
        bayi_oran DECIMAL(10, 0) NOT NULL,
        firma INT,
        il VARCHAR(255),
        ilce VARCHAR(255),
        bakiye DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // Roles tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        permissions TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    // Vinreader tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS vinreader (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plaka VARCHAR(250) NOT NULL,
        sase VARCHAR(250) NOT NULL,
        motor VARCHAR(250) NOT NULL,
        marka VARCHAR(100) NOT NULL,
        model VARCHAR(100) NOT NULL,
        yil INT NOT NULL,
        gosterge_km INT NOT NULL,
        paket VARCHAR(250) NOT NULL,
        ucret DECIMAL(10, 2) DEFAULT 0,
        aciklama VARCHAR(500) NOT NULL,
        kontrolmod VARCHAR(450) NOT NULL,
        vin1 VARCHAR(250) NOT NULL,
        vin2 VARCHAR(250) NOT NULL,
        vin3 VARCHAR(250) NOT NULL,
        usersid INT,
        tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        test_id INT NOT NULL
      );
    `);

    // Komisyon Ayarları tablosunu oluştur
    await db.query(`
      CREATE TABLE IF NOT EXISTS komisyon_ayarlari (
        id INT AUTO_INCREMENT PRIMARY KEY,
        komisyon_oran DECIMAL(5, 2) DEFAULT 10.00 NOT NULL,
        kdv_oran DECIMAL(5, 2) DEFAULT 20.00 NOT NULL,
        updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP DEFAULT NULL
      );
    `);

    console.log("Database migration completed successfully!");
  } catch (error) {
    console.error("Error during database migration:", error);
  }
}

main();
