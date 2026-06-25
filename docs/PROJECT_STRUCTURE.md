# ResearchOS Directory Structure Specification
**Enterprise-Grade Monorepo/Workspace Layout**

To support rapid prototyping on a student laptop while remaining architecture-ready for an enterprise SaaS takeoff, **ResearchOS** employs a modular, highly organized directory structure. This ensures a clean separation of concerns among the frontend (UI), backend (routing & orchestration), databases, AI systems (embeddings & retrievers), background agents, automated tests, and deployment resources.

Below is the complete directory blueprint followed by a detailed mapping and breakdown of every folder.

---

## 1. Directory Tree Visualization

```text
researchos-workspace/
├── .env.example                  # Template for all global environment secrets
├── .gitignore                    # Tells git which build artifacts/secrets to ignore
├── package.json                  # Root monorepo workspace dependencies & run scripts
├── tsconfig.json                 # Core TypeScript compiler presets and aliases
├── vite.config.ts                # Vite build and development proxy configuration
│
├── assets/                       # Static branding, high-resolution logos, and UI graphics
│
├── deployment/                   # Cloud Infrastructure as Code (IaC) & containers
│   ├── docker/
│   │   ├── Dockerfile.dev        # Lightweight local development container configuration
│   │   └── Dockerfile.prod       # Optimized, multi-stage production container
│   ├── kubernetes/               # Enterprise container orchestration (future scalability)
│   │   ├── deployment.yaml
│   │   └── ingress.yaml
│   └── terraform/                # Infrastructure provisioning (GCP/AWS/Supabase)
│       ├── main.tf
│       └── variables.tf
│
├── docs/                         # Architecture, compliance, and developer onboarding guides
│   ├── ARCHITECTURE.md           # Visual design plans & system blueprints
│   ├── DATABASE_SCHEMA.md        # 3NF normalization definitions and SQL DDL
│   ├── UML_DIAGRAMS.md           # System execution sequence and component diagrams
│   └── PROJECT_STRUCTURE.md      # [This File] Detailed directory definitions
│
├── scripts/                      # Platform automation, seeding, and migration tools
│   ├── db-seed.ts                # Populate development databases with sample research papers
│   ├── db-migrate.ts             # Applies schema modifications to target PostgreSQL instance
│   └── ingest-sample-papers.sh   # Automated catalog parser ingestion script
│
├── src/                          # Monorepo Core Source Code
│   ├── App.tsx                   # Main React SPA entrypoint and router mount
│   ├── index.css                 # Global styles importing Tailwind CSS variables
│   ├── main.tsx                  # React DOM client mounting root node
│   │
│   ├── components/               # Atomic, highly reusable presentation components
│   │   ├── ui/                   # Primitive design components (Buttons, Inputs, Badges, Dialogs)
│   │   ├── graph/                # Interactive force-directed knowledge graph visualizations (D3)
│   │   ├── chat/                 # Conversational interfaces for research assistants
│   │   └── dashboard/            # Analytical charts, trend widgets, and project lists
│   │
│   ├── server/                   # Backend Application Tier (Node.js/Express)
│   │   ├── server.ts             # Main entry point bootstrapping express and mounting Vite
│   │   ├── controllers/          # Request handler mapping routes to functional services
│   │   │   ├── project.controller.ts
│   │   │   ├── paper.controller.ts
│   │   │   └── agent.controller.ts
│   │   ├── middleware/           # Request interceptors (Authorization, rate limiters, validation)
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── routes/               # API endpoint routing structures mapping pathing resources
│   │       ├── api.ts            # Root API registry (/api/*)
│   │       ├── auth.routes.ts
│   │       └── project.routes.ts
│   │
│   ├── db/                       # Database access, ORM, and schema configuration
│   │   ├── connection.ts         # Connection pool initialization using pg or Drizzle/Prisma client
│   │   ├── schema.ts             # TypeScript definitions of 3NF SQL structures (Drizzle schemas)
│   │   └── queries/              # Hand-optimized relational & vector repository patterns
│   │       ├── project.queries.ts
│   │       ├── paper.queries.ts
│   │       └── graph.queries.ts
│   │
│   ├── ai/                       # Dense Vector retrieval and generative AI modules
│   │   ├── gemini.ts             # Lazy initializer for Google @google/genai SDK
│   │   ├── embeddings.ts         # Dense semantic chunk vectors parser
│   │   └── prompts.ts            # Strictly versioned system instruction strings (for summaries, extraction)
│   │
│   ├── agents/                   # Autonomous Multi-Agent reasoning frameworks
│   │   ├── coordinator.ts        # Orchestrator assigning tasks to specialized agents
│   │   ├── ingestion.agent.ts    # Background worker parsing pdf structures & DOI records
│   │   ├── graph.agent.ts        # Extract entities/relations & save to database
│   │   └── synthesis.agent.ts    # Gathers notes and literature to output reports
│   │
│   ├── types/                    # System-wide static type definitions
│   │   ├── database.types.ts     # Typings matching database tables and entities
│   │   ├── api.types.ts          # REST Request/Response payload contracts
│   │   └── agent.types.ts        # Enum statuses and state boundaries for background tasks
│   │
│   └── utils/                    # Miscellaneous helper utilities
│       ├── formatters.ts         # Date and author list parser helper methods
│       └── validators.ts         # Input sanitation and DOI syntax regex validation
│
└── tests/                        # Comprehensive QA suite (Integration, Unit, and E2E)
    ├── unit/                     # Business logic testing with mocking frameworks (Vitest/Jest)
    │   ├── gemini-prompt.test.ts # Verifies structured outputs match expected json-schemas
    │   └── 3nf-mapping.test.ts   # Tests validation models
    ├── integration/              # Functional tests mocking live APIs and vector indexes
    │   └── db-vector.test.ts     # Validates HNSW index returns correct nearest neighbors
    └── e2e/                      # Browser automation tests validating user flows (Playwright/Cypress)
        └── user-journey.spec.ts  # Verifies full user registration-to-synthesis flow
```

---

## 2. In-Depth Folder Descriptions & Responsibilities

### Root Configuration Directory
*   **`.env.example`**: Defines all required developer variables (e.g., `GEMINI_API_KEY`, `DATABASE_URL`) without storing actual secrets.
*   **`package.json`**: Acts as the single registry for dependencies and deployment commands. Configured with workspaces if utilizing a monorepo setup.
*   **`tsconfig.json`**: Sets TypeScript compiler guidelines (targets `ES2022`, enforces strict checks, configures path mapping aliases like `@/*` to resolve imports cleanly).
*   **`vite.config.ts`**: Builds client-side assets efficiently, setups proxies to route `/api/*` to the Express backend in development, and disables HMR when requested to match sandbox bounds.

---

### `/deployment` — DevOps & Infrastructure as Code (IaC)
Handles all deployment configurations. It is split by hosting strategies:
*   **`docker/`**: Contains instructions for building Docker images. `Dockerfile.prod` employs highly optimized multi-stage builds—compiling TypeScript into lightweight runtime targets and stripping out heavy devDependencies.
*   **`kubernetes/`**: Contains standard YAML manifest files (`deployment.yaml`, `service.yaml`, `ingress.yaml`) to orchestrate containers across high-availability clusters.
*   **`terraform/`**: Contains declarative files to automatically provision necessary GCP resources (e.g. Cloud Run, Cloud SQL) or external databases (e.g. Supabase) with zero manual console intervention.

---

### `/docs` — System Specifications & Documentation
Serves as the knowledge repository of the project, including UML architectures, database diagrams, API specifications, and installation checklists. This is designed for both academic examiners reviewing portfolio code and future engineers joining the startup.

---

### `/scripts` — Platform Automation & Tooling
Standalone executable TypeScript files designed for system operations:
*   **`db-migrate.ts`**: Runs SQL migrations sequentially to mutate the remote database.
*   **`db-seed.ts`**: Populates the database with synthetic research datasets, allowing immediate testing of semantic search interfaces and visualization graphs without manual uploads.

---

### `/src` — The Core Application Codebase
The core directory containing all program execution instructions, modularized to prevent massive, unmaintainable single files:

#### `src/components/` — User Interfaces
Divided into thematic subfolders for maximum organization:
*   **`ui/`**: Basic UI atoms (buttons, badges, inputs, dialog modals) styled directly with Tailwind CSS utility classes.
*   **`graph/`**: Holds custom canvas and SVG code (specifically utilizing `D3.js` and `ResizeObserver`) to render responsive force-directed networks of extracted research entities.
*   **`chat/`**: Custom interactive layouts managing messaging states for the user to query agents about papers.
*   **`dashboard/`**: Analytical overview layouts tracking active ingestion metrics, active projects, and system health.

#### `src/server/` — Express Application Layer
A fully-fledged backend isolating HTTP transport protocols from business logic:
*   **`controllers/`**: Maps request parameters, delegates tasks to correct agents or database repositories, and returns unified HTTP responses.
*   **`routes/`**: Handles endpoint registrations (e.g., `/api/projects`, `/api/papers`) and maps them to appropriate controllers.
*   **`middleware/`**: Handles transversal request processing, such as verifying JWT tokens (`auth.middleware.ts`) or intercepting thrown runtime exceptions (`error.middleware.ts`) to return formatted JSON errors rather than stack traces.

#### `src/db/` — Relational Repository Layer
Bypasses unstructured raw SQL by mapping database tables to type-safe queries:
*   **`schema.ts`**: The single source of truth describing database layouts using an ORM like Drizzle. This automatically keeps the database in 3NF and type-safe.
*   **`queries/`**: Encapsulates data access patterns. Rather than scattered DB queries, controllers call structured methods (e.g. `paperQueries.findNearestNeighbors(vector)`) directly.

#### `src/ai/` — LLM & Embedding Integrations
All interfaces interacting with foundation models:
*   **`gemini.ts`**: Safely initializes the Google Gen AI client server-side. Enforces API Key checks.
*   **`embeddings.ts`**: Chunks academic paper PDFs, triggers vector generation, and prepares payloads for vector storage.
*   **`prompts.ts`**: Holds version-controlled system prompts and JSON response schemas for model queries.

#### `src/agents/` — Multi-Agent System Core
Independent, cooperative background loops mimicking human researchers:
*   **`coordinator.ts`**: Monitors the `agent_tasks` database queue. Upon identifying a pending task, it spins up specialized workers asynchronously.
*   **`ingestion.agent.ts`**: Resolves DOIs, scrapes catalogs, and parses structural layouts of uploaded documents.
*   **`graph.agent.ts`**: Uses Gemini's deep reasoning to extract relational triads (Entity -> Relation -> Entity) to build the semantic knowledge graph.
*   **`synthesis.agent.ts`**: Runs MapReduce operations over extensive lists of source chunks to author literature reviews.

#### `src/types/` — Type Integrity and Validation
Stores types shared between the client browser and the node backend. Having a centralized types folder eliminates import duplicates and ensures strict, compile-time contract enforcement.

---

### `/tests` — Quality Assurance Suite
Divided by test types to isolate test runners:
*   **`unit/`**: Tests small, pure utility modules (e.g. verifying text formatting, regex parsers) with ultra-high execution speeds.
*   **`integration/`**: Verifies component integration (e.g., verifying database reads/writes work together, testing pgvector indexes under load).
*   **`e2e/`**: Employs headless browser tools (such as Playwright) to automatically navigate the live application, register a mock account, create a project, upload a PDF, and verify the UI updates correctly.
