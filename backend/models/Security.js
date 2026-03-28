import mongoose from 'mongoose';

const securityEventSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, required: true },
  action: { type: String, enum: ['block', 'warn', 'rate_limit', 'auth_fail'], required: true },
  reason: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  metadata: { type: Object, default: {} }
});

const blacklistedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  reason: { type: String },
  addedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // Optional: If null, permanent
  isActive: { type: Boolean, default: true }
});

export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);
export const BlacklistedIP = mongoose.model('BlacklistedIP', blacklistedIPSchema);

export default SecurityEvent;
