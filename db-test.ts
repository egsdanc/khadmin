import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function testDatabaseConnection() {
  console.log("MySQL bağlantısı test ediliyor...");
  console.log("Bağlantı detayları:", {
    host: process.env.MYSQL_HOST || '149.202.76.5',
    user: 'kilometr_s',
    database: process.env.MYSQL_DATABASE || 'kilometr_yedek'
  });

  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || '149.202.76.5',
      user: 'kilometr_s',
      password: 'oCJ0ibbD6Cu1',
      database: process.env.MYSQL_DATABASE || 'kilometr_yedek'
    });

    console.log("MySQL bağlantısı başarılı!");
    await connection.end();
    return true;
  } catch (error: any) {
    console.error("MySQL bağlantı hatası:", error.message);
    console.error("Detaylı hata bilgisi:", error);
    return false;
  }
}

testDatabaseConnection();