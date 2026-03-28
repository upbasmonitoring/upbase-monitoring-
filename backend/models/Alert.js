import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null, // Optional: RUM/SLO/anomaly alerts are monitor-scoped, not project-scoped
  },
  rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AlertRule',
  },
  monitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
  },
  type: {
    type: String,
    enum: ['DOWN', 'UP', 'DEGRADED', 'SECURITY', 'RECOVERY', 'rum_p95_breach', 'slo_breach', 'anomaly'],
    default: 'DOWN',
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    default: 'warning',
  },
  message: {
    type: String,
    required: true,
  },
  // Deduplication: prevents identical alerts from flooding the DB
  deduplicationKey: {
    type: String,
    default: null,
  },
  triggeredAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'acknowledged'],
    default: 'active',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

// Index for fast dashboard timeline
alertSchema.index({ project: 1, triggeredAt: -1 });
// Prevent duplicate alerts across concurrent pods
alertSchema.index({ deduplicationKey: 1 }, { unique: true, sparse: true });
// Fast monitor-scoped alert lookups
alertSchema.index({ monitor: 1, type: 1, triggeredAt: -1 });

export default mongoose.model('Alert', alertSchema);
