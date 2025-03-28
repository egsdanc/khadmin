import { sql } from "drizzle-orm";
import { db } from "@db";

export async function syncKomisyonTutarFields() {
  try {
    console.log("Syncing komisyon_tutar fields...");

    // Update komisyon_tutar field in bayiler table
    await db.execute(sql`
      ALTER TABLE bayiler 
      MODIFY COLUMN komisyon_tutar DECIMAL(10,2) NOT NULL DEFAULT '0.00'
    `);

    // Update komisyon_tutar field in bakiye_komisyonlar table
    await db.execute(sql`
      ALTER TABLE bakiye_komisyonlar 
      MODIFY COLUMN komisyon_tutar DECIMAL(10,2) NOT NULL DEFAULT '0.00'
    `);

    console.log("Successfully synced komisyon_tutar fields");
  } catch (error) {
    console.error("Error syncing komisyon_tutar fields:", error);
    throw error;
  }
}
