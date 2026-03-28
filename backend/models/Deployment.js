import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
    monitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: true,
    },
    repo: { type: String, required: true },
    branch: { type: String, required: true },
    commitSha: { type: String, required: true },
    commitMessage: { type: String },
    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAIL', 'FAILED', 'ROLLED_BACK'],
        default: 'PENDING',
    },
    deployUrl: { type: String },
    finishedAt: { type: Date },
    healthStatus: {
        type: String,
        enum: ['OK', 'FAIL', 'NOT_CHECKED'],
        default: 'NOT_CHECKED',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    impact: [{
        monitor: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor' },
        status: { type: String, enum: ['DOWN', 'SLOW'] },
        detectedAt: { type: Date, default: Date.now }
    }],
});

export default mongoose.model('Deployment', deploymentSchema);
