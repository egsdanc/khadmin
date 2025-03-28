-- Create online_cihaz_satislari table for tracking online device sales
CREATE TABLE online_cihaz_satislari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siparis_no VARCHAR(50) NOT NULL UNIQUE,
    cihaz_satis_id INT,
    musteri_adi VARCHAR(100) NOT NULL,
    musteri_soyadi VARCHAR(100) NOT NULL,
    tc_no VARCHAR(11),
    email VARCHAR(100) NOT NULL,
    telefon VARCHAR(20) NOT NULL,
    adres TEXT NOT NULL,
    il VARCHAR(50) NOT NULL,
    ilce VARCHAR(50) NOT NULL,
    fatura_tipi ENUM('Bireysel', 'Kurumsal') NOT NULL DEFAULT 'Bireysel',
    vergi_dairesi VARCHAR(100),
    vergi_no VARCHAR(20),
    tutar DECIMAL(10,2) NOT NULL,
    odeme_durumu ENUM('Beklemede', 'Odendi', 'Iptal') NOT NULL DEFAULT 'Beklemede',
    kargo_durumu ENUM('Hazirlaniyor', 'Kargoya_Verildi', 'Teslim_Edildi') NOT NULL DEFAULT 'Hazirlaniyor',
    kargo_firmasi VARCHAR(50),
    kargo_takip_no VARCHAR(50),
    iyzico_payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (cihaz_satis_id) REFERENCES cihaz_satislari(id),
    INDEX idx_siparis_no (siparis_no),
    INDEX idx_email (email),
    INDEX idx_telefon (telefon),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_id (iyzico_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for better documentation
ALTER TABLE online_cihaz_satislari 
COMMENT 'Online cihaz satışları için müşteri ve sipariş bilgilerini tutan tablo';

ALTER TABLE online_cihaz_satislari
MODIFY COLUMN siparis_no VARCHAR(50) NOT NULL COMMENT 'Benzersiz sipariş numarası (OS-YYYYMMDD-XXX formatında)',
MODIFY COLUMN cihaz_satis_id INT COMMENT 'cihaz_satislari tablosu ile ilişki',
MODIFY COLUMN musteri_adi VARCHAR(100) NOT NULL COMMENT 'Müşteri adı',
MODIFY COLUMN musteri_soyadi VARCHAR(100) NOT NULL COMMENT 'Müşteri soyadı',
MODIFY COLUMN tc_no VARCHAR(11) COMMENT 'TC Kimlik numarası (opsiyonel)',
MODIFY COLUMN email VARCHAR(100) NOT NULL COMMENT 'E-posta adresi',
MODIFY COLUMN telefon VARCHAR(20) NOT NULL COMMENT 'Telefon numarası',
MODIFY COLUMN adres TEXT NOT NULL COMMENT 'Teslimat adresi',
MODIFY COLUMN il VARCHAR(50) NOT NULL COMMENT 'İl',
MODIFY COLUMN ilce VARCHAR(50) NOT NULL COMMENT 'İlçe',
MODIFY COLUMN fatura_tipi ENUM('Bireysel', 'Kurumsal') NOT NULL COMMENT 'Fatura tipi',
MODIFY COLUMN vergi_dairesi VARCHAR(100) COMMENT 'Vergi dairesi (kurumsal için)',
MODIFY COLUMN vergi_no VARCHAR(20) COMMENT 'Vergi numarası (kurumsal için)',
MODIFY COLUMN tutar DECIMAL(10,2) NOT NULL COMMENT 'Sipariş tutarı (TL)',
MODIFY COLUMN odeme_durumu ENUM('Beklemede', 'Odendi', 'Iptal') NOT NULL COMMENT 'Ödeme durumu',
MODIFY COLUMN kargo_durumu ENUM('Hazirlaniyor', 'Kargoya_Verildi', 'Teslim_Edildi') NOT NULL COMMENT 'Kargo durumu',
MODIFY COLUMN kargo_firmasi VARCHAR(50) COMMENT 'Kargo firması adı',
MODIFY COLUMN kargo_takip_no VARCHAR(50) COMMENT 'Kargo takip numarası',
MODIFY COLUMN iyzico_payment_id VARCHAR(100) COMMENT 'İyzico ödeme ID';
