-- Online siparişler tablosunu oluştur
CREATE TABLE online_siparisler (
    id INT AUTO_INCREMENT PRIMARY KEY,
    siparis_no VARCHAR(50) UNIQUE NOT NULL,
    musteri_adi VARCHAR(100) NOT NULL,
    musteri_soyadi VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefon VARCHAR(20) NOT NULL,
    adres TEXT NOT NULL,
    il VARCHAR(50) NOT NULL,
    ilce VARCHAR(50) NOT NULL,
    siparis_tarihi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    odeme_durumu VARCHAR(20) NOT NULL DEFAULT 'Bekliyor',
    tutar DECIMAL(10,2) NOT NULL,
    kargo_takip_no VARCHAR(50),
    kargo_durumu VARCHAR(20) DEFAULT 'Hazırlanıyor',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME DEFAULT NULL
);

-- Indexler ekle
CREATE INDEX idx_siparis_no ON online_siparisler(siparis_no);
CREATE INDEX idx_email ON online_siparisler(email);
CREATE INDEX idx_siparis_tarihi ON online_siparisler(siparis_tarihi);
CREATE INDEX idx_odeme_durumu ON online_siparisler(odeme_durumu);
CREATE INDEX idx_deleted_at ON online_siparisler(deleted_at);