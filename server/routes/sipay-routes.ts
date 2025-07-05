import { Router } from "express";
import { requireAuth } from "../auth";
import { db } from "../services/database-service";
import type { PoolConnection } from "mysql2/promise";
import crypto from 'crypto';

const router = Router();
const callbackRouter = Router();

// Sipay token endpoint - POST /api/sipay/token
router.post("/token", requireAuth, async (req, res) => {

  console.log("🔧 Sipay Routes - Environment Variables:");
  console.log("SIPAY_BASE_URL:", process.env.SIPAY_BASE_URL);
  console.log("SIPAY_APP_ID:", process.env.SIPAY_APP_ID);
  console.log("SIPAY_APP_SECRET:", process.env.SIPAY_APP_SECRET ? "***SET***" : "NOT SET");

  try {
    console.log('🔄 Sipay token request received from:', req.user?.role);
    console.log('📋 Request body:', req.body);
    console.log('👤 User info:', {
      id: req.user?.id,
      role: req.user?.role,
      bayi_id: req.user?.bayi_id
    });

    const SIPAY_BASE_URL = process.env.SIPAY_BASE_URL;
    const SIPAY_ENDPOINT = "/ccpayment/api/token";

    if (!SIPAY_BASE_URL) {
      console.error('❌ SIPAY_BASE_URL environment variable is not defined');
      throw new Error('SIPAY_BASE_URL environment variable is not defined');
    }

    const sipayUrl = `${SIPAY_BASE_URL}${SIPAY_ENDPOINT}`;

    console.log('🌐 Sipay token request details:');
    console.log('   URL:', sipayUrl);
    console.log('   app_id:', process.env.SIPAY_APP_ID);
    console.log('   app_secret:', process.env.SIPAY_APP_SECRET ? '***SET***' : 'NOT SET');

    const requestBody = {
      app_id: process.env.SIPAY_APP_ID,
      app_secret: process.env.SIPAY_APP_SECRET
    };

    console.log('📤 Request body to Sipay:', {
      app_id: requestBody.app_id,
      app_secret: requestBody.app_secret ? '***SET***' : 'NOT SET'
    });

    const response = await fetch(sipayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Sipay API response status:', response.status);
    console.log('📡 Sipay API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Sipay API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Sipay API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    console.log('✅ Sipay token response received:');
    console.log('   status_code:', data.status_code);
    console.log('   status_description:', data.status_description);
    console.log('   hasToken:', !!data.data?.token);
    console.log('   token_length:', data.data?.token?.length);
    console.log('   expires_in:', data.data?.expires_in);
    console.log('   Full response:', JSON.stringify(data, null, 2));

    return res.status(200).json(data);

  } catch (error) {
    console.error("💥 Sipay token error:", error);
    console.error("💥 Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({
      message: "Server error",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Sipay payment create endpoint - POST /api/sipay/create-payment
router.post("/create-payment", requireAuth, async (req, res) => {
  try {
    console.log('💳 Sipay payment create request received:');
    console.log('   Request body:', req.body);
    console.log('   User:', {
      id: req.user?.id,
      role: req.user?.role,
      bayi_id: req.user?.bayi_id
    });

    const { amount, bayi_id } = req.body;

    // Super Admin için gönderilen bayi_id'yi, normal bayi için kendi ID'sini kullan
    const targetBayiId = req.user?.role === "Super Admin" ? bayi_id : req.user?.role === "Admin" ? bayi_id : req.user?.bayi_id;

    console.log('🎯 Target bayi ID calculation:');
    console.log('   Original bayi_id:', bayi_id);
    console.log('   User role:', req.user?.role);
    console.log('   User bayi_id:', req.user?.bayi_id);
    console.log('   Final targetBayiId:', targetBayiId);

    if (!targetBayiId) {
      console.error('❌ Bayi bilgisi bulunamadı');
      return res.status(401).json({
        success: false,
        message: "Bayi bilgisi bulunamadı"
      });
    }

    console.log('🔄 Getting Sipay token for payment...');

    // Önce token al
    const tokenResult = await fetch(`${process.env.SIPAY_BASE_URL}/ccpayment/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: process.env.SIPAY_APP_ID,
        app_secret: process.env.SIPAY_APP_SECRET
      })
    });

    console.log('📡 Token request response status:', tokenResult.status);

    if (!tokenResult.ok) {
      const errorText = await tokenResult.text();
      console.error('❌ Token request failed:', errorText);
      throw new Error('Sipay token alınamadı');
    }

    const tokenData = await tokenResult.json();
    console.log('✅ Token response:', tokenData);

    if (tokenData.status_code !== 100 || !tokenData.data?.token) {
      console.error('❌ Invalid token response:', tokenData);
      throw new Error('Sipay token geçersiz');
    }

    console.log('✅ Token obtained successfully:', {
      status_code: tokenData.status_code,
      token_length: tokenData.data.token.length,
      expires_in: tokenData.data.expires_in
    });

    // TODO: Sipay payment service'i burada implement edilecek
    // Şimdilik token'ı döndürüyoruz
    const responseData = {
      success: true,
      token: tokenData.data.token,
      amount: parseFloat(amount),
      bayi_id: targetBayiId,
      message: "Sipay payment başlatıldı"
    };

    console.log('📤 Sending response:', responseData);

    res.json(responseData);

  } catch (error: any) {
    console.error('💥 Sipay payment başlatma hatası:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Sipay payment başlatılırken bir hata oluştu'
    });
  }
});

// Sipay callback endpoint - POST /api/sipay-callback
callbackRouter.post('/', async (req, res) => {
  try {
    console.log('Sipay callback data:', req.body);

    // Başarılı ödeme durumunda veritabanı işlemlerini yap
    if (req.body.sipay_status === '1') {
      console.log('✅ Başarılı ödeme - Veritabanı güncelleniyor...');
      console.log('📋 Transaction type:', req.body.transaction_type);

      // Ödeme başarılıysa ve Pre-Authorization değilse status=1 yap
      if (req.body.transaction_type !== 'Pre-Authorization') {
        console.log('✅ Pre-Authorization değil, status güncelleniyor...');

        const invoiceId = req.body.invoice_id;
        if (invoiceId) {
          try {
            // Bakiye işlemleri tablosunda ilgili kaydı bul ve status'u güncelle
            const connection = await db.getConnection();
            try {
              await connection.beginTransaction();

              // Önce bakiye işlemleri kaydını kontrol et
              const [bakiyeRows] = await connection.execute(
                'SELECT id, bayi_id, miktar FROM bakiye_islemleri WHERE invoice_id = ? AND status = 0',
                [invoiceId]
              );

              if (bakiyeRows && (bakiyeRows as any[]).length > 0) {
                const record = (bakiyeRows as any[])[0];
                console.log('📋 Bulunan bakiye kayıt:', record);

                // Status'u 1 (başarılı) yap
                await connection.execute(
                  'UPDATE bakiye_islemleri SET status = 1 WHERE invoice_id = ? AND status = 0',
                  [invoiceId]
                );
                console.log('✅ Bakiye işlemi status güncellendi: invoice_id =', invoiceId);

                // Bayi bakiyesini güncelle
                if (record.bayi_id && record.bakiye_sonrasi) {
                  await connection.execute(
                    'UPDATE bayiler SET bakiye = ? WHERE id = ?',
                    [record.bakiye_sonrasi, record.bayi_id]
                  );
                  console.log('✅ Bayi bakiyesi güncellendi: bayi_id =', record.bayi_id, 'yeni_bakiye =', record.bakiye_sonrasi);
                } else {
                  console.log('⚠️ Bayi bakiyesi güncellenemedi: bayi_id veya bakiye_sonrasi eksik');
                }
              }

              // Sipay panel fatura kaydını da güncelle
              const [faturaRows] = await connection.execute(
                'SELECT id FROM sipay_panel_fatura WHERE invoice_id = ?',
                [invoiceId]
              );

              if (faturaRows && (faturaRows as any[]).length > 0) {
                await connection.execute(
                  'UPDATE sipay_panel_fatura SET status = 1, sipay_status = ?, transaction_id = ? WHERE invoice_id = ?',
                  [req.body.sipay_status, req.body.transaction_id || null, invoiceId]
                );
                console.log('✅ Sipay panel fatura status güncellendi: invoice_id =', invoiceId);
              }

              await connection.commit();
              console.log('🎉 Veritabanı işlemleri başarıyla tamamlandı');
            } catch (error) {
              await connection.rollback();
              console.error('❌ Veritabanı işlemi hatası:', error);
            } finally {
              connection.release();
            }
          } catch (error) {
            console.error('❌ Veritabanı bağlantı hatası:', error);
          }
        } else {
          console.log('⚠️ Invoice ID bulunamadı');
        }
      } else {
        console.log('⚠️ Pre-Authorization işlemi - status güncellenmedi');
      }
    } else {
      console.log('❌ Başarısız ödeme - Veritabanı güncellenmedi');
    }

    // URL'i oluştur - Vite.js için doğru route'ları kullan
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const redirectUrl = new URL(baseUrl);

    // Önemli parametreleri seç
    const importantParams = {
      status: req.body.sipay_status,
      invoice_id: req.body.invoice_id,
      error_code: req.body.error_code,
      error_message: req.body.error || req.body.status_description,
      amount: req.body.amount,
      transaction_type: req.body.transaction_type
    };

    // Başarılı ödeme durumunda success sayfasına yönlendir
    if (req.body.sipay_status === '1' && req.body.transaction_type !== 'Pre-Authorization') {

      redirectUrl.pathname = '/odeme-basarili';
      // Sadece önemli parametreleri ekle
      Object.entries(importantParams).forEach(([key, value]) => {
        if (value) {
          redirectUrl.searchParams.append(key, value as string);
        }
      });
      return res.redirect(303, redirectUrl.toString());
    }

    // Başarısız ödeme durumunda error sayfasına yönlendir
    redirectUrl.pathname = '/odeme-hatasi';
    // Sadece önemli parametreleri ekle
    Object.entries(importantParams).forEach(([key, value]) => {
      if (value) {
        redirectUrl.searchParams.append(key, value as string);
      }
    });
    return res.redirect(303, redirectUrl.toString());

  } catch (error: any) {
    console.error('Sipay callback error:', error);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const redirectUrl = new URL(baseUrl);
    redirectUrl.pathname = '/odeme-hatasi';
    redirectUrl.searchParams.append('error_message', 'Bir hata oluştu');
    return res.redirect(303, redirectUrl.toString());
  }
});

// Sipay payment status endpoint - GET /api/sipay/payment-status/:paymentId
router.get("/payment-status/:paymentId", requireAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;

    console.log('📊 Payment status request:');
    console.log('   Payment ID:', paymentId);
    console.log('   User:', {
      id: req.user?.id,
      role: req.user?.role,
      bayi_id: req.user?.bayi_id
    });

    // TODO: Sipay payment status kontrolü burada implement edilecek

    const responseData = {
      success: true,
      paymentId,
      status: "pending", // veya "completed", "failed"
      message: "Payment status retrieved"
    };

    console.log('📤 Payment status response:', responseData);

    res.json(responseData);
  } catch (error: any) {
    console.error('💥 Sipay payment status hatası:', error);
    console.error('💥 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment status alınırken bir hata oluştu'
    });
  }
});

// Sipay installment options endpoint - POST /api/sipay-post
router.post("/sipay-post", requireAuth, async (req, res) => {
  try {
    // 🚦 Gelen istek logu
    console.log("🚦 /api/sipay-post endpointine istek geldi", {
      body: req.body,
      headers: req.headers
    });
    // .env'den değerleri al
    const SIPAY_BASE_URL = process.env.SIPAY_BASE_URL;
    const SIPAY_ENDPOINT = "/ccpayment/api/getpos";
    const SIPAY_MERCHANT_KEY = process.env.SIPAY_MERCHANT_KEY;
    const SIPAY_COMMISSION_BY = process.env.SIPAY_COMMISSION_BY;

    if (!SIPAY_BASE_URL) {
      return res.status(500).json({
        message: "SIPAY_BASE_URL environment variable is not defined"
      });
    }
    if (!SIPAY_MERCHANT_KEY) {
      return res.status(500).json({
        message: "SIPAY_MERCHANT_KEY environment variable is not defined"
      });
    }

    const sipayUrl = `${SIPAY_BASE_URL}${SIPAY_ENDPOINT}`;

    const { credit_card, amount, currency_code, is_recurring, is_2d } = req.body;
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader) {
      return res.status(400).json({
        message: "Authorization header is required"
      });
    }

    // Debug loglar
    console.log("POST /sipay-post:", {
      credit_card,
      amount,
      currency_code,
      SIPAY_MERCHANT_KEY,
      SIPAY_COMMISSION_BY
    });

    const response = await fetch(sipayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader as string
      },
      body: JSON.stringify({
        credit_card,
        amount,
        currency_code,
        merchant_key: SIPAY_MERCHANT_KEY,
        commission_by: SIPAY_COMMISSION_BY,
        is_recurring,
        is_2d
      })
    });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("JSON olmayan cevap geldi:", text);
      return res.status(500).json({
        message: "API'den beklenmeyen formatta cevap geldi",
        rawResponse: text
      });
    }

    const sipayData = await response.json();

    // Detailed logging of the complete response
    console.log("✅ Sipay API Response (Complete):");
    console.log("   Status Code:", sipayData.status_code);
    console.log("   Status Description:", sipayData.status_description);
    console.log("   Full Response:", JSON.stringify(sipayData, null, 2));

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Sipay API error",
        details: sipayData
      });
    }

    return res.json(sipayData);
  } catch (error: any) {
    console.error("Sipay post error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
});

// Hash key oluşturma fonksiyonu
function generateHashKey(total: any, installment: any, currency_code: any, merchant_key: any, invoice_id: any, app_secret: any) {
  try {
    const data = total + '|' + installment + '|' + currency_code + '|' + merchant_key + '|' + invoice_id;
    const iv = crypto.createHash('sha1').update(String(Math.random())).digest('hex').slice(0, 16);
    const password = crypto.createHash('sha1').update(app_secret).digest('hex');
    const salt = crypto.createHash('sha1').update(String(Math.random())).digest('hex').slice(0, 4);
    const salt_with_password = crypto.createHash('sha256').update(password + salt).digest('hex').slice(0, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', salt_with_password, iv);
    const padded_data = data;
    let encrypted = cipher.update(padded_data, 'binary', 'base64');
    encrypted += cipher.final('base64');
    const msg_encrypted_bundle = iv + ':' + salt + ':' + encrypted;
    const msg_encrypted_bundle_replaced = msg_encrypted_bundle.replace(/\//g, '__');
    return msg_encrypted_bundle_replaced;
  } catch (error: any) {
    console.error("Hata (generateHashKey):", error.message || error);
    return null;
  }
}

// Sipay 3D Smart Payment endpoint - POST /api/sipay-paySmart3D
router.post('/sipay-paySmart3D', async (req, res) => {
  try {
    console.log('Sipay 3D Payment API called');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    let body = req.body;
    let token = req.headers['authorization']?.split(' ')[1];

    // Form data olarak geldiğinde
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      console.log('Form data detected, parsing...');
      body = req.body;
      token = req.body.authorization?.split(' ')[1];
    }

    console.log('Parsed token:', token ? 'Present' : 'Missing');
    console.log('Parsed body:', JSON.stringify(body, null, 2));

    if (!token) {
      console.error('Token is missing');
      return res.status(401).json({ error: 'Token is required' });
    }

    // Gerekli alanları kontrol et
    const requiredFields = [
      'cc_holder_name', 'cc_no', 'expiry_month', 'expiry_year', 'cvv',
      'total', 'invoice_id', 'name', 'surname', 'currency_code',
      'installments_number', 'invoice_description',
      'bill_email', 'bill_phone', 'cancel_url', 'return_url', 'yuklenecek_tutar'
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`);
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    // Bayi bilgilerini al ve bakiye işlemlerini yap
    console.log('🔄 Bayi bilgileri alınıyor ve bakiye işlemleri yapılıyor...');

    // Request body'den bayi_id'yi al
    const targetBayiId = body.bayi_id;

    if (!targetBayiId) {
      console.error('❌ Bayi ID bulunamadı');
      throw new Error('Bayi ID bulunamadı');
    }

    // Klasik SQL sorguları ile bayi bilgilerini al
    const bayiRows = await db.executeQuery(
      'SELECT id, bakiye, ad FROM bayiler WHERE id = ?',
      [targetBayiId] // Request body'den gelen bayi_id'yi kullan
    );

    if (!bayiRows || (bayiRows as any[]).length === 0) {
      console.error('❌ Bayi bulunamadı');
      throw new Error('Bayi bulunamadı');
    }

    const bayi = (bayiRows as any[])[0];
    console.log('✅ Bayi bilgileri alındı:', bayi);

    const oldBalance = parseFloat(bayi.bakiye?.toString() || '0');
    const amount = parseFloat(body.yuklenecek_tutar);
    const newBalance = oldBalance + amount;

    console.log('💰 Bakiye hesaplaması:');
    console.log('   Bayi ID:', targetBayiId);
    console.log('   Eski bakiye:', oldBalance);
    console.log('   Yüklenecek tutar:', amount);
    console.log('   Yeni bakiye:', newBalance);

    // Manuel transaction ile bakiye güncelleme ve işlem kaydı
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Bayi bakiyesini güncelle
      await connection.execute(
        'UPDATE bayiler SET bakiye = ? WHERE id = ?',
        [newBalance.toString(), bayi.id]
      );
      console.log('✅ Bayi bakiyesi güncellendi');

      // Bakiye işlemleri tablosuna kayıt ekle
      await connection.execute(
        `INSERT INTO bakiye_islemleri 
         (bayi_id, miktar, bakiye_sonrasi, aciklama, invoice_id, status, manuel_yukleme, sipay_yukleme) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          body.bayi_id,
          amount.toString(),
          newBalance.toString(),
          `Sipay bakiye yukleme: ${amount} TL`,
          body.invoice_id || "", // invoice_id
          0, // status: 0 = beklemede
          0.00, // manuel_yukleme
          1.00 // sipay_yukleme
        ]
      );
      console.log('✅ Bakiye işlemi kaydedildi');

      await connection.commit();
      console.log('🎉 Transaction başarıyla tamamlandı');
    } catch (error) {
      await connection.rollback();
      console.error('❌ Transaction hatası, rollback yapıldı:', error);
      throw error;
    } finally {
      connection.release();
    }

    console.log('🎉 Bakiye işlemleri tamamlandı');

    // Hash key oluştur
    const SIPAY_MERCHANT_KEY = process.env.SIPAY_MERCHANT_KEY;
    const SIPAY_BASE_URL = process.env.SIPAY_BASE_URL;
    const SIPAY_ENDPOINT = '/ccpayment/api/paySmart3D';
    const SIPAY_APP_SECRET = process.env.SIPAY_APP_SECRET;
    if (!SIPAY_BASE_URL || !SIPAY_MERCHANT_KEY || !SIPAY_APP_SECRET) {
      throw new Error('SiPay environment variables are not defined');
    }
    const hashKey = generateHashKey(
      body.total,
      body.installments_number || '1',
      body.currency_code || 'TRY',
      SIPAY_MERCHANT_KEY,
      body.invoice_id,
      SIPAY_APP_SECRET
    );
    console.log('Generated hash key:', hashKey);
    // Base URL'den cancel ve return URL'lerini oluştur
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/sipay-callback`;

    console.log('🌐 Callback URL:', callbackUrl);
    console.log('🌐 Sipay URL:', `${SIPAY_BASE_URL}${SIPAY_ENDPOINT}`);

    // HTML form oluştur
    const html = `
      <!doctype html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
          <meta http-equiv="X-UA-Compatible" content="ie=edge">
          <title>Ödeme Sayfasına Yönlendiriliyor...</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-KyZXEAg3QhqLMpG8r+8fhAXLRk2vvoC2f3B09zVXn8CA5QIVfZOJ3BCsw2P0p/We" crossorigin="anonymous">
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js" integrity="sha384-U1DAWAznBHeqEIlVSCgzq+c9gqGAJn5c/t99JyeKa9xxaYpSvHU5awsuZVVFIhvj" crossorigin="anonymous"></script>
          <style>
            .loading-container {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 9999;
            }
            .loading-content {
              text-align: center;
              color: white;
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 5px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top-color: white;
              animation: spin 1s ease-in-out infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .payment-form {
              display: none;
            }
          </style>
      </head>
      <body>
          <!-- Loading Screen -->
          <div class="loading-container" id="loadingScreen">
              <div class="loading-content">
                  <div class="spinner"></div>
                  <h3>Ödeme Sayfası Hazırlanıyor...</h3>
                  <p>Lütfen bekleyin, Bankanızın ödeme sayfasına yönlendiriliyorsunuz.</p>
              </div>
          </div>

          <!-- Payment Form (Hidden) -->
          <div class="payment-form" id="paymentForm">
              <form action="${SIPAY_BASE_URL}${SIPAY_ENDPOINT}" method="POST" id="sipayForm" target="_self">
                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>Bearer</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" class="form-control" name="authorization" value="Bearer ${token}">
                      </div>
                  </div>
                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>merchant_key</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" name="merchant_key" class="form-control" value="${SIPAY_MERCHANT_KEY}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>commission_by</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="commission_by" class="form-control" value="merchant">
                      </div>
                      <div class="col-md-2">
                          <label>is_commission_from_user</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="is_commission_from_user" class="form-control" value="1">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>cc_holder_name</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" class="form-control" name="cc_holder_name" value="${body.cc_holder_name}">
                      </div>
                      <div class="col-md-2">
                          <label>cc_no</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" class="form-control" name="cc_no" value="${body.cc_no}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>expiry_month</label>
                      </div>
                      <div class="col-md-2">
                          <input type="text" class="form-control" name="expiry_month" value="${body.expiry_month}">
                      </div>
                      <div class="col-md-2">
                          <label>expiry_year</label>
                      </div>
                      <div class="col-md-2">
                          <input type="text" class="form-control" name="expiry_year" value="${body.expiry_year}">
                      </div>
                      <div class="col-md-2">
                          <label>cvv</label>
                      </div>
                      <div class="col-md-2">
                          <input type="text" class="form-control" name="cvv" value="${body.cvv}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>currency_code</label>
                      </div>
                      <div class="col-md-2">
                          <input type="text" class="form-control" name="currency_code" value="${body.currency_code || 'TRY'}">
                      </div>
                      <div class="col-md-2">
                          <label>installments_number</label>
                      </div>
                      <div class="col-md-2">
                          <input type="text" name="installments_number" class="form-control" value="${body.installments_number || '1'}">
                      </div>
                      <div class="col-md-2">
                          <label>invoice_id</label>
                      </div>
                      <div class="col-md-2">
                          <input type="text" name="invoice_id" class="form-control" value="${body.invoice_id}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>invoice_description</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" name="invoice_description" class="form-control" value="${body.invoice_description}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>name</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="name" class="form-control" value="${body.name}">
                      </div>
                      <div class="col-md-2">
                          <label>surname</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="surname" class="form-control" value="${body.surname}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>total</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="total" class="form-control" value="${body.total}">
                      </div>
                      <div class="col-md-2">
                          <label>items</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="items" class="form-control" value='${typeof body.items === 'string' ? body.items : JSON.stringify(body.items)}'>
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>cancel_url</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="cancel_url" class="form-control" value="${callbackUrl}">
                      </div>
                      <div class="col-md-2">
                          <label>return_url</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="return_url" class="form-control" value="${callbackUrl}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>hash_key</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" name="hash_key" class="form-control" value="${hashKey}">
                      </div>
                  </div>

                  <!-- Address Fields -->
                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>bill_address1</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" name="bill_address1" class="form-control" value="${body.bill_address1 || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>bill_address2</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" name="bill_address2" class="form-control" value="${body.bill_address2 || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>bill_city</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="bill_city" class="form-control" value="${body.bill_city || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>bill_postcode</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="bill_postcode" class="form-control" value="${body.bill_postcode || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>bill_state</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="bill_state" class="form-control" value="${body.bill_state || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>bill_country</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="bill_country" class="form-control" value="${body.bill_country || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>bill_email</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="bill_email" class="form-control" value="${body.bill_email || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>bill_phone</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="bill_phone" class="form-control" value="${body.bill_phone || ''}">
                      </div>
                  </div>

                  <!-- Additional Fields -->
                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>ip</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="ip" class="form-control" value="${body.ip || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>transaction_type</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="transaction_type" class="form-control" value="${body.transaction_type || 'Auth'}">
                      </div>
                      <div class="col-md-2">
                          <label>sale_web_hook_key</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="sale_web_hook_key" class="form-control" value="${body.sale_web_hook_key || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>payment_completed_by</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="payment_completed_by" class="form-control" value="${body.payment_completed_by || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>response_method</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="response_method" class="form-control" value="${body.response_method || ''}">
                      </div>
                  </div>

                  <!-- Recurring Payment Fields -->
                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>order_type</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="order_type" class="form-control" value="${body.order_type || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>recurring_payment_number</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="recurring_payment_number" class="form-control" value="${body.recurring_payment_number || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>recurring_payment_cycle</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="recurring_payment_cycle" class="form-control" value="${body.recurring_payment_cycle || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>recurring_payment_interval</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="recurring_payment_interval" class="form-control" value="${body.recurring_payment_interval || ''}">
                      </div>
                  </div>

                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>recurring_web_hook_key</label>
                      </div>
                      <div class="col-md-10">
                          <input type="text" name="recurring_web_hook_key" class="form-control" value="${body.recurring_web_hook_key || ''}">
                      </div>
                  </div>

                  <!-- Agricultural Card Fields -->
                  <div class="row mt-2 justify-content-md-center">
                      <div class="col-md-2">
                          <label>maturity_period</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="maturity_period" class="form-control" value="${body.maturity_period || ''}">
                      </div>
                      <div class="col-md-2">
                          <label>payment_frequency</label>
                      </div>
                      <div class="col-md-4">
                          <input type="text" name="payment_frequency" class="form-control" value="${body.payment_frequency || ''}">
                      </div>
                  </div>

                  <div class="row mt-4 justify-content-md-center mb-5">
                      <div class="col-md-8">
                          <button type="submit" value="SEND" class="btn btn-primary" style="width: 100%">Submit</button>
                      </div>
                  </div>
              </form>
          </div>

          <script>
              // Sayfa yüklendiğinde 2 saniye bekle, sonra formu submit et
              window.onload = function() {
                  setTimeout(function() {
                      console.log('Sipay payment form submitting...');
                      document.getElementById('sipayForm').submit();
                  }, 2000);
              };
          </script>
      </body>
      </html>
    `;

    console.log('📄 HTML form oluşturuldu, uzunluk:', html.length);
    console.log('📄 HTML form preview:', html.substring(0, 500) + '...');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.send(html);
  } catch (error: any) {
    console.error('SiPay 3D Payment Error:', error);
    res.status(500).json({
      error: error.message || 'Payment processing failed',
      timestamp: new Date().toISOString()
    });
  }
});


router.post('/add-sipay-panel-fatura', requireAuth, async (req, res) => {
  try {
    console.log('📋 Add Sipay Panel Fatura isteği alındı');
    console.log('📋 Request body:', req.body);
    console.log('👤 Kullanıcı:', {
      id: req.user?.id,
      role: req.user?.role,
      bayi_id: req.user?.bayi_id
    });



    const paymentData = req.body;

    // Zorunlu alanları kontrol et
    if (!paymentData.invoice_id) {
      return res.status(400).json({
        success: false,
        message: "invoice_id alanı zorunludur"
      });
    }

    // Mevcut kayıt kontrolü
    const existingRows = await db.executeQuery(
      'SELECT id FROM sipay_panel_fatura WHERE invoice_id = ?',
      [paymentData.invoice_id]
    );

    if (existingRows && (existingRows as any[]).length > 0) {
      return res.status(409).json({
        success: false,
        message: "Bu invoice_id ile zaten bir kayıt mevcut"
      });
    }

    // Payment kaydını oluştur
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `INSERT INTO sipay_panel_fatura (
          invoice_id, cc_holder_name, cc_no, expiry_month, expiry_year, cvv,
          total, quantity, name, surname, currency_code, installments_number,
          invoice_description, bill_email, bill_phone, bill_address1, bill_address2,
          bill_city, bill_postcode, bill_state, bill_country, ip, status, unit_price,
          bayi_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          paymentData.invoice_id,
          paymentData.cc_holder_name || null,
          paymentData.cc_no || null,
          paymentData.expiry_month || null,
          paymentData.expiry_year || null,
          paymentData.cvv || null,
          paymentData.total || 0,
          paymentData.quantity || 1,
          paymentData.name || null,
          paymentData.surname || null,
          paymentData.currency_code || 'TRY',
          paymentData.installments_number || '1',
          paymentData.invoice_description || null,
          paymentData.bill_email || null,
          paymentData.bill_phone || null,
          paymentData.bill_address1 || null,
          paymentData.bill_address2 || null,
          paymentData.bill_city || null,
          paymentData.bill_postcode || null,
          paymentData.bill_state || null,
          paymentData.bill_country || null,
          paymentData.ip || null,
          paymentData.status || 0,
          paymentData.unit_price || 0,
          paymentData.bayi_id || req.user?.bayi_id || null
        ]
      );

      await connection.commit();

      const insertedId = (result as any).insertId;
      console.log('✅ Sipay panel fatura kaydı başarıyla oluşturuldu, ID:', insertedId);

      // Oluşturulan kaydı döndür
      const [rows] = await connection.execute(
        'SELECT * FROM sipay_panel_fatura WHERE id = ?',
        [insertedId]
      );

      const payment = (rows as any[])[0];

      res.status(201).json({
        success: true,
        data: payment,
        message: "Sipay panel fatura kaydı başarıyla oluşturuldu"
      });

    } catch (error) {
      await connection.rollback();
      console.error('❌ Sipay panel fatura kaydı oluşturulurken hata:', error);
      throw error;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    console.error('💥 Add Sipay Panel Fatura hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Sipay panel fatura kaydı oluşturulurken bir hata oluştu'
    });
  }
});

// Export the callback router separately
export { callbackRouter };

export default router; 