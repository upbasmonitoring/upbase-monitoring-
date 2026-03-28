import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'developer', 'viewer', 'user'],
    default: 'user',
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  securitySettings: {
    botProtection: { type: Boolean, default: true },
    rateLimitToggle: { type: Boolean, default: true },
    ipBlacklist: [String],
    suspiciousIPs: [{
      ip: String,
      reason: String,
      timestamp: { type: Date, default: Date.now }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  provider: {
    type: String,
    default: 'local'
  },
  isSocial: {
    type: Boolean,
    default: false
  },
  integrations: {
    discordWebhook: { type: String, default: null },
    slackWebhook: { type: String, default: null },
    customWebhook: { type: String, default: null },
    pagerdutyWebhook: { type: String, default: null },
    emailAlerts: { type: Boolean, default: true },
    alertEmail: { type: String, default: null },
    smsAlerts: { type: Boolean, default: false },
    callAlerts: { type: Boolean, default: false },
    whatsappAlerts: { type: Boolean, default: false },
    phone: { type: String, default: null },
    whatsapp: { type: String, default: null },
    isAutopilotEnabled: { type: Boolean, default: false },
    kerberosConfig: {
      type: {
        enabled: { type: Boolean, default: false },
        realm: { type: String, default: null },
        kdc: { type: String, default: null }
      },
      default: {}
    }
  },
  github: {
    accessToken: { type: String, default: null, select: false },
    username: { type: String, default: null },
    connectedAt: { type: Date, default: null }
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
