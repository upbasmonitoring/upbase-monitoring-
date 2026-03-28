import ApiKey from '../models/ApiKey.js';
import Project from '../models/Project.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateRawKey, hashApiKey } from '../utils/apiKeyService.js';

/**
 * @desc    Generate a new API Key for a project
 * @route   POST /api/keys
 * @access  Private
 */
export const createApiKey = asyncHandler(async (req, res) => {
  const { projectId, name } = req.body;

  // 1. Verify project ownership
  const project = await Project.findOne({ _id: projectId, user: req.user._id });
  if (!project) {
    res.status(404);
    throw new Error('Project not found or unauthorized');
  }

  // 2. Generate and hash the unique key
  const rawKey = generateRawKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 10); // "monitr_xx"

  const apiKey = await ApiKey.create({
    user: req.user._id,
    project: projectId,
    name: name || 'Production SDK Key',
    keyHash,
    keyPrefix,
    isActive: true,
    permissions: ['ingest:write', 'github:read']
  });

  // 3. IMPORTANT: Return the RAW key ONLY ONCE
  res.status(201).json({
    ...apiKey.toObject(),
    key: rawKey // This is the only time the user will ever see it.
  });
});

/**
 * @desc    Get all API Keys for a project
 * @route   GET /api/keys/project/:projectId
 * @access  Private
 */
export const getProjectApiKeys = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Verify ownership
  const project = await Project.findOne({ _id: projectId, user: req.user._id });
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  const keys = await ApiKey.find({ project: projectId }).sort('-createdAt');
  res.json(keys);
});

/**
 * @desc    Revoke/Delete an API Key
 * @route   DELETE /api/keys/:id
 * @access  Private
 */
export const revokeApiKey = asyncHandler(async (req, res) => {
  const key = await ApiKey.findOne({ _id: req.params.id, user: req.user._id });

  if (!key) {
    res.status(404);
    throw new Error('API Key not found');
  }

  await key.deleteOne();
  res.json({ message: 'API Key revoked and purged from vault' });
});
