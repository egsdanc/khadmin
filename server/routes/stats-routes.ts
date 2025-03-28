import { Router } from "express";
import { db } from "../services/database-service";

const router = Router();

router.get("/", async (_req, res) => {
  let connection;
  try {
    connection = await db.getConnection();

    // Komisyon Yönetimi'ndeki ile aynı sorgu
    const [komisyonlar] = await connection.execute(`
      SELECT bk.*, b.ad as bayi_name, f.name as firma_name
      FROM bakiye_komisyonlar bk
      LEFT JOIN bayiler b ON b.id = bk.bayi_id
      LEFT JOIN firmalar f ON f.id = b.firma
      WHERE bk.deleted_at IS NULL
    `);

    // Aktif kullanıcı sayısı
    const [usersResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM panel_users WHERE deleted_at IS NULL AND status = "active"'
    );

    // Toplam bakiye
    const [balanceResult] = await connection.execute(
      'SELECT COALESCE(SUM(bakiye), 0) as total FROM bayiler WHERE deleted_at IS NULL AND aktif = 1'
    );

    // Debug için verileri loglayalım
    console.log('Query Results:', {
      count: komisyonlar.length,
      results: komisyonlar.length,
      firstRecord: komisyonlar[0],
      whereConditions: []
    });

    res.json({
      success: true,
      data: {
        komisyonlar,
        totalUsers: parseInt(usersResult[0].total || 0),
        totalBalance: parseFloat(balanceResult[0].total || 0)
      }
    });
  } catch (error) {
    console.error("İstatistikler alınırken hata:", error);
    res.status(500).json({
      success: false,
      message: "İstatistikler alınırken bir hata oluştu"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;