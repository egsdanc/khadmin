import { updatePanelUsersFirmaRelation, testConnection } from './services/database-service';

async function testPanelUsersFirmaMigration() {
  try {
    // Önce bağlantıyı test et
    await testConnection();

    // Panel users firma ilişkilendirmesini yap
    await updatePanelUsersFirmaRelation();

    console.log('Migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Migration hatası:', error);
  }
}

testPanelUsersFirmaMigration();
