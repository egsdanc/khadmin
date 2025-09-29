import { Router } from 'express';
import { db } from '../../db';
import { ulkeler, iller, ilceler } from '../../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const router = Router();

// Ülkeleri getir
router.get('/', async (req, res) => {
  try {
    const ulkelerListesi = await db
      .select()
      .from(ulkeler)
      .orderBy(ulkeler.ulke_adi);

    res.json({
      success: true,
      data: ulkelerListesi
    });
  } catch (error) {
    console.error('Ülkeler getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'Ülkeler getirilirken bir hata oluştu'
    });
  }
});

// Belirli bir ülkenin illerini getir
router.get('/:ulkeId/iller', async (req, res) => {
  try {
    const { ulkeId } = req.params;
    
    const illerListesi = await db
      .select({
        id: iller.id,
        il: iller.il,
        ulke_id: iller.ulke_id
      })
      .from(iller)
      .where(eq(iller.ulke_id, parseInt(ulkeId)))
      .orderBy(iller.il);

    res.json({
      success: true,
      data: illerListesi
    });
  } catch (error) {
    console.error('İller getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İller getirilirken bir hata oluştu'
    });
  }
});

// Belirli bir ilin ilçelerini getir
router.get('/:ulkeId/iller/:ilAdi/ilceler', async (req, res) => {
  try {
    const { ulkeId, ilAdi } = req.params;
    console.log('İlçe API çağrısı:', { ulkeId, ilAdi });
    console.log('parseInt(ulkeId):', parseInt(ulkeId));
    
    // Önce il ID'sini bul
    const ilKaydi = await db
      .select({ id: iller.id })
      .from(iller)
      .where(and(
        eq(iller.il, ilAdi),
        eq(iller.ulke_id, parseInt(ulkeId))
      ))
      .limit(1);
    
    console.log('İl kaydı bulundu:', ilKaydi);
    console.log('İl kaydı ID:', ilKaydi[0]?.id);

    if (ilKaydi.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const ilcelerListesi = await db
      .select({
        id: ilceler.id,
        ilce: ilceler.ilce,
        il_id: ilceler.il_id
      })
      .from(ilceler)
      .where(eq(ilceler.il_id, ilKaydi[0].id))
      .orderBy(ilceler.ilce);

    res.json({
      success: true,
      data: ilcelerListesi
    });
  } catch (error) {
    console.error('İlçeler getirilirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İlçeler getirilirken bir hata oluştu'
    });
  }
});

// İl sil
router.delete('/iller/:ilId', async (req, res) => {
  try {
    const { ilId } = req.params;
    
    await db
      .delete(iller)
      .where(eq(iller.id, parseInt(ilId)));

    res.json({
      success: true,
      message: 'İl başarıyla silindi'
    });
  } catch (error) {
    console.error('İl silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İl silinirken bir hata oluştu'
    });
  }
});

// İlçe sil
router.delete('/iller/:ilId/ilceler/:ilceId', async (req, res) => {
  try {
    const { ilceId } = req.params;
    
    await db
      .delete(ilceler)
      .where(eq(ilceler.id, parseInt(ilceId)));

    res.json({
      success: true,
      message: 'İlçe başarıyla silindi'
    });
  } catch (error) {
    console.error('İlçe silinirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İlçe silinirken bir hata oluştu'
    });
  }
});

// İl güncelle
router.put('/iller/:ilId', async (req, res) => {
  try {
    const { ilId } = req.params;
    const { il } = req.body;
    
    await db
      .update(iller)
      .set({ il })
      .where(eq(iller.id, parseInt(ilId)));

    res.json({
      success: true,
      message: 'İl başarıyla güncellendi'
    });
  } catch (error) {
    console.error('İl güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İl güncellenirken bir hata oluştu'
    });
  }
});

// İlçe güncelle
router.put('/iller/:ilId/ilceler/:ilceId', async (req, res) => {
  try {
    const { ilceId } = req.params;
    const { ilce } = req.body;
    
    await db
      .update(ilceler)
      .set({ ilce })
      .where(eq(ilceler.id, parseInt(ilceId)));

    res.json({
      success: true,
      message: 'İlçe başarıyla güncellendi'
    });
  } catch (error) {
    console.error('İlçe güncellenirken hata:', error);
    res.status(500).json({
      success: false,
      message: 'İlçe güncellenirken bir hata oluştu'
    });
  }
});

export default router;
