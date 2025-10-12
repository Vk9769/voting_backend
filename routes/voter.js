import express from 'express';
import { getVoterStatus, verifyVoter } from '../controllers/voterController.js';

const router = express.Router();

router.get('/status/:voter_id', getVoterStatus);
router.post('/verify', verifyVoter);

export default router;
