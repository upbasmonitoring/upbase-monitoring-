import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'developer', 'viewer'],
      default: 'viewer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  invites: [{
    email: String,
    role: {
      type: String,
      enum: ['admin', 'developer', 'viewer'],
      default: 'viewer'
    },
    token: String,
    expiresAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Team', teamSchema);
