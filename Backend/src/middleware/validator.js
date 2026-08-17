function validateWebhookPayload(req, res, next) {
  const payload = req.body;

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ error: 'Request body must be a valid JSON object' });
  }

  const errors = [];

  // WebHookPayload validations
  if (!payload.consentId || typeof payload.consentId !== 'string' || !payload.consentId.trim()) {
    errors.push('consentId is required and cannot be blank');
  }

  if (!payload.userId || typeof payload.userId !== 'string' || !payload.userId.trim()) {
    errors.push('userId is required and cannot be blank');
  }

  if (!payload.fetchTimestamp || typeof payload.fetchTimestamp !== 'string' || !payload.fetchTimestamp.trim()) {
    errors.push('fetchTimestamp is required and cannot be blank');
  }

  if (!payload.bankName || typeof payload.bankName !== 'string' || !payload.bankName.trim()) {
    errors.push('bankName is required and cannot be blank');
  }

  if (!payload.transactions || !Array.isArray(payload.transactions) || payload.transactions.length === 0) {
    errors.push('transactions must be a non-empty array');
  } else {
    payload.transactions.forEach((txn, index) => {
      const prefix = `transactions[${index}]`;
      if (!txn || typeof txn !== 'object') {
        errors.push(`${prefix} must be a valid transaction object`);
        return;
      }

      if (!txn.transactionId || typeof txn.transactionId !== 'string' || !txn.transactionId.trim()) {
        errors.push(`${prefix}.transactionId is required`);
      }
      if (!txn.userId || typeof txn.userId !== 'string' || !txn.userId.trim()) {
        errors.push(`${prefix}.userId is required`);
      }
      if (!txn.accountId || typeof txn.accountId !== 'string' || !txn.accountId.trim()) {
        errors.push(`${prefix}.accountId is required`);
      }
      if (!txn.timestamp || typeof txn.timestamp !== 'string' || !txn.timestamp.trim()) {
        errors.push(`${prefix}.timestamp is required`);
      }
      if (txn.amount === undefined || txn.amount === null || typeof txn.amount !== 'number' || isNaN(txn.amount) || txn.amount <= 0) {
        errors.push(`${prefix}.amount must be a positive number`);
      }
      if (!txn.transactionType || typeof txn.transactionType !== 'string' || !txn.transactionType.trim()) {
        errors.push(`${prefix}.transactionType is required`);
      }
      if (!txn.narration || typeof txn.narration !== 'string' || !txn.narration.trim()) {
        errors.push(`${prefix}.narration is required`);
      }
      if (txn.balanceAfter === undefined || txn.balanceAfter === null || typeof txn.balanceAfter !== 'number' || isNaN(txn.balanceAfter)) {
        errors.push(`${prefix}.balanceAfter must be a number`);
      }
      if (!txn.bankName || typeof txn.bankName !== 'string' || !txn.bankName.trim()) {
        errors.push(`${prefix}.bankName is required`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
}

module.exports = {
  validateWebhookPayload,
};
