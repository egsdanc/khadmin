import { executeQuery } from './services/connection';

async function testBayilerQuery() {
  try {
    console.log("Test sorgusu başlatılıyor...");
    
    const sql = `
      SELECT 
        b.id,
        b.ad,
        b.telefon,
        b.email,
        b.adres,
        b.il,
        b.ilce,
        b.aktif,
        b.firma,
        f.name as firma_adi,
        f.firma_unvan as firma_unvan
      FROM bayiler b
      LEFT JOIN firmalar f ON b.firma = f.id
      WHERE b.deleted_at IS NULL 
      ORDER BY b.created_at DESC
      LIMIT 5;
    `;

    const result = await executeQuery(sql);
    console.log("Sorgu sonucu:", JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Sorgu hatası:', error);
    throw error;
  }
}

testBayilerQuery().catch(console.error);
