import { db } from '../db';
import { sql } from 'drizzle-orm';

async function addUlkeIdToIller() {
  try {
    console.log('İller tablosuna ulke_id alanı ekleniyor...');
    
    // İller tablosuna ulke_id alanı ekle
    await db.execute(sql`
      ALTER TABLE iller 
      ADD COLUMN ulke_id INT NOT NULL DEFAULT 1,
      ADD CONSTRAINT fk_iller_ulkeler FOREIGN KEY (ulke_id) REFERENCES ulkeler(id)
    `);
    
    console.log('ulke_id alanı başarıyla eklendi');
    
    // Mevcut tüm illeri Türkiye'ye bağla
    await db.execute(sql`
      UPDATE iller SET ulke_id = 1 WHERE ulke_id IS NULL OR ulke_id = 0
    `);
    
    console.log('Mevcut iller Türkiye\'ye bağlandı');
    
    console.log('Migration tamamlandı!');
  } catch (error) {
    console.error('Migration hatası:', error);
  } finally {
    process.exit(0);
  }
}

addUlkeIdToIller();
