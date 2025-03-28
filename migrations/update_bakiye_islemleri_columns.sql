-- Güncelleme manuel_yukleme ve iyzico_yukleme sütunları için
ALTER TABLE bakiye_islemleri
MODIFY COLUMN manuel_yukleme DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN iyzico_yukleme DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN miktar DECIMAL(10,2) DEFAULT 0.00,
MODIFY COLUMN bakiye_sonrasi DECIMAL(10,2) DEFAULT 0.00;
