const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = require('./db');

const sessionMiddleware = session({
  store: new pgSession({ pool, tableName: 'session', createTableIfMissing: true }),
  name: 'spts.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 30, // 30 minute session timeout
  },
});

module.exports = sessionMiddleware;
