-- Create bakiye_hareketleri table for tracking iyzico payments
CREATE TABLE bakiye_hareketleri (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bayi_id INT NOT NULL,
    tutar DECIMAL(10,2) NOT NULL,
    bakiye_oncesi DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bakiye_sonrasi DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    islem_tipi ENUM('ODEME', 'IADE', 'IPTAL') NOT NULL,
    durum ENUM('BASARILI', 'BASARISIZ', 'BEKLEMEDE') NOT NULL,
    iyzico_payment_id VARCHAR(100),
    referans_kodu VARCHAR(100),
    basket_id VARCHAR(100),
    kart_no VARCHAR(20),
    taksit_sayisi INT,
    aciklama TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bayi_id) REFERENCES bayiler(id),
    INDEX idx_bayi_id (bayi_id),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_id (iyzico_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments for better documentation
ALTER TABLE bakiye_hareketleri 
COMMENT 'İyzico üzerinden yapılan ödemelerin takibi için kullanılan tablo';

ALTER TABLE bakiye_hareketleri 
MODIFY COLUMN tutar DECIMAL(10,2) NOT NULL COMMENT 'İşlem tutarı (TL)',
MODIFY COLUMN bakiye_oncesi DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'İşlem öncesi bayi bakiyesi',
MODIFY COLUMN bakiye_sonrasi DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT 'İşlem sonrası bayi bakiyesi',
MODIFY COLUMN islem_tipi ENUM('ODEME', 'IADE', 'IPTAL') NOT NULL COMMENT 'İşlem tipi: Ödeme, İade veya İptal',
MODIFY COLUMN durum ENUM('BASARILI', 'BASARISIZ', 'BEKLEMEDE') NOT NULL COMMENT 'İşlem durumu',
MODIFY COLUMN iyzico_payment_id VARCHAR(100) COMMENT 'İyzico ödeme ID',
MODIFY COLUMN referans_kodu VARCHAR(100) COMMENT 'İyzico referans kodu',
MODIFY COLUMN basket_id VARCHAR(100) COMMENT 'İyzico sepet ID',
MODIFY COLUMN kart_no VARCHAR(20) COMMENT 'Maskelenmiş kart numarası',
MODIFY COLUMN taksit_sayisi INT COMMENT 'Taksit sayısı (varsa)',
MODIFY COLUMN aciklama TEXT COMMENT 'İşlem açıklaması';
