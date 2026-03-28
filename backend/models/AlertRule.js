import mongoose from 'mongoose';

const alertRuleSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metric: {
    type: String,
    enum: ['uptime', 'error_rate', 'response_time', 'new_error', 'security_threat', 'vulnerability'],
    required: true,
  },
  operator: {
    type: String,
    enum: ['gt', 'lt', 'eq', 'contains'],
    default: 'gt',
  },
  threshold: Number, // e.g. 500ms, 5% error rate
  window: {
    type: Number,
    default: 5, // Evaluation window in minutes
  },
  consecutiveCount: {
    type: Number,
    default: 1,
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    default: 'warning',
  },
  channels: [{
    type: String,
    enum: ['email', 'whatsapp', 'slack', 'webhook'],
  }],
  recipients: [String], // Emails, phone numbers
  webhookUrl: String,
  cooldownMinutes: {
    type: Number,
    default: 30,
  },
  lastTriggeredAt: Date,
}, { timestamps: true });

export default mongoose.model('AlertRule', alertRuleSchema);
