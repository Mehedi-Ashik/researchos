# ResearchOS UML Design Specification
**AI-Powered Autonomous Research Intelligence Platform**

This document contains complete system design diagrams for **ResearchOS** using the standardized Mermaid syntax. These architectural models capture user-system boundaries, static class relations, dynamic query/ingest sequences, processing activity states, component distribution boundaries, and operational deployment topologies.

---

## 1. Use Case Diagram

Because Mermaid does not have a native "usecase" diagram type, we model this elegantly using a hierarchically structured flowchart with boundary subgraphs. This clearly separates **Actors** (on the left/right boundaries) from the internal **System Boundary** containing operational Use Cases.

```mermaid
graph LR
    %% Actors
    subgraph Actors [Actors]
        Researcher[Researcher / Academic]
        Admin[Platform Administrator]
        Gemini[Gemini LLM API]
        ArXiv[ArXiv/External Catalogs]
    end

    %% ResearchOS Core System Boundary
    subgraph SystemBoundary [ResearchOS System Boundary]
        UC_Auth(Manage Account & Auth)
        UC_ManageProj(Create/Manage Projects)
        UC_UploadPaper(Upload Research Papers & PDFs)
        UC_AutoIngest(Trigger External Catalog Fetch)
        UC_SearchPaper(Semantic Semantic & Retrieval)
        UC_Annotate(Write/Link Project Notes)
        UC_Graph(Explore AI-Extracted Knowledge Graph)
        UC_Summary(Generate Multi-Paper Report/Review)
        UC_Trend(Analyze Research Trends)
        UC_Monitor(Monitor Agent Tasks)
    end

    %% Actor to Use Case Mappings
    Researcher --> UC_Auth
    Researcher --> UC_ManageProj
    Researcher --> UC_UploadPaper
    Researcher --> UC_SearchPaper
    Researcher --> UC_Annotate
    Researcher --> UC_Graph
    Researcher --> UC_Summary
    Researcher --> UC_Trend

    Admin --> UC_Monitor

    %% External System Connections
    UC_AutoIngest --> ArXiv
    UC_SearchPaper --> Gemini
    UC_Summary --> Gemini
    UC_Graph --> Gemini
    UC_AutoIngest --> UC_UploadPaper
```

---

## 2. Class Diagram

This class diagram represents the static, object-oriented data structures inside ResearchOS. It models entity relationships, core properties, access modifiers, and operational methods.

```mermaid
classDiagram
    direction TB
    
    class User {
        +UUID id
        +String email
        +String passwordHash
        +String fullName
        +UserRole role
        +DateTime createdAt
        +register() Boolean
        +login() String
        +updateProfile() Boolean
    }

    class Project {
        +UUID id
        +UUID userId
        +String title
        +String description
        +DateTime createdAt
        +create() Project
        +delete() Boolean
        +exportReport() File
    }

    class ResearchPaper {
        +UUID id
        +String title
        +String[] authors
        +String journal
        +Date publicationDate
        +String doi
        +String url
        +String abstract
        +ingestPDF() Boolean
        +parseMetadata() Object
    }

    class Embedding {
        +UUID id
        +UUID paperId
        +Integer chunkIndex
        +String chunkText
        +Float[] vector
        +generateVector() Float[]
    }

    class Summary {
        +UUID id
        +UUID paperId
        +String summaryText
        +JSON keyTakeaways
        +String methodology
        +generateSummary() Summary
    }

    class Note {
        +UUID id
        +UUID userId
        +UUID projectId
        +UUID paperId
        +String content
        +save() Boolean
        +linkToNode() Boolean
    }

    class KnowledgeGraphNode {
        +UUID id
        +UUID projectId
        +String label
        +String type
        +JSON properties
        +createNode() KnowledgeGraphNode
    }

    class KnowledgeGraphRelation {
        +UUID id
        +UUID projectId
        +UUID sourceNodeId
        +UUID targetNodeId
        +String relationType
        +JSON properties
        +connectNodes() Boolean
    }

    class AgentTask {
        +UUID id
        +UUID projectId
        +String taskType
        +TaskStatus status
        +JSON parameters
        +JSON result
        +execute() Boolean
        +updateStatus() Boolean
    }

    %% Class Associations
    User "1" -- "0..*" Project : owns
    User "1" -- "0..*" Note : writes
    Project "1" -- "0..*" Note : groups
    Project "1" -- "0..*" AgentTask : schedules
    Project "1" -- "0..*" KnowledgeGraphNode : contains
    Project "1" -- "0..*" KnowledgeGraphRelation : contains
    ResearchPaper "1" -- "0..*" Embedding : chunks
    ResearchPaper "1" -- "1" Summary : has
    Note "0..*" -- "0..1" ResearchPaper : references
    KnowledgeGraphNode "1" -- "0..*" KnowledgeGraphRelation : acts_as_source
    KnowledgeGraphNode "1" -- "0..*" KnowledgeGraphRelation : acts_as_target
```

---

## 3. Sequence Diagram

This sequence diagram depicts the end-to-end flow for **Autonomous Research Ingestion & Graph Extraction**. It illustrates the dynamic message exchanges between the user interface, backend server, background agents, external databases, vector stores, and the Gemini API.

```mermaid
sequenceDiagram
    autonumber
    actor Researcher
    participant UI as React Client (Vite)
    participant Server as Express API Server
    participant Agent as Agent Execution Engine
    participant DB as PostgreSQL (3NF)
    participant Vector as pgvector (HNSW Index)
    participant Gemini as Gemini AI Service

    Researcher->>UI: Input paper DOI / search query
    UI->>Server: POST /api/projects/:id/tasks (Ingest Request)
    
    Server->>DB: INSERT INTO agent_tasks (status: 'pending')
    DB-->>Server: Return taskId
    Server-->>UI: Return 202 Accepted (taskId)
    UI->>UI: Show background progress indicator

    Note over Server,Agent: Background worker picks up task
    Server->>Agent: Spawn Task (taskId, parameters)
    Agent->>Agent: Query External Catalogs (ArXiv / Semantic Scholar)
    Agent-->>Agent: Fetch PDF binary & parse layout

    Agent->>DB: INSERT INTO research_papers (title, abstract, doi, authors)
    DB-->>Agent: Confirm save

    Agent->>Gemini: Request summary & key takeaways (Abstract + Text Chunks)
    Gemini-->>Agent: Return structured JSON (Key Takeaways, Methodology)
    Agent->>DB: INSERT INTO summaries (paper_id, summary_text, key_takeaways)

    Agent->>Gemini: Generate Embedding vectors for text chunks
    Gemini-->>Agent: Return array of float dimensions (1536)
    Agent->>Vector: INSERT INTO embeddings (paper_id, chunk_text, embedding)

    Agent->>Gemini: Extract entities and relation edges for Knowledge Graph
    Gemini-->>Agent: Return triples (Entity_A, RELATION, Entity_B)
    Agent->>DB: INSERT INTO knowledge_graph_nodes & relations

    Agent->>DB: UPDATE agent_tasks (status: 'completed', result)
    DB-->>Agent: Task closed

    UI->>Server: GET /api/projects/:id/tasks/:taskId (Polling or WebSockets)
    Server->>DB: Fetch task state
    DB-->>Server: Return status: 'completed'
    Server-->>UI: Return result status
    UI->>Researcher: Render newly updated interactive Knowledge Graph & Document list
```

---

## 4. Activity Diagram

This Activity Diagram models the dynamic operational workflows of ResearchOS's multi-agent report writer. It illustrates decision pathways, branching, and synchronous merges.

```mermaid
stateDiagram-v2
    [*] --> InitializeSynthesisTask
    
    state InitializeSynthesisTask {
        [*] --> FetchProjectContext
        FetchProjectContext --> RetrieveLinkedNotes
        RetrieveLinkedNotes --> QuerySimilarChunckEmbeddings
        QuerySimilarChunckEmbeddings --> AssembleSourcePayload
    }

    InitializeSynthesisTask --> EvaluatePayloadVolume
    
    state EvaluatePayloadVolume <<choice>>
    EvaluatePayloadVolume --> TruncateOrSegment : If Payload > Context Limit
    EvaluatePayloadVolume --> ForwardToAgent : If Payload fits inside context window
    
    state TruncateOrSegment {
        [*] --> RunMapReduceSummarization
        RunMapReduceSummarization --> RecombineIntermediateSummaries
    }
    
    TruncateOrSegment --> ForwardToAgent
    
    state ForwardToAgent {
        [*] --> GenerateLiteratureReview
        GenerateLiteratureReview --> GenerateSWOTAna_lysis
        GenerateSWOTAna_lysis --> SynthesizeMethodologies
    }

    ForwardToAgent --> AgentQualityCheck
    
    state AgentQualityCheck <<choice>>
    AgentQualityCheck --> RewritePrompt : Fail (Hallucinations or incomplete citations)
    AgentQualityCheck --> RenderDocument : Pass (Factual consistency high)

    state RewritePrompt {
        [*] --> InjectRefinedGuidelines
        InjectRefinedGuidelines --> ForwardToAgent
    }

    state RenderDocument {
        [*] --> CompileMarkdown
        CompileMarkdown --> InsertCitationFootnotes
    }

    RenderDocument --> SaveReportToDB
    SaveReportToDB --> [*]
```

---

## 5. Component Diagram

The component diagram details the physical organization and dependencies of the system modules.

```mermaid
graph TB
    subgraph ClientComponent [Client Tier - Single Page App]
        V_UI[Vite Single Page Application]
        C_Router[React Router Hooks]
        C_State[React Context State]
        C_Views[Layout Views / Pages]
        C_Vis[D3.js / Recharts Graphics]
    end

    subgraph ServerComponent [Application Server Tier]
        E_Server[Express.js App Router]
        M_Auth[Authentication Middleware]
        C_AgentTask[Agent Task Controller]
        C_Paper[Paper Ingestion Controller]
        C_Graph[Knowledge Graph Controller]
        A_Engine[Autonomous Agent Engine]
    end

    subgraph DataComponent [Data Infrastructure Tier]
        PG_DB[(PostgreSQL Core Relational Engine)]
        PG_Vec[(pgvector Semantic Memory)]
    end

    subgraph ExternalServices [Third Party API Tier]
        Gemini_API[Gemini LLM / Embeddings API]
        Academic_Catalogs[ArXiv / Crossref API]
    end

    %% Client and Server Communication
    V_UI -->|HTTPS Request| E_Server
    C_Router --> V_UI
    C_State --> C_Views
    C_Views --> V_UI
    C_Vis --> C_Views

    %% Server Internal Dependencies
    E_Server --> M_Auth
    E_Server --> C_AgentTask
    E_Server --> C_Paper
    E_Server --> C_Graph
    C_AgentTask --> A_Engine
    C_Paper --> A_Engine

    %% Server Data Mappings
    A_Engine -->|Execute SQL / Save Records| PG_DB
    A_Engine -->|Cosine Similarity Query| PG_Vec

    %% Server External Handshakes
    A_Engine -->|REST Requests| Academic_Catalogs
    A_Engine -->|SDK Callbacks| Gemini_API
```

---

## 6. Deployment Diagram

This deployment model maps the software components onto target execution environments, mirroring the containerized Cloud Run system constraints.

```mermaid
graph TD
    subgraph UserWorkstation [User Workstation]
        Browser[Modern Web Browser]
    end

    subgraph GoogleCloudRun [Google Cloud Platform - Cloud Run]
        subgraph ProxyContainer [Nginx Reverse Proxy Container]
            Port3000[Port 3000 Ingress Router]
        end

        subgraph FullStackContainer [Full-Stack Node.js Container]
            ViteDev[Vite Dynamic Dev Server]
            ExpressApp[Express.js Production Node Service]
        end
    end

    subgraph ManagedDatabase [GCP Cloud SQL - Dev Edition]
        PostgresContainer[PostgreSQL 16 Instance]
        PgVectorExtension[pgvector Extension Layer]
    end

    subgraph ExternalProvider [External Services Cloud]
        GeminiService[Google Gemini AI Backend]
        MetadataService[Academic Metadata Catalogs]
    end

    %% Network Connections
    Browser -->|HTTPS/TLS Port 443| Port3000
    Port3000 -->|Proxy Pass Internal| ViteDev
    Port3000 -->|Proxy Pass Internal| ExpressApp

    ExpressApp -->|Intra-VPC TLS Connection| PostgresContainer
    PostgresContainer --> PgVectorExtension

    ExpressApp -->|Outgoing HTTPS Call| GeminiService
    ExpressApp -->|Outgoing HTTPS Call| MetadataService
```
