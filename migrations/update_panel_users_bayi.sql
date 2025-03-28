-- Önce bayi_id kolonunu ekleyelim (eğer yoksa)
ALTER TABLE panel_users 
ADD COLUMN IF NOT EXISTS bayi_id INT NULL;

-- Panel users tablosunda bayi ilişkilendirmesi  
ALTER TABLE panel_users
ADD CONSTRAINT fk_panel_users_bayi
FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- İndeksi ekle
ALTER TABLE panel_users
ADD INDEX idx_bayi_id (bayi_id);
