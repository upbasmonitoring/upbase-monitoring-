import mongoose from 'mongoose';

const escalationStepSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Slack', 'Email', 'Mobile Push', 'Phone Call', 'Webhook'],
    required: true
  },
  delay: {
    type: String, // e.g., "0 min", "5 min", "15 min"
    default: "0 min"
  },
  recipient: {
    type: String,
    required: true
  }
});

const escalationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name for the policy']
  },
  target: {
    type: String, // This could be a reference to a monitor name or "Global"
    default: 'Global'
  },
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Paused'],
    default: 'Active'
  },
  steps: [escalationStepSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Escalation', escalationSchema);
