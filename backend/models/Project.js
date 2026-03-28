import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  githubOwner: String,
  githubRepo: String,
  githubWebhookSecret: String,
  githubWebhookId: String,
  healingConfig: {
    enabled: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      enum: ['manual_approval', 'automatic'],
      default: 'manual_approval',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Ensure unique project names per user
projectSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Project', projectSchema);
