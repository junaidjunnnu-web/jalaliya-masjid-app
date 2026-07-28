-- Add phone and occupation columns to family_members table
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone VARCHAR(15);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
