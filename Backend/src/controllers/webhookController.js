const { sendTransactionPayload } = require('../config/kafka');
const logger = require('../utils/logger');

const TOPIC = 'transactions';

async function receiveWebhook(req, res) {
  const payload = req.body;

  logger.info(`Received webhook for userId=${payload.userId} with ${payload.transactions.length} transactions`);

  try {
    await sendTransactionPayload(TOPIC, payload.userId, payload);
    logger.info(`Pushed to Kafka topic '${TOPIC}' for userId=${payload.userId}`);

    return res.status(200).json({
      status: 'queued',
      userId: payload.userId,
      transactionCount: payload.transactions.length,
    });
  } catch (err) {
    logger.error(`Failed to publish message to Kafka topic '${TOPIC}' for userId=${payload.userId}:`, err);
    return res.status(500).json({
      error: 'Failed to queue transaction payload onto Kafka',
      message: err.message,
    });
  }
}

function health(req, res) {
  return res.status(200).json({ status: 'UP' });
}

module.exports = {
  receiveWebhook,
  health,
};
