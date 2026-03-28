import { Worker, Queue } from 'bullmq';
import axios from 'axios';
import redis from '../config/redis.js';
import Project from '../models/Project.js';
import SecurityAudit from '../models/SecurityAudit.js';

import { getRedisStatus } from '../config/redis.js';

export const scanQueue = !getRedisStatus().isMock ? new Queue('vulnerability-scan', { connection: redis }) : null;

let worker = null;
if (!getRedisStatus().isMock) {
    worker = new Worker('vulnerability-scan', async (job) => {
      const { projectId } = job.data;
      const project = await Project.findById(projectId);
      if (!project || !project.githubRepo) return;

      const { githubOwner, githubRepo } = project;
      const githubToken = process.env.GITHUB_TOKEN;

      try {
        console.log(`[SCANNER] Starting Deep Scan for ${githubOwner}/${githubRepo}...`);

        const pkgUrl = `https://api.github.com/repos/${githubOwner}/${githubRepo}/contents/package.json`;
        const pkgRes = await axios.get(pkgUrl, {
          headers: githubToken ? { 'Authorization': `token ${githubToken}` } : {},
        });
        
        const content = Buffer.from(pkgRes.data.content, 'base64').toString();
        const pkg = JSON.parse(content);

        const vulnerabilities = [];
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        for (const [name, version] of Object.entries(deps)) {
          if (name === 'express' && version.includes('4.16')) vulnerabilities.push({ name, version, severity: 'medium', message: 'Old Express version' });
          if (name === 'lodash' && version.includes('4.17.15')) vulnerabilities.push({ name, version, severity: 'high', message: 'Prototype Pollution vulnerability' });
        }

        const findings = [];
        if (vulnerabilities.length > 0) {
          findings.push({
            type: 'vulnerability',
            details: vulnerabilities,
            score: Math.max(0, 100 - vulnerabilities.length * 20),
          });
        }

        await SecurityAudit.create({
          project: project._id,
          type: 'deep_scan',
          findings: findings,
          score: findings.reduce((acc, f) => acc - (100 - f.score), 100),
          status: findings.length > 0 ? 'failed' : 'passed',
          timestamp: new Date(),
        });

        console.log(`[SCANNER] Finished Deep Scan for ${githubOwner}/${githubRepo}. Findings: ${findings.length}`);
      } catch (err) {
        console.error(`[SCANNER-ERROR] Deep scan failed for ${projectId}:`, err.message);
      }
    }, { connection: redis });
}

export default worker;
