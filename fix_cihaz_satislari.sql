-- Önce foreign key kontrollerini devre dışı bırakalım
SET FOREIGN_KEY_CHECKS=0;

-- kalan_tutar ve prim_tutari kolonlarını yeniden oluşturalım
ALTER TABLE cihaz_satislari 
MODIFY COLUMN kalan_tutar DECIMAL(10,2) NOT NULL,
MODIFY COLUMN prim_tutari DECIMAL(10,2) NOT NULL;

-- deleted_at kolonunu ekleyelim
ALTER TABLE cihaz_satislari 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Index ekleyelim
CREATE INDEX idx_cihaz_satislari_deleted_at ON cihaz_satislari(deleted_at);

-- Foreign key kontrollerini tekrar aktif edelim
SET FOREIGN_KEY_CHECKS=1;