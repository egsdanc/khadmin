import { Router } from "express";
import { onlineCihazSatislariService } from "../services/online-cihaz-satislari-service";

const router = Router();

// Online sipariş oluşturma ve ödeme başlatma
router.post("/siparis", async (req, res) => {
  try {
    console.log('Online sipariş isteği:', req.body);
    const result = await onlineCihazSatislariService.createPayment(req.body);

    console.log('Online sipariş sonucu:', result);

    res.json({
      success: true,
      data: {
        siparis_no: result.siparis_no,
        paymentPageUrl: result.paymentPageUrl,
        token: result.token
      }
    });
  } catch (error: any) {
    console.error('Online sipariş hatası:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Sipariş oluşturulurken bir hata oluştu'
    });
  }
});

// Ödeme callback
router.post("/odeme-callback", async (req, res) => {
  try {
    const { token } = req.body;
    const result = await onlineCihazSatislariService.handlePaymentCallback(token);

    if (result.status === 'success') {
      console.log("rrr",res)
      res.redirect('/odeme-basarili');
    } else {
      res.redirect('/odeme-hatasi');
    }
  } catch (error: any) {
    console.error('Ödeme callback hatası:', error);
    res.redirect('/odeme-hatasi');
  }
});

export default router;