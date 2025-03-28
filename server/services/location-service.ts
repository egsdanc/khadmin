import { Request, Response } from "express";
import { executeQuery } from "./connection";

interface Il {
  id: number;
  il: string;
}

interface Ilce {
  id: number;
  ilce: string;
  il_id: number;
}

// İl ve ilçe verilerini getiren endpoint
export const getLocations = async (_req: Request, res: Response) => {
  try {
    // Tüm illeri getir
    const iller = await executeQuery(`
      SELECT id, il 
      FROM iller 
      ORDER BY il ASC
    `) as Il[];

    // Her il için ilçelerini getir
    const illerWithIlceler = await Promise.all(iller.map(async (il) => {
      const ilceler = await executeQuery(`
        SELECT id, ilce 
        FROM ilceler 
        WHERE il_id = ? 
        ORDER BY ilce ASC
      `, [il.id]) as Ilce[];

      return {
        id: il.id,
        il: il.il,
        ilceler: ilceler.map(ilce => ({
          id: ilce.id,
          ilce: ilce.ilce
        }))
      };
    }));

    res.json({
      success: true,
      data: illerWithIlceler
    });
  } catch (error) {
    console.error('İl-ilçe verisi getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İl ve ilçe verileri getirilirken bir hata oluştu'
    });
  }
};

// İl adını güncelleme fonksiyonu
export async function updateIlName() {
  try {
    console.log("İl adı güncelleniyor...");
    await executeQuery(`UPDATE iller SET il = 'MERSİN' WHERE il = 'İÇEL'`);
    console.log("İl adı başarıyla güncellendi");
    return true;
  } catch (error) {
    console.error('İl adı güncelleme hatası:', error);
    throw error;
  }
}

// Yeni il ekleme
export const createIl = async (req: Request, res: Response) => {
  try {
    const { il } = req.body;
    if (!il) {
      return res.status(400).json({
        success: false,
        message: 'İl adı gereklidir'
      });
    }

    const result = await executeQuery(
      'INSERT INTO iller (il) VALUES (?)',
      [il.toUpperCase()]
    );

    res.json({
      success: true,
      message: 'İl başarıyla eklendi',
      data: result
    });
  } catch (error) {
    console.error('İl ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İl eklenirken bir hata oluştu'
    });
  }
};

// İlçe ekleme işlemi optimizasyonu
export const createIlce = async (req: Request, res: Response) => {
  try {
    const { ilce, il_id } = req.body;

    if (!ilce || !il_id) {
      return res.status(400).json({
        success: false,
        message: 'İlçe adı ve il ID gereklidir'
      });
    }

    // il_id'yi number'a çevir
    const ilIdNumber = parseInt(il_id, 10);
    if (isNaN(ilIdNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz il ID formatı'
      });
    }

    // Önce ilin var olduğunu kontrol et - performans için sadece id kontrolü
    const [ilKontrol] = await executeQuery(
      'SELECT 1 FROM iller WHERE id = ? LIMIT 1',
      [ilIdNumber]
    ) as any[];

    if (!ilKontrol) {
      return res.status(404).json({
        success: false,
        message: 'Belirtilen il bulunamadı'
      });
    }

    // İlçe adının benzersiz olup olmadığını kontrol et
    const [ilceKontrol] = await executeQuery(
      'SELECT 1 FROM ilceler WHERE ilce = ? AND il_id = ? LIMIT 1',
      [ilce.toUpperCase(), ilIdNumber]
    ) as any[];

    if (ilceKontrol) {
      return res.status(400).json({
        success: false,
        message: 'Bu ilçe adı zaten mevcut'
      });
    }

    // İlçeyi ekle
    const result = await executeQuery(
      'INSERT INTO ilceler (ilce, il_id) VALUES (?, ?)',
      [ilce.toUpperCase(), ilIdNumber]
    );

    res.json({
      success: true,
      message: 'İlçe başarıyla eklendi',
      data: result
    });
  } catch (error) {
    console.error('İlçe ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlçe eklenirken bir hata oluştu'
    });
  }
};

// İl silme
export const deleteIl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM iller WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'İl başarıyla silindi'
    });
  } catch (error) {
    console.error('İl silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İl silinirken bir hata oluştu'
    });
  }
};

// İlçe silme
export const deleteIlce = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await executeQuery('DELETE FROM ilceler WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'İlçe başarıyla silindi'
    });
  } catch (error) {
    console.error('İlçe silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İlçe silinirken bir hata oluştu'
    });
  }
};

export default {
  getLocations,
  updateIlName,
  createIl,
  createIlce,
  deleteIl,
  deleteIlce
};