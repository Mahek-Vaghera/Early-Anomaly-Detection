const express = require('express');
const cors = require('cors');
const webhookRoutes = require('./routes/webhookRoutes');
const anomalyRoutes = require('./routes/anomalyRoutes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount API routes
app.use('/webhook', webhookRoutes);
app.use('/anomalies', anomalyRoutes);

// Root health/info route
app.get('/', (req, res) => {
  res.json({
    service: 'Financial Early Warning System Backend',
    status: 'UP',
    version: '1.0.0',
    endpoints: [
      'POST /webhook/aa-fetch',
      'GET /webhook/health',
      'GET /anomalies',
      'GET /anomalies/:userId'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

module.exports = app;
