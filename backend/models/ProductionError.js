import mongoose from 'mongoose';

const productionErrorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  fingerprint: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    default: 'UnhandledError',
  },
  message: {
    type: String,
    required: true,
  },
  stack: {
    type: String,
  },
  level: {
    type: String,
    enum: ['fatal', 'error', 'warning', 'info'],
    default: 'error',
  },
  request: {
    method: String,
    path: String,
    statusCode: Number,
    ip: String,
    userAgent: String,
    body: mongoose.Schema.Types.Mixed,
    headers: mongoose.Schema.Types.Mixed,
  },
  environment: {
    type: String,
    default: 'production',
  },
  release: String, // Git commit SHA
  occurrences: {
    type: Number,
    default: 1,
  },
  firstSeen: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['open', 'resolved', 'ignored'],
    default: 'open',
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Compound index for fast queries
productionErrorSchema.index({ project: 1, status: 1, lastSeen: -1 });
productionErrorSchema.index({ project: 1, fingerprint: 1 });

export default mongoose.model('ProductionError', productionErrorSchema);
