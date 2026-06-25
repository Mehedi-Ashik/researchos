# ResearchOS User Manual 📓
## Operating Guidelines for Research Ingestion, Synthesis, & Extraction

ResearchOS is a comprehensive, interactive workspace tailored to accelerate scientific research. This manual guides you through operating all the major functional workspaces of the application.

---

## 🌌 Navigating the Workspace

The workstation features a sidebar menu with five central modes of operation:
1.  **Dashboard**: Live workspace analytics and high-level project telemetry.
2.  **PDF Ingestion**: Bulk PDF uploads, document parsing, and semantic chunking.
3.  **Synthesis Chat**: Dynamic, cited retrieval-augmented chat over your PDF corpus.
4.  **Gap Analysis**: AI-powered logical contradiction and conceptual missing-link analysis.
5.  **Agent Workstation**: Multi-agent task execution and interactive knowledge graphs.

---

## 📈 1. Interactive Dashboard
The **Dashboard** is your primary analytical command deck. 

*   **System Analytics**: View high-level metrics including total *Ingested Papers*, discovered *Knowledge Entities*, extracted *Research Gaps*, and completed *Autonomous Agent Tasks*.
*   **Active Project Configuration**: The top panel displays the name, DOI, and abstract context of your active project workspace.
*   **Workflow Navigation Cards**: Use the sequential workflow cards at the bottom of the dashboard to easily jump between primary execution steps:
    1.  *Ingest PDF Literature* (Workspace tab)
    2.  *Q&A Synthesis Chat* (Chat tab)
    3.  *Examine Structural Gaps* (Gap Analysis tab)
    4.  *Run Autonomous Agents* (Agent tab)

---

## 📥 2. PDF Ingestion & Workspace
The Ingestion view is where you feed literature into the vector engine.

### How to Ingest a Research Paper:
1.  Navigate to the **Workspace** tab.
2.  Either drag and drop a PDF file onto the designated area or click to select a PDF from your local computer.
3.  Fill out the Metadata parameters (optional):
    *   **DOI**: Useful for automated schema syncing.
    *   **Journal / Venue**: e.g., *NeurIPS*, *ICML*, *Nature*.
    *   **Publication Date**: e.g., *2024*.
4.  Click **Upload & Index**.
5.  *Under the Hood*: The platform extracts text from the PDF, splits it into semantic paragraphs (chunking), passes each chunk through the Google Gemini Embedding engine, and stores the vectors and texts inside your PostgreSQL `pgvector` database.

---

## 💬 3. Synthesis Chat (Advanced RAG)
The Chat view allows you to interview your academic library directly.

*   **Asking Questions**: Type research-related questions such as *"What are the main limitations identified in the Transformer architecture?"* or *"Compare the performance of Model A vs Model B."*
*   **Semantic Retrieval**: The engine computes embeddings for your query, searches PostgreSQL for matching document paragraphs, and prompts Gemini to draft an answer based strictly on retrieved texts.
*   **Source Citations**: Every generated response includes dynamic footnotes linking to the exact page, section, and original paper. Hover over citations to review source snippets.
*   **Summarizer Panel**: The right sidebar compiles a bulleted, auto-updated executive summary of the entire chat session.

---

## 🔍 4. AI-Driven Gap Analysis
The Gap Analysis engine extracts latent academic opportunities by examining logical inconsistencies or assumptions across your ingested papers.

*   **Conceptual Gaps**: Displays identified areas of study where current research is thin, lacking robust data, or conceptually incomplete.
*   **Contradictions**: Lists opposing conclusions found between different papers (e.g., *Paper X claims Parameter-Efficient Fine-Tuning degrades calibration, whereas Paper Y reports calibration is preserved*).
*   **Extracted Assumptions**: Surfaces underlying theoretical assumptions that have not yet been empirically validated.
*   **Adding Gaps manually**: You can click **Add Conceptual Gap** to record your own hypotheses and map them alongside AI-extracted results.

---

## 🤖 5. Agent Workstation & Knowledge Graph
The Agent Workstation combines autonomous AI agents with network graphs.

### Operating the Knowledge Graph:
*   **Entity Nodes**: Represents conceptual targets (e.g., "Transformer", "DPO Fine-Tuning", "Calibration Error") categorized as *Models*, *Metrics*, *Datasets*, or *Theories*.
*   **Relational Links**: Directed arrows representing causal or structural interactions (e.g., *implements*, *optimizes*, *contradicts*, *evaluates*).
*   **Interaction**: Hover over nodes to highlight neighbors. Drag nodes to reshape the interactive 3D/2D visual workspace.

### Launching Autonomous Agent Tasks:
1.  Navigate to the **Multi-Agent Tasks** panel.
2.  Click **Create New Task**.
3.  Select a Task Category:
    *   *Literature Review Generation*
    *   *Triangulate Contradictions*
    *   *Trend Mapping*
4.  Specify parameters (target project context, depth).
5.  Click **Execute Autonomous Agent**.
6.  *Task Telemetry*: Watch agents spin up background threads (managed in Python FastAPI) and transition through states (`Pending` ➡️ `Running` ➡️ `Completed` or `Failed`). Once finished, view the generated rich markdown reports.
