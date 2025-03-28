-- Add indexes to improve VIN reader query performance
CREATE INDEX idx_vinreader_test_id_tarih ON vinreader (test_id, tarih);
CREATE INDEX idx_vinreader_plaka_tarih ON vinreader (plaka, tarih);
CREATE INDEX idx_vinreader_kontrolmod ON vinreader (kontrolmod);
