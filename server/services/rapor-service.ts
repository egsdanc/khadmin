import { db } from "@db";
import { companies, bayiler, bakiye_komisyonlar } from "@db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

interface KomisyonParams {
  firma_id?: string;
  bayi_id?: string;
  ay: string;
  yil: string;
  role?: string; // Kullanıcı rolü
  user_bayi_id?: number; // Giriş yapan kullanıcının bayi ID'si
}

export class RaporService {
  async getKomisyonOzet(params: KomisyonParams) {
    try {
      // Güvenlik kontrolleri
      const ay = parseInt(params.ay);
      const yil = parseInt(params.yil);
console.log("bbbCD",params.role," ",params.user_bayi_id)
      if (isNaN(ay) || ay < 1 || ay > 12) {
        throw new Error("Geçersiz ay değeri");
      }
      if (isNaN(yil) || yil < 2000 || yil > 2100) {
        throw new Error("Geçersiz yıl değeri");
      }

      // Filtre koşulları
      const whereConditions = [];

      // Firma ve bayi filtreleri
      if (params.firma_id && params.firma_id !== 'all') {
        whereConditions.push(eq(bayiler.firma, parseInt(params.firma_id)));
      }

      if (params.bayi_id && params.bayi_id !== 'all') {
        whereConditions.push(eq(bayiler.id, parseInt(params.bayi_id)));
      }

      const result = await db
        .select({
          firma_adi: companies.name,
          bayi_adi: bayiler.ad,
          bayi_aktif: bayiler.aktif,
          toplam_ucret: sql`COALESCE(SUM(${bakiye_komisyonlar.ucret}), 0)`,
          toplam_komisyon: sql`COALESCE(SUM(${bakiye_komisyonlar.test_komisyon_tutar}), 0)`,
          guncel_bakiye: bayiler.bakiye,
          bayi_id: bayiler.id // Filtreleme için bayi ID'sini de alıyoruz
        })
        .from(bayiler)
        .leftJoin(companies, eq(bayiler.firma, companies.id))
        .leftJoin(bakiye_komisyonlar, eq(bayiler.id, bakiye_komisyonlar.bayi_id))
        .where(and(...whereConditions))
        .groupBy(
          companies.id,
          companies.name,
          bayiler.id,
          bayiler.ad,
          bayiler.aktif,
          bayiler.bakiye
        )
        .orderBy(companies.name, bayiler.ad);

      // Kullanıcı rolüne göre filtreleme
      console.log("44444",result)
      if (params.role === "Bayi") {
        // Sadece kullanıcının kendi bayisine ait kayıtları filtrele
        return result.filter(item => String(item.bayi_id) === String(params.user_bayi_id));
      }
 
      // Admin veya Super Admin için tüm sonuçları dön
      else  if (params.role === "Admin" || params.role === "Super Admin") {
        // Sadece kullanıcının kendi bayisine ait kayıtları filtrele
        return result;
      }
      else
      {
        return
      }
   
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Komisyon özet raporu hatası: ${error.message}`);
      }
      throw error;
    }
  }
}

export const raporService = new RaporService();