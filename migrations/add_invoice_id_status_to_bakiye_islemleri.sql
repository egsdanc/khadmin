-- bakiye_islemleri tablosuna invoice_id ve status sütunlarını ekle
ALTER TABLE bakiye_islemleri 
ADD COLUMN invoice_id VARCHAR(100) DEFAULT NULL COMMENT 'Sipay invoice ID',
ADD COLUMN status TINYINT DEFAULT 0 COMMENT 'İşlem durumu: 0=beklemede, 1=başarılı, 2=başarısız';

-- İndeks ekle
CREATE INDEX idx_bakiye_islemleri_invoice_id ON bakiye_islemleri(invoice_id);
CREATE INDEX idx_bakiye_islemleri_status ON bakiye_islemleri(status); 