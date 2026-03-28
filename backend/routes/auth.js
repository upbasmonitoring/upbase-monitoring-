import express from 'express';
import { protect } from '../middleware/auth.js';
import { getWhatsAppStatus, disconnectWhatsApp } from '../services/whatsappService.js';
import {
    registerUser,
    loginUser,
    verifyPassword,
    deleteProfile,
    googleLogin,
    updateIntegrations,
    updateGithubConfig,
    updateProfile,
    updatePassword
} from '../controllers/authController.js';

import { validateRegister } from '../middleware/validator.js';

const router = express.Router();

router.post('/register', validateRegister, registerUser);
router.post('/login', loginUser);
router.post('/verify-password', protect, verifyPassword);
router.get('/profile', protect, (req, res) => res.json(req.user));
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.delete('/profile', protect, deleteProfile);
router.post('/google', googleLogin);
router.put('/integrations', protect, updateIntegrations);
router.put('/github', protect, updateGithubConfig);

router.get('/whatsapp/status', (req, res) => {
    res.json(getWhatsAppStatus());
});

router.post('/whatsapp/logout', protect, async (req, res) => {
    const result = await disconnectWhatsApp();
    res.json(result);
});

export default router;
