import { sql } from "drizzle-orm";
import { db } from "@db";

export async function createBakiyeTables() {
  try {
    console.log("Bakiye tabloları oluşturuluyor...");

    // Bakiye işlemleri tablosu
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bakiye_islemleri (
        id SERIAL PRIMARY KEY,
        bayi_id INTEGER NOT NULL,
        manuel_yukleme BOOLEAN DEFAULT FALSE,
        iyzico_yukleme BOOLEAN DEFAULT FALSE,
        test_komisyonu BOOLEAN DEFAULT FALSE,
        miktar DECIMAL(10,2) NOT NULL,
        bakiye_sonrasi DECIMAL(10,2) NOT NULL,
        aciklama TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bayi_id) REFERENCES bayiler(id)
      );

      CREATE INDEX IF NOT EXISTS idx_bakiye_islemleri_bayi_id ON bakiye_islemleri(bayi_id);
    `);

    console.log("Bakiye tabloları başarıyla oluşturuldu");
  } catch (error) {
    console.error("Bakiye tabloları oluşturulurken hata:", error);
    throw error;
  }
}