import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { getDashboard, getBooths, getAgents, getReports, flagActivity } from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', verifyToken, requireRole(['admin']), getDashboard);
router.get('/booths', verifyToken, requireRole(['admin']), getBooths);
router.get('/agents', verifyToken, requireRole(['admin']), getAgents);
router.get('/reports', verifyToken, requireRole(['admin']), getReports);
router.post('/flag', verifyToken, requireRole(['admin']), flagActivity);

export default router;
