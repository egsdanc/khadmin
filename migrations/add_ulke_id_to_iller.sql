-- İller tablosuna ulke_id alanı ekle
ALTER TABLE iller 
ADD COLUMN ulke_id INT NOT NULL DEFAULT 1,
ADD CONSTRAINT fk_iller_ulkeler FOREIGN KEY (ulke_id) REFERENCES ulkeler(id);

-- Mevcut tüm illeri Türkiye'ye bağla (ulke_id = 1)
UPDATE iller SET ulke_id = 1 WHERE ulke_id IS NULL OR ulke_id = 0;
