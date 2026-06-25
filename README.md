# ResearchOS 🌌
### AI-Powered Autonomous Research Intelligence Platform

ResearchOS is a comprehensive, full-stack, enterprise-grade research workstation designed to help researchers ingest, index, map, and analyze literature at scale. It features a custom **Dual-Engine Architecture** pairing an interactive, highly responsive **React + TypeScript (Vite)** frontend with an advanced **Python FastAPI** backend powered by state-of-the-art LLMs (Gemini), vector-indexed retrieval (RAG), and a dynamic Knowledge Graph generator.

With ResearchOS, you can analyze complex research literature, extract implicit gaps, automatically structure cross-paper relational entities, and execute autonomous multi-agent synthesis workflows.

---

## 🚀 Key Features

*   **PDF Literature Ingestion & Parsing**: Extract structured knowledge directly from academic papers.
*   **Vector-Indexed Semantic Search (RAG)**: Connect research questions directly to precise page numbers and paragraphs using advanced Dense Passage Retrieval.
*   **A.I. Research Gap Analysis**: Unearth logical contradictions, unaddressed assumptions, and missing link trends across parsed literature.
*   **Dynamic Knowledge Graph Extraction**: Automatically parse papers to extract structured entities (e.g., Models, Metrics, Datasets) and map semantic relations in real time.
*   **Multi-Agent Research Workflows**: Execute complex workflows (e.g., Literature Synthesis, Contradiction Triangulation, Trend Mapping) using integrated agent networks.
*   **Interactive Chat Synthesis**: Chat directly with your corpus, generating structured reports backed by citation anchors.

---

## 🏛️ System Architecture

ResearchOS runs a unified **dual-process parent-child model**:

1.  **Orchestration layer (NodeJS / Express)**: Acts as the primary ingress proxy (port 3000), serves compiled static SPA files in production, and spawns the FastAPI engine as a child process.
2.  **Intelligence engine (Python / FastAPI)**: Hosts high-performance vector search, database management (SQLAlchemy / PostgreSQL), and orchestrates Gemini SDK integrations.

```text
                  ┌───────────────────────────────────────────────┐
                  │                Browser Client                 │
                  └──────────────────────┬────────────────────────┘
                                         │ Requests (Port 3000)
                                         ▼
                  ┌───────────────────────────────────────────────┐
                  │            Node.js Parent Wrapper             │
                  │        (Express Static / Reverse Proxy)       │
                  └──────────────┬────────────────────────┬───────┘
                                 │                        │
             Static Assets       │                        │ Proxied API Routes (/api/*)
             (React App)         ▼                        ▼
                  ┌──────────────────────┐        ┌───────────────┴───────┐
                  │     Dist Folder      │        │ Python FastAPI Engine │
                  │    (Static Build)    │        │      (Port 8000)      │
                  └──────────────────────┘        └───────┬───────┬───────┘
                                                          │       │
                                       Vector / RAG Calls │       │ SQL Queries
                                                          ▼       ▼
                                                 ┌────────┴───────┴───────┐
                                                 │ PostgreSQL + pgvector  │
                                                 └────────────────────────┘
```

---

## 📁 Repository Structure

```text
├── .github/workflows/       # Automated CI/CD pipelines
├── fastapi-backend/         # Python FastAPI intelligence engine
│   ├── app/                 # FastAPI application root
│   │   ├── api/             # API Router, endpoints (auth, papers, rag, agents)
│   │   ├── core/            # System config, security settings, JWT auth
│   │   ├── db/              # SQLAlchemy session and schema setup
│   │   ├── models/          # Declarative relational models
│   │   └── services/        # Business logic, embedding, text splitting, agent orchestration
│   ├── requirements.txt     # Python production dependencies
│   └── alembic.ini          # Alembic database migration config
├── src/                     # React + Vite frontend source code
│   ├── components/          # Reusable view layouts (Dashboard, Workspace, Chat, Gaps)
│   ├── test/                # Unit & Integration tests (Vitest)
│   └── App.tsx              # Main frontend component & view router
├── server.ts                # Express development / production host wrapper
├── Dockerfile               # Production multi-stage Docker container build
├── docker-compose.yml       # Standard local orchestration file
└── DEPLOYMENT.md            # Detailed deployment strategy (free tiers, Cloud Run, Supabase)
```

---

## 🛠️ Quick Start

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) v20+
*   [Python](https://www.python.org/) v3.11+
*   [PostgreSQL](https://www.postgresql.org/) v15+ (with `pgvector` enabled)
*   Google Gemini API Key

### 2. Fast Track: Docker Compose (Unified Stack)
The easiest way to boot the complete environment including a pre-configured PostgreSQL + pgvector database:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/researchos.git
    cd researchos
    ```
2.  **Configure Environment Variables**:
    Create a `.env` file in the root:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    SECRET_KEY=some_secure_jwt_signing_key_here
    ```
3.  **Boot Container Stack**:
    ```bash
    docker-compose up --build
    ```
4.  **Access Station**:
    Open `http://localhost:3000` on your browser.

---

## 📚 Complete Project Documentation

For exhaustive deep-dives, configuration guides, and architectural designs, explore our documentation hub:

*   📖 **[Installation Guide](docs/INSTALLATION.md)**: Manual setup for local development.
*   📖 **[User Manual](docs/USER_MANUAL.md)**: Operating guidelines for research execution.
*   📖 **[Architecture Docs](docs/ARCHITECTURE.md)**: Process boundaries, schemas, and design constraints.
*   📖 **[API Documentation](docs/API_DOCS.md)**: Detailed JSON payloads and endpoint specifications.
*   📖 **[Developer Guide](docs/DEVELOPER_GUIDE.md)**: Guide on extending and building custom modules.
*   📖 **[Contribution Guidelines](docs/CONTRIBUTING.md)**: Coding standards, testing rules, and branch guidelines.
*   📖 **[Academic Research Paper Draft](docs/RESEARCH_PAPER.md)**: Draft paper on Multi-Agent Literature Synthesis.

---

## ⚖️ License
This project is licensed under the MIT License - see the LICENSE file for details.
