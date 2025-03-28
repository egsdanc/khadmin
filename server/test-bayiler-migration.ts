import { db } from './services/database-service';

async function updateBayilerFirma() {
  const connection = await db.getConnection();
  try {
    console.log("Bayiler firma ilişkilendirmesi başlatılıyor...");

    // Önce tabloların yapısını kontrol et
    const [bayilerStructure] = await connection.query(`
      SHOW CREATE TABLE bayiler;
    `);
    console.log("Bayiler tablosu yapısı:", bayilerStructure);

    const [firmalarStructure] = await connection.query(`
      SHOW CREATE TABLE firmalar;
    `);
    console.log("Firmalar tablosu yapısı:", firmalarStructure);

    // Firma alanı NULL olabilir olarak güncelle
    await connection.query(`
      ALTER TABLE bayiler
      MODIFY COLUMN firma INT NULL;
    `);
    console.log("Firma alanı NULL olarak güncellendi");

    // Firma ilişkilendirmesini güncelle
    await connection.query(`
      UPDATE bayiler 
      SET firma = 1 
      WHERE ad IN ('Ankara / Yenimahalle', 'Ankara / Otokent', 'Ankara / Yahyalar');
    `);
    console.log("Firma ilişkilendirmesi güncellendi");

    // Foreign key'i kontrol et ve ekle
    const [foreignKeys] = await connection.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_NAME = 'bayiler' 
      AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
      AND CONSTRAINT_NAME = 'fk_bayiler_firma';
    `);

    if (Array.isArray(foreignKeys) && foreignKeys.length === 0) {
      await connection.query(`
        ALTER TABLE bayiler
        ADD CONSTRAINT fk_bayiler_firma
        FOREIGN KEY (firma) REFERENCES firmalar(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
      console.log("Foreign key kısıtlaması eklendi");
    }

    console.log("Bayiler firma ilişkilendirmesi başarıyla tamamlandı");
    return true;
  } catch (error) {
    console.error('Bayiler firma ilişkilendirme hatası:', error);
    throw error;
  } finally {
    connection.release();
  }
}

updateBayilerFirma().catch(console.error);