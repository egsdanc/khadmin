import { db } from '../services/database-service';

async function updateBakiyeColumns() {
  let connection;
  try {
    connection = await db.getConnection();
    
    console.log("Bakiye sütunları güncelleniyor...");
    
    await connection.query(`
      ALTER TABLE bakiye_islemleri
      MODIFY COLUMN manuel_yukleme DECIMAL(10,2) DEFAULT 0.00,
      MODIFY COLUMN iyzico_yukleme DECIMAL(10,2) DEFAULT 0.00,
      MODIFY COLUMN miktar DECIMAL(10,2) DEFAULT 0.00,
      MODIFY COLUMN bakiye_sonrasi DECIMAL(10,2) DEFAULT 0.00;
    `);
    
    console.log("Bakiye sütunları başarıyla güncellendi");
    
  } catch (error) {
    console.error('Bakiye sütunları güncelleme hatası:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

updateBakiyeColumns().catch(console.error);
