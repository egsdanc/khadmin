import { sql } from "drizzle-orm";
import { db } from "@db";

export async function fixKalanTutarColumn() {
  try {
    console.log("Fixing kalan_tutar column in cihaz_satislari table...");

    // First drop the generated column if it exists
    await db.execute(sql`
      ALTER TABLE cihaz_satislari 
      DROP COLUMN IF EXISTS kalan_tutar;
    `);

    // Then add it back as a regular column
    await db.execute(sql`
      ALTER TABLE cihaz_satislari 
      ADD COLUMN kalan_tutar DECIMAL(10,2) NOT NULL;
    `);

    console.log("Successfully fixed kalan_tutar column");
  } catch (error) {
    console.error("Error fixing kalan_tutar column:", error);
    throw error;
  }
}