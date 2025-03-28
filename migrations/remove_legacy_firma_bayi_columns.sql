-- First verify that firma_id and bayi_id columns exist and have proper foreign key constraints
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.COLUMNS 
    WHERE TABLE_NAME = 'kullanicilar' 
    AND COLUMN_NAME IN ('firma_id', 'bayi_id')
) as has_new_columns;

-- Remove the legacy columns
ALTER TABLE kullanicilar
DROP COLUMN IF EXISTS firma,
DROP COLUMN IF EXISTS bayi;