import mongoose from 'mongoose';

const monitorLogSchema = new mongoose.Schema({
    monitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: true,
    },
    status: {
        type: String, // Evolve enum strictly based on what is passed, e.g. UP, DOWN, PROTECTED
        required: true,
    },
    // Backwards compatibility legacy field
    responseTime: {
        type: Number,
        default: 0
    },
    latency: {
        type: Number,
        default: 0
    },
    
    // Analytics Fields (Derived)
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false, // Make it optional temporarily for backwards compatibility
    },
    url: {
        type: String,
        default: null,
    },
    responseSize: {
        type: Number,
        default: 0,
    },
    region: {
        type: String,
        default: 'global',
    },
    userAgent: {
        type: String,
        default: null,
    },
    
    // EXPLICIT SEPARATION AS REQUESTED
    edgeLatency: {
        type: Number,
        default: 0
    },
    realLatency: {
        type: Number,
        default: 0
    },
    p50: {
        type: Number,
        default: 0
    },
    p95: {
        type: Number,
        default: 0
    },
    source: {
        type: String,
        enum: ['synthetic', 'RUM'],
        default: 'synthetic'
    },

    // Structured histogram buckets (queryable JSON, not string)
    histogram: {
        type: mongoose.Schema.Types.Mixed,
        default: null
        // Shape: { fast: N, normal: N, slow: N, critical: N }
    },

    checkedAt: {
        type: Date,
        default: Date.now,
    },
    errorMessage: {
        type: String,
        default: null,
    },
    statusCode: {
        type: Number,
        default: 0,
    },
    responseBody: {
        type: String,
        default: null,
    },
});

// Index for fast RUM vs Synthetic queries and time-series lookups
monitorLogSchema.index({ monitor: 1, source: 1, checkedAt: -1 });

export default mongoose.model('MonitorLog', monitorLogSchema);
