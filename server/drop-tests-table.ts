import { dropTestsTable } from './services/database-service';

async function dropTests() {
  try {
    const result = await dropTestsTable();
    if (result) {
      console.log('Tests tablosu başarıyla silindi');
    } else {
      console.log('Tests tablosu zaten mevcut değil');
    }
  } catch (error) {
    console.error('Hata:', error);
  }
}

dropTests();
