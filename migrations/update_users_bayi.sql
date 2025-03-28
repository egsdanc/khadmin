-- Önce geçici kolonu ekleyelim
ALTER TABLE kullanicilar 
ADD COLUMN temp_bayi VARCHAR(255);

-- Mevcut bayi değerlerini yedekle
UPDATE kullanicilar 
SET temp_bayi = bayi 
WHERE bayi IS NOT NULL;

-- bayi_id kolonunu ekle
ALTER TABLE kullanicilar 
ADD COLUMN bayi_id INT NULL;

-- Bayi değerlerini ID'ye dönüştür
UPDATE kullanicilar u
INNER JOIN bayiler b ON u.temp_bayi = b.ad
SET u.bayi_id = b.id;

-- Foreign key kısıtlamasını ekle
ALTER TABLE kullanicilar
ADD CONSTRAINT fk_kullanicilar_bayi
FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- İndeksi ekle
ALTER TABLE kullanicilar
ADD INDEX idx_bayi_id (bayi_id);

-- Geçici kolonu temizle
ALTER TABLE kullanicilar
DROP COLUMN temp_bayi;
