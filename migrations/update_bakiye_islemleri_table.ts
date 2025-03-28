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

async function updateBakiyeIslemleriTable() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Add new boolean columns
    await connection.execute(`
      ALTER TABLE bakiye_islemleri 
      ADD COLUMN manuel_yukleme BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN iyzico_yukleme BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN test_komisyonu BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN manuel_komisyon BOOLEAN NOT NULL DEFAULT false;
    `);

    // Update new columns based on existing data
    await connection.execute(`
      UPDATE bakiye_islemleri 
      SET 
        manuel_yukleme = CASE 
          WHEN islem_tipi = 'bakiye_yukleme' AND yukleme_tipi = 'manual' THEN true 
          ELSE false 
        END,
        iyzico_yukleme = CASE 
          WHEN islem_tipi = 'bakiye_yukleme' AND yukleme_tipi = 'iyzico' THEN true 
          ELSE false 
        END,
        test_komisyonu = CASE 
          WHEN islem_tipi = 'test_komisyonu' THEN true 
          ELSE false 
        END,
        manuel_komisyon = CASE 
          WHEN islem_tipi = 'manuel_komisyon' THEN true 
          ELSE false 
        END;
    `);

    // Drop old columns
    await connection.execute(`
      ALTER TABLE bakiye_islemleri 
      DROP COLUMN islem_tipi,
      DROP COLUMN yukleme_tipi;
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

updateBakiyeIslemleriTable();
