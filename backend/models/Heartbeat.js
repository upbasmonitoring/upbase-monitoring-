import mongoose from 'mongoose';

const heartbeatSchema = new mongoose.Schema({
  monitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true,
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    required: true,
  },
  statusCode: {
    type: Number,
  },
  responseTime: {
    type: Number, // in ms
  },
  message: {
    type: String,
  },
  responseBody: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  aiAnalysis: {
    rootCause: String,
    remediation: String,
    estimatedComplexity: String,
  },
  stepResults: [{
    action: String,
    status: { type: String, enum: ['success', 'fail'] },
    error: String,
    duration: Number
  }],
  securityFinding: {
    message: String,
    severity: String,
    score: Number
  }
});

export default mongoose.model('Heartbeat', heartbeatSchema);
