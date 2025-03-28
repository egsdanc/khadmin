import { updateUsersBayiRelation, testConnection } from './services/database-service';

async function testBayiMigration() {
  try {
    // Önce bağlantıyı test et
    await testConnection();

    // Bayi ilişkilendirmesini yap
    await updateUsersBayiRelation();

    console.log('Migration başarıyla tamamlandı');
  } catch (error) {
    console.error('Migration hatası:', error);
  }
}

testBayiMigration();
