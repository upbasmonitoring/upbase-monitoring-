import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'developer', 'viewer'],
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'revoked'],
    default: 'active',
  },
}, { timestamps: true });

// Ensure a user can only have one role per project
teamMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export default mongoose.model('TeamMember', teamMemberSchema);
