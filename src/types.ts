export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  journal?: string;
  publication_date?: string;
  doi?: string;
  url?: string;
  abstract?: string;
}

export interface ResearchGap {
  id: string;
  project_id: string;
  paper_id?: string;
  gap_type: 'limitation' | 'future_work' | 'novelty' | 'opportunity';
  title: string;
  description: string;
  original_text_quote?: string;
  severity_score: number;
  feasibility_score: number;
  strategy?: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  description: string;
}

export interface AgentTask {
  id: string;
  project_id: string;
  task_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: Record<string, any>;
  result: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  paper_id: string;
  title: string;
  authors: string[];
  doi?: string;
  url?: string;
}

export interface CitationSource {
  citation_key: string;
  citation: Citation;
  chunk_index: number;
  text: string;
  score: number;
}

export interface RAGQueryResponse {
  answer: string;
  sources: CitationSource[];
}
