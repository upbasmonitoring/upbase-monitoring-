import mongoose from 'mongoose';

const healingLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Monitor',
    required: true
  },
  productionError: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionError',
    default: null
  },
  project: { type: String, required: true },
  trigger: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto'
  },
  // --- 🧠 Ralph Intelligence (Analysis Engine) ---
  analysis: {
    cause: { type: String, default: null },
    impact: { type: String, default: null },
    suggestion: { type: String, default: null },
    aiAnalysis: { type: String, default: null }, // 🧠 Gemini Deep Analysis
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' }
  },
  // Phase 1: Rollback
  rollback: {
    attempted: { type: Boolean, default: false },
    commitSha: { type: String, default: null },      // Commit we rolled back to
    rolledBackFrom: { type: String, default: null }, // Commit that failed
    status: { type: String, enum: ['pending', 'success', 'failed', 'skipped'], default: 'pending' },
    verifiedAt: { type: Date, default: null },
    message: { type: String, default: null }
  },
  // Phase 2: AI Code Fix
  aiFix: {
    attempted: { type: Boolean, default: false },
    filePath: { type: String, default: null },       // File that was fixed
    originalCode: { type: String, default: null },   // Before
    fixedCode: { type: String, default: null },      // After (AI output)
    commitSha: { type: String, default: null },      // New commit after fix
    status: { type: String, enum: ['pending', 'success', 'failed', 'skipped'], default: 'pending' },
    verifiedAt: { type: Date, default: null },
    message: { type: String, default: null }
  },
  // Final outcome
  outcome: {
    type: String,
    enum: [
      'in_progress', 
      'healed_by_restart', 
      'healed_by_rollback', 
      'healed_by_ai', 
      'healing_failed', 
      'suggestion_generated', // AI found a fix, waiting for approval
      'fix_applied',           // User clicked "Apply Fix"
      'fix_rejected'           // User clicked "Reject Fix"
    ],
    default: 'in_progress'
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  timeTakenMs: { type: Number, default: null }
});

export default mongoose.model('HealingLog', healingLogSchema);
