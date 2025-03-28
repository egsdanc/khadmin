-- Add indexes to improve panel_users query performance
CREATE INDEX IF NOT EXISTS idx_panel_users_firma_id ON panel_users (firma_id);
CREATE INDEX IF NOT EXISTS idx_panel_users_bayi_id ON panel_users (bayi_id);
CREATE INDEX IF NOT EXISTS idx_panel_users_status ON panel_users (status);
CREATE INDEX IF NOT EXISTS idx_panel_users_role ON panel_users (role);
CREATE INDEX IF NOT EXISTS idx_panel_users_created_at ON panel_users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_panel_users_search ON panel_users (name, email);
CREATE INDEX IF NOT EXISTS idx_panel_users_deleted_at ON panel_users (deleted_at);
