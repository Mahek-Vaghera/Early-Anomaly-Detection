# Comprehensive File-by-File Guide

This document provides a line-by-line inventory and functional guide for every file in the **Financial Early Warning System** repository.

---

## Directory Overview

```text
Early-Anomaly-Detection/
├── .env.example
├── docker-compose.yml
├── README.md
├── AI_CONTEXT.md
├── schemas/
│   └── transaction.avsc
├── data/
│   ├── .gitignore
│   ├── features.csv
│   └── transactions_raw.csv.dvc
├── models/
│   ├── .gitignore
│   └── pipeline.pkl.dvc
├── Backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example
│   ├── tests/
│   │   ├── webhook.test.js
│   │   └── anomaly.test.js
│   └── src/
│       ├── index.js
│       ├── app.js
│       ├── config/
│       │   ├── db.js
│       │   └── kafka.js
│       ├── controllers/
│       │   ├── webhookController.js
│       │   └── anomalyController.js
│       ├── routes/
│       │   ├── webhookRoutes.js
│       │   └── anomalyRoutes.js
│       ├── middleware/
│       │   └── validator.js
│       ├── repository/
│       │   └── anomalyRepository.js
│       ├── consumer/
│       │   └── anomalyConsumer.js
│       └── utils/
│           └── logger.js
└── ML-Pipeline/
    ├── Dockerfile
    ├── requirements.txt
    ├── data_generator.py
    ├── feature_engineering.py
    ├── train.py
    ├── kafka_producer_test.py
    └── inference_service.py
```

---

## Root Level Files

### 1. [docker-compose.yml](file:///d:/@Vatsal/Early-Anomaly-Detection/docker-compose.yml)
- **Why it exists**: Orchestrates all infrastructure services (ZooKeeper, Kafka, Schema Registry, PostgreSQL) and application microservices (`backend` Node.js Express app and `ml-inference` Python FastAPI service) using Docker.
- **What it does**:
  - `zookeeper`: Manages Kafka cluster state.
  - `kafka`: Event broker handling `transactions` and `anomalies` topics.
  - `schema-registry`: Stores Avro schemas for message serialization.
  - `postgres`: Relational database storing persistent anomaly flags and user scores on port `5433:5432`.
  - `backend`: Node.js Express Webhook API and DB Consumer.
  - `ml-inference`: FastAPI server & real-time streaming ML engine.

### 2. [.env.example](file:///d:/@Vatsal/Early-Anomaly-Detection/.env.example)
- **Why it exists**: Defines environment variable defaults for database credentials, ports, and Kafka broker URLs.
- **What it does**: Provides a copy-paste template for deployment environments.

### 3. [README.md](file:///d:/@Vatsal/Early-Anomaly-Detection/README.md)
- **Why it exists**: Main project documentation covering business context, value proposition, BFSI early warning use case, architecture overview, tech stack, and setup steps.

### 4. [AI_CONTEXT.md](file:///d:/@Vatsal/Early-Anomaly-Detection/AI_CONTEXT.md)
- **Why it exists**: Optimized single-file context document for AI coding assistants and LLMs to understand the codebase structure, APIs, schemas, and design patterns instantly.

---

## Schema & Data Management (`schemas/`, `data/`, `models/`)

### 5. [schemas/transaction.avsc](file:///d:/@Vatsal/Early-Anomaly-Detection/schemas/transaction.avsc)
- **Why it exists**: Apache Avro schema defining the standardized format for Account Aggregator transaction events.
- **Key Fields**: `transaction_id`, `user_id`, `account_id`, `timestamp`, `amount`, `transaction_type` (CREDIT/DEBIT), `narration`, `balance_after`, `bank_name`.

### 6. [data/features.csv](file:///d:/@Vatsal/Early-Anomaly-Detection/data/features.csv)
- **Why it exists**: Extracted training features generated from historical raw transactions.
- **Columns**: `user_id`, `ratio_inflow_outflow`, `emi_to_income_ratio`, `amb_drop_percentage`.

### 7. [data/transactions_raw.csv.dvc](file:///d:/@Vatsal/Early-Anomaly-Detection/data/transactions_raw.csv.dvc) & [models/pipeline.pkl.dvc](file:///d:/@Vatsal/Early-Anomaly-Detection/models/pipeline.pkl.dvc)
- **Why it exists**: DVC (Data Version Control) pointer files tracking large datasets and binary ML pipeline models without committing them directly into Git.

---

## Node.js Backend Microservice (`Backend/`)

### 8. [Backend/package.json](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/package.json)
- **Why it exists**: Node.js project manifest and dependency specification (Express, KafkaJS, `pg`, CORS, Jest, Supertest).

### 9. [Backend/Dockerfile](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/Dockerfile)
- **Why it exists**: Production Node.js 20 Alpine container image definition.

### 10. [Backend/src/index.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/index.js)
- **Why it exists**: Server initialization and entry point. Connects to PostgreSQL, initializes schema, connects Kafka producer, and launches the Kafka anomaly consumer.

### 11. [Backend/src/app.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/app.js)
- **Why it exists**: Express application setup configuring JSON middleware, CORS, route mounting, and centralized error handling.

### 12. [Backend/src/controllers/webhookController.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/controllers/webhookController.js)
- **Why it exists**: REST Controller handling incoming financial transaction webhooks from Account Aggregators.
- **Endpoints**:
  - `POST /webhook/aa-fetch`: Validates incoming payload and publishes it asynchronously to Kafka topic `transactions`.
  - `GET /webhook/health`: Health check endpoint.

### 13. [Backend/src/controllers/anomalyController.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/controllers/anomalyController.js)
- **Why it exists**: REST Controller serving detected financial anomalies to internal risk dashboards or underwriting teams.
- **Endpoints**:
  - `GET /anomalies`: Returns all detected anomalies recorded in PostgreSQL.
  - `GET /anomalies/:userId`: Returns detected anomaly history for a specific borrower/user.

### 14. [Backend/src/config/kafka.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/config/kafka.js)
- **Why it exists**: KafkaJS client configuration managing message publishing to the `transactions` topic.

### 15. [Backend/src/consumer/anomalyConsumer.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/consumer/anomalyConsumer.js)
- **Why it exists**: Kafka event listener subscribing to the `anomalies` topic (`groupId = "java-anomaly-writer"` / `"node-anomaly-writer"`).
- **Functionality**: Receives `AnomalyResult` objects emitted by the ML Inference Service and persists them into PostgreSQL via `anomalyRepository`.

### 16. [Backend/src/repository/anomalyRepository.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/repository/anomalyRepository.js)
- **Why it exists**: Data access layer executing PostgreSQL queries against the `anomalies` table (`findAll`, `findByUserId`, `save`).

### 17. [Backend/src/middleware/validator.js](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/src/middleware/validator.js)
- **Why it exists**: Express middleware verifying request payload schema and field-level constraints.

### 18. [Backend/tests/](file:///d:/@Vatsal/Early-Anomaly-Detection/Backend/tests/)
- **Why it exists**: Automated Jest test suites verifying REST API endpoints, payload validation rules, and error handling.

---

## Python ML & Streaming Pipeline (`ML-Pipeline/`)

### 17. [ML-Pipeline/requirements.txt](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/requirements.txt)
- **Why it exists**: Lists Python package requirements (`pandas`, `numpy`, `scikit-learn`, `mlflow`, `fastapi`, `uvicorn`, `confluent-kafka`, `pydantic`).

### 18. [ML-Pipeline/Dockerfile](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/Dockerfile)
- **Why it exists**: Docker container definition for Python 3.10 runtime environment, installing `librdkafka` C libraries and launching `inference_service.py`.

### 19. [data_generator.py](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/data_generator.py)
- **Why it exists**: Synthetic transaction generator simulating 180 days of realistic banking transactions across normal users and distinct financial anomaly archetypes (`job_loss`, `credit_stacking`, `amb_wipeout`). Writes output to `data/transactions_raw.csv`.

### 20. [feature_engineering.py](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/feature_engineering.py)
- **Why it exists**: Extracts domain-specific financial health metrics from raw transaction streams:
  - `ratio_inflow_outflow`: Inflow credits vs outflow debits.
  - `emi_to_income_ratio`: Estimated total EMI debits vs monthly salary income.
  - `amb_drop_percentage`: 7-day average monthly balance vs 90-day average monthly balance.

### 21. [train.py](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/train.py)
- **Why it exists**: Builds and trains an **Isolation Forest** anomaly detection model using scikit-learn (`StandardScaler` + `IsolationForest`).
- **Functionality**: Logs hyper-parameters and metrics to **MLflow** experiment `bfsi-anomaly-detection` and exports binary pipeline to `models/pipeline.pkl`.

### 22. [kafka_producer_test.py](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/kafka_producer_test.py)
- **Why it exists**: Simulation test script reading generated transactions for test users (`USER_ANOM_JL`, `USER_ANOM_AW`, `USER_ANOM_CS`, `USER_0000`) and pushing webhooks into Kafka topic `transactions` to simulate live Account Aggregator fetches.

### 23. [inference_service.py](file:///d:/@Vatsal/Early-Anomaly-Detection/ML-Pipeline/inference_service.py)
- **Why it exists**: Main production execution service for real-time ML inference.
- **Functionality**:
  - Launches a FastAPI web server on port `8000`.
  - Runs a background Kafka consumer listening to topic `transactions`.
  - Computes features dynamically, runs Isolation Forest model inference, classifies distress category (`JOB_LOSS_DISRUPT`, `CREDIT_STACKING`, `AMB_DRAINAGE`), and emits results to topic `anomalies`.