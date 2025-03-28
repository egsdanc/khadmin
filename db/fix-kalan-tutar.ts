import { db } from "@db";
import { sql } from "drizzle-orm";

async function fixKalanTutarColumn() {
  try {
    // First drop the generated column
    await db.execute(sql`
      ALTER TABLE cihaz_satislari 
      DROP COLUMN kalan_tutar;
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

fixKalanTutarColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
