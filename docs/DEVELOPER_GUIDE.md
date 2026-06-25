# ResearchOS Developer Guide 💻
## Technical Manual on Modifying, Extending, & Troubleshooting

This guide assists engineers in extending the ResearchOS platform, adding new views, creating custom API endpoints, and resolving standard environment issues.

---

## 🛠️ 1. Adding a New API Endpoint in FastAPI

The Python backend is structured modularly. Follow these steps to register a new endpoint:

### Step 1: Create or Edit Endpoint Files
Navigate to `fastapi-backend/app/api/v1/endpoints/`. If adding a new domain, create a new `.py` file (e.g., `analytics.py`):

```python
# fastapi-backend/app/api/v1/endpoints/analytics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter()

@router.get("/metrics")
async def get_workstation_metrics(db: Session = Depends(get_db)):
    # Your business/database logic here
    return {"calculated_papers": 10, "indexing_queue": 0}
```

### Step 2: Register Router in API Root
Open `fastapi-backend/app/api/v1/api.py` and register your new router:

```python
# fastapi-backend/app/api/v1/api.py
from fastapi import APIRouter
from app.api.v1.endpoints import auth, papers, rag, gap_analysis, agents, analytics # <-- Import here

api_router = APIRouter()
# ... existing routes ...
api_router.include_router(analytics.router, prefix="/analytics", tags=["System Analytics"]) # <-- Register here
```

---

## 🎨 2. Adding a New UI Tab / Component in React

The React single-page application uses a high-contrast layout and modular tabs.

### Step 1: Create your component
Create a new file in `src/components/` (e.g., `AnalyticsView.tsx`):

```tsx
// src/components/AnalyticsView.tsx
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AnalyticsViewProps {
  projectId: string;
  token: string;
}

export default function AnalyticsView({ projectId, token }: AnalyticsViewProps) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch(`/api/v1/analytics/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setData(data));
  }, [projectId, token]);

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-6" id="analytics_view">
      <h3 className="font-display font-bold text-lg text-white mb-4">Bibliometric Telemetry</h3>
      {/* Dynamic visualizations using Recharts */}
    </div>
  );
}
```

### Step 2: Register in App.tsx
Open `src/App.tsx`, import your new component, add it to your routing/tab state, and include it in the sidebar sidebar container.

---

## 🧪 3. Running & Writing Tests

We use **Vitest** for testing frontend React interactions and mocks.

### Executing Tests
To run the complete test suite locally:
```bash
npm run test
```

### Writing a new Vitest Test
Create files with `.test.tsx` inside `src/test/`. Here is a standard integration test template:

```tsx
// src/test/AnalyticsView.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsView from '../components/AnalyticsView';

describe('AnalyticsView', () => {
  it('renders title heading correctly', () => {
    render(<AnalyticsView projectId="proj_123" token="mock_token" />);
    expect(screen.getByText('Bibliometric Telemetry')).toBeInTheDocument();
  });
});
```

---

## 🔍 4. Troubleshooting Common Issues

### Issue A: "FastAPI backend server is starting up or temporarily offline."
*   **Root Cause**: The Node.js Express server is up, but the spawned Python process has either crashed, is failing migrations, or is taking longer than expected to bind to port `8000`.
*   **Fix**: Check your terminal logs for any Python tracebacks. If you are running locally without Docker, verify you activated the virtual environment and installed all dependencies:
    ```bash
    cd fastapi-backend
    source venv/bin/activate
    pip install -r requirements.txt
    ```

### Issue B: "Relation 'paper_embeddings' does not exist"
*   **Root Cause**: The database is connected, but structural migrations have not been applied yet.
*   **Fix**: Run database migrations manually using Alembic:
    ```bash
    cd fastapi-backend
    source venv/bin/activate
    alembic upgrade head
    ```

### Issue C: Gemini API Calls Fail / Timeout
*   **Root Cause**: The environment variable `GEMINI_API_KEY` is missing, invalid, or has exceeded rate limits.
*   **Fix**: Verify your `.env` contains a valid key. Test your key standalone:
    ```bash
    curl -H "Content-Type: application/json" \
         -d '{"contents":[{"parts":[{"text":"Explain quantum computing"}]}]}' \
         "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY"
    ```
