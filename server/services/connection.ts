import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '149.202.76.5',
  user: 'kilometr_s',
  password: process.env.MYSQL_PASSWORD || 'oCJ0ibbD6Cu1',
  database: process.env.MYSQL_DATABASE || 'kilometr_yedek',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Add these options to handle boolean values properly
  typeCast: function (field, next) {
    if (field.type === 'TINY' && field.length === 1) {
      return field.string() === '1'; // Convert to true/false
    }
    return next();
  }
});

async function executeQuery(sql: string, params?: any[]) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.execute(sql, params);

    // Convert any MySQL tinyint(1) to proper number for consistency
    if (Array.isArray(results)) {
      results.forEach(row => {
        if ('bayi_aktif' in row) {
          row.bayi_aktif = row.bayi_aktif ? 1 : 0;
        }
      });
    }

    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function testConnection() {
  try {
    const connection = await pool.getConnection();
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

export { pool, executeQuery, testConnection };