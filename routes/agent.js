import express from 'express';
import { addAgent, getAssignedBooth, postLocation, markVote, getTasks } from '../controllers/agentController.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';

const router = express.Router();

// Add new agent (admin only)
router.post('/', verifyToken, requireRole(['admin']), addAgent);

// Existing agent routes
router.get('/assigned-booth', verifyToken, requireRole(['agent']), getAssignedBooth);
router.post('/location', verifyToken, requireRole(['agent']), postLocation);
router.post('/mark-vote', verifyToken, requireRole(['agent']), markVote);
router.get('/tasks', verifyToken, requireRole(['agent']), getTasks);

export default router;
