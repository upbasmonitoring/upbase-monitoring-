import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
  },
  keyHash: {
    type: String,
    required: true,
    unique: true,
  },
  keyPrefix: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  permissions: {
    type: [String],
    default: ['ingest:write', 'github:read'],
  },
  rateLimit: {
    type: Number,
    default: 10000, // requests per hour
  },
  lastUsed: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('ApiKey', apiKeySchema);
