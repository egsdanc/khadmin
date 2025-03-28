-- Add indexes to improve kilometre query performance
CREATE INDEX idx_testler_test_id_tarih ON testler (test_id, tarih);
CREATE INDEX idx_testler_plaka_tarih ON testler (plaka, tarih);
CREATE INDEX idx_testler_usersid_tarih ON testler (usersid, tarih);