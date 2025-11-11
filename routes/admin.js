import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import {
  getDashboard,
  getBooths,
  createBooth,
  editBooth,
  deleteBooth,
  getAgents,
  getReports,
  flagActivity,
  assignAgentToBooth,
  assignVoterToBooth,
  getBoothAssignments,
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', verifyToken, requireRole(['admin']), getDashboard);

// Booth management
router.get('/booths', verifyToken, requireRole(['admin']), getBooths);
router.post('/booths', verifyToken, requireRole(['admin']), createBooth);
router.put('/booths/:booth_id', verifyToken, requireRole(['admin']), editBooth);
router.delete('/booths/:booth_id', verifyToken, requireRole(['admin']), deleteBooth);
router.get('/booths/full', verifyToken, requireRole(['admin', 'super_admin', 'master_admin']), getBoothsFull);

// Agents & Reports
router.get('/agents', verifyToken, requireRole(['admin']), getAgents);
router.get('/reports', verifyToken, requireRole(['admin']), getReports);

// Flag suspicious activity
router.post('/flag', verifyToken, requireRole(['admin']), flagActivity);

// Booth assignments
router.post('/assign-agent', verifyToken, requireRole(['admin']), assignAgentToBooth);
router.post('/assign-voter', verifyToken, requireRole(['admin']), assignVoterToBooth);
router.get('/booth-assignments', verifyToken, requireRole(['admin']), getBoothAssignments);

export default router;
