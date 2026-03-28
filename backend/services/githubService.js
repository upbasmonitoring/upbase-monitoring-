import axios from 'axios';

/**
 * Ralph GitHub Service: Repository Interaction Layer
 * Handles branching, diffing, and committing automated fixes.
 */
export const getCommitDiff = async (token, owner, repo, sha) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3.diff' // Explicitly request unified diff
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error(`[GITHUB-SERVICE] ❌ Failed to fetch diff for ${sha}: ${err.message}`);
        return null;
    }
};

export const createBranch = async (token, owner, repo, baseBranch, newBranch) => {
    try {
        // Step 1: Get latest SHA from base branch
        const baseRef = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        const baseSha = baseRef.data.object.sha;

        // Step 2: Create a new ref (branch) from that SHA
        await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/git/refs`,
            {
                ref: `refs/heads/${newBranch}`,
                sha: baseSha
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        console.log(`[GITHUB-SERVICE] ✅ Branch created: ${newBranch}`);
        return true;
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        if (errorMsg.includes('already exists')) {
            console.log(`[GITHUB-SERVICE] ℹ️ Branch ${newBranch} already exists. Proceeding.`);
            return true;
        }
        console.error(`[GITHUB-SERVICE] ❌ Failed to create branch ${newBranch}: ${errorMsg}`);
        return false;
    }
};

/**
 * Commits and pushes changes by updating a file in a branch.
 * Simplifies the "commitChanges + pushChanges" step as per REST API docs.
 */
export const pushCommit = async (token, owner, repo, branch, path, content, message) => {
    try {
        // Step 1: Get file's current SHA in the branch
        const fileRes = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        const fileSha = fileRes.data.sha;

        // Step 2: Update (PUT) file with new content
        const updateRes = await axios.put(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
            {
                message: message,
                content: Buffer.from(content).toString('base64'),
                sha: fileSha,
                branch: branch
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );

        console.log(`[GITHUB-SERVICE] ✅ Commit pushed to ${branch}`);
        return updateRes.data.commit.sha;
    } catch (err) {
        console.error(`[GITHUB-SERVICE] ❌ Failed to push commit: ${err.message}`);
        return null;
    }
};

/**
 * Fetches the current content of a file from GitHub (decoded)
 */
export const getFileContent = async (token, owner, repo, branch, path) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        // GitHub sends content in base64
        return Buffer.from(response.data.content, 'base64').toString('utf8');
    } catch (err) {
        console.warn(`[GITHUB-SERVICE] ⚠️ File not found or inaccessible: ${path}`);
        return null;
    }
};

/**
 * Merges a branch (head) into another branch (base)
 */
export const mergeBranch = async (token, owner, repo, base, head, message) => {
    try {
        const response = await axios.post(
            `https://api.github.com/repos/${owner}/${repo}/merges`,
            {
                base: base,
                head: head,
                commit_message: message
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        return response.status === 201 || response.status === 204;
    } catch (err) {
        console.error(`[GITHUB-SERVICE] ❌ Failed to merge branch: ${err.message}`);
        return false;
    }
};

/**
 * Reset a branch to a specific SHA (Hard Rollback)
 */
export const rollbackBranch = async (token, owner, repo, branch, sha) => {
    try {
        const response = await axios.patch(
            `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
            {
                sha: sha,
                force: true
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            }
        );
        return response.status === 200;
    } catch (err) {
        console.error(`[GITHUB-SERVICE] ❌ Rollback failed: ${err.message}`);
        return false;
    }
};

/**
 * Helper to identify failing file path from error context (minimal heuristic)
 */
export const guessFailingFilePath = (error) => {
    if (!error) return null;
    
    // Example regex for picking up file paths from error strings or stack traces
    const pathMatch = error.match(/([\w.-]+\.(js|ts|jsx|tsx))/i);
    if (pathMatch) return pathMatch[0];

    // Fallback: Default to index.js if unknown (most likely backend starting point)
    return 'index.js';
};
