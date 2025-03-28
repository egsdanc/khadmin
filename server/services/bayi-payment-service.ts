import Iyzipay from "iyzipay";
import { db } from "@db";
import { bayiler, bakiye_islemleri } from "@db/schema";
import { eq } from "drizzle-orm";

interface PaymentRequest {
  amount: number;
  bayiId: number;
}

// Email validasyonu için helper fonksiyon
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Geçerli bir email adresi oluştur
function generateValidEmail(bayiId: number, email: string | null): string {
  if (email && isValidEmail(email)) return email;
  return `bayi${bayiId}@dynobil.com`;
}

class BayiPaymentService {
  private iyzipay: Iyzipay;

  constructor() {
    this.iyzipay = new Iyzipay({
      apiKey: process.env.IYZIPAY_API_KEY || "",
      secretKey: process.env.IYZIPAY_SECRET_KEY || "",
      uri: "https://sandbox-api.iyzipay.com",
    });

    console.log(
      "İyzipay initialized with API Key:",
      process.env.IYZIPAY_API_KEY ? "Present" : "Missing",
    );
  }

  async createPayment({ amount, bayiId }: PaymentRequest): Promise<any> {
    try {
      console.log("Creating payment request:", { amount, bayiId });

      // Bayi bilgilerini al
      const bayi = await db.query.bayiler.findFirst({
        where: eq(bayiler.id, bayiId),
        columns: {
          id: true,
          ad: true,
          email: true,
          telefon: true,
          adres: true,
          il: true,
        },
      });

      if (!bayi) {
        throw new Error(`Bayi bulunamadı (ID: ${bayiId})`);
      }

      console.log("Bayi info:", bayi);

      // Geçerli email oluştur
      const validEmail = generateValidEmail(bayiId, bayi.email);

      // İsim ve soyisim ayırma
      const nameParts = bayi.ad.split(" ");
      const firstName = nameParts[0] || "İsim";
      const lastName = nameParts.slice(1).join(" ") || "Soyisim";

      // Callback URL'yi dinamik olarak oluştur
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? process.env.BASE_URL
          : "http://localhost:5000";

      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `bayi_${bayiId}_${Date.now()}`,
        price: amount.toString(),
        paidPrice: amount.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: `BAKIYE_${bayiId}_${Date.now()}`,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${baseUrl}/api/payment/callback`,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: {
          id: bayiId.toString(),
          name: firstName,
          surname: lastName,
          gsmNumber: bayi.telefon?.replace(/[^0-9+]/g, "") || "+905350000000",
          email: validEmail,
          identityNumber: "11111111111",
          lastLoginDate: "2025-02-07 12:43:35",
          registrationDate: "2025-02-07 12:43:35",
          registrationAddress: bayi.adres || bayi.il || "Test Address",
          ip: "85.34.78.112",
          city: bayi.il || "Istanbul",
          country: "Turkey",
          zipCode: "34732",
        },
        shippingAddress: {
          contactName: bayi.ad,
          city: bayi.il || "Istanbul",
          country: "Turkey",
          address: bayi.adres || bayi.il || "Test Address",
          zipCode: "34732",
        },
        billingAddress: {
          contactName: bayi.ad,
          city: bayi.il || "Istanbul",
          country: "Turkey",
          address: bayi.adres || bayi.il || "Test Address",
          zipCode: "34732",
        },
        basketItems: [
          {
            id: "BAKIYE",
            name: "Bakiye Yükleme",
            category1: "Bakiye",
            itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
            price: amount.toString(),
          },
        ],
      };

      console.log(
        "Sending request to iyzico:",
        JSON.stringify(request, null, 2),
      );

      return new Promise((resolve, reject) => {
        this.iyzipay.checkoutFormInitialize.create(request, (err, result) => {
          if (err) {
            console.error("Iyzico error:", err);
            reject(new Error("Ödeme formu başlatılamadı: " + err.message));
            return;
          }

          console.log("Iyzico response:", result);

          if (result.status !== "success") {
            reject(
              new Error(result.errorMessage || "Ödeme formu oluşturulamadı"),
            );
            return;
          }

          // Form içeriğindeki script tag'ini kontrol et
          if (
            !result.checkoutFormContent ||
            !result.checkoutFormContent.includes("iyziInit")
          ) {
            console.error(
              "Invalid form content received:",
              result.checkoutFormContent,
            );
            reject(new Error("Geçersiz form içeriği"));
            return;
          }

          resolve({
            status: result.status,
            checkoutFormContent: result.checkoutFormContent,
            token: result.token,
          });
        });
      });
    } catch (error) {
      console.error("Payment creation error:", error);
      throw error;
    }
  }

  async handleCallback(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      console.log("Processing callback with token:", token);

      this.iyzipay.checkoutForm.retrieve(
        {
          token: token,
          locale: Iyzipay.LOCALE.TR,
        },
        async (err, result) => {
          if (err) {
            console.error("Callback retrieval error:", err);
            reject(err);
            return;
          }

          console.log("Callback result:", result);

          if (
            result.status === "success" &&
            result.paymentStatus === "SUCCESS"
          ) {
            try {
              const basketId = result.basketId;
              const [_, bayiIdStr] = basketId.split("_");
              const bayiId = parseInt(bayiIdStr);
              const amount = parseFloat(result.price);

              const bayi = await db.query.bayiler.findFirst({
                where: eq(bayiler.id, bayiId),
                columns: {
                  bakiye: true,
                },
              });

              if (!bayi) {
                throw new Error("Bayi bulunamadı");
              }

              const oldBalance = parseFloat(bayi.bakiye?.toString() || "0");
              const newBalance = oldBalance + amount;

              await db.transaction(async (tx) => {
                await tx
                  .update(bayiler)
                  .set({ bakiye: newBalance.toString() })
                  .where(eq(bayiler.id, bayiId));

                await tx.insert(bakiye_islemleri).values({
                  bayi_id: bayiId,
                  miktar: amount.toString(),
                  bakiye_sonrasi: newBalance.toString(),
                  aciklama: `Iyzico ile bakiye yükleme: ${amount} TL`,
                  iyzico_yukleme: 1,
                });
              });

              resolve({
                status: "success",
                message: "Ödeme başarıyla tamamlandı",
              });
            } catch (error) {
              console.error("Payment record error:", error);
              reject(error);
            }
          } else {
            reject(new Error("Ödeme başarısız veya onaylanmadı"));
          }
        },
      );
    });
  }
}

export const bayiPaymentService = new BayiPaymentService();
