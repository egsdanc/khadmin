import Iyzipay from 'iyzipay';
import { db } from "@db";
import { bayiler, bakiye_islemleri, bakiye_hareketleri } from "@db/schema";
import { eq } from "drizzle-orm";

interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface PaymentRequest {
  amount: number;
  customerInfo: CustomerInfo;
}

class OnlinePaymentService {
  private iyzipay: Iyzipay;

  constructor() {
    const apiKey = process.env.IYZIPAY_API_KEY;
    const secretKey = process.env.IYZIPAY_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error('İyzipay API anahtarları eksik!');
      throw new Error('İyzipay yapılandırması eksik');
    }

    this.iyzipay = new Iyzipay({
      apiKey,
      secretKey,
      uri: 'https://sandbox-api.iyzipay.com'
    });
  }

  async createPayment({ amount, customerInfo }: PaymentRequest): Promise<any> {
    try {
      // Log tüm gelen veriyi
      console.log('Received payment request:', JSON.stringify({ amount, customerInfo }, null, 2));

      if (!customerInfo) {
        throw new Error('Müşteri bilgileri bulunamadı');
      }

      // Her alan için ayrı kontrol
      if (!customerInfo.firstName) throw new Error('Müşteri adı zorunludur');
      if (!customerInfo.lastName) throw new Error('Müşteri soyadı zorunludur');
      if (!customerInfo.email) throw new Error('Email adresi zorunludur');
      if (!customerInfo.phone) throw new Error('Telefon numarası zorunludur');
      if (!customerInfo.address) throw new Error('Adres zorunludur');
      if (!customerInfo.city) throw new Error('Şehir zorunludur');

      // Telefon numarasını formatla
      const formattedPhone = customerInfo.phone.startsWith('+') 
        ? customerInfo.phone 
        : `+90${customerInfo.phone.replace(/[^0-9]/g, '')}`;

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? process.env.BASE_URL 
        : 'http://localhost:5000';

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `order_${Date.now()}`,
        price: amount.toString(),
        paidPrice: amount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: `ORDER_${Date.now()}`,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${baseUrl}/api/payment/callback`,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: `BUYER_${Date.now()}`,
          name: customerInfo.firstName.trim(),
          surname: customerInfo.lastName.trim(),
          gsmNumber: formattedPhone,
          email: customerInfo.email.trim(),
          identityNumber: '74300864791',
          lastLoginDate: '2025-02-07 12:43:35',
          registrationDate: '2025-02-07 12:43:35',
          registrationAddress: customerInfo.address.trim(),
          ip: '85.34.78.112',
          city: customerInfo.city.trim(),
          country: customerInfo.country || 'Turkey',
          zipCode: '34732'
        },
        shippingAddress: {
          contactName: `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`,
          city: customerInfo.city.trim(),
          country: customerInfo.country || 'Turkey',
          address: customerInfo.address.trim(),
          zipCode: '34732'
        },
        billingAddress: {
          contactName: `${customerInfo.firstName.trim()} ${customerInfo.lastName.trim()}`,
          city: customerInfo.city.trim(),
          country: customerInfo.country || 'Turkey',
          address: customerInfo.address.trim(),
          zipCode: '34732'
        },
        basketItems: [
          {
            id: 'KILOMETRE_HACKER',
            name: 'Kilometre Hacker Cihazı',
            category1: 'Cihazlar',
            itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
            price: amount.toString()
          }
        ]
      };

      // Log iyzico'ya gönderilen request
      console.log('Sending request to iyzico:', JSON.stringify(request, null, 2));

      return new Promise((resolve, reject) => {
        this.iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
          if (err) {
            console.error('Iyzico error:', err);
            reject(new Error('Ödeme formu başlatılamadı: ' + err.message));
            return;
          }

          console.log('Iyzico response:', result);

          if (result.status !== 'success') {
            console.error('Iyzico error response:', result);
            reject(new Error(result.errorMessage || 'Ödeme formu oluşturulamadı'));
            return;
          }

          resolve({
            status: result.status,
            checkoutFormContent: result.checkoutFormContent,
            token: result.token
          });
        });
      });

    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  async handleCallback(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.iyzipay.checkoutForm.retrieve({
        token: token,
        locale: Iyzipay.LOCALE.TR
      }, async (err: any, result: any) => {
        if (err) {
          console.error('Callback retrieval error:', err);
          reject(err);
          return;
        }

        console.log('Callback result:', result);

        if (result.status === 'success' && result.paymentStatus === '1') {
          try {
            const basketId = result.basketId;
            const amount = parseFloat(result.price);

            // Bayi bilgisini al (varsayılan olarak ilk bayi)
            const bayi = await db.query.bayiler.findFirst({
              where: eq(bayiler.id, 1), // Varsayılan bayi ID'si
              columns: {
                id: true,
                bakiye: true,
                ad: true
              }
            });

            if (!bayi) {
              throw new Error('Bayi bulunamadı');
            }

            const oldBalance = parseFloat(bayi.bakiye?.toString() || '0');
            const newBalance = oldBalance + amount;

            // Bakiye güncelleme ve işlem kayıtları
            await db.transaction(async (tx) => {
              // Bayi bakiyesini güncelle
              await tx.update(bayiler)
                .set({ bakiye: newBalance.toString() })
                .where(eq(bayiler.id, bayi.id));

              // Bakiye işlemleri tablosuna kayıt ekle
              await tx.insert(bakiye_islemleri).values({
                bayi_id: bayi.id,
                miktar: amount.toString(),
                bakiye_sonrasi: newBalance.toString(),
                aciklama: `İyzico bakiye yukleme: ${amount.toFixed(2)} TL`,
                iyzico_yukleme: "1"
              });

              // Bakiye hareketleri tablosuna iyzico kaydı ekle
              await tx.insert(bakiye_hareketleri).values({
                bayi_id: bayi.id,
                tutar: amount.toString(),
                bakiye_oncesi: oldBalance.toString(),
                bakiye_sonrasi: newBalance.toString(),
                islem_tipi: 'ODEME',
                durum: 'BASARILI',
                iyzico_payment_id: result.paymentId,
                referans_kodu: result.paymentTransactionId,
                basket_id: result.basketId,
                kart_no: result.lastFourDigits ? `**** **** **** ${result.lastFourDigits}` : null,
                taksit_sayisi: result.installment ? parseInt(result.installment) : null,
                aciklama: `İyzico online ödeme: ${amount.toFixed(2)} TL`
              });
            });

            resolve({
              status: 'success',
              message: 'Ödeme başarıyla tamamlandı',
              paymentId: result.paymentId,
              paymentTransactionId: result.paymentTransactionId
            });
          } catch (error) {
            console.error('Payment record error:', error);
            reject(error);
          }
        } else {
          reject(new Error('Ödeme başarısız veya onaylanmadı'));
        }
      });
    });
  }
}

export const onlinePaymentService = new OnlinePaymentService();