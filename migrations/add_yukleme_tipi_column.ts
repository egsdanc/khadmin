import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addYuklemeTipiColumn() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Add yukleme_tipi column to bakiye_islemleri table with ENUM type
    await connection.execute(`
      ALTER TABLE bakiye_islemleri 
      ADD COLUMN IF NOT EXISTS yukleme_tipi ENUM('manual', 'iyzico') NOT NULL DEFAULT 'manual' 
      AFTER islem_tipi;
    `);

    await connection.commit();
    console.log('Migration completed successfully');
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

// Run migration
addYuklemeTipiColumn();