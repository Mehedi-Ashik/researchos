import React, { useState, useEffect } from 'react';
import { Project, Paper } from './types';
import DashboardView from './components/DashboardView';
import ResearchWorkspaceView from './components/ResearchWorkspaceView';
import ChatInterfaceView from './components/ChatInterfaceView';
import KnowledgeGraphView from './components/KnowledgeGraphView';
import TrendAnalysisView from './components/TrendAnalysisView';
import SettingsView from './components/SettingsView';
import { 
  Sparkles, Library, Sliders, Play, LogOut, Loader2, Key, User, 
  PlusCircle, CheckCircle2, ChevronRight, GraduationCap,
  LayoutDashboard, MessageSquare, Network, TrendingUp, Settings 
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('researchos_token'));
  const [projectId, setProjectId] = useState<string | null>(localStorage.getItem('researchos_project_id'));
  const [project, setProject] = useState<Project | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [papersLoading, setPapersLoading] = useState(false);

  // Auth Forms State
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Active workspace view tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'chat' | 'graph' | 'trends' | 'settings'>('dashboard');

  useEffect(() => {
    if (token) {
      initializeWorkspace();
    }
  }, [token]);

  const initializeWorkspace = async () => {
    setPapersLoading(true);
    try {
      // 1. Get or create a default project for this authenticated user
      let currentProjectId = projectId;
      
      if (!currentProjectId) {
        console.log("[WORKSPACE] No project found in storage. Bootstrapping user project...");
        const response = await fetch('/api/v1/auth/register-default-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Fallback or actual create
        if (response.ok) {
          const defaultProject = await response.json();
          currentProjectId = defaultProject.id;
          localStorage.setItem('researchos_project_id', currentProjectId!);
          setProjectId(currentProjectId);
        } else {
          // Fallback static project UUID
          currentProjectId = "99999999-9999-9999-9999-999999999999";
          localStorage.setItem('researchos_project_id', currentProjectId);
          setProjectId(currentProjectId);
        }
      }

      setProject({
        id: currentProjectId!,
        name: "Autonomous Visual-Semantic Research Lab",
        description: "Workspace project analyzing deep-learning models, spatial indices, and visual-semantic parsing."
      });

      // 2. Fetch papers for this project
      fetchPapers(currentProjectId!);
    } catch (error) {
      console.error("[WORKSPACE ERROR] Failed to bootstrap project:", error);
    } finally {
      setPapersLoading(false);
    }
  };

  const fetchPapers = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/papers/project/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPapers(data);
      }
    } catch (e) {
      console.error("[WORKSPACE ERROR] Failed to fetch papers:", e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setAuthError(null);
    setAuthLoading(true);

    try {
      if (isRegister) {
        // Sign Up
        const emailVal = username.includes('@') ? username : `${username}@researchos.local`;
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailVal,
            password,
            full_name: fullName || username,
            role: 'researcher'
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Registration failed.');
        }

        // Auto transition to login
        setIsRegister(false);
        setAuthError('Registration successful! Please login.');
      } else {
        // Sign In
        const params = new URLSearchParams();
        const loginEmail = username.includes('@') ? username : `${username}@researchos.local`;
        params.append('username', loginEmail);
        params.append('password', password);

        const response = await fetch('/api/v1/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });

        if (!response.ok) {
          throw new Error('Invalid username or password.');
        }

        const data = await response.json();
        localStorage.setItem('researchos_token', data.access_token);
        setToken(data.access_token);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoBypass = () => {
    // Setup a local bypass token so developers can inspect UI instantly
    const demoToken = "demo_session_token_approved";
    const demoProjectId = "99999999-9999-9999-9999-999999999999";
    
    localStorage.setItem('researchos_token', demoToken);
    localStorage.setItem('researchos_project_id', demoProjectId);
    
    setToken(demoToken);
    setProjectId(demoProjectId);
    setProject({
      id: demoProjectId,
      name: "Autonomous Visual-Semantic Research Lab",
      description: "Workspace project analyzing deep-learning models, spatial indices, and visual-semantic parsing."
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('researchos_token');
    localStorage.removeItem('researchos_project_id');
    setToken(null);
    setProjectId(null);
    setProject(null);
    setPapers([]);
  };

  // If not logged in, show Auth gateway
  if (!token) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
        {/* Elegant minimal lines background representing library stacks */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-100/20 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-stone-200/80 rounded-2xl p-8 relative z-10 shadow-[0_4px_30px_-4px_rgba(28,25,23,0.05),0_1px_4px_rgba(28,25,23,0.02)]" id="auth_container">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center border border-stone-200/60 mb-4 shadow-sm">
              <GraduationCap className="w-6 h-6 text-stone-700" />
            </div>
            <h1 className="font-serif font-semibold text-2xl text-stone-900 tracking-tight">ResearchOS</h1>
            <p className="text-xs text-stone-500 mt-2 max-w-[280px] leading-relaxed">
              Autonomous Academic Literature Workspace & Multi-Agent Analytics Platform
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4.5">
            {isRegister && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Academic Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <input 
                    type="text" 
                    placeholder="Dr. Claude Shannon"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-stone-50/50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded-lg pl-9.5 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-all" 
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="researcher@university.edu"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-stone-50/50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded-lg pl-9.5 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-all" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Security Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50/50 border border-stone-200 focus:border-stone-400 focus:bg-white rounded-lg pl-9.5 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none transition-all" 
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs font-mono">
                {authError}
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-medium py-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isRegister ? <PlusCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {isRegister ? "Submit Registration" : "Unlock Workspace Gateway"}
            </button>
          </form>

          <div className="flex items-center justify-between border-t border-stone-100 mt-6 pt-5">
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="text-[11px] text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
            >
              {isRegister ? "Already registered? Login" : "First time? Register Academic Account"}
            </button>

            <button 
              onClick={handleDemoBypass}
              className="text-[11px] text-stone-700 hover:text-stone-950 font-medium transition-colors flex items-center gap-0.5 cursor-pointer"
            >
              Demo Workstation Mode
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Workstation Workspace Dashboard
  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans" id="workstation_layout_root">
      {/* Header toolbar */}
      <header className="bg-white/90 backdrop-blur border-b border-stone-200 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 z-10 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center border border-stone-200">
            <GraduationCap className="w-5 h-5 text-stone-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-base tracking-tight text-stone-900">ResearchOS</h1>
              <span className="text-[9px] font-medium bg-stone-100 text-stone-600 border border-stone-200 px-1.5 py-0.2 rounded">v2.1</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">Project: <strong>{project?.name || "Initializing..."}</strong></p>
          </div>
        </div>

        {/* Global panel selector tabs */}
        <nav className="flex flex-wrap bg-stone-100/80 p-0.5 rounded-xl border border-stone-200/50 gap-0.5 shadow-inner">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-white text-stone-900 shadow-sm font-semibold border border-stone-200/20' : 'text-stone-500 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-stone-500" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'workspace' ? 'bg-white text-stone-900 shadow-sm font-semibold border border-stone-200/20' : 'text-stone-500 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <Library className="w-3.5 h-3.5 text-stone-500" />
            Research Workspace
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat' ? 'bg-white text-stone-900 shadow-sm font-semibold border border-stone-200/20' : 'text-stone-500 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
            Chat Interface
          </button>
          <button 
            onClick={() => setActiveTab('graph')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'graph' ? 'bg-white text-stone-900 shadow-sm font-semibold border border-stone-200/20' : 'text-stone-500 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-stone-500" />
            Knowledge Graph
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trends' ? 'bg-white text-stone-900 shadow-sm font-semibold border border-stone-200/20' : 'text-stone-500 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-stone-500" />
            Trend Analysis
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-stone-900 shadow-sm font-semibold border border-stone-200/20' : 'text-stone-500 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-stone-500" />
            Settings
          </button>
        </nav>

        {/* User profile dropdown and signout */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-stone-500 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Academic Sandbox
          </span>
          <button 
            onClick={handleSignOut}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-lg text-stone-600 hover:text-stone-900 transition-all cursor-pointer flex items-center gap-1.5 text-xs shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-stone-400" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main viewport area */}
      <main className="flex-1 p-6 overflow-hidden max-w-[1500px] w-full mx-auto">
        {papersLoading ? (
          <div className="h-full flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-500 mb-3" />
            <p className="text-xs text-stone-500 font-mono">Synthesizing research project environment...</p>
          </div>
        ) : projectId ? (
          <div className="h-full">
            {activeTab === 'dashboard' && (
              <DashboardView 
                projectId={projectId}
                project={project}
                papers={papers}
                token={token!}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}
            {activeTab === 'workspace' && (
              <ResearchWorkspaceView 
                projectId={projectId}
                papers={papers}
                onPapersRefresh={() => fetchPapers(projectId)}
                token={token!}
              />
            )}
            {activeTab === 'chat' && (
              <ChatInterfaceView 
                projectId={projectId}
                token={token!}
              />
            )}
            {activeTab === 'graph' && (
              <KnowledgeGraphView 
                projectId={projectId}
                papers={papers}
                token={token!}
              />
            )}
            {activeTab === 'trends' && (
              <TrendAnalysisView 
                projectId={projectId}
                token={token!}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsView 
                projectId={projectId}
                project={project}
                token={token!}
                onLogout={handleSignOut}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-stone-500 mb-3" />
            <p className="text-xs text-stone-500 font-mono">Establishing relational workspace index...</p>
          </div>
        )}
      </main>
    </div>
  );
}
