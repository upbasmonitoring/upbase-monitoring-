import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import crypto from 'crypto';
import { sendEmail } from '../alertService.js';

const router = express.Router();

// @desc    Get current user's team
// @route   GET /api/teams
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('team');
    if (!user.team) {
       // Create a default team if none exists for the user (The user is owner)
       const newTeam = await Team.create({
           name: `${user.name}'s Organization`,
           owner: user._id,
           members: [{ user: user._id, role: 'admin' }]
       });
       user.team = newTeam._id;
       await user.save();
       return res.json({ team: newTeam });
    }
    
    const team = await Team.findById(user.team).populate('members.user', 'name email role');
    res.json({ team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Invite a member to team
// @route   POST /api/teams/invite
router.post('/invite', protect, authorize(['admin']), async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findById(req.user.id);
    const team = await Team.findById(user.team);

    if (!team) return res.status(404).json({ message: 'Team not found' });
    

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    team.invites.push({ email, role, token, expiresAt });
    await team.save();

    const inviteLink = `${process.env.FRONTEND_URL}/join?token=${token}`;
    await sendEmail(email, 'Invitation to join PulseWatch Team', `You joined! \n\nClick here: ${inviteLink}`);

    res.json({ success: true, message: `Invite sent to ${email}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Accept invite
// @route   POST /api/teams/join/:token
router.post('/join/:token', protect, async (req, res) => {
    try {
        const { token } = req.params;
        const team = await Team.findOne({ 'invites.token': token });
        if (!team) return res.status(400).json({ message: 'Invalid or expired token' });

        const inviteIndex = team.invites.findIndex(i => i.token === token);
        const invite = team.invites[inviteIndex];
        
        if (new Date() > invite.expiresAt) {
            team.invites.splice(inviteIndex, 1);
            await team.save();
            return res.status(400).json({ message: 'Invite expired' });
        }

        const user = await User.findById(req.user.id);
        if (user.team) return res.status(400).json({ message: 'User already belongs to a team' });

        // Add member
        team.members.push({ user: user._id, role: invite.role });
        team.invites.splice(inviteIndex, 1);
        await team.save();

        user.team = team._id;
        user.role = invite.role;
        await user.save();

        res.json({ success: true, message: `Successfully joined ${team.name}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
