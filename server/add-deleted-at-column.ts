import { db } from "./services/database-service";

async function addDeletedAtColumn() {
  let connection;
  try {
    console.log("Roles tablosuna deleted_at kolonu ekleniyor...");
    
    connection = await db.getConnection();
    
    await connection.query(`
      ALTER TABLE roles 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;
    `);
    
    console.log("deleted_at kolonu başarıyla eklendi");
    
    return true;
  } catch (error) {
    console.error('Kolon ekleme hatası:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Migration'ı çalıştır
addDeletedAtColumn().catch(console.error);
