-- Önce firma_id kolonunu ekleyelim
ALTER TABLE kullanicilar 
ADD COLUMN firma_id INT NULL;

-- Mevcut firma değerlerini firmalar tablosundan eşleştirerek aktaralım
UPDATE kullanicilar u
LEFT JOIN firmalar f ON u.firma = f.name COLLATE utf8mb4_turkish_ci
SET u.firma_id = f.id
WHERE u.firma IS NOT NULL;

-- Foreign key kısıtlamasını ekleyelim
ALTER TABLE kullanicilar
ADD CONSTRAINT fk_kullanicilar_firma
FOREIGN KEY (firma_id) REFERENCES firmalar(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- İndeks ekleyelim
ALTER TABLE kullanicilar
ADD INDEX idx_firma_id (firma_id);