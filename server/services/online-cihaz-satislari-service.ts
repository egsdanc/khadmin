import { sql } from "drizzle-orm";
import { db } from "@db";
import { onlinePaymentService } from "./online-payment-service";

interface OnlineSiparisRequest {
  musteri_adi: string;
  musteri_soyadi: string;
  tc_no?: string;
  email: string;
  telefon: string;
  adres: string;
  il: string;
  ilce: string;
  fatura_tipi?: 'Bireysel' | 'Kurumsal';
  vergi_dairesi?: string;
  vergi_no?: string;
}

export class OnlineCihazSatislariService {
  async createSiparis(data: OnlineSiparisRequest) {
    try {
      console.log('Creating siparis with data:', data);

      // Sipariş numarası oluştur (Örnek: OS-20250216-001)
      const siparisNo = `OS-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

      await db.execute(sql`
        INSERT INTO online_cihaz_satislari (
          siparis_no,
          musteri_adi,
          musteri_soyadi,
          tc_no,
          email,
          telefon,
          adres,
          il,
          ilce,
          fatura_tipi,
          vergi_dairesi,
          vergi_no,
          tutar,
          odeme_durumu,
          kargo_durumu
        ) VALUES (
          ${siparisNo},
          ${data.musteri_adi},
          ${data.musteri_soyadi},
          ${data.tc_no || null},
          ${data.email},
          ${data.telefon},
          ${data.adres},
          ${data.il},
          ${data.ilce},
          ${data.fatura_tipi || 'Bireysel'},
          ${data.vergi_dairesi || null},
          ${data.vergi_no || null},
          60000.00,
          'Beklemede',
          'Hazirlaniyor'
        )
      `);

      return {
        success: true,
        siparis_no: siparisNo
      };
    } catch (error) {
      console.error('Online sipariş oluşturma hatası:', error);
      throw new Error('Sipariş oluşturulurken bir hata oluştu');
    }
  }

  async createPayment(data: OnlineSiparisRequest) {
    try {
      // Önce siparişi oluştur
      const { siparis_no } = await this.createSiparis(data);

      // Sonra ödeme başlat
      const paymentResult = await onlinePaymentService.createPayment({
        amount: 60000.00,
        customerInfo: {
          firstName: data.musteri_adi,
          lastName: data.musteri_soyadi,
          email: data.email,
          phone: data.telefon,
          address: data.adres,
          city: data.il,
          country: 'Turkey'
        }
      });

      // İyzico payment result'ı kontrol et
      if (!paymentResult.checkoutFormContent) {
        throw new Error('Ödeme formu oluşturulamadı');
      }

      return {
        success: true,
        data: {
          siparis_no,
          checkoutFormContent: paymentResult.checkoutFormContent,
          token: paymentResult.token
        }
      };
    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  async handleCallback(token: string) {
    try {
      const result = await onlinePaymentService.handleCallback(token);

      if (result.status === 'success') {
        // Sipariş durumunu güncelle
        await this.updateSiparisDurumu(result.orderId, 'Odendi');
      }

      return result;
    } catch (error) {
      console.error('Ödeme callback hatası:', error);
      throw new Error('Ödeme sonucu işlenirken bir hata oluştu');
    }
  }

  async updateSiparisDurumu(siparisNo: string, odemeDurumu: string) {
    try {
      await db.execute(sql`
        UPDATE online_cihaz_satislari 
        SET odeme_durumu = ${odemeDurumu}
        WHERE siparis_no = ${siparisNo}
      `);

      return { success: true, message: 'Sipariş durumu güncellendi' };
    } catch (error) {
      console.error('Sipariş durumu güncelleme hatası:', error);
      throw new Error('Sipariş durumu güncellenirken bir hata oluştu');
    }
  }

  async getSiparisByNo(siparisNo: string) {
    try {
      const siparis = await db.execute(sql`
        SELECT * FROM online_cihaz_satislari 
        WHERE siparis_no = ${siparisNo} 
        AND deleted_at IS NULL
      `);

      return siparis[0] || null;
    } catch (error) {
      console.error('Sipariş sorgulama hatası:', error);
      throw new Error('Sipariş bilgileri alınırken bir hata oluştu');
    }
  }
}

export const onlineCihazSatislariService = new OnlineCihazSatislariService();