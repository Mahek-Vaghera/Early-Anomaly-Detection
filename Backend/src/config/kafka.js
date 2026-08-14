const { Kafka, logLevel } = require('kafkajs');
const logger = require('../utils/logger');

const brokers = (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(',');
const clientId = process.env.KAFKA_CLIENT_ID || 'early-anomaly-backend';
const groupId = process.env.KAFKA_CONSUMER_GROUP || 'java-anomaly-writer'; // Backward compatible with java-anomaly-writer

const kafka = new Kafka({
  clientId,
  brokers,
  logLevel: logLevel.NOTHING,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  }
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId });

let producerConnected = false;

async function connectProducer() {
  if (producerConnected) return;
  try {
    await producer.connect();
    producerConnected = true;
    logger.info(`Kafka producer connected successfully to brokers: ${brokers.join(', ')}`);
  } catch (err) {
    logger.warn(`Kafka producer connection failed: ${err.message}. Messages will retry.`);
  }
}

async function sendTransactionPayload(topic, key, payload) {
  if (!producerConnected) {
    await connectProducer();
  }
  return await producer.send({
    topic,
    messages: [
      {
        key: String(key),
        value: JSON.stringify(payload),
      },
    ],
  });
}

module.exports = {
  kafka,
  producer,
  consumer,
  connectProducer,
  sendTransactionPayload,
  groupId,
  brokers,
};
