import mongoose from 'mongoose';

/**
 * Log Schema — Centralized Normalized Log Storage
 * 
 * Every log ingested through POST /api/logs is stored here.
 * Logs are strictly categorized into: frontend | backend | system.
 * Indexed for fast filtering by type, timestamp, severity, and trace_id.
 */
const logSchema = new mongoose.Schema(
  {
    // Required: strict categorization
    type: {
      type: String,
      required: [true, 'Log type is required'],
      enum: {
        values: ['frontend', 'backend', 'system'],
        message: 'Log type must be one of: frontend, backend, system',
      },
      index: true,
    },

    // Source of the log (e.g., browser, render, cloudflare, nginx, node-process)
    source: {
      type: String,
      required: [true, 'Log source is required'],
      trim: true,
      maxlength: [128, 'Source must be 128 characters or less'],
    },

    // Optional: which service produced this log
    service: {
      type: String,
      trim: true,
      maxlength: [128, 'Service name must be 128 characters or less'],
      default: null,
    },

    // Severity level
    severity: {
      type: String,
      required: [true, 'Severity is required'],
      enum: {
        values: ['info', 'warning', 'error', 'critical'],
        message: 'Severity must be one of: info, warning, error, critical',
      },
      index: true,
    },

    // Human-readable log message
    message: {
      type: String,
      required: [true, 'Log message is required'],
      trim: true,
      maxlength: [8192, 'Message must be 8192 characters or less'],
    },

    // Flexible JSON metadata for extra context
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Optional: correlation ID for distributed tracing
    trace_id: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // Server-side ingestion timestamp (always set by the server)
    // Note: indexed via compound indexes + TTL index below (no inline index: true to avoid duplicates)
    timestamp: {
      type: Date,
      default: Date.now,
    },

    // Which API key / project ingested this log (for multi-tenant isolation)
    ingested_by: {
      type: String,
      default: null,
    },

    // ─── Enrichment Fields (Phase 2) ────────────────────────────
    // Project association for multi-tenant filtering
    project_id: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    // Deployment environment
    environment: {
      type: String,
      trim: true,
      enum: {
        values: ['production', 'staging', 'development', 'test', null],
        message: 'Environment must be one of: production, staging, development, test',
      },
      default: null,
    },

    // Geographic region (if available from CDN/infrastructure)
    region: {
      type: String,
      trim: true,
      maxlength: [64, 'Region must be 64 characters or less'],
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  }
);

// ─── Compound Indexes ───────────────────────────────────────────
// Primary query: "show me all frontend logs from the last hour, ordered by time"
logSchema.index({ type: 1, timestamp: -1 });

// Secondary: "show me all critical logs across all types"
logSchema.index({ severity: 1, timestamp: -1 });

// Tertiary: correlation lookups
logSchema.index({ trace_id: 1, timestamp: -1 });

// Multi-tenant: per-project log queries
logSchema.index({ project_id: 1, type: 1, timestamp: -1 });

// TTL index: auto-delete logs older than 90 days (configurable via env)
const LOG_TTL_DAYS = parseInt(process.env.LOG_TTL_DAYS, 10) || 90;
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: LOG_TTL_DAYS * 86400 });

const Log = mongoose.model('Log', logSchema);

export default Log;
