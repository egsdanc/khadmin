import express from 'express';
import { getFirmaNameById } from '../services/firma-service';

const router = express.Router();

// ... existing code ...

router.get('/:id/name', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const name = await getFirmaNameById(id);
    res.json({ name });
  } catch (error) {
    console.error('Error fetching company name:', error);
    res.status(500).json({ error: 'Failed to fetch company name' });
  }
});

export default router; 