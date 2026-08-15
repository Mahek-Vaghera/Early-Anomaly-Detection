const db = require('../config/db');

function mapRowToEntity(row) {
  if (!row) return null;
  return {
    id: parseInt(row.id, 10),
    userId: row.user_id,
    anomalyType: row.anomaly_type,
    anomalyScore: row.anomaly_score !== null ? parseFloat(row.anomaly_score) : null,
    ratioInflowOutflow: row.ratio_inflow_outflow !== null ? parseFloat(row.ratio_inflow_outflow) : null,
    emiToIncomeRatio: row.emi_to_income_ratio !== null ? parseFloat(row.emi_to_income_ratio) : null,
    ambDropPercentage: row.amb_drop_percentage !== null ? parseFloat(row.amb_drop_percentage) : null,
    transactionCount: row.transaction_count !== null ? parseInt(row.transaction_count, 10) : null,
    detectedAt: row.detected_at instanceof Date ? row.detected_at.toISOString() : row.detected_at,
  };
}

class AnomalyRepository {
  async findAll() {
    const query = `
      SELECT id, user_id, anomaly_type, anomaly_score,
             ratio_inflow_outflow, emi_to_income_ratio, amb_drop_percentage,
             transaction_count, detected_at
      FROM anomalies
      ORDER BY id ASC;
    `;
    const result = await db.query(query);
    return result.rows.map(mapRowToEntity);
  }

  async findByUserId(userId) {
    const query = `
      SELECT id, user_id, anomaly_type, anomaly_score,
             ratio_inflow_outflow, emi_to_income_ratio, amb_drop_percentage,
             transaction_count, detected_at
      FROM anomalies
      WHERE user_id = $1
      ORDER BY id ASC;
    `;
    const result = await db.query(query, [userId]);
    return result.rows.map(mapRowToEntity);
  }

  async save(anomaly) {
    const query = `
      INSERT INTO anomalies (
        user_id, anomaly_type, anomaly_score,
        ratio_inflow_outflow, emi_to_income_ratio, amb_drop_percentage,
        transaction_count, detected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const detectedAt = anomaly.detectedAt ? new Date(anomaly.detectedAt) : new Date();
    const values = [
      anomaly.userId,
      anomaly.anomalyType,
      anomaly.anomalyScore,
      anomaly.ratioInflowOutflow,
      anomaly.emiToIncomeRatio,
      anomaly.ambDropPercentage,
      anomaly.transactionCount,
      detectedAt,
    ];
    const result = await db.query(query, values);
    return mapRowToEntity(result.rows[0]);
  }
}

module.exports = new AnomalyRepository();
