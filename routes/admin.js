import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import {
  getDashboard,
  getBooths,
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

// Fetch lists
router.get('/booths', verifyToken, requireRole(['admin']), getBooths);
router.get('/agents', verifyToken, requireRole(['admin']), getAgents);
router.get('/reports', verifyToken, requireRole(['admin']), getReports);

// Flag suspicious activity
router.post('/flag', verifyToken, requireRole(['admin']), flagActivity);

// Booth assignments
router.post('/assign-agent', verifyToken, requireRole(['admin']), assignAgentToBooth);
router.post('/assign-voter', verifyToken, requireRole(['admin']), assignVoterToBooth);
router.get('/booth-assignments', verifyToken, requireRole(['admin']), getBoothAssignments);

export default router;
