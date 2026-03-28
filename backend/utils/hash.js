import crypto from "node:crypto";

/**
 * Generates a SHA256 hash for any data object
 * used for blockchain audit verification.
 */
export function generateHash(data) {
    if (!data) return null;
    try {
        const str = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto
            .createHash("sha256")
            .update(str)
            .digest("hex");
    } catch (err) {
        console.error("[HASH ERROR]", err.message);
        return null;
    }
}
