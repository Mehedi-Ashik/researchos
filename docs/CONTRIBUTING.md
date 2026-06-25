# Contributing to ResearchOS 🤝

Thank you for your interest in contributing to ResearchOS! We welcome contributions from researchers, software engineers, and machine learning practitioners.

To maintain our standards of quality, security, and visual alignment, please review and adhere to the guidelines outlined below.

---

## 🎨 Design & Styling Guidelines

We place extreme care on visual quality, spacing, and UI craftsmanship. 

1.  **Tailwind CSS Only**: All component styles **MUST** use inline Tailwind utility classes. Do not write custom `.css` stylesheets or inline CSS `style={...}` objects.
2.  **Color Palette Harmony**: Maintain the unified high-contrast dark visual theme:
    *   Canvas Base: `bg-slate-950`
    *   Card Surface: `bg-slate-900/40` with borders `border-slate-900`
    *   Primary Text: `text-white`
    *   Accents: Emerald Green (`text-emerald-400`, `bg-emerald-500/10`) for status indicators and active states.
3.  **Typography**: 
    *   Display Headings: Pair heavy sans-serif fonts with subtle letter-spacing reduction (`tracking-tight`).
    *   Telemetry & Data: Always wrap identifiers, dates, and numbers in monospace styling (`font-mono text-xs`).
4.  **Icons**: 
    *   Always import icons exclusively from the **`lucide-react`** package.
    *   **Do not** introduce raw SVG inline elements, and do not install alternative icon libraries (such as FontAwesome or Material Icons).

---

## 💻 Coding Standards & Quality

### TypeScript Rules
*   **No Implicit `any`**: Ensure strict type declarations. Always represent response payloads using structured interfaces in `src/types.ts`.
*   **Functional Components**: Write React UI exclusively using functional components with state hooks. Class components are strictly prohibited.
*   **Hook Safety**: Prevent re-render loops in `useEffect` blocks. Avoid passing complex objects or arrays as dependency arguments.

### Python Rules
*   **PEP 8 Compliance**: Follow strict PEP 8 formatting rules.
*   **Type Hinting**: All function signatures **MUST** include input type hints and return annotations:
    ```python
    def parse_citation(doi: str) -> dict[str, Any]:
        ...
    ```
*   **FastAPI Best Practices**: Utilize Pydantic schemas for data validation on all incoming query requests and responses.

---

## 🍴 Contribution Workflow

### 1. Branch Strategy
We use a structured branching scheme. Name your branches based on the contribution category:
*   `feature/new-agent-workflow` (adding capabilities)
*   `bugfix/resolve-pdf-rendering` (correcting issues)
*   `docs/api-specs-update` (updating docs)

### 2. Commit Message Guidelines
Use clear, imperative, descriptive verbs for commit titles:
*   `feat: integrate Alembic migrations for knowledge nodes`
*   `fix: resolve race conditions on upload file handles`
*   `docs: update API endpoints definitions`

### 3. Creating Pull Requests
Ensure your branch is fully updated with the main branch:
1.  Run the full test suite locally:
    ```bash
    npm run test
    ```
2.  Confirm the app compiles clean:
    ```bash
    npm run build
    ```
3.  Submit a Pull Request targeting the `main` branch. Provide a comprehensive summary detailing the functional changes and visual impact of your modifications.
