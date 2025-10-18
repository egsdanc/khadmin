-- Fix panel_users table to use name and lastname instead of first_name and last_name

-- First, add lastname column if it doesn't exist
ALTER TABLE panel_users 
ADD COLUMN lastname VARCHAR(255) DEFAULT NULL;

-- Update existing records to populate lastname from last_name
UPDATE panel_users 
SET lastname = last_name 
WHERE last_name IS NOT NULL AND last_name != '';

-- Drop the first_name and last_name columns
ALTER TABLE panel_users 
DROP COLUMN first_name,
DROP COLUMN last_name;



