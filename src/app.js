const path = require('path');
const express = require('express');
const sessionMiddleware = require('./config/session');
const routes = require('./routes');

const app = express();

// Render (and most PaaS hosts) sit behind a reverse proxy that terminates
// TLS. Trusting the first proxy hop lets Express read X-Forwarded-* headers
// correctly, which express-session relies on for secure cookies.
app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(sessionMiddleware);

app.use('/', routes);

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).send('Page not found');
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  if (req.path.startsWith('/api') || req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({ error: err.message || 'Internal server error' });
  }
  res.status(status).send('Something went wrong.');
});

module.exports = app;
