-- Önce iller tablosunu oluştur
CREATE TABLE IF NOT EXISTS `iller` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `il` VARCHAR(50) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sonra ilçeler tablosunu oluştur
CREATE TABLE IF NOT EXISTS `ilceler` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `il_id` INT NOT NULL,
  `ilce` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`il_id`) REFERENCES `iller`(`id`) ON DELETE CASCADE
);

-- İndeks ekle
CREATE INDEX idx_il_id ON ilceler(il_id);

-- İlleri ekle
INSERT INTO iller (il) VALUES 
('ADANA'),('ADIYAMAN'),('AFYON'),('AĞRI'),('AMASYA'),('ANKARA'),('ANTALYA'),
('ARTVİN'),('AYDIN'),('BALIKESİR'),('BİLECİK'),('BİNGÖL'),('BİTLİS'),('BOLU'),
('BURDUR'),('BURSA'),('ÇANAKKALE'),('ÇANKIRI'),('ÇORUM'),('DENİZLİ'),('DİYARBAKIR'),
('EDİRNE'),('ELAZIĞ'),('ERZİNCAN'),('ERZURUM'),('ESKİŞEHİR'),('GAZİANTEP'),
('GİRESUN'),('GÜMÜŞHANE'),('HAKKARİ'),('HATAY'),('ISPARTA'),('İÇEL'),('İSTANBUL'),
('İZMİR'),('KARS'),('KASTAMONU'),('KAYSERİ'),('KIRKLARELİ'),('KIRŞEHİR'),('KOCAELİ'),
('KONYA'),('KÜTAHYA'),('MALATYA'),('MANİSA'),('KAHRAMANMARAŞ'),('MARDİN'),('MUĞLA'),
('MUŞ'),('NEVŞEHİR'),('NİĞDE'),('ORDU'),('RİZE'),('SAKARYA'),('SAMSUN'),('SİİRT'),
('SİNOP'),('SİVAS'),('TEKİRDAĞ'),('TOKAT'),('TRABZON'),('TUNCELİ'),('ŞANLIURFA'),
('UŞAK'),('VAN'),('YOZGAT'),('ZONGULDAK'),('AKSARAY'),('BAYBURT'),('KARAMAN'),
('KIRIKKALE'),('BATMAN'),('ŞIRNAK'),('BARTIN'),('ARDAHAN'),('IĞDIR'),('YALOVA'),
('KARABÜK'),('KİLİS'),('OSMANİYE'),('DÜZCE');

-- İlçeleri ekle (örnek olarak ilk birkaç il için)
INSERT INTO ilceler (il_id, ilce) VALUES 
-- ADANA (id: 1)
(1, 'SEYHAN'),(1, 'CEYHAN'),(1, 'FEKE'),(1, 'KARAİSALI'),(1, 'KARATAŞ'),
(1, 'KOZAN'),(1, 'POZANTI'),(1, 'SAİMBEYLİ'),(1, 'TUFANBEYLİ'),(1, 'YUMURTALIK'),
(1, 'YÜREĞİR'),(1, 'ALADAĞ'),(1, 'İMAMOĞLU'),
-- ANKARA (id: 6)
(6, 'ALTINDAĞ'),(6, 'AYAS'),(6, 'BALA'),(6, 'BEYPAZARI'),(6, 'ÇAMLIDERE'),
(6, 'ÇANKAYA'),(6, 'ÇUBUK'),(6, 'ELMADAĞ'),(6, 'GÜDÜL'),(6, 'HAYMANA'),
(6, 'KALECİK'),(6, 'KIZILCAHAMAM'),(6, 'NALLIHAN'),(6, 'POLATLI'),
(6, 'ŞEREFLİKOÇHİSAR'),(6, 'YENİMAHALLE'),(6, 'GÖLBAŞI'),(6, 'KEÇİÖREN'),
(6, 'MAMAK'),(6, 'SİNCAN'),(6, 'KAZAN'),(6, 'AKYURT'),(6, 'ETİMESGUT'),
(6, 'EVREN'),
-- İSTANBUL (id: 34)
(34, 'ADALAR'),(34, 'BAKIRKÖY'),(34, 'BEŞİKTAŞ'),(34, 'BEYKOZ'),(34, 'BEYOĞLU'),
(34, 'ÇATALCA'),(34, 'EMİNÖNÜ'),(34, 'EYÜP'),(34, 'FATİH'),(34, 'GAZİOSMANPAŞA'),
(34, 'KADIKÖY'),(34, 'KARTAL'),(34, 'SARIYER'),(34, 'SİLİVRİ'),(34, 'ŞİLE'),
(34, 'ŞİŞLİ'),(34, 'ÜSKÜDAR'),(34, 'ZEYTİNBURNU'),(34, 'BÜYÜKÇEKMECE'),
(34, 'KAĞITHANE'),(34, 'KÜÇÜKÇEKMECE'),(34, 'PENDİK'),(34, 'ÜMRANİYE'),
(34, 'BAYRAMPAŞA'),(34, 'AVCILAR'),(34, 'BAĞCILAR'),(34, 'BAHÇELİEVLER'),
(34, 'GÜNGÖREN'),(34, 'MALTEPE'),(34, 'SULTANBEYLİ'),(34, 'TUZLA'),
(34, 'ESENLER'),(34, 'ARNAVUTKÖY'),(34, 'ATAŞEHİR'),(34, 'BAŞAKŞEHİR'),
(34, 'BEYLİKDÜZÜ'),(34, 'ÇEKMEKÖY'),(34, 'ESENYURT'),(34, 'SANCAKTEPE'),
(34, 'SULTANGAZİ');