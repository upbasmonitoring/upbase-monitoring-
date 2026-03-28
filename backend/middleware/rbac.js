import TeamMember from '../models/TeamMember.js';

const PERMISSIONS = {
  owner: ['*'],
  admin: [
    'project:read', 'project:update', 'team:invite', 'team:remove',
    'alerts:manage', 'errors:resolve', 'settings:manage', 'github:manage'
  ],
  developer: [
    'project:read', 'alerts:manage', 'errors:resolve', 'settings:view'
  ],
  viewer: [
    'project:read', 'settings:view'
  ],
};

/**
 * Middleware to check if a user has a specific permission for a project
 * Assumes req.project._id is already set (e.g. by API key auth or URL param)
 * @param {string} permission - The permission to check
 */
export function requirePermission(permission) {
  return async (req, res, next) => {
    // If we're using an API key, we check the API key's own permissions list
    if (req.apiKey) {
      const hasPermission = req.apiKey.permissions.includes('*') || req.apiKey.permissions.includes(permission);
      if (!hasPermission) {
        return res.status(403).json({ error: `API Key requires ${permission} permission` });
      }
      return next();
    }

    // Otherwise, check the user's role in the project
    const projectId = req.project?._id || req.params.projectId || req.query.projectId;

    if (!projectId) {
      return res.status(400).json({ error: 'Project context is missing' });
    }

    try {
      const member = await TeamMember.findOne({
        project: projectId,
        user: req.user._id,
        status: 'active',
      });

      if (!member) {
        return res.status(403).json({ error: 'You are not a member of this project' });
      }

      const permissions = PERMISSIONS[member.role] || [];
      const hasPermission = permissions.includes('*') || permissions.includes(permission);

      if (!hasPermission) {
        return res.status(403).json({ error: `Requires ${permission} permission` });
      }

      req.member = member;
      next();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}
