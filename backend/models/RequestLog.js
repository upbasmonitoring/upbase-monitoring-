import mongoose from 'mongoose';

const requestLogSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true,
  },
  method: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  normalizedPath: String, // e.g. /users/:id instead of /users/123
  statusCode: {
    type: Number,
    required: true,
  },
  responseTime: {
    type: Number,
    required: true,
  },
  ip: String,
  country: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// TTL Index for auto-cleanup (30 days as per roadmap)
requestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
// Fast queries for project dashboard charts (Trend Analysis)
requestLogSchema.index({ project: 1, timestamp: -1 });
// Index for slow path analysis
requestLogSchema.index({ project: 1, path: 1, responseTime: -1 });
// Index for status code distribution (Error Tracking)
requestLogSchema.index({ project: 1, statusCode: 1, timestamp: -1 });

export default mongoose.model('RequestLog', requestLogSchema);
