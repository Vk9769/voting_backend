import express from 'express';
import { login, refreshToken, registerDevice, getRoles, selectRole } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';
const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/register-device', registerDevice);
router.get('/roles', verifyToken, getRoles);
router.post('/select-role', verifyToken, selectRole);

export default router;
