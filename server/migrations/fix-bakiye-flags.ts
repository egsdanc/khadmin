import { db } from "../services/database-service";
import type { PoolConnection } from "mysql2/promise";

export async function fixBakiyeFlags() {
  let connection: PoolConnection | null = null;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Set manuel_yukleme flag for all positive transactions
    await connection.execute(`
      UPDATE bakiye_islemleri 
      SET manuel_yukleme = 1,
          aciklama = CONCAT('Manuel bakiye yukleme: ', miktar, ' TL')
      WHERE miktar > 0 
        AND (manuel_yukleme = 0 OR manuel_yukleme IS NULL)
        AND (iyzico_yukleme = 0 OR iyzico_yukleme IS NULL)
    `);

    await connection.commit();
    console.log("Bakiye flags successfully updated");
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error updating bakiye flags:", error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}