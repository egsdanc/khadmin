import { updateUsersFirmaRelation, testConnection, checkUsersFirmaRelation } from './services/database-service.js';

async function testMigration() {
  try {
    // Önce bağlantıyı test et
    await testConnection();

    // Firma ilişkilendirmesini yap
    await updateUsersFirmaRelation();

    // İlişkilendirmeyi kontrol et
    const checkResult = await checkUsersFirmaRelation();

    console.log('İlişkilendirme Kontrol Sonuçları:');
    console.log('Kullanıcı-Firma Eşleşmeleri:', checkResult.userFirmaData);
    console.log('Foreign Key Mevcut:', checkResult.hasForeignKey);
    console.log('İndeks Mevcut:', checkResult.hasIndex);

    console.log('Migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Migration hatası:', error);
  }
}

testMigration();
