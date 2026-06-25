# ResearchOS API Specifications (V1) 🔌
## Technical Documentation for REST Endpoints

All backend endpoints are hosted on the Python FastAPI server (port `8000`), proxied securely by the parent Node Express server (port `3000`) under the `/api/v1` namespace.

---

## 🔒 1. Authentication (`/api/v1/auth`)

Manages user registrations, sessions, and secure JSON Web Tokens (JWT).

### POST `/api/v1/auth/register`
Creates a new researcher user account.

*   **Request Headers**: `Content-Type: application/json`
*   **Request Body**:
    ```json
    {
      "email": "researcher@university.edu",
      "password": "securepassword123",
      "full_name": "Dr. Sarah Jenkins"
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "id": "usr_9921f008",
      "email": "researcher@university.edu",
      "full_name": "Dr. Sarah Jenkins",
      "is_active": true
    }
    ```

### POST `/api/v1/auth/login`
Authenticates a user and returns an access token.

*   **Request Headers**: `Content-Type: application/x-www-form-urlencoded` or `application/json`
*   **Request Body**:
    ```json
    {
      "username": "researcher@university.edu",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer",
      "user": {
        "email": "researcher@university.edu",
        "full_name": "Dr. Sarah Jenkins"
      }
    }
    ```

---

## 📄 2. PDF Research Engine (`/api/v1/papers`)

Manages projects, bulk literature ingestion, and paper metadata.

### GET `/api/v1/papers/projects`
Retrieves all active research projects.

*   **Request Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    [
      {
        "id": "proj_123",
        "name": "LLM Systems Evaluation",
        "description": "Literature analysis of LLM reasoning engines",
        "created_at": "2026-06-24T01:45:00Z"
      }
    ]
    ```

### POST `/api/v1/papers/upload`
Uploads a scientific PDF paper and initiates vector chunk indexing.

*   **Request Headers**:
    *   `Authorization: Bearer <token>`
    *   `Content-Type: multipart/form-data`
*   **Form Data**:
    *   `file`: *(Binary PDF data)*
    *   `project_id`: `"proj_123"`
    *   `title`: `"Attention Is All You Need"`
    *   `authors`: `"Vaswani, Shazeer, Parmar"`
    *   `publication_date`: `"2017"`
    *   `doi`: `"10.48550/arXiv.1706.03762"`
*   **Response (201 Created)**:
    ```json
    {
      "id": "paper_ab8891cf",
      "status": "indexed",
      "title": "Attention Is All You Need",
      "chunks_generated": 48,
      "message": "Paper successfully parsed and stored in vector database"
    }
    ```

---

## 💬 3. Advanced RAG System (`/api/v1/rag`)

Facilitates contextualized chat synthesis with automatic search retrieval.

### POST `/api/v1/rag/query`
Executes a dense passage retrieval search and triggers Gemini synthesis.

*   **Request Headers**: `Authorization: Bearer <token>`
*   **Request Body**:
    ```json
    {
      "project_id": "proj_123",
      "query": "How do reasoning models handle logical calibration?",
      "chat_history": [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "How can I assist your literature review today?"}
      ]
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "answer": "Reasoning models handle logical calibration through self-correction mechanisms and chain-of-thought verification [1]. Research shows that prompting models to outline confidence intervals before answering improves calibration accuracy [2].",
      "citations": [
        {
          "index": 1,
          "paper_title": "Attention Is All You Need",
          "doi": "10.48550/arXiv.1706.03762",
          "snippet": "Self-correction behaviors during decoding passes show structural...",
          "page_number": 4
        },
        {
          "index": 2,
          "paper_title": "LLM Calibration Benchmarks",
          "doi": "10.1145/test",
          "snippet": "Prompting confidence margins explicitly yields standard deviations...",
          "page_number": 12
        }
      ]
    }
    ```

---

## 🔍 4. AI Gap Analysis Engine (`/api/v1/gap-analysis`)

Exposes findings about logical gaps, contradictory conclusions, and theoretical assumptions.

### GET `/api/v1/gap-analysis/project/{project_id}`
Retrieves all extracted research gap data.

*   **Request Headers**: `Authorization: Bearer <token>`
*   **Response (200 OK)**:
    ```json
    {
      "conceptual_gaps": [
        {
          "id": "gap_001",
          "title": "Out-of-Distribution Calibration in Reasoning Networks",
          "description": "Lack of testing on non-English reasoning paths.",
          "strength": "high",
          "source_papers": ["paper_1"]
        }
      ],
      "contradictions": [
        {
          "id": "contra_102",
          "claim_a": "Chain-of-thought decreases perplexity overall.",
          "paper_a": "Attention Is All You Need",
          "claim_b": "Chain-of-thought increases generation variance.",
          "paper_b": "LLM Calibration Benchmarks",
          "resolution_hypothesis": "The variance is highly dependent on temperature parameters."
        }
      ],
      "assumptions": [
        {
          "id": "assump_003",
          "statement": "Assumes context windows are uniformly retrieved.",
          "validity_status": "unverified",
          "vulnerable_models": ["GPT-4", "Gemini 1.5 Pro"]
        }
      ]
    }
    ```

---

## 🤖 5. Multi-Agent Workspace (`/api/v1/agents`)

Manages structural knowledge graphs and schedules long-running synthesis tasks.

### GET `/api/v1/agents/project/{project_id}/graph`
Retrieves structural knowledge graph entities and relations.

*   **Response (200 OK)**:
    ```json
    {
      "nodes": [
        { "id": "node_1", "label": "Transformer", "category": "model" },
        { "id": "node_2", "label": "Self-Attention", "category": "mechanism" }
      ],
      "relations": [
        { "id": "rel_1", "source": "node_1", "target": "node_2", "type": "implements" }
      ]
    }
    ```

### POST `/api/v1/agents/tasks`
Schedules an autonomous research multi-agent task.

*   **Request Body**:
    ```json
    {
      "project_id": "proj_123",
      "task_type": "literature_review",
      "parameters": {
        "depth": "comprehensive",
        "focus_areas": ["logical_reasoning", "quantization"]
      }
    }
    ```
*   **Response (202 Accepted)**:
    ```json
    {
      "task_id": "task_881a2f00",
      "status": "pending",
      "created_at": "2026-06-24T01:45:00Z"
    }
    ```
