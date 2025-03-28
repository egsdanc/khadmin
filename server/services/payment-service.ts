import Iyzipay from 'iyzipay';
import { db } from "@db";
import { bayiler, bakiye_islemleri } from "@db/schema";
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
  bayiId: number;
  customerInfo: CustomerInfo;
}

class PaymentService {
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

    console.log('İyzipay initialized with API credentials');
  }

  async createPayment({ amount, customerInfo }: PaymentRequest): Promise<any> {
    try {
      console.log('Creating payment request:', { amount, customerInfo });

      // Callback URL'yi dinamik olarak oluştur
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
          id: Date.now().toString(),
          name: customerInfo.firstName,
          surname: customerInfo.lastName,
          gsmNumber: customerInfo.phone?.replace(/[^0-9+]/g, '') || '+905350000000',
          email: customerInfo.email,
          identityNumber: '74300864791',
          lastLoginDate: '2025-02-07 12:43:35',
          registrationDate: '2025-02-07 12:43:35',
          registrationAddress: customerInfo.address,
          ip: '85.34.78.112',
          city: customerInfo.city,
          country: customerInfo.country,
          zipCode: '34732'
        },
        shippingAddress: {
          contactName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          city: customerInfo.city,
          country: customerInfo.country,
          address: customerInfo.address,
          zipCode: '34732'
        },
        billingAddress: {
          contactName: `${customerInfo.firstName} ${customerInfo.lastName}`,
          city: customerInfo.city,
          country: customerInfo.country,
          address: customerInfo.address,
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
            resolve({
              status: 'success',
              message: 'Ödeme başarıyla tamamlandı'
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

export const paymentService = new PaymentService();