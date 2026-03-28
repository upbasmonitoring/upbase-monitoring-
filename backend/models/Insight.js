import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema({
    monitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['ANOMALY', 'PATTERN', 'HEALTH', 'STABILITY'],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW',
    },
    data: {
        type: mongoose.Schema.Types.Mixed, // Optional data context
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Auto-expire after 24h
    }
});

// Index to automatically remove old insights
insightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Insight', insightSchema);
