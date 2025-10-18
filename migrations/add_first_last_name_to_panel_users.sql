-- Add first_name and last_name columns to panel_users table
ALTER TABLE panel_users 
ADD COLUMN first_name VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN last_name VARCHAR(255) NOT NULL DEFAULT '';

-- Update existing records to split the name field
-- This is a basic split - you might want to customize this based on your data
UPDATE panel_users 
SET 
  first_name = CASE 
    WHEN LOCATE(' ', name) > 0 THEN SUBSTRING(name, 1, LOCATE(' ', name) - 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN LOCATE(' ', name) > 0 THEN SUBSTRING(name, LOCATE(' ', name) + 1)
    ELSE ''
  END
WHERE first_name = '' OR last_name = '';

-- Make the columns NOT NULL after populating them
ALTER TABLE panel_users 
MODIFY COLUMN first_name VARCHAR(255) NOT NULL,
MODIFY COLUMN last_name VARCHAR(255) NOT NULL;
