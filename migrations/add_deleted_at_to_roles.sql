-- Roles tablosuna deleted_at kolonunu ekle
ALTER TABLE roles 
ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;
