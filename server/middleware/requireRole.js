function requireRole(allowedRoles) {
  return function (req, res, next) {
    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to do this" });
    }
    next();
  };
}

module.exports = requireRole;
