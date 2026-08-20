# Complete Deployment & Operation Guide

This guide provides step-by-step instructions for running, testing, building, and deploying the **Financial Early Warning System** locally and in containerized environments.

---

## Environment Prerequisites

- **Docker & Docker Compose** (Recommended for containerized execution)
- **Node.js 18+ / 20+** & **npm 9+** (For local Node.js backend development)
- **Python 3.10+** (For local ML pipeline development)
- **PostgreSQL 15** & **Apache Kafka 3.x / Confluent 7.x** (If running infrastructure bare-metal)

---

## Deployment Option 1: Docker Compose (One-Command Deployment)

The fastest and most reliable way to launch the entire system (Database, Kafka Broker, Node.js Backend Service, Python Inference Engine) is using Docker Compose.

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/vatsalchandrani/Early-Anomaly-Detection.git
cd Early-Anomaly-Detection

# Copy sample environment configuration
cp .env.example .env
```

### Step 2: Build and Start Containers
```bash
docker-compose up --build -d
```

### Step 3: Verify Services
Once launched, verify service status:

| Service | Port | Endpoint / Health Check |
| :--- | :--- | :--- |
| **Node.js Webhook Backend** | `8080` | `http://localhost:8080/webhook/health` |
| **Python ML Inference** | `8000` | `http://localhost:8000/health` |
| **PostgreSQL Database** | `5433` | `localhost:5433` (`creditrisk`) |
| **Apache Kafka Broker** | `9092` | `localhost:9092` |

---

## Deployment Option 2: Local Development Setup

If you wish to run components individually for debugging:

### Step 1: Start Infrastructure (Kafka & Postgres)
```bash
docker-compose up zookeeper kafka postgres -d
```

### Step 2: Run Data Generation & Train ML Model
```bash
# Navigate to ML-Pipeline
cd ML-Pipeline

# Create and activate Python virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Generate synthetic bank data (creates data/transactions_raw.csv)
python data_generator.py

# Compute features (creates data/features.csv)
python feature_engineering.py

# Train Isolation Forest & log to MLflow (creates models/pipeline.pkl)
python train.py
```

### Step 3: Start Python Real-Time Inference Service
```bash
python inference_service.py
```
*Inference Service runs at `http://localhost:8000` and starts listening to Kafka topic `transactions`.*

### Step 4: Install Dependencies & Run Node.js Backend
In a new terminal window:
```bash
cd Backend

# Install Node.js dependencies
npm install

# Run backend service
npm start
# Or for development: npm run dev
```
*Backend runs at `http://localhost:8080`.*

---

## Testing & Simulating Real-Time Streams

To verify the end-to-end event stream from ingestion -> feature extraction -> model inference -> database insertion:

### Run Producer Test Script
```bash
cd ML-Pipeline
python kafka_producer_test.py
```
This script pushes transaction batches for test accounts (including distress archetypes `USER_ANOM_JL`, `USER_ANOM_AW`, `USER_ANOM_CS`) into Kafka topic `transactions`.

### Query Detected Anomalies via REST API
```bash
# Fetch all detected anomalies stored in PostgreSQL
curl -X GET http://localhost:8080/anomalies

# Fetch anomalies for job loss user
curl -X GET http://localhost:8080/anomalies/USER_ANOM_JL
```

---

## MLflow Dashboard & Model Tracking

To view logged experiment runs, contamination metrics, and model artifacts:
```bash
cd ML-Pipeline
mlflow ui
```
Open browser at `http://localhost:5000` to inspect the `bfsi-anomaly-detection` experiment.