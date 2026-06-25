# ResearchOS Architectural Specifications 🏛️
## High-Performance Parent-Child Process Orchestration

ResearchOS is engineered using a robust, decoupled, yet unified **multi-process architecture**. This document specifies the technical design, processing boundaries, data pipelines, and database schemas of the platform.

---

## 🏗️ 1. Orchestration Mechanics

Rather than forcing users to deploy, scale, and secure multiple separate services, ResearchOS bundles the entire runtime into a **single execution environment**.

```text
                  ┌──────────────────────────────────────────────┐
                  │                 Docker Ingress               │
                  │                 (Port: 3000)                 │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            Node.js Parent Process            │
                  │           Express & Vite Middleware          │
                  └──────────────┬────────────────────────┬──────┘
                                 │                        │
                    Internal IPC │ (spawn)                │ Reverse Proxy
                    and Signals  │                        │ (/api/*)
                                 ▼                        ▼
                  ┌──────────────────────┐        ┌───────────────┐
                  │ Python FastAPI Engine│        │ Browser Client│
                  │     (Port: 8000)     │        │  (Static SPA) │
                  └──────────────────────┘        └───────────────┘
```

### Parent Node.js Orchestrator (`server.ts`)
*   **Process Boot**: Upon booting, Node.js uses `child_process.spawn()` to spin up the Python FastAPI backend using Uvicorn on port `8000`.
*   **Process Lifecycle Management**: Node.js listens to system exit signals (`SIGINT`, `SIGTERM`) and child exit events. It acts as an init-like process, ensuring that if Node.js shuts down, the underlying Python process is gracefully terminated (`pythonProcess.kill()`) to prevent orphaned port bindings.
*   **Unified Port Routing**: Port `3000` is the only port exposed outside the container.
    *   **Development**: Express mounts Vite's dev server middleware (`vite.middlewares`) to serve React source files with real-time TypeScript compilation.
    *   **Production**: Express serves static pre-compiled chunks directly from the `dist/` directory.
    *   **Proxy Routing**: Any request arriving at `/api/*` is caught by `http-proxy-middleware` and forwarded directly to the Python backend running on `127.0.0.1:8000`.

---

## 🗄️ 2. Relational and Vector Database Schema

ResearchOS uses PostgreSQL equipped with the `pgvector` extension. This provides full ACID-compliant transactional relational queries side-by-side with high-dimensional vector similarity operations.

```text
  ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
  │     Project     │◄────────│  ResearchPaper  │◄────────│  PaperEmbedding │
  │ ──────────────── │         │ ─────────────── │         │ ─────────────── │
  │ id (PK)         │         │ id (PK)         │         │ id (PK)         │
  │ name            │         │ title           │         │ paper_id (FK)   │
  │ description     │         │ authors         │         │ chunk_index     │
  │ created_at      │         │ journal         │         │ content_text    │
  └─────────────────┘         │ doi             │         │ vector (1536d)  │
           ▲                  └─────────────────┘         └─────────────────┘
           │                           ▲
           │                           │
  ┌────────┴────────┐         ┌────────┴────────┐         ┌─────────────────┐
  │    AgentTask    │         │   ResearchGap   │         │  GraphRelation  │
  │ ──────────────── │         │ ─────────────── │         │ ──────────────── │
  │ id (PK)         │         │ id (PK)         │         │ id (PK)         │
  │ project_id (FK) │         │ paper_id (FK)   │         │ source_id (FK)  │
  │ task_type       │         │ gap_type        │         │ target_id (FK)  │
  │ status          │         │ description     │         │ predicate_type  │
  │ result_data     │         │ resolution_idea │         │ confidence      │
  └─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Table Definitions

1.  **`users`**: Manages credentials and system profiles.
    *   `id` (UUID, Primary Key)
    *   `email` (VARCHAR, Unique, Indexed)
    *   `hashed_password` (VARCHAR)
    *   `full_name` (VARCHAR)
    *   `is_active` (BOOLEAN)

2.  **`projects`**: Context boundaries for research domains.
    *   `id` (UUID, Primary Key)
    *   `name` (VARCHAR)
    *   `description` (TEXT)
    *   `owner_id` (UUID, Foreign Key ➡️ `users.id`)

3.  **`research_papers`**: Stores general bibliographic details.
    *   `id` (UUID, Primary Key)
    *   `project_id` (UUID, Foreign Key ➡️ `projects.id`)
    *   `title` (VARCHAR, Indexed)
    *   `authors` (VARCHAR)
    *   `journal` (VARCHAR)
    *   `publication_date` (VARCHAR)
    *   `doi` (VARCHAR, Unique)
    *   `file_path` (VARCHAR)

4.  **`paper_embeddings`**: Holds vectorized text fragments (RAG engine).
    *   `id` (UUID, Primary Key)
    *   `paper_id` (UUID, Foreign Key ➡️ `research_papers.id` on delete CASCADE)
    *   `chunk_index` (INTEGER)
    *   `content` (TEXT)
    *   `embedding` (VECTOR(1536) / VECTOR(768) depending on Gemini model - e.g. text-embedding-004)

5.  **`knowledge_graph_nodes` & `knowledge_graph_relations`**: Houses structures extracted from papers.
    *   **Nodes**: `id`, `project_id` (FK), `label`, `category` (Model, Dataset, Metric, Theory).
    *   **Relations**: `id`, `source_node_id` (FK), `target_node_id` (FK), `type` (implements, optimizations, contradicts, evaluates).

---

## 📈 3. Data Flow Pipelines

### Ingestion Pipeline
```text
  [PDF Upload] ──► [PDFMiner / PyPDF Text Extraction] ──► [Recursive Text Splitter]
                         │
                         ▼
  [SQLAlchemy Store] ◄── [Gemini Embedding Service] ◄── [Chunk Array Generation]
```

1.  **Text Extraction**: FastAPI parses incoming PDF streams using structured layout heuristics.
2.  **Semantic Chunking**: Text is split recursively into overlapping 800-token chunks to preserve semantic context boundaries.
3.  **Vectorization**: Chunks are processed concurrently through the Gemini AI Studio embedding service.
4.  **Database Commit**: Relational metadata is stored in `research_papers` and embedding vectors are committed in bulk to `paper_embeddings`.

### Chat Synthesis Pipeline (Advanced RAG)
1.  **Semantic Retrieval**: A user query is embedded into a high-dimensional vector. PostgreSQL executes a cosine distance vector lookup:
    ```sql
    SELECT content, paper_id, page_number
    FROM paper_embeddings
    ORDER BY embedding <=> :query_embedding LIMIT 5;
    ```
2.  **Synthesis Injection**: Retrieved text blocks are formatted into a markdown citation block and appended to a system template.
3.  **LLM Call**: Gemini reads the unified query-context package and generates a cited answer.
