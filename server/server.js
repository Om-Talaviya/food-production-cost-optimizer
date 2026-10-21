const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { initializeDatabase, getDatabaseStatus, closeDatabase } = require('./utils/database');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// CORS configuration - restrictive in production, permissive in development
const corsOptions = isProduction
  ? {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }
  : { origin: true, credentials: true }; // Allow all origins in development

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint with storage diagnostic reporting
app.get('/health', async (req, res) => {
  const storage = await getDatabaseStatus();
  res.json({
    status: 'HEALTHY',
    service: 'Food Production Cost Optimizer Backend',
    storage,
    timestamp: new Date().toISOString()
  });
});

// Serve the production client build (client/dist) from the same origin as the API.
// In development the Vite dev server proxies /api to this backend, so this only
// kicks in when a built frontend exists (e.g. `cd client && npm run build`).
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));

  // SPA fallback: any non-API GET returns the client index.html so client-side
  // routes work when hosted from this single origin. Requests that look like
  // missing static assets (a path ending in a file extension) must return 404
  // instead of index.html: if a browser/edge still serves a stale index.html
  // that references an older build's hashed filenames, the browser would receive
  // HTML where it expects CSS/JS and the UI silently renders unstyled.
  app.get('*', (req, res) => {
    const lastSegment = req.path.split('/').pop() || '';
    const looksLikeAsset = /\.[a-z0-9]+$/i.test(lastSegment);
    if (looksLikeAsset) {
      return res.status(404).send('Not Found');
    }
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });

  console.log(`✅ Serving production client build from ${CLIENT_DIST}`);
} else {
  console.warn('⚠️ client/dist not found. Run `cd client && npm run build`, or use the Vite dev server for development.');
}

// Global Error Handler - sanitize errors in production
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  if (isProduction) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  } else {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  }
});

// Initialize DB & Start Server
initializeDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Food Production Cost Optimizer API Server Running`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================`);
  });

  const handleShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await closeDatabase();
      console.log('Database connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
});
