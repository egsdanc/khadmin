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

async function updateIslemTipiColumn() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Modify islem_tipi column to use ENUM
    await connection.execute(`
      ALTER TABLE bakiye_islemleri 
      MODIFY COLUMN islem_tipi ENUM('bakiye_yukleme', 'test_komisyonu', 'manuel_komisyon') NOT NULL;
    `);

    // Update existing records
    await connection.execute(`
      UPDATE bakiye_islemleri 
      SET islem_tipi = CASE 
        WHEN islem_tipi = 'yukleme' THEN 'bakiye_yukleme'
        WHEN islem_tipi = 'komisyon_kesintisi' THEN 'test_komisyonu'
        ELSE islem_tipi 
      END;
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
updateIslemTipiColumn();
