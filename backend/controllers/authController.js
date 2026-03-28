import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import { trackSuspicious } from '../middleware/securityShield.js';
import asyncHandler from '../utils/asyncHandler.js';

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- 🛡️ SECURE VAULT: Send JWT via HTTPOnly Cookie ---
const sendTokenResponse = (user, statusCode, res) => {
    const token = generateToken(user._id);

    const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax' // Lax is better for localhost http
    };

    res.status(statusCode)
       .cookie('token', token, options) // Send Cookie
       .json({
           _id: user._id,
           name: user.name,
           email: user.email,
           token // Still sending for frontend logic, but browser will use cookie
       });
};

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        sendTokenResponse(user, 201, res);
    }
});

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        sendTokenResponse(user, 200, res);
    } else {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await trackSuspicious(ip, `Failed login attempt for email: ${email}`, 'medium');
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

/**
 * @desc    Verify user password
 * @route   POST /api/auth/verify-password
 * @access  Private
 */
export const verifyPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user && (await user.matchPassword(password))) {
        res.json({ success: true, message: 'Password verified' });
    } else {
        res.status(401);
        throw new Error('Invalid password');
    }
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/profile
 * @access  Private
 */
export const deleteProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    await user.deleteOne();
    res.json({ message: 'User account deleted' });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            integrations: updatedUser.integrations,
            github: updatedUser.github,
            token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : req.cookies.token
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');

    if (user) {
        // Find existing password match
        if (!(await user.matchPassword(req.body.currentPassword))) {
            res.status(401);
            throw new Error('Current password is incorrect');
        }

        user.password = req.body.newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Google Login
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = asyncHandler(async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) {
        res.status(400);
        throw new Error('No access token provided');
    }

    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!profile.email) {
        res.status(400);
        throw new Error('Failed to retrieve email from Google');
    }

    let user = await User.findOne({ email: profile.email });

    if (user) {
        sendTokenResponse(user, 200, res);
    } else {
        const randomPassword = Math.random().toString(36).slice(-10) + 'A1!';
        user = await User.create({
            name: profile.name || profile.email.split('@')[0],
            email: profile.email,
            password: randomPassword,
            provider: 'google',
            isSocial: true
        });

        sendTokenResponse(user, 201, res);
    }
});

/**
 * @desc    Update user integrations (Discord, Email settings, etc)
 * @route   PUT /api/auth/integrations
 * @access  Private
 */
export const updateIntegrations = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Update integrations fields individually to avoid overwriting nested schemas with 'undefined'
        Object.keys(req.body).forEach(key => {
            if (key in user.integrations) {
                user.integrations[key] = req.body[key];
            }
        });
        
        user.markModified('integrations');

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            integrations: updatedUser.integrations,
            github: updatedUser.github,
            token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : null
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Update GitHub Personal Access Token
 * @route   PUT /api/auth/github
 * @access  Private
 */
export const updateGithubConfig = asyncHandler(async (req, res) => {
    const { accessToken, username } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (accessToken) user.github.accessToken = accessToken;
    if (username) user.github.username = username;
    user.github.connectedAt = new Date();

    const updatedUser = await user.save();
    
    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        integrations: updatedUser.integrations,
        github: updatedUser.github,
        token: req.headers.authorization ? req.headers.authorization.split(' ')[1] : null
    });
});
