-- Add deleted_at column to cihaz_satislari table
ALTER TABLE cihaz_satislari
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Add index for soft delete queries
CREATE INDEX idx_cihaz_satislari_deleted_at ON cihaz_satislari(deleted_at);
