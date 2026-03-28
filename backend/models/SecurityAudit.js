import mongoose from 'mongoose';

const SecurityAuditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['vulnerability', 'malware', 'virus', 'logic_bug'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  message: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  aiAnalysis: {
    explanation: String,
    remediation: String,
    advancedFix: String,
    impact: String,
    threatLevel: String,
  },
  status: {
    type: String,
    enum: ['pending', 'mitigated', 'ignored'],
    default: 'pending',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('SecurityAudit', SecurityAuditSchema);
