import express from 'express';
import { bayiService } from '../services/bayi-service';

const router = express.Router();

// ... existing code ...

router.get('/:id/name', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const name = await bayiService.getBayiNameById(id);
    res.json({ name });
  } catch (error) {
    console.error('Error fetching dealer name:', error);
    res.status(500).json({ error: 'Failed to fetch dealer name' });
  }
});

export default router; 