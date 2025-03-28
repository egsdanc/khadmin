import { sql } from "drizzle-orm";
import { db } from "@db";

export async function updateBakiyeFlags() {
  try {
    console.log("Bakiye işlem flag'leri güncelleniyor...");

    // Pozitif bakiye işlemleri için manuel_yukleme flag'ini güncelle
    await db.execute(sql`
      UPDATE bakiye_islemleri 
      SET manuel_yukleme = true 
      WHERE miktar > 0 AND manuel_yukleme = false;
    `);

    console.log("Bakiye işlem flag'leri başarıyla güncellendi");
  } catch (error) {
    console.error("Bakiye işlem flag'leri güncellenirken hata:", error);
    throw error;
  }
}
