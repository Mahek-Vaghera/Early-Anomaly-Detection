const request = require('supertest');
const app = require('../src/app');
const anomalyRepository = require('../src/repository/anomalyRepository');

jest.mock('../src/repository/anomalyRepository');

describe('Anomaly API Endpoints', () => {
  const mockAnomalies = [
    {
      id: 1,
      userId: 'USER_ANOM_JL',
      anomalyType: 'JOB_LOSS_DISRUPT',
      anomalyScore: 0.1845,
      ratioInflowOutflow: 0.1624,
      emiToIncomeRatio: 0.8521,
      ambDropPercentage: 0.3412,
      transactionCount: 142,
      detectedAt: '2026-08-04T02:00:00.000Z',
    },
    {
      id: 2,
      userId: 'USER_ANOM_CS',
      anomalyType: 'CREDIT_STACKING',
      anomalyScore: 0.2105,
      ratioInflowOutflow: 0.4512,
      emiToIncomeRatio: 0.7812,
      ambDropPercentage: 0.1205,
      transactionCount: 98,
      detectedAt: '2026-08-04T02:05:00.000Z',
    },
  ];

  describe('GET /anomalies', () => {
    it('should return all anomalies from repository', async () => {
      anomalyRepository.findAll.mockResolvedValueOnce(mockAnomalies);

      const res = await request(app).get('/anomalies');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockAnomalies);
      expect(anomalyRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return 500 when database query fails', async () => {
      anomalyRepository.findAll.mockRejectedValueOnce(new Error('DB Connection Refused'));

      const res = await request(app).get('/anomalies');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to retrieve anomalies from database');
    });
  });

  describe('GET /anomalies/:userId', () => {
    it('should return anomalies for specific user', async () => {
      const userAnomalies = [mockAnomalies[0]];
      anomalyRepository.findByUserId.mockResolvedValueOnce(userAnomalies);

      const res = await request(app).get('/anomalies/USER_ANOM_JL');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(userAnomalies);
      expect(anomalyRepository.findByUserId).toHaveBeenCalledWith('USER_ANOM_JL');
    });

    it('should return 500 when query fails for user', async () => {
      anomalyRepository.findByUserId.mockRejectedValueOnce(new Error('Query Timeout'));

      const res = await request(app).get('/anomalies/USER_ANOM_JL');
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Failed to retrieve anomalies for user USER_ANOM_JL');
    });
  });
});
