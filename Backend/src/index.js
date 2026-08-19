require('dotenv').config();

const app = require('./app');
const { initDb, pool } = require('./config/db');
const { connectProducer, producer, consumer } = require('./config/kafka');
const { startAnomalyConsumer } = require('./consumer/anomalyConsumer');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '8080', 10);

async function startServer() {
  logger.info(`Starting Financial Early Warning System Backend on port ${PORT}...`);

  // Initialize Database Schema
  await initDb();

  // Connect Kafka Producer
  await connectProducer();

  // Start Kafka Anomaly Consumer in background
  startAnomalyConsumer().catch((err) => {
    logger.error('Failed to initialize anomaly consumer:', err);
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Backend service running and listening on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await producer.disconnect();
        logger.info('Kafka producer disconnected.');
      } catch (e) {
        // ignore
      }
      try {
        await consumer.disconnect();
        logger.info('Kafka consumer disconnected.');
      } catch (e) {
        // ignore
      }
      try {
        await pool.end();
        logger.info('PostgreSQL pool closed.');
      } catch (e) {
        // ignore
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  logger.error('Fatal error starting server:', err);
  process.exit(1);
});
