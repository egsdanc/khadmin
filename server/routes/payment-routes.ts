import { Router } from "express";
import { requireAuth } from "../auth";
import { bayiPaymentService } from "../services/bayi-payment-service";

const router = Router();

// Initialize payment form for dealers
router.post("/bayi/create", requireAuth, async (req, res) => {
  try {
    const { amount, bayi_id } = req.body;

    // Super Admin için gönderilen bayi_id'yi, normal bayi için kendi ID'sini kullan
    const targetBayiId = req.user?.role === "Super Admin" ? bayi_id : req.user?.bayi_id;

    if (!targetBayiId) {
      return res.status(401).json({ 
        success: false, 
        message: "Bayi bilgisi bulunamadı" 
      });
    }

    const result = await bayiPaymentService.createPayment({
      amount: parseFloat(amount),
      bayiId: targetBayiId
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Ödeme başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Ödeme başlatılırken bir hata oluştu'
    });
  }
});

// Callback endpoint - İyzico'dan gelen ödeme sonucu
router.post("/callback", async (req, res) => {
  try {
    const { token } = req.body;
    console.log('Payment callback received:', req.body);

    if (!token) {
      return res.status(400).json({
        status: "failure",
        errorMessage: "Token is required"
      });
    }

    const result = await bayiPaymentService.handleCallback(token);

    if (result.status === 'success') {
      console.log("rrrffd",res)
      res.redirect('/odeme-basarili');
    } else {
      res.redirect('/odeme-hatasi');
    }
  } catch (error: any) {
    console.error('Ödeme callback hatası:', error);
    res.redirect('/odeme-hatasi');
  }
});

// Success endpoint - user will be redirected here after successful payment
router.get("/success", async (req, res) => {
  try {
    const { token } = req.query;
    console.log('Payment success:', req.query);
    res.redirect('/bakiye?status=success');
  } catch (error: any) {
    console.error('Ödeme başarı işleme hatası:', error);
    res.redirect('/bakiye?status=error&message=' + encodeURIComponent(error.message));
  }
});

// Failure endpoint - user will be redirected here after failed payment
router.get("/fail", (req, res) => {
  console.log('Payment failed:', req.query);
  res.redirect('/bakiye?status=failed');
});

export default router;