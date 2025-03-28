import { updatePanelUsersBayiRelation, testConnection } from './services/database-service';

async function testPanelUsersBayiMigration() {
  try {
    // Önce bağlantıyı test et
    await testConnection();

    // Panel users bayi ilişkilendirmesini yap
    await updatePanelUsersBayiRelation();

    console.log('Migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Migration hatası:', error);
  }
}

testPanelUsersBayiMigration();
