import React, { useState } from 'react';
import { RAGQueryResponse, CitationSource } from '../types';
import { 
  Sparkles, MessageSquare, Loader2, BookOpen, Quote, 
  Trash2, HelpCircle, ArrowUpRight, Send, CheckCircle2, FileText
} from 'lucide-react';

interface ChatInterfaceViewProps {
  projectId: string;
  token: string;
}

const PROMPT_SUGGESTIONS = [
  "What methodology bottlenecks are outlined?",
  "What datasets are evaluated or utilized?",
  "Summarize key future research directions.",
  "What were the novel breakthroughs of the authors?"
];

export default function ChatInterfaceView({
  projectId,
  token
}: ChatInterfaceViewProps) {
  const [chatQuery, setChatQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ 
    role: 'user' | 'assistant'; 
    text: string; 
    sources?: CitationSource[] 
  }>>([
    {
      role: 'assistant',
      text: "Hello! I am your AI Research Assistant powered by Gemini and PGVector. I can perform grounded literature synthesis across your ingested publications. Ask me any analytical question, and I will back up my answers with verified source citations."
    }
  ]);

  const handleRAGQuery = async (queryText: string) => {
    if (!queryText.trim() || chatLoading) return;

    setChatLoading(true);
    setChatQuery('');
    
    // Append user message
    setChatHistory(prev => [...prev, { role: 'user', text: queryText }]);

    try {
      const response = await fetch('/api/v1/rag/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          project_id: projectId,
          query_text: queryText,
          limit: 5,
          hybrid_alpha: 0.5,
          enable_compression: true
        })
      });

      if (!response.ok) {
        throw new Error('RAG synthesis query pipeline failed');
      }

      const data: RAGQueryResponse = await response.json();
      
      // Append assistant message with sources
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        text: data.answer, 
        sources: data.sources 
      }]);
    } catch (error: any) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        text: `Error conducting literature synthesis: ${error.message || 'Server timeout'}` 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRAGQuery(chatQuery);
  };

  const clearChat = () => {
    setChatHistory([
      {
        role: 'assistant',
        text: "Conversation reset. Enter a literature query to generate semantic answers with inline quotes."
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-190px)] min-h-[550px]" id="chat_view_root">
      
      {/* LEFT COLUMN: Prompt assistance panel & configurations (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6" id="chat_left_assistance">
        
        {/* Suggestion Prompts */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 shadow-sm" id="chat_prompt_suggester">
          <h3 className="font-serif font-semibold text-stone-900 mb-2 flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-stone-600 animate-pulse" />
            Suggested Research Prompts
          </h3>
          <p className="text-xs text-stone-500 mb-4 leading-relaxed">
            Click any curated prompt below to trigger a vector scan across your papers.
          </p>

          <div className="flex flex-col gap-2.5">
            {PROMPT_SUGGESTIONS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleRAGQuery(prompt)}
                disabled={chatLoading}
                className="w-full text-left bg-stone-50 hover:bg-stone-100 border border-stone-200 p-3 rounded-lg text-xs text-stone-700 hover:text-stone-900 transition-all cursor-pointer flex justify-between items-start gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              >
                <span>{prompt}</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Quality control guidelines */}
        <div className="bg-white border border-stone-200/80 rounded-xl p-5 flex-1 flex flex-col justify-between shadow-sm" id="chat_instructions_card">
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase text-stone-500 tracking-wider">Literature Q&A Pipeline Specs</h4>
            <div className="flex flex-col gap-3.5 text-[11px] text-stone-600 font-sans leading-relaxed">
              <p>
                <strong>Cosine Similarity check:</strong> Supports automated context indexing using embeddings. Matches text-tokens to minimize hallucinations.
              </p>
              <p>
                <strong>Grounded References:</strong> All responses append verifiable supporting quotes from actual paper passages.
              </p>
            </div>
          </div>

          <button 
            onClick={clearChat}
            className="w-full bg-stone-50 hover:bg-red-50/40 border border-stone-200 hover:border-red-200/50 text-stone-600 hover:text-red-700 font-semibold py-2.5 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-4 shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Chat Conversation
          </button>
        </div>

      </div>

      {/* RIGHT COLUMN: Interactive Chat log container (8 cols) */}
      <div className="lg:col-span-8 bg-white border border-stone-200/80 rounded-xl p-5 flex flex-col h-full overflow-hidden shadow-sm" id="chat_log_main">
        
        {/* Chat top info */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4 shrink-0">
          <div>
            <h3 className="font-serif font-semibold text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-stone-600" />
              Literature Synthesis Chatbot
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Stateful research conversation with automated source lookup.
            </p>
          </div>
          <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/60 px-2.5 py-0.5 rounded-full uppercase shrink-0 tracking-wider">
            Secure RAG Active
          </span>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 mb-4" id="chat_scroller">
          {chatHistory.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] rounded-xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-stone-100 border border-stone-200/80 text-stone-950 self-end shadow-[0_1px_2px_rgba(0,0,0,0.01)]' 
                  : 'bg-stone-50/50 border border-stone-200/60 text-stone-800 self-start shadow-[0_1px_3px_rgba(0,0,0,0.01)]'
              }`}
            >
              <span className="text-[9px] font-semibold text-stone-400 mb-1">
                {msg.role === 'user' ? 'RESEARCHER' : 'AI ASSISTANT'}
              </span>
              
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>

              {/* Citations block */}
              {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3.5 border-t border-stone-200/60">
                  <span className="text-[9px] font-sans font-semibold text-stone-500 block mb-2 tracking-wide uppercase">
                    VERIFIED RETRIEVED SOURCES:
                  </span>
                  <div className="flex flex-col gap-2.5">
                    {msg.sources.map((src, sIdx) => (
                      <div key={sIdx} className="p-3 bg-white rounded-lg border border-stone-200/80 text-[11px] hover:border-stone-400 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                        <div className="flex items-center justify-between font-sans text-stone-500 mb-1.5 pb-1 border-b border-stone-100">
                          <span className="text-stone-700 font-semibold truncate max-w-[200px] font-serif">
                            {src.citation_key} {src.citation.title}
                          </span>
                          <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 rounded border border-stone-200/60 font-medium">
                            Score: {(src.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-stone-600 italic font-serif leading-relaxed pl-2 border-l border-stone-200">
                          "{src.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-stone-500 self-start max-w-[80%] flex items-center gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
              <Loader2 className="w-4 h-4 animate-spin text-stone-500 shrink-0" />
              <span className="text-xs font-medium">Scanning semantic database and synthesizing response...</span>
            </div>
          )}
        </div>

        {/* Input prompt form */}
        <form onSubmit={onFormSubmit} className="flex gap-2.5 mt-auto shrink-0 pb-1">
          <input 
            type="text" 
            placeholder="Ask a deep research question across your papers..." 
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            disabled={chatLoading}
            className="flex-1 bg-stone-50/50 border border-stone-200 focus:bg-white focus:border-stone-400 rounded-lg px-4 py-3 text-xs text-stone-950 placeholder-stone-400 focus:outline-none font-sans shadow-inner transition-all" 
          />
          <button 
            type="submit"
            disabled={chatLoading || !chatQuery.trim()}
            className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white font-semibold px-5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
          >
            {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send
          </button>
        </form>

      </div>

    </div>
  );
}
