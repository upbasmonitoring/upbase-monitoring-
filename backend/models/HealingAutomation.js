import mongoose from 'mongoose';

const healingAutomationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  targetMonitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
  },
  type: {
    type: String,
    enum: ['webhook', 'script', 'restart', 'custom'],
    default: 'webhook',
  },
  config: {
    url: String, // For webhook
    method: { type: String, default: 'POST' },
    scriptPath: String, // For local scripts
    serviceName: String, // For system restarts
    command: String, // For raw shell commands
  },
  trigger: {
    type: String,
    enum: ['manual', 'on_failure', 'on_latency'],
    default: 'on_failure',
  },
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'draft',
  },
  lastRan: Date,
  lastResult: {
    status: { type: String, enum: ['success', 'fail'] },
    message: String,
    output: String
  },
}, { timestamps: true });

export default mongoose.model('HealingAutomation', healingAutomationSchema);
