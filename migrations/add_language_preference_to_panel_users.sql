-- Dil tercihi alanını panel_users tablosuna ekle
ALTER TABLE panel_users 
ADD COLUMN language_preference VARCHAR(5) DEFAULT 'tr' 
COMMENT 'Panel kullanıcı dil tercihi (tr, en)';

-- Mevcut panel kullanıcıları için varsayılan değer
UPDATE panel_users 
SET language_preference = 'tr' 
WHERE language_preference IS NULL;
