import { updatePanelUserRelations, testConnection, checkPanelUserRelations } from './services/database-service';

async function testMigration() {
  try {
    // Önce bağlantıyı test et
    await testConnection();

    // Panel users ilişkilendirmesini yap
    await updatePanelUserRelations();

    // İlişkilendirmeyi kontrol et
    const checkResult = await checkPanelUserRelations();

    console.log('İlişkilendirme Kontrol Sonuçları:');
    console.log('Foreign Keys:', checkResult.foreignKeys);
    console.log('İndeksler:', checkResult.indexes);
    console.log('İlişkili Kayıtlar:', checkResult.relations);

    console.log('Migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Migration hatası:', error);
  }
}

testMigration();