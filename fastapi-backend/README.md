# ResearchOS - FastAPI Backend Setup
**Clean Architecture, Repository Pattern, & Service Layer Blueprint**

This directory contains the initial blueprint and project setup for the FastAPI backend of **ResearchOS**. It is structured according to **Clean Architecture** principles to isolate business logic, database entities, validation layers, and HTTP transport layers.

---

## 1. Clean Architecture Mapping

The backend follows a strict layered separation of concerns:

```text
               ┌──────────────────────────────┐
               │    Presentation (API/Web)    │  <-- FastAPI Routers, HTTP Requests/Responses
               └──────────────┬───────────────┘
                              │ Uses (via Dependency Injection)
               ┌──────────────▼───────────────┐
               │         Service Layer        │  <-- Coordinates transactions, executes agents, business rules
               └──────────────┬───────────────┘
                              │ Uses (via Dependency Injection)
               ┌──────────────▼───────────────┐
               │    Repository (Data Layer)   │  <-- SQLAlchemy ORM, raw SQL, pgvector actions
               └──────────────────────────────┘
```

*   **Core Configuration (`app/core/`)**: Holds application configuration settings, security modules (JWT decoding/encryption), and global constants.
*   **Database Infrastructure (`app/db/`)**: Holds database connections, SQLAlchemy transaction session factories, and base declarations.
*   **Models/Entities (`app/models/`)**: Declarative database models mapping 3NF tables to Python structures.
*   **Repositories (`app/repositories/`)**: Abstract data access patterns matching operations (e.g., `UserRepository.find_by_email()`).
*   **Service Layer (`app/services/`)**: The engine implementing the platform's core business processes (e.g., coordinating ingestion, calling Gemini APIs, running the RAG pipelines).
*   **Schemas/DTOs (`app/schemas/`)**: Pydantic models acting as Data Transfer Objects, validating and formatting input and output payloads.
*   **API presentation (`app/api/`)**: Routing modules parsing HTTP parameters and converting them to structured service invocations.

---

## 2. Bootstrapping Instructions

To start developing on this backend locally:

### Step 1: Install Python Requirements
Activate a virtual environment and run pip installation:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables
Create a local `.env` file matching settings inside `app/core/config.py`:
```env
PROJECT_NAME="ResearchOS"
API_V1_STR="/api/v1"
BACKEND_CORS_ORIGINS="http://localhost:3000,http://localhost:5173"

# PostgreSQL Setup
POSTGRES_SERVER="localhost"
POSTGRES_USER="researcher"
POSTGRES_PASSWORD="secure_dev_pass"
POSTGRES_DB="researchos"

# Auth and API keys
SECRET_KEY="super_secure_development_secret_key_change_in_production_12345678"
GEMINI_API_KEY="your_google_ai_studio_api_key"
```

### Step 3: Run the Development Server
Run Uvicorn with hot-reload enabled:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once booted, access the interactive documentation at `http://localhost:8000/docs`.
