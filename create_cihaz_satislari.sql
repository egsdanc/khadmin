-- Create the main table
CREATE TABLE cihaz_satislari (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firma_id INT NOT NULL,
    bayi_id INT NOT NULL,
    toplam_tutar DECIMAL(10,2) NOT NULL,
    odenen_tutar DECIMAL(10,2) NOT NULL DEFAULT 0,
    kalan_tutar DECIMAL(10,2) AS (toplam_tutar - odenen_tutar) STORED,
    teslim_durumu ENUM('Beklemede', 'Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi') NOT NULL DEFAULT 'Beklemede',
    aciklama TEXT,
    odeme_tarihi DATETIME,
    kalan_odeme_tarihi DATETIME,
    prim_yuzdesi DECIMAL(5,2) DEFAULT 0,
    prim_tutari DECIMAL(10,2) AS (toplam_tutar * prim_yuzdesi / 100) STORED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraints
    FOREIGN KEY (firma_id) REFERENCES firmalar(id),
    FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
);

-- Create trigger to validate odenen_tutar <= toplam_tutar
DELIMITER //
CREATE TRIGGER before_cihaz_satislari_insert 
BEFORE INSERT ON cihaz_satislari
FOR EACH ROW
BEGIN
    IF NEW.odenen_tutar > NEW.toplam_tutar THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ödenen tutar, toplam tutardan büyük olamaz';
    END IF;
END;//

CREATE TRIGGER before_cihaz_satislari_update
BEFORE UPDATE ON cihaz_satislari
FOR EACH ROW
BEGIN
    IF NEW.odenen_tutar > NEW.toplam_tutar THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ödenen tutar, toplam tutardan büyük olamaz';
    END IF;
END;//
DELIMITER ;