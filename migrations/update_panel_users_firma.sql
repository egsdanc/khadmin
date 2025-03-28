-- Önce gerekli kolonları ekleyelim (eğer yoksa)
ALTER TABLE panel_users 
ADD COLUMN IF NOT EXISTS firma_id INT NULL,
ADD COLUMN IF NOT EXISTS bayi_id INT NULL;

-- Panel users tablosunda firma ilişkilendirmesi
ALTER TABLE panel_users 
ADD CONSTRAINT fk_panel_users_firma
FOREIGN KEY (firma_id) REFERENCES firmalar(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- Panel users tablosunda bayi ilişkilendirmesi  
ALTER TABLE panel_users
ADD CONSTRAINT fk_panel_users_bayi
FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- İndeksleri ekle
ALTER TABLE panel_users
ADD INDEX idx_firma_id (firma_id),
ADD INDEX idx_bayi_id (bayi_id);