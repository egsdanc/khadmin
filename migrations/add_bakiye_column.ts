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

async function addBakiyeColumn() {
  try {
    const connection = await pool.getConnection();

    // Add bakiye column if it doesn't exist
    await connection.query(`
      ALTER TABLE bayiler
      ADD COLUMN IF NOT EXISTS bakiye DECIMAL(10,2) DEFAULT 0.00 NOT NULL;
    `);

    // Add bakiye_islemleri table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bakiye_islemleri (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bayi_id INT NOT NULL,
        islem_tipi ENUM('yukleme', 'komisyon_kesintisi') NOT NULL,
        miktar DECIMAL(10,2) NOT NULL,
        bakiye_sonrasi DECIMAL(10,2) NOT NULL,
        test_id INT,
        aciklama TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
      );
    `);

    console.log('Migration completed successfully');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
addBakiyeColumn();