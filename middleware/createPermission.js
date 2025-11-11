export const checkRoleCreatePermission = (req, res, next) => {
  const creator = req.user.role;
  const target = req.body.role?.toLowerCase();

  const permissions = {
    master_admin: ['super_admin', 'admin', 'super_agent', 'agent'],
    super_admin: ['admin', 'super_agent', 'agent'],
    admin: ['super_agent', 'agent'],
    super_agent: ['agent'],
    agent: []
  };

  if (!permissions[creator]?.includes(target)) {
    return res.status(403).json({
      error: `You (${creator}) cannot create role: ${target}`
    });
  }

  next();
};
