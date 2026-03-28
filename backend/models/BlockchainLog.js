import mongoose from 'mongoose';

/**
 * BlockchainLog - Simulated Blockchain Audit Trail
 * Stores cryptographic hashes of system events, logs, and actions.
 */
const blockchainLogSchema = new mongoose.Schema({
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    type: {
        type: String, // "latency", "error", "security", "deployment", "self-healing"
        required: true,
        index: true
    },
    monitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Monitor',
        required: false,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

export default mongoose.model('BlockchainLog', blockchainLogSchema);
