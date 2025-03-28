-- Add indexes to improve program_users (kullanicilar) query performance
CREATE INDEX IF NOT EXISTS idx_kullanicilar_firma_id ON kullanicilar (firma_id);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_bayi ON kullanicilar (bayi);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_firstlogin ON kullanicilar (firstlogin);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_search ON kullanicilar (isim, macAdress);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_created_at ON kullanicilar (firstlogin DESC);
