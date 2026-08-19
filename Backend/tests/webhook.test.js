const request = require('supertest');
const app = require('../src/app');

// Mock Kafka producer to avoid needing a live broker during unit tests
jest.mock('../src/config/kafka', () => {
  return {
    kafka: {},
    producer: {
      connect: jest.fn().mockResolvedValue(),
      send: jest.fn().mockResolvedValue([{ topicName: 'transactions', partition: 0, offset: '0' }]),
      disconnect: jest.fn().mockResolvedValue(),
    },
    consumer: {
      connect: jest.fn().mockResolvedValue(),
      subscribe: jest.fn().mockResolvedValue(),
      run: jest.fn().mockResolvedValue(),
      disconnect: jest.fn().mockResolvedValue(),
    },
    connectProducer: jest.fn().mockResolvedValue(),
    sendTransactionPayload: jest.fn().mockResolvedValue([{ topicName: 'transactions', partition: 0, offset: '0' }]),
    groupId: 'test-group',
    brokers: ['localhost:9092'],
  };
});

describe('Webhook API Endpoints', () => {
  describe('GET /webhook/health', () => {
    it('should return 200 OK with status UP', async () => {
      const res = await request(app).get('/webhook/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'UP' });
    });
  });

  describe('POST /webhook/aa-fetch', () => {
    const validPayload = {
      consentId: 'CONSENT-9901',
      userId: 'USER_ANOM_JL',
      fetchTimestamp: '2026-08-12T02:00:00',
      bankName: 'HDFC',
      transactions: [
        {
          transactionId: 'TXN-001',
          userId: 'USER_ANOM_JL',
          accountId: 'ACC-8812',
          timestamp: '2026-08-01T10:00:00',
          amount: 15000.0,
          transactionType: 'DEBIT',
          narration: 'EMI PAYMENT HDFC LOAN',
          balanceAfter: 12000.0,
          bankName: 'HDFC',
        },
      ],
    };

    it('should accept a valid AA webhook payload and queue to Kafka', async () => {
      const res = await request(app)
        .post('/webhook/aa-fetch')
        .send(validPayload);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'queued',
        userId: 'USER_ANOM_JL',
        transactionCount: 1,
      });
    });

    it('should reject when consentId is missing', async () => {
      const invalidPayload = { ...validPayload, consentId: '' };
      const res = await request(app)
        .post('/webhook/aa-fetch')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toContain('consentId is required and cannot be blank');
    });

    it('should reject when transactions array is empty', async () => {
      const invalidPayload = { ...validPayload, transactions: [] };
      const res = await request(app)
        .post('/webhook/aa-fetch')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toContain('transactions must be a non-empty array');
    });

    it('should reject when transaction amount is non-positive or invalid', async () => {
      const invalidPayload = {
        ...validPayload,
        transactions: [
          {
            ...validPayload.transactions[0],
            amount: -50,
          },
        ],
      };
      const res = await request(app)
        .post('/webhook/aa-fetch')
        .send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toContain('transactions[0].amount must be a positive number');
    });
  });
});
