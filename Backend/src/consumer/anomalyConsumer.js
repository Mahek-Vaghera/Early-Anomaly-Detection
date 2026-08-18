const { consumer } = require('../config/kafka');
const anomalyRepository = require('../repository/anomalyRepository');
const logger = require('../utils/logger');

const TOPIC = 'anomalies';

async function startAnomalyConsumer() {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
    logger.info(`Kafka consumer subscribed to topic '${TOPIC}'`);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawValue = message.value.toString();
          const result = JSON.parse(rawValue);

          logger.info(`Received anomaly result for userId=${result.userId} type=${result.anomalyType}`);

          await anomalyRepository.save({
            userId: result.userId,
            anomalyType: result.anomalyType,
            anomalyScore: result.anomalyScore,
            ratioInflowOutflow: result.ratioInflowOutflow,
            emiToIncomeRatio: result.emiToIncomeRatio,
            ambDropPercentage: result.ambDropPercentage,
            transactionCount: result.transactionCount,
            detectedAt: result.detectedAt || new Date().toISOString(),
          });

          logger.info(`Anomaly saved to PostgreSQL for userId=${result.userId}`);
        } catch (err) {
          logger.error(`Error processing message from topic '${topic}':`, err);
        }
      },
    });
  } catch (err) {
    logger.warn(`Kafka consumer failed to start: ${err.message}. Retrying in 10 seconds...`);
    setTimeout(startAnomalyConsumer, 10000);
  }
}

module.exports = {
  startAnomalyConsumer,
};
