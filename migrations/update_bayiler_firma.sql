-- Bayiler tablosundaki firma ilişkilerini güncelle
UPDATE bayiler SET firma = 1 WHERE ad IN ('Ankara / Yenimahalle', 'Ankara / Otokent', 'Ankara / Yahyalar');

-- İndeksi ekle (eğer yoksa)
ALTER TABLE bayiler
ADD INDEX idx_firma (firma);

-- Foreign key kısıtlamasını ekle (eğer yoksa)
ALTER TABLE bayiler
ADD CONSTRAINT fk_bayiler_firma
FOREIGN KEY (firma) REFERENCES firmalar(id)
ON DELETE SET NULL ON UPDATE CASCADE;
