SET FOREIGN_KEY_CHECKS=0;

-- Drop and recreate kalan_tutar column
ALTER TABLE cihaz_satislari 
DROP COLUMN IF EXISTS kalan_tutar;

ALTER TABLE cihaz_satislari 
ADD COLUMN kalan_tutar DECIMAL(10,2) NOT NULL;

-- Drop and recreate prim_tutari column
ALTER TABLE cihaz_satislari 
DROP COLUMN IF EXISTS prim_tutari;

ALTER TABLE cihaz_satislari 
ADD COLUMN prim_tutari DECIMAL(10,2) NOT NULL;

SET FOREIGN_KEY_CHECKS=1;
