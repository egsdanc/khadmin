import { Router } from 'express';
import { db } from "@db";
import { bayiler } from "@db/schema";
import { eq, count, sql, sum,and } from 'drizzle-orm';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    // Parse the user object from query parameters
    const userParam = req.query.user as string;
    const user = JSON.parse(userParam);

    console.log('Fetching active dealer count and total balance...');
    console.log("ggggg",user.user.bayi_id)

    // Create base query
    let query = db
      .select({
        count: count(),
        totalBalance: sql<string>`COALESCE(SUM(bakiye), 0)`.mapWith(String)
      })
      .from(bayiler)
      .where(eq(bayiler.aktif, 1));

    // Apply role-based filtering
    if (user.user.role === 'Admin' || user.user.role === 'Super Admin') {
      // Admin veya Super Admin ise herhangi bir filtreleme yapma
      // Tüm veriler üzerinden istatistikler hesaplanacak
    } else if (user.user.role === 'Bayi') {
      console.log("ggggg",bayiler.id,user.user.bayi_id)
      // Bayi rolü için sadece kendi bayi_id'sine ait veriyi getir
      query = query.where(
        and(
          eq(bayiler.aktif, 1), 
          eq(bayiler.id, user.user.bayi_id)
        )
      );
    } else {
      // Tanımlanmamış roller için hata dönüşü
      return res.status(403).json({
        success: false,
        message: "Bu işlemi yapmaya yetkiniz yok"
      });
    }

    const result = await query;

    console.log('Dealer stats result:', result);

    // Format the total balance
    const totalBalance = parseFloat(result[0].totalBalance || '0');
    const formattedTotalBalance = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(totalBalance);

    return res.json({
      success: true,
      data: {
        activeCount: result[0].count,
        totalBalance: totalBalance,
        formattedTotalBalance: `${formattedTotalBalance} ₺`,
        userRole: user.user.role // Hata ayıklama için rol bilgisi
      }
    });
  } catch (error) {
    console.error('Error fetching dealer stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dealer statistics'
    });
  }
});

export default router;