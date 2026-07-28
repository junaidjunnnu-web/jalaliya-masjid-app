-- Make committee_members tenure_start, tenure_end, and photo_url nullable
ALTER TABLE committee_members ALTER COLUMN tenure_start DROP NOT NULL;
ALTER TABLE committee_members ALTER COLUMN tenure_end DROP NOT NULL;
ALTER TABLE committee_members ALTER COLUMN photo_url DROP NOT NULL;
