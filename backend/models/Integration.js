import mongoose from 'mongoose';
import crypto from 'crypto';

const integrationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  platform: {
    type: String,
    enum: ['github', 'slack', 'discord', 'pagerduty', 'linear'],
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  refreshToken: String,
  expiresAt: Date,
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Encryption Logic (Optional but recommended in production)
// In a real app we'd use a master key to encrypt/decrypt access tokens
// For this implementation, we'll store them as-is or implement minimal masking

export default mongoose.model('Integration', integrationSchema);
