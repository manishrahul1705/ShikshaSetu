import { Router } from 'express';
import { login, logout, me } from './authController.js';
import authorize from '../../middleware/authorize.js';
import loginGuards from '../../middleware/loginGuards.js';

const router = Router();

// Public routes (no authorize middleware)
router.post('/login', ...loginGuards, login);

// Protected routes
router.post('/logout', authorize(), logout);
router.get('/me', authorize(), me);

export default router;
