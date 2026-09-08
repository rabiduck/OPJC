-- OPJC member resources storage metadata
-- Run once against opjc-uat before testing file uploads.
-- Run once against opjc-prod before promoting file upload functionality.

ALTER TABLE resources
ADD COLUMN file_size INTEGER NOT NULL DEFAULT 0 CHECK (file_size >= 0);
