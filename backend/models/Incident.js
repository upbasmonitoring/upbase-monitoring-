import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'DOWN_DETECTED', 
            'RETRY_FAILED', 
            'ALERT_SENT', 
            'SELF_HEALING_TRIGGERED', 
            'ROLLBACK_STARTED', 
            'AI_FIX_GENERATED',
            'AI_FIX_APPLIED',
            'RECOVERED',
            'MANUAL_CHECK',
            'RALPH_TRIGGERED',
            'RALPH_ANALYSIS',
            'RALPH_LOCALIZATION',
            'RALPH_INTELLIGENCE',
            'RALPH_UPDATE',
            'RALPH_REMEDIATION_SUCCESS',
            'RALPH_REMEDIATION_FAILED',
            'RALPH_ADVISORY',
            'DEPLOYMENT_IMPACT'
        ]
    },
    message: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const incidentSchema = new mongoose.Schema({
    monitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deployment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deployment'
    },
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED'],
        default: 'OPEN'
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'LOW'
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date,
    aiRca: String,
    alertSent: {
        type: Boolean,
        default: false,
    },
    timeline: [timelineEventSchema]
}, {
    timestamps: true
});

// Index for quick lookup of active incident for a monitor
incidentSchema.index({ monitor: 1, status: 1 });
// Index for recent incidents across a project (Dashboard view)
incidentSchema.index({ user: 1, status: 1, startedAt: -1 });
incidentSchema.index({ status: 1, severity: 1 });

const Incident = mongoose.model('Incident', incidentSchema);

export default Incident;
