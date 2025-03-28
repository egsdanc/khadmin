-- Add indexes to improve bayiler table query performance
CREATE INDEX IF NOT EXISTS idx_bayiler_firma ON bayiler (firma);
CREATE INDEX IF NOT EXISTS idx_bayiler_aktif ON bayiler (aktif);
CREATE INDEX IF NOT EXISTS idx_bayiler_created_at ON bayiler (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bayiler_firma_aktif ON bayiler (firma, aktif);
CREATE INDEX IF NOT EXISTS idx_bayiler_search ON bayiler (ad, email, telefon);
