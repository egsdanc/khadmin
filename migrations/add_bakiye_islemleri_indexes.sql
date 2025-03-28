-- Add indexes to improve bakiye_islemleri query performance
CREATE INDEX idx_bakiye_islemleri_created_at ON bakiye_islemleri (created_at);
CREATE INDEX idx_bakiye_islemleri_bayi_id ON bakiye_islemleri (bayi_id);
CREATE INDEX idx_bakiye_islemleri_type ON bakiye_islemleri (manuel_yukleme, iyzico_yukleme, test_komisyonu);