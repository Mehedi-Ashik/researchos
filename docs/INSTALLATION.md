# ResearchOS Installation Guide 🛠️

This document provides a step-by-step setup guide to install and run ResearchOS on your local system or servers. ResearchOS is composed of:
1.  **React Frontend (Vite + TS)**
2.  **Parent Host (Express Reverse Proxy)**
3.  **Intelligence Engine (FastAPI + Python)**
4.  **Database (PostgreSQL with `pgvector` extension)**

---

## 🏗️ Hardware & Software Requirements

*   **Operating System**: macOS, Linux (Ubuntu 20.04+ recommended), or Windows 11 with WSL2.
*   **Processor**: 2+ Cores (Intel/AMD or Apple Silicon).
*   **Memory**: 4GB RAM minimum (8GB+ recommended).
*   **Node.js**: v20.x or newer.
*   **Python**: v3.11.x or newer.
*   **PostgreSQL**: v15.x or newer (must support `pgvector` extension).

---

## 🐳 Option A: Zero-Configuration Docker Installation (Recommended)

Docker Compose abstracts away database setups, runtime installations, and environment configurations.

### 1. Verify Prerequisites
Make sure you have Docker and Docker Compose installed:
```bash
docker --version
docker-compose --version
```

### 2. Configure Environment Variables
Create a file named `.env` in the root of the project:
```env
# Google Gemini API key used for text generation, embeddings, and report drafting
GEMINI_API_KEY=AIzaSyA...your_real_key_here

# JSON Web Token signing key (minimum 32-character hexadecimal string recommended)
SECRET_KEY=9a2f7c...your_secure_hash_here
```

### 3. Run the Containers
Run the Docker Compose orchestration stack:
```bash
docker-compose up --build
```
*   This downloads the specialized `pgvector` Postgres database, boots the DB container, waits for healthy initialization, compiles your React assets, and starts the dual NodeJS-FastAPI platform.
*   Access the workspace directly at `http://localhost:3000`.

---

## 🛠️ Option B: Bare-Metal Manual Installation (Development)

Follow these steps if you want to run the codebase directly on your machine for rapid debugging and file hot-reloading.

### Step 1: Database Setup (PostgreSQL with pgvector)
ResearchOS requires a PostgreSQL database with vector capabilities to handle advanced semantic RAG search and knowledge retrieval.

1.  **Install pgvector**:
    *   **macOS (Homebrew)**:
        ```bash
        brew install pgvector
        ```
    *   **Linux (Ubuntu)**:
        ```bash
        sudo apt-get install postgresql-15-pgvector
        ```
    *   **Windows**: Download binaries or use a PostgreSQL Docker image locally:
        ```bash
        docker run --name researchos-pg -e POSTGRES_PASSWORD=secure_pass -p 5432:5432 -d pgvector/pgvector:pg16
        ```

2.  **Initialize the Database**:
    Log in to your PostgreSQL terminal and execute the following queries:
    ```sql
    CREATE DATABASE researchos;
    \c researchos;
    CREATE EXTENSION IF NOT EXISTS vector;
    ```

---

### Step 2: Configure Environment Variables
Create a `.env` file at the root of the project:
```env
# General
NODE_ENV=development
PORT=3000
SECRET_KEY=super_secure_development_secret_key_change_in_production_12345678

# AI Models
GEMINI_API_KEY=your_gemini_api_key_here

# Relational Database Configuration
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=researchos
POSTGRES_PORT=5432
```

---

### Step 3: Install & Start the FastAPI Backend

1.  Navigate to the Python backend directory:
    ```bash
    cd fastapi-backend
    ```

2.  Create a virtual environment:
    ```bash
    python3 -m venv venv
    ```

3.  Activate the virtual environment:
    *   **Linux/macOS**:
        ```bash
        source venv/bin/activate
        ```
    *   **Windows (CMD)**:
        ```cmd
        venv\Scripts\activate.bat
        ```
    *   **Windows (PowerShell)**:
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```

4.  Install Python dependencies:
    ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
    ```

5.  Run structural database migrations using Alembic:
    ```bash
    alembic upgrade head
    ```

6.  Boot the FastAPI server standalone to test (optional):
    ```bash
    uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    ```
    *   Confirm FastAPI is running successfully by checking `http://localhost:8000/docs` in your browser.
    *   Once confirmed, stop the server (`Ctrl+C`). It will be managed automatically by the NodeJS parent host.

---

### Step 4: Install & Start the React and Express Frontend

1.  Return to the root directory:
    ```bash
    cd ..
    ```

2.  Install NodeJS packages:
    ```bash
    npm install
    ```

3.  Run the integrated workstation:
    ```bash
    npm run dev
    ```
    *   The Express server will launch on port `3000`, verify environment keys, and spawn the FastAPI backend as a child process. It then mounts the Vite live middleware for front-end editing.
    *   Navigate to `http://localhost:3000` to start using ResearchOS!

---

## 🧪 Verifying the Installation

To verify that the complete system (Frontend, Backend, and Database) is connected and operating cleanly, run our integrated test suites:

```bash
# Run Jest/Vitest unit and integration suites
npm run test
```

If any errors occur, see our Troubleshooting section in the **[Developer Guide](DEVELOPER_GUIDE.md)**.
