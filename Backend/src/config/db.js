const { Pool } = require('pg');
const logger = require('../utils/logger');

function getDbConfig() {
  // Support DATABASE_URL or SPRING_DATASOURCE_URL (for compatibility)
  const connectionString = process.env.DATABASE_URL || 
    (process.env.SPRING_DATASOURCE_URL ? process.env.SPRING_DATASOURCE_URL.replace(/^jdbc:/, '') : null);

  if (connectionString) {
    return {
      connectionString,
      user: process.env.POSTGRES_USER || process.env.SPRING_DATASOURCE_USERNAME,
      password: process.env.POSTGRES_PASSWORD || process.env.SPRING_DATASOURCE_PASSWORD,
    };
  }

  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
    database: process.env.POSTGRES_DB || 'creditrisk',
    user: process.env.POSTGRES_USER || process.env.SPRING_DATASOURCE_USERNAME || 'admin',
    password: process.env.POSTGRES_PASSWORD || process.env.SPRING_DATASOURCE_PASSWORD || 'admin123',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(getDbConfig());

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

async function initDb() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS anomalies (
      id BIGSERIAL PRIMARY KEY,
      user_id VARCHAR(255),
      anomaly_type VARCHAR(255),
      anomaly_score DOUBLE PRECISION,
      ratio_inflow_outflow DOUBLE PRECISION,
      emi_to_income_ratio DOUBLE PRECISION,
      amb_drop_percentage DOUBLE PRECISION,
      transaction_count INTEGER,
      detected_at TIMESTAMP
    );
  `;
  try {
    const client = await pool.connect();
    try {
      await client.query(createTableQuery);
      logger.info('Database schema verified: table "anomalies" is ready.');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn(`Database connection/initialization warning: ${err.message}. Will retry on next query.`);
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDb,
};
