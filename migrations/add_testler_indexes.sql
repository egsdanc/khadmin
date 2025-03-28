-- Add indexes to improve testler table query performance
CREATE INDEX IF NOT EXISTS idx_testler_test_id ON testler (test_id);
CREATE INDEX IF NOT EXISTS idx_testler_tarih ON testler (tarih);
CREATE INDEX IF NOT EXISTS idx_testler_usersid ON testler (usersid);
CREATE INDEX IF NOT EXISTS idx_testler_plaka ON testler (plaka);
