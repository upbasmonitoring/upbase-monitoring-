import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please add a name for the monitor'],
    },
    url: {
        type: String,
        required: [true, 'Please add a URL to monitor'],
    },
    apiUrl: {
        type: String,
        default: null, // Optional backend API to check alongside frontend
    },
    successKeyword: {
        type: String,
        default: null, // If set, monitor will search for this text in response HTML
    },
    useSentinelIQ: {
        type: Boolean,
        default: true, // Enable autonomous hazard detection (V2 logic)
    },
    failureKeywords: {
        type: [String],
        default: [], // Custom strings that indicate a failure (e.g., "maintenance")
    },
    status: {
        type: String,
        enum: ['UP', 'DOWN', 'PENDING', 'GOOD', 'OK', 'DEGRADED'],
        default: 'PENDING',
    },
    monitorType: {
        type: String,
        enum: ['FRONTEND', 'BACKEND', 'API'],
        default: 'FRONTEND',
    },
    responseTime: {
        type: Number,
        default: 0,
    },
    avgResponseTime: {
        type: Number,
        default: 0,
    },
    healthScore: {
        type: Number,
        default: 100,
    },
    uptimePercentage: {
        type: Number,
        default: 100,
    },
    lastChecked: {
        type: Date,
    },
    frequency: {
        type: Number,
        default: 30, // Frequency in seconds (User requested e.g. 30 sec)
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    autoHealPaused: {
        type: Boolean,
        default: false,
    },
    // Section 2: Alerting Tracking
    consecutiveFailures: {
        type: Number,
        default: 0,
    },
    failureStartedAt: {
        type: Date,
    },
    lastAlertSentAt: {
        type: Date,
    },
    alertLevel: {
        type: String,
        enum: ['NONE', 'DISCORD', 'EMAIL', 'ESCALATED'],
        default: 'NONE',
    },
    // Section 3: Git Integration
    githubRepo: {
        owner: { type: String, default: null },       // GitHub username or org
        repo: { type: String, default: null },        // Repo name
        branch: { type: String, default: 'main' },    // Branch to track
        lastReleaseSha: { type: String, default: null }, // Tracking latest commit
        lastReleaseAt: { type: Date, default: null },
        webhookSecret: { type: String, default: null } // Randomly generated secret
    },
    lastError: {
        type: String,
        default: null,
    },
    // Section 4: Pro-Reliability Engine
    rollbackTodayCount: {
        type: Number,
        default: 0,
    },
    lastRollbackAt: {
        type: Date,
        default: null,
    },
    healingCooldownUntil: {
        type: Date,
        default: null, // Prevents re-triggering healing while rollback deployment is propagating
    },
    lastDeploymentAt: {
        type: Date,
        default: Date.now,
    },
    isBaselineError: {
        type: Boolean,
        default: false,
    },
    lastCommitStatus: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'UNKNOWN'],
        default: 'SUCCESS',
    },
    silenceUntil: {
        type: Date,
        default: null,
    },
    failureThreshold: {
        type: Number,
        default: 3,
    },
    degradedThreshold: {
        type: Number,
        default: 2000, // ms
    },
    ralphStatus: {
        type: String,
        enum: ['IDLE', 'ANALYZING', 'REMEDIATING', 'STABILIZING'],
        default: 'IDLE',
    },
    lastRalphAnalysisAt: {
        type: Date,
        default: null, // Track AI attempt time to avoid 429 spam
    },
    safeMode: {
        type: Boolean,
        default: true,
    },
    // Section 5: Ralph Auto-Fix Engine
    autoFixAttempted: {
        type: Boolean,
        default: false,
    },
    lastFixStatus: {
        type: String,
        enum: ['IDLE', 'SUCCESS', 'FAILED', 'VALIDATED', 'PENDING', 'MERGED', 'POST_MERGE_FAILED'],
        default: 'IDLE',
    },
    mergedAt: {
        type: Date,
        default: null,
    },
    productionVerified: {
        type: Boolean,
        default: false,
    },
    mergeInProgress: {
        type: Boolean,
        default: false,
    },
    rollbackDone: {
        type: Boolean,
        default: false,
    },
    fixValidated: {
        type: Boolean,
        default: false,
    },
    fixTestedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for fast project-based monitor lookups
monitorSchema.index({ project: 1, isActive: 1 });
// Index for fast owner repo lookups (Git integrations)
monitorSchema.index({ "githubRepo.owner": 1, "githubRepo.repo": 1 });

export default mongoose.model('Monitor', monitorSchema);
