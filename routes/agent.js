import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { getAssignedBooth, postLocation, markVote, getTasks } from '../controllers/agentController.js';

const router = express.Router();

router.get('/assigned-booth', verifyToken, requireRole(['agent']), getAssignedBooth);
router.post('/location', verifyToken, requireRole(['agent']), postLocation);
router.post('/mark-vote', verifyToken, requireRole(['agent']), markVote);
router.get('/tasks', verifyToken, requireRole(['agent']), getTasks);

export default router;
