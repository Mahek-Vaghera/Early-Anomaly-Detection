const anomalyRepository = require('../repository/anomalyRepository');
const logger = require('../utils/logger');

async function getAllAnomalies(req, res) {
  try {
    const anomalies = await anomalyRepository.findAll();
    return res.status(200).json(anomalies);
  } catch (err) {
    logger.error('Failed to fetch all anomalies:', err);
    return res.status(500).json({
      error: 'Failed to retrieve anomalies from database',
      message: err.message,
    });
  }
}

async function getByUser(req, res) {
  const { userId } = req.params;
  try {
    const anomalies = await anomalyRepository.findByUserId(userId);
    return res.status(200).json(anomalies);
  } catch (err) {
    logger.error(`Failed to fetch anomalies for userId=${userId}:`, err);
    return res.status(500).json({
      error: `Failed to retrieve anomalies for user ${userId}`,
      message: err.message,
    });
  }
}

module.exports = {
  getAllAnomalies,
  getByUser,
};
