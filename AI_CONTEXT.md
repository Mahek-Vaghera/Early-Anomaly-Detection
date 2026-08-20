# AI Context Specification — Financial Early Warning System

> **Document Target**: Artificial Intelligence Assistants & LLM Coding Agents  
> **Purpose**: Provides a single-file, 100% comprehensive context map of the entire workspace, architecture, data schemas, code implementations, Kafka topic contracts, and operational execution flows.

---

## 1. Project High-Level Context

- **Project Name**: Financial Early Warning System (Credit Risk Anomaly Detection)
- **Domain**: BFSI (Banking, Financial Services, Insurance) / Fintech
- **Business Goal**: Early detection of borrower financial distress (30–90 days prior to loan default) using consent-based Account Aggregator bank statement transaction streams.
- **Key Anomaly Types**:
  - `JOB_LOSS_DISRUPT`: Salary credit drop with continuous debits.
  - `CREDIT_STACKING`: High EMI obligations relative to income (>60% EMI ratio).
  - `AMB_DRAINAGE`: >50% drop in 7-day Average Monthly Balance relative to 90-day baseline.
  - `FINANCIAL_DISTRESS`: General negative inflow/outflow balance trajectory.

---

## 2. Directory Structure & File Map

```text
d:\@Vatsal\Early-Anomaly-Detection\
│
├── README.md                      # Primary business & project introduction
├── AI_CONTEXT.md                  # Comprehensive AI context document (this file)
├── docker-compose.yml             # Orchestration for Postgres, Kafka, Zookeeper, Backend, ML-Inference
├── .env.example                   # Environment configuration template
├── schemas/
│   └── transaction.avsc           # Apache Avro schema for Account Aggregator transactions
├── data/
│   ├── features.csv               # Extracted feature dataset for ML model training
│   └── transactions_raw.csv.dvc   # DVC pointer for raw simulated transaction dataset
├── models/
│   └── pipeline.pkl.dvc           # DVC pointer for trained scikit-learn Isolation Forest pipeline
├── docs/
│   ├── architecture.md            # Detailed system design & pipeline specifications
│   ├── file_guide.md              # Exhaustive file-by-file directory reference
│   ├── deployment_guide.md        # Comprehensive deployment and operations manual
│   └── api_reference.md           # Specification for Node.js & Python REST APIs
├── Backend/                       # Node.js Express Microservice
│   ├── Dockerfile                 # Production Node.js 20 Alpine container build
│   ├── package.json               # Node.js dependencies (Express, KafkaJS, pg, Jest)
│   ├── .env.example               # Backend environment variable template
│   ├── tests/
│   │   ├── webhook.test.js        # Unit/Integration tests for Webhook ingestion
│   │   └── anomaly.test.js        # Unit/Integration tests for Anomaly REST queries
│   └── src/
│       ├── index.js               # Application entry point, server startup & workers
│       ├── app.js                 # Express app configuration & middleware
│       ├── config/
│       │   ├── db.js              # PostgreSQL pool connection & schema initializer
│       │   └── kafka.js           # KafkaJS client, producer & consumer instances
│       ├── controllers/
│       │   ├── webhookController.js # Ingests AA webhooks -> publishes to Kafka "transactions"
│       │   └── anomalyController.js # REST API GET /anomalies and /anomalies/:userId
│       ├── routes/
│       │   ├── webhookRoutes.js   # Route definitions for /webhook
│       │   └── anomalyRoutes.js   # Route definitions for /anomalies
│       ├── middleware/
│       │   └── validator.js       # Request validation for AA payload & transactions
│       ├── repository/
│       │   └── anomalyRepository.js # PostgreSQL data access layer for anomalies table
│       ├── consumer/
│       │   └── anomalyConsumer.js   # Subscribes to Kafka "anomalies" -> writes to Postgres
│       └── utils/
│           └── logger.js          # Formatted logging utility
└── ML-Pipeline/                    # Python FastAPI & ML Engine
    ├── Dockerfile                 # Python 3.10 deployment container
    ├── requirements.txt           # Dependency file (pandas, sklearn, mlflow, fastapi, confluent-kafka)
    ├── data_generator.py          # Generates synthetic 180-day banking transaction profiles
    ├── feature_engineering.py     # Extracts financial ratios (inflow/outflow, EMI ratio, AMB drop %)
    ├── train.py                   # Trains Isolation Forest, logs to MLflow, exports pipeline.pkl
    ├── kafka_producer_test.py     # Pushes simulated webhooks into Kafka topic "transactions"
    └── inference_service.py       # FastAPI server & Kafka consumer thread running real-time ML inference
```

---

## 3. Data Contracts & Kafka Topics

### Kafka Topics

1. **`transactions`**:
   - **Producer**: Node.js Express `webhookController.js` or Python test scripts.
   - **Consumer**: Python `inference_service.py` background consumer thread (`group.id = ml-inference-group`).
   - **Key**: `userId` (String).
   - **Value**: JSON Object matching `WebHookPayload` schema (`consentId`, `userId`, `fetchTimestamp`, `bankName`, `transactions[]`).

2. **`anomalies`**:
   - **Producer**: Python `inference_service.py`.
   - **Consumer**: Node.js `anomalyConsumer.js` (`groupId = java-anomaly-writer` / `node-anomaly-writer`).
   - **Key**: `userId` (String).
   - **Value**: JSON Object matching `AnomalyResult` schema:
     ```json
     {
       "userId": "USER_ANOM_JL",
       "anomalyType": "JOB_LOSS_DISRUPT",
       "anomalyScore": 0.1845,
       "ratioInflowOutflow": 0.1624,
       "emiToIncomeRatio": 0.8521,
       "ambDropPercentage": 0.3412,
       "transactionCount": 142,
       "detectedAt": "2026-08-04T02:00:00"
     }
     ```

---

## 4. Machine Learning & Feature Engineering Logic

### Feature Calculations (`feature_engineering.py` & `inference_service.py`)
1. **`ratio_inflow_outflow`**: Total credit transactions divided by total debit transactions.
2. **`emi_to_income_ratio`**: Debits containing "EMI" in narration divided by average monthly "SALARY" credit.
3. **`amb_drop_percentage`**: $(\text{AMB}_{90d} - \text{AMB}_{7d}) / \text{AMB}_{90d}$.

### Model Architecture (`train.py`)
- **Pipeline**: `StandardScaler()` $\rightarrow$ `IsolationForest(contamination=0.05, n_estimators=100, random_state=42)`.
- **Outputs**: `prediction` (-1 = Anomaly, 1 = Normal), `anomaly_score` (inverted decision function sample score).
- **MLflow Experiment**: `bfsi-anomaly-detection`.

---

## 5. Microservice Ports & Infrastructure

| Service Name | Container / Host Port | Purpose |
| :--- | :--- | :--- |
| **Node.js Express Backend** | `8080` | Webhook ingestion & Anomaly Query REST API |
| **Python ML Inference**| `8000` | FastAPI server & real-time streaming ML worker |
| **Apache Kafka** | `9092` (host) / `29092` (docker) | Message streaming broker |
| **ZooKeeper** | `2181` | Kafka cluster coordination |
| **Schema Registry** | `8081` | Confluent Avro schema registry |
| **PostgreSQL** | `5433` (host) / `5432` (docker) | Database for `creditrisk` (`anomalies` table) |
| **MLflow UI** | `5000` | Experiment tracking dashboard |

---

## 6. Execution Commands Cheat Sheet

### Run Full Stack (Docker Compose)
```bash
docker-compose up --build -d
```

### Run Synthetic Pipeline (Local Python Environment)
```bash
cd ML-Pipeline
python data_generator.py      # Output -> data/transactions_raw.csv
python feature_engineering.py # Output -> data/features.csv
python train.py                # Output -> models/pipeline.pkl & MLflow experiment
python inference_service.py    # Starts FastAPI on 8000 & Kafka consumer thread
```

### Run Node.js Backend (Local Environment)
```bash
cd Backend
npm install
npm start
```

### Run Webhook Simulation
```bash
cd ML-Pipeline
python kafka_producer_test.py
```

### Query Database via Node.js REST API
```bash
curl -X GET http://localhost:8080/anomalies
```