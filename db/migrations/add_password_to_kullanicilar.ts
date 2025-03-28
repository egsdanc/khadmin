import { sql } from "drizzle-orm";
import { db } from "@db";

export async function addPasswordToKullanicilar() {
  try {
    console.log("Adding password column to kullanicilar table...");

    await db.execute(sql`
      ALTER TABLE kullanicilar
      ADD COLUMN IF NOT EXISTS password VARCHAR(255);
    `);

    console.log("Successfully added password column to kullanicilar table");
  } catch (error) {
    console.error("Error adding password column:", error);
    throw error;
  }
}
