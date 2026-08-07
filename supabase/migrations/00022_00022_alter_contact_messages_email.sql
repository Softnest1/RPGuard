ALTER TABLE contact_messages ALTER COLUMN email DROP NOT NULL;
ALTER TABLE contact_messages RENAME COLUMN email TO contact_info;
