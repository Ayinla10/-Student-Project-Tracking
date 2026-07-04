// Protects admin routes. Redirects browser navigations to the login page,
// but responds with JSON 401 for XHR/fetch calls made from the dashboard.
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.redirect('/admin/login');
}

module.exports = { requireAdmin };
