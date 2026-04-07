import mongoose from 'mongoose';

/**
 * ActionLog Model — Audit trail for every action executed
 * 
 * Every action (restart, rollback, cache clear) is logged here
 * with its status, who triggered it, and the result.
 */
const actionLogSchema = new mongoose.Schema(
  {
    // What action was executed
    action_id: {
      type: String,
      required: true,
      index: true,
    },
    action_name: {
      type: String,
      required: true,
    },

    // Context
    trace_id: {
      type: String,
      index: true,
      default: null,
    },
    project_id: {
      type: String,
      default: null,
    },
    environment: {
      type: String,
      default: null,
    },

    // Execution details
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'executing', 'completed', 'failed', 'cancelled', 'rolled_back'],
      default: 'pending',
    },
    risk: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    command: {
      type: String,
      default: null,
    },

    // Who triggered it
    triggered_by: {
      type: String,
      default: 'user',
    },

    // Result
    result: {
      success: { type: Boolean, default: null },
      message: { type: String, default: '' },
      output: { type: String, default: '' },
      error: { type: String, default: null },
    },

    // Timing
    confirmed_at: { type: Date, default: null },
    executed_at: { type: Date, default: null },
    completed_at: { type: Date, default: null },
    duration_ms: { type: Number, default: null },

    // User feedback
    feedback: {
      helpful: { type: Boolean, default: null },
      comment: { type: String, default: null },
      rated_at: { type: Date, default: null },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

actionLogSchema.index({ status: 1, created_at: -1 });
actionLogSchema.index({ trace_id: 1, created_at: -1 });

const ActionLog = mongoose.model('ActionLog', actionLogSchema);

export default ActionLog;
