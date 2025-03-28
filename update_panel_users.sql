-- Önce mevcut firma ve bayi kolonlarını yeni isimlerle yedekleyelim
ALTER TABLE panel_users 
ADD COLUMN firma_id INT NULL,
ADD COLUMN bayi_id INT NULL;

-- Var olan verileri yeni kolonlara aktaralım (firma ve bayi string değerlerini ID'lere çevirerek)
UPDATE panel_users pu
LEFT JOIN firmalar f ON pu.firma = f.name
SET pu.firma_id = f.id
WHERE pu.firma IS NOT NULL;

UPDATE panel_users pu
LEFT JOIN bayiler b ON pu.branch = b.ad
SET pu.bayi_id = b.id
WHERE pu.branch IS NOT NULL;

-- Eski kolonları kaldıralım
ALTER TABLE panel_users
DROP COLUMN firma,
DROP COLUMN branch;

-- Foreign key kısıtlamalarını ekleyelim
ALTER TABLE panel_users
ADD CONSTRAINT fk_panel_users_firma
FOREIGN KEY (firma_id) REFERENCES firmalar(id)
ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT fk_panel_users_bayi
FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
ON DELETE SET NULL ON UPDATE CASCADE;

-- İndeksleri ekleyelim
ALTER TABLE panel_users
ADD INDEX idx_firma_id (firma_id),
ADD INDEX idx_bayi_id (bayi_id);
