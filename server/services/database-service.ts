import mysql from 'mysql2/promise';
import { sql } from "drizzle-orm";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || '149.202.76.5',
      user: 'kilometr_s', // Explicitly set correct username
      password: process.env.MYSQL_PASSWORD || 'oCJ0ibbD6Cu1',
      database: process.env.MYSQL_DATABASE || 'kilometr_yedek',
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
  }

  async getConnection() {
    try {
      return await this.pool.getConnection();
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async executeQuery(sql: string, params?: any[]) {
    const connection = await this.getConnection();
    try {
      const [results] = await connection.query(sql, params);
      return results;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async testConnection() {
    try {
      const connection = await this.getConnection();
      console.log('MySQL connection successful');
      connection.release();
      return true;
    } catch (error: any) {
      console.error('MySQL connection error:', error);
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('MySQL kullanıcı adı veya şifre hatalı');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('MySQL sunucusuna bağlanılamadı');
      } else if (error.code === 'ER_HOST_NOT_PRIVILEGED') {
        console.error('Bu IP adresinden bağlantıya izin verilmiyor');
      }
      throw error;
    }
  }
}

const db = new DatabaseService();

export { db };

// Firma ilişkilendirme migration'ı
export async function updateUsersFirmaRelation() {
  try {
    console.log("Firma ilişkilendirmesi başlatılıyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log('Firma ilişkilendirmesi başarıyla tamamlandı');
    return true;
  } catch (error) {
    console.error('Firma ilişkilendirmesi hatası:', error);
    throw error;
  }
}

// Firma ilişkilendirmesini kontrol etmek için fonksiyon
export async function checkUsersFirmaRelation() {
  try {
    // Replace with actual MySQL queries using db.executeQuery
    const result = await db.executeQuery('/* Your MySQL query here */');
    return {
      userFirmaData: result,
      hasForeignKey: false,
      hasIndex: false
    };
  } catch (error) {
    console.error('Firma ilişkilendirmesi kontrolü hatası:', error);
    throw error;
  }
}

// Panel users ve bayiler ilişkilendirme migration'ı
export async function updatePanelUserRelations() {
  try {
    console.log("Panel users ilişkilendirmesi başlatılıyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log('Panel users ilişkilendirmesi başarıyla tamamlandı');
    return true;
  } catch (error) {
    console.error('Panel users ilişkilendirmesi hatası:', error);
    throw error;
  }
}

// İlişkilendirmeleri kontrol etmek için fonksiyon
export async function checkPanelUserRelations() {
  try {
    // Replace with actual MySQL queries using db.executeQuery
    const result = await db.executeQuery('/* Your MySQL query here */');
    return {
      foreignKeys: result,
      indexes: [],
      relations: []
    };
  } catch (error) {
    console.error('İlişki kontrolü hatası:', error);
    throw error;
  }
}

// Komisyon tablolarının oluşturulması
export const createKomisyonTables = async () => {
  try {
    console.log('Komisyon tabloları oluşturuluyor...');
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log('Komisyon tabloları başarıyla oluşturuldu');
  } catch (error) {
    console.error('Komisyon tabloları oluşturulurken hata:', error);
    throw error;
  }
};


// Tests tablosunu silmek için yeni fonksiyon
export async function dropTestsTable() {
  try {
    console.log("Tests tablosu siliniyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log('Tests tablosu başarıyla silindi');
    return true;
  } catch (error) {
    console.error('Tests tablosu silinirken hata:', error);
    throw error;
  }
}

// Bayi ilişkilendirme migration'ı
export async function updateUsersBayiRelation() {
  try {
    console.log("Bayi ilişkilendirmesi başlatılıyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log("Bayi ilişkilendirmesi başarıyla tamamlandı");
    return true;
  } catch (error) {
    console.error('Bayi ilişkilendirmesi hatası:', error);
    throw error;
  }
}

// Panel users firma ilişkilendirmesini migration'ı
export async function updatePanelUsersFirmaRelation() {
  try {
    console.log("Panel users firma ilişkilendirmesi başlatılıyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log("Panel users firma ilişkilendirmesi başarıyla tamamlandı");
    return true;
  } catch (error) {
    console.error('Panel users firma ilişkilendirmesi hatası:', error);
    throw error;
  }
}

// Panel users bayi ilişkilendirmesini migration'ı
export async function updatePanelUsersBayiRelation() {
  try {
    console.log("Panel users bayi ilişkilendirmesi başlatılıyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log("Panel users bayi ilişkilendirmesi başarıyla tamamlandı");
    return true;
  } catch (error) {
    console.error('Panel users bayi ilişkilendirmesi hatası:', error);
    throw error;
  }
}

// Bayi-firma ilişkilendirme migration'ı
export async function updateBayiFirmaRelation() {
  try {
    console.log("Bayi-firma ilişkilendirmesi başlatılıyor...");
    // Replace with actual MySQL queries using db.executeQuery
    await db.executeQuery('/* Your MySQL query here */');
    console.log("Bayi-firma ilişkilendirmesi başarıyla tamamlandı");
    return true;
  } catch (error) {
    console.error('Bayi-firma ilişkilendirmesi hatası:', error);
    throw error;
  }
}