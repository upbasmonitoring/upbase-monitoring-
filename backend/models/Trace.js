import mongoose from 'mongoose';

/**
 * Trace Model — Stores correlated trace summaries & timelines
 * 
 * Each trace groups logs from frontend/backend/system into a single
 * debugging view with a structured timeline and rule-based root cause.
 */
const traceSchema = new mongoose.Schema(
  {
    // Unique correlation ID (matches trace_id in Log documents)
    trace_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ─── Timeline ────────────────────────────────────────────────
    // Ordered array of log references that form the trace
    timeline: [
      {
        log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Log' },
        timestamp: Date,
        type: { type: String, enum: ['frontend', 'backend', 'system'] },
        source: String,
        service: String,
        severity: String,
        message: String,
        metadata: mongoose.Schema.Types.Mixed,
      },
    ],

    // ─── Summary Statistics ──────────────────────────────────────
    log_count: { type: Number, default: 0 },
    
    // Which log types are present in this trace
    types_involved: {
      type: [String],
      enum: ['frontend', 'backend', 'system'],
      default: [],
    },

    // Highest severity found in the trace
    max_severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
    },

    // ─── Root Cause Analysis ─────────────────────────────────────
    root_cause: {
      category: {
        type: String,
        enum: [
          'database', 'network', 'cdn', 'frontend', 'backend',
          'authentication', 'timeout', 'memory', 'configuration',
          'third_party', 'infrastructure', 'unknown',
        ],
        default: 'unknown',
      },
      description: { type: String, default: '' },
      matched_rule: { type: String, default: null },
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low',
      },
      source_log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Log', default: null },
    },

    // Impact assessment
    impact_level: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },

    // ─── Time Window ─────────────────────────────────────────────
    first_seen: { type: Date },
    last_seen: { type: Date },
    duration_ms: { type: Number, default: 0 },

    // ─── Enrichment ──────────────────────────────────────────────
    project_id: { type: String, default: null, index: true },
    environment: { type: String, default: null },
    is_demo: { type: Boolean, default: false },

    // Status of the trace analysis
    status: {
      type: String,
      enum: ['open', 'resolved', 'investigating'],
      default: 'open',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────
traceSchema.index({ max_severity: 1, last_seen: -1 });
traceSchema.index({ 'root_cause.category': 1, last_seen: -1 });
traceSchema.index({ impact_level: 1, last_seen: -1 });
traceSchema.index({ project_id: 1, last_seen: -1 });
traceSchema.index({ status: 1, last_seen: -1 });

const Trace = mongoose.model('Trace', traceSchema);

export default Trace;
