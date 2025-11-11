import express from 'express';
import multer from 'multer';
import { addAgent, getAssignedBooth, postLocation, markVote, getTasks } from '../controllers/agentController.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleCheck.js';
import { checkRoleCreatePermission } from '../middleware/createPermission.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // keep file in memory

// Add new agent (admin only) with multipart support
router.post(
  '/',
  verifyToken,
  checkRoleCreatePermission,   // ✅ Add here
  upload.single('profilePhoto'),
  addAgent
);

// Existing agent routes
router.get('/assigned-booth', verifyToken, requireRole(['agent']), getAssignedBooth);
router.post('/location', verifyToken, requireRole(['agent']), postLocation);
router.post('/mark-vote', verifyToken, requireRole(['agent']), markVote);
router.get('/tasks', verifyToken, requireRole(['agent']), getTasks);

export default router;
