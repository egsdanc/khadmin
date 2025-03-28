import { executeQuery } from './connection';

export async function updatePanelUserRelations() {
  try {
    console.log("Panel users ilişkilendirmesi başlatılıyor...");

    // Kolon kontrolleri ve ekleme
    await executeQuery(`
      ALTER TABLE panel_users 
      ADD COLUMN IF NOT EXISTS firma_id INT NULL,
      ADD COLUMN IF NOT EXISTS bayi_id INT NULL;
    `);

    // Foreign key kontrolleri ve ekleme
    const [firmaForeignKeys, bayiForeignKeys] = await Promise.all([
      executeQuery(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_NAME = 'panel_users' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME = 'fk_panel_users_firma';
      `),
      executeQuery(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_NAME = 'panel_users' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME = 'fk_panel_users_bayi';
      `)
    ]);

    // Firma foreign key yoksa ekle
    if (Array.isArray(firmaForeignKeys) && firmaForeignKeys.length === 0) {
      await executeQuery(`
        ALTER TABLE panel_users
        ADD CONSTRAINT fk_panel_users_firma
        FOREIGN KEY (firma_id) REFERENCES firmalar(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    }

    // Bayi foreign key yoksa ekle
    if (Array.isArray(bayiForeignKeys) && bayiForeignKeys.length === 0) {
      await executeQuery(`
        ALTER TABLE panel_users
        ADD CONSTRAINT fk_panel_users_bayi
        FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    }

    // İndeksleri kontrol et ve ekle
    const [firmaIndexes, bayiIndexes] = await Promise.all([
      executeQuery(`SHOW INDEX FROM panel_users WHERE Key_name = 'idx_firma_id';`),
      executeQuery(`SHOW INDEX FROM panel_users WHERE Key_name = 'idx_bayi_id';`)
    ]);

    if (Array.isArray(firmaIndexes) && firmaIndexes.length === 0) {
      await executeQuery(`
        ALTER TABLE panel_users
        ADD INDEX idx_firma_id (firma_id);
      `);
    }

    if (Array.isArray(bayiIndexes) && bayiIndexes.length === 0) {
      await executeQuery(`
        ALTER TABLE panel_users
        ADD INDEX idx_bayi_id (bayi_id);
      `);
    }

    return true;
  } catch (error) {
    console.error('Panel users ilişkilendirme hatası:', error);
    throw error;
  }
}

export async function checkPanelUserRelations() {
  try {
    const [foreignKeys, indexes, relations] = await Promise.all([
      executeQuery(`
        SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_NAME = 'panel_users' 
        AND REFERENCED_TABLE_NAME IS NOT NULL;
      `),
      executeQuery(`SHOW INDEX FROM panel_users;`),
      executeQuery(`
        SELECT 
          pu.id, 
          pu.email,
          f.name as firma_name,
          b.ad as bayi_name
        FROM panel_users pu
        LEFT JOIN firmalar f ON pu.firma_id = f.id
        LEFT JOIN bayiler b ON pu.bayi_id = b.id;
      `)
    ]);

    return { foreignKeys, indexes, relations };
  } catch (error) {
    console.error('İlişki kontrolü hatası:', error);
    throw error;
  }
}

export default {
  updatePanelUserRelations,
  checkPanelUserRelations
};
