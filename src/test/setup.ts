import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Initialize a global array to track all fetched URLs and returned data for test assertion debugging
(global as any).fetchedUrls = [];

// Mock values for global use
const mockTasks = [
  {
    id: 'task_1',
    project_id: 'proj_123',
    task_type: 'gap_analyzer',
    status: 'completed',
    parameters: { topic: 'Attention mechanism' },
    result: { done: true },
    created_at: '2026-06-24T01:28:19-07:00',
    updated_at: '2026-06-24T01:28:19-07:00'
  },
  {
    id: 'task_2',
    project_id: 'proj_123',
    task_type: 'literature_reviewer',
    status: 'running',
    parameters: { topic: 'review transformers' },
    result: {},
    created_at: '2026-06-24T01:28:19-07:00',
    updated_at: '2026-06-24T01:28:19-07:00'
  }
];

const mockGaps = {
  limitations: [{ id: 'gap_1', description: 'Limited context length' }],
  future_work: [{ id: 'gap_2', description: 'Linear attention alternatives' }],
  novelties: [{ id: 'gap_3', description: 'Self-attention mechanism' }],
  opportunities: [{ id: 'gap_4', description: 'Hardware acceleration' }]
};

const mockGraph = {
  nodes: [{ id: 'node_1', label: 'Transformer' }, { id: 'node_2', label: 'Attention' }],
  relations: [{ source: 'node_1', target: 'node_2', type: 'USES' }]
};

const mockPapers = [
  {
    id: 'paper_1',
    project_id: 'proj_123',
    title: 'Attention Is All You Need',
    authors: ['Vaswani', 'Shazeer', 'Parmar'],
    journal: 'NeurIPS',
    publication_date: '2017',
    doi: '10.1111/test',
    url: 'https://test.com',
    abstract: 'The dominant sequence transduction models...',
    pdf_path: '/pdfs/transformer.pdf',
    vector_status: 'ready',
    created_at: '2026-06-24T01:28:19-07:00'
  }
];

const mockRAGResponse = {
  answer: "Literature synthesis indicates that self-attention is highly scalable.",
  sources: [
    {
      citation_key: "vaswani2017",
      citation: {
        paper_id: "paper_1",
        title: "Attention Is All You Need",
        authors: ["Vaswani et al."]
      },
      chunk_index: 0,
      text: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.",
      score: 0.95
    }
  ]
};

const mockTrends = {
  trends: [
    { term: "Transformer", weight: 1.0, count: 42 },
    { term: "Attention", weight: 0.8, count: 35 }
  ]
};

// Robust fetch mock with URL logging
const fetchMock = vi.fn().mockImplementation((url, options) => {
  const urlStr = (typeof url === 'string' ? url : url?.url || '').toString();
  
  let data: any = [];
  if (urlStr.includes('/tasks')) {
    data = mockTasks;
  } else if (urlStr.includes('/gap-analysis') || urlStr.includes('/analyze')) {
    data = mockGaps;
  } else if (urlStr.includes('/graph')) {
    data = mockGraph;
  } else if (urlStr.includes('/papers') || (urlStr.includes('/project/') && urlStr.includes('/papers'))) {
    data = mockPapers;
  } else if (urlStr.includes('/rag/query')) {
    data = mockRAGResponse;
  } else if (urlStr.includes('/trends')) {
    data = mockTrends;
  } else {
    data = {
      limitations: [],
      future_work: [],
      novelties: [],
      opportunities: [],
      nodes: [],
      relations: []
    };
  }

  (global as any).fetchedUrls.push({ url: urlStr, data });

  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as any);
});

global.fetch = fetchMock;
window.fetch = fetchMock;
globalThis.fetch = fetchMock;

// Mock ResizeObserver which is not present in standard jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;

// Mock window.matchMedia which is sometimes needed by component libraries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
