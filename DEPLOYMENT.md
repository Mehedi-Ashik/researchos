# ResearchOS Deployment Strategy Guide
## Unified Multi-Process Production Blueprint (100% Free Stack Focus)

ResearchOS features a highly efficient **dual-engine architecture** managed by a single unified orchestrator. A parent **Node.js Express** wrapper manages the static compiled React frontend, serves as an API proxy, and dynamically spawns the background **Python FastAPI** backend as a child process.

Because both servers run within a single operating container, **you only need to host a single web service in production**, allowing you to host the entire platform **100% for free** using perpetual free-tier cloud platforms.

---

## 1. Architectural Overview

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                   SINGLE DOCKER CONTAINER                   │
  │                                                             │
  │                     Node.js Parent Host                     │
  │                     (Express Proxy @ :3000)                 │
  │                                                             │
  │        ┌───────────────────────┴───────────────────────┐    │
  │        ▼                                               ▼    │
  │  Vite Web Assets                                FastAPI     │
  │  (Static HTML/JS/CSS)                        (Python @ :8000)│
  └────────┬───────────────────────────────────────────────┬────┘
           │                                               │
           ▼                                               ▼
     Public Clients                                 Database (PostgreSQL)
  (Desktop / Web Browser)                          (with pgvector support)
```

By packaging both components into a single Docker container, we eliminate multi-service coordination overhead, simplify SSL/CORS management, and fit comfortably within single-instance free hosting limits.

---

## 2. Local Deployment

### Option A: Standard Bare-Metal Execution (Development)
Ideal for active development and fast iteration.

1. **Clone and Prepare Databases**:
   Ensure you have a PostgreSQL database running locally (version 15+ recommended, with the `pgvector` extension installed).
   
2. **Setup and Boot FastAPI Backend**:
   ```bash
   cd fastapi-backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
   Create a `.env` inside `fastapi-backend/` matching the parameters in `app/core/config.py`. Then run:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

3. **Setup and Boot React & Express Frontend**:
   In the root directory:
   ```bash
   npm install
   npm run dev
   ```
   Access the dashboard and workstation at `http://localhost:3000`.

---

### Option B: Docker Compose (Local Sandbox)
Ideal for testing exact production parity locally with a bundled, pre-configured `pgvector` database container.

1. **Verify Prerequisites**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. **Start the Stack**:
   In the root directory, execute:
   ```bash
   docker-compose up --build
   ```
3. **Verify Execution**:
   - PostgreSQL launches on port `5432` with `pgvector` ready.
   - Database health check waits for socket readiness.
   - The unified application starts on port `3000`.
   - Access the platform at `http://localhost:3000`.

To stop the containers and preserve database records:
```bash
docker-compose down
```

---

## 3. Cloud Deployment Strategy (Perpetual Free Options)

To host ResearchOS in production without incurring costs, we recommend combining a **Serverless Container Host** with a **Managed Database Host**.

### Strategy 1: Google Cloud Run + Supabase (Recommended)
This stack is 100% free, highly scalable, and handles cold-starts cleanly.

| Component | Platform | Free Tier Benefits |
| :--- | :--- | :--- |
| **Compute / Frontend / Backend** | **Google Cloud Run** | 2 Million requests/month, 360k vCPU-seconds, 180k GiB-seconds free. Scales to zero. |
| **Database & Vectors** | **Supabase** or **Neon** | Perpetual free Postgres database, full `pgvector` extension support, 500MB storage. |

#### Step-by-Step Google Cloud Run & Supabase Provisioning:

1. **Create the Database (Supabase)**:
   - Sign up at [Supabase.com](https://supabase.com).
   - Create a new project named `researchos`.
   - Go to the **SQL Editor** tab and execute:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - Navigate to **Project Settings > Database** and copy the URI Connection String (`postgresql://postgres:[YOUR_PASSWORD]@...supabase.co:5432/postgres`).

2. **Deploy Container to Google Cloud Run**:
   - Install the [Google Cloud SDK](https://cloud.google.com/sdk).
   - Authenticate and configure your project:
     ```bash
     gcloud auth login
     gcloud config set project [YOUR_GCP_PROJECT_ID]
     ```
   - Build and submit your Docker container to GCP Artifact Registry:
     ```bash
     gcloud builds submit --tag gcr.io/[YOUR_GCP_PROJECT_ID]/researchos
     ```
   - Deploy to Cloud Run:
     ```bash
     gcloud run deploy researchos \
       --image gcr.io/[YOUR_GCP_PROJECT_ID]/researchos \
       --platform managed \
       --region us-central1 \
       --allow-unauthenticated \
       --set-env-vars="NODE_ENV=production,PORT=3000,POSTGRES_SERVER=[DB_HOST],POSTGRES_USER=postgres,POSTGRES_PASSWORD=[YOUR_PASSWORD],POSTGRES_DB=postgres,POSTGRES_PORT=5432,SECRET_KEY=[RANDOM_SECRET_KEY],GEMINI_API_KEY=[YOUR_GEMINI_KEY]"
     ```
   - You will receive a secure HTTPS URL (e.g., `https://researchos-abcxyz-uc.a.run.app`) completely provisioned with SSL.

---

### Strategy 2: Render (Click-to-Deploy Free Tier)
Render offers a developer-friendly UI with zero-configuration build hooks.

| Component | Platform | Free Tier Benefits |
| :--- | :--- | :--- |
| **Unified Web Service** | **Render Web Service** | Free container deployment, automated Let's Encrypt SSL, Git integration. |
| **Database** | **Render PostgreSQL** | Free managed database (deletes after 90 days on free plan, so Supabase/Neon is preferred for data persistence). |

#### Step-by-Step Render Setup:
1. Sign in to [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. Select **Docker** as the Runtime environment.
5. In **Advanced**, add the following environment variables:
   - `GEMINI_API_KEY`: *(Your Google AI API Key)*
   - `SECRET_KEY`: *(A secure random string)*
   - `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: *(Point to Supabase or Neon)*
6. Click **Deploy Web Service**. Render will build the multi-stage Dockerfile and host the application.

---

## 4. CI/CD & GitHub Actions Pipeline

Our automated pipeline in `.github/workflows/ci-cd.yml` automates code quality checks, lints, and builds on push to the repository.

### Pipeline Workflow:
```text
  [Git Push/PR] ──► [Install Deps] ──► [TypeScript Typechecks] ──► [Vitest Tests] ──► [Docker Build & Deploy]
```

### GitHub Secrets Setup:
To enable automated deployments to Google Cloud Run through GitHub Actions, add the following secrets under your GitHub repository **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Example / Format |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `researchos-prod-1234` |
| `GCP_SA_KEY` | Service Account Key JSON with Cloud Run Admin permissions | `{"type": "service_account", ...}` |
| `GEMINI_API_KEY` | Google Gemini AI Studio API key | `AIzaSy...` |
| `PROD_POSTGRES_SERVER` | Production PostgreSQL DB Server Endpoint | `aws-0-us-east-1.pooler.supabase.co` |
| `PROD_POSTGRES_USER` | Production Database User | `postgres.your-project-id` |
| `PROD_POSTGRES_PASSWORD` | Production Database Password | `your-secure-db-password` |
| `PROD_POSTGRES_DB` | Production Database Name | `postgres` |
| `PROD_SECRET_KEY` | Production JWT Signature Secret | `32-byte-hexadecimal-string` |

---

## 5. Database Migrations & Vector Setup

We use **Alembic** to safely track database schemas and manage structural transitions inside `fastapi-backend/`.

### Initial Setup
Ensure the database contains the required structural tables (Projects, Papers, Gaps, Tasks, Graph Nodes & Relations):

1. **Activate the backend environment**:
   ```bash
   cd fastapi-backend
   source venv/bin/activate
   ```
2. **Auto-Generate the Migration Script**:
   ```bash
   alembic revision --autogenerate -m "Initial schema setup"
   ```
3. **Apply Structural Changes**:
   ```bash
   alembic upgrade head
   ```

### Running Migrations in Docker
When deploying via Docker, migrations can run automatically as part of the container boot sequence. Simply prepend migrations to the execution routine in `package.json` or your entrypoint command:
```bash
# Example update to command to run migrations before server startup:
cd fastapi-backend && alembic upgrade head && cd .. && npm start
```

---

## 6. Security Hardening & Best Practices

1. **HTTPS Enforcement**: Always access your site using `https://` in production. Both Google Cloud Run and Render provide TLS termination out-of-the-box.
2. **CORS Configuration**: Restrict allowable origins in the Python FastAPI layer by passing a specific list rather than wildcarding (`*`). Set `BACKEND_CORS_ORIGINS` to your primary web URL.
3. **Database Security**:
   - Never expose port `5432` of your production PostgreSQL instance publicly without requiring strong passwords.
   - Use pooled connections (`PgBouncer` or Supabase pooling) on serverless environments to avoid running out of database socket connections during traffic spikes.
4. **Secret Storage**: Never commit passwords or API keys to Git. Use `.env.example` as a template, and inject values securely using your cloud provider's Secrets Manager.
