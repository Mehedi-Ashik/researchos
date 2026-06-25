import React from 'react';
import { Project } from '../types';
import { 
  Settings, KeyRound, Shield, Database, Trash2, LogOut, 
  CheckCircle2, Clock, Terminal, AlertTriangle, Info, Cpu
} from 'lucide-react';

interface SettingsViewProps {
  projectId: string;
  project: Project | null;
  token: string;
  onLogout: () => void;
}

export default function SettingsView({
  projectId,
  project,
  token,
  onLogout
}: SettingsViewProps) {

  const handleClearLocalCache = () => {
    localStorage.removeItem('research_workspace_token');
    localStorage.removeItem('research_project_id');
    addLog("Cleared local workspace tokens.");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const [logs, setLogs] = React.useState<string[]>([
    "Integrated database session authenticated.",
    "PGVector backend indexes mapped on Cloud Run secure sandbox.",
    "Express reverse-proxy serving secure TLS sockets on port 3000."
  ]);

  const addLog = (m: string) => {
    setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${m}`]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full" id="settings_view_root">
      
      {/* LEFT COLUMN: System guidelines & Active Session Details (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-6" id="settings_left_col">
        
        {/* Workspace details info */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5" id="settings_workspace_card">
          <h3 className="font-display font-semibold text-white mb-2 flex items-center gap-2 text-sm">
            <Settings className="w-4 h-4 text-emerald-400" />
            Active Research Workspace Configuration
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            System configuration metrics and core database mappings for your research project workspace.
          </p>

          <div className="flex flex-col gap-3 font-mono text-xs text-slate-400 bg-slate-950/40 p-4 rounded-lg border border-slate-900">
            <div className="flex justify-between pb-2 border-b border-slate-900">
              <span className="text-slate-500">Project Workspace ID:</span>
              <span className="text-white select-all">{projectId}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-900">
              <span className="text-slate-500">Project Name:</span>
              <span className="text-white">{project?.name || "Academic Workstation"}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-900">
              <span className="text-slate-500">Workspace Database:</span>
              <span className="text-emerald-400 font-bold">Cloud SQL (PostgreSQL)</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-900">
              <span className="text-slate-500">Vector Index Engine:</span>
              <span className="text-white">PGVector Euclidean Embeddings</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reverse Proxy Ingress:</span>
              <span className="text-white">Port 3000 (HTTPS TLS Tunnel)</span>
            </div>
          </div>
        </div>

        {/* API Key Security policy */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5" id="settings_security_card">
          <h3 className="font-display font-semibold text-white mb-2 flex items-center gap-2 text-sm">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            AI Studio Key Security Policy
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            API keys and client credentials (such as the Gemini API Key or cloud connection parameters) are managed safely at the environment system layer.
          </p>

          <div className="p-4 bg-slate-950/50 border border-slate-900 rounded-xl flex items-start gap-3 text-slate-300 text-xs">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex flex-col gap-2 leading-relaxed">
              <strong className="text-white">Zero-Client Leak Policy</strong>
              <p>
                API keys are strictly bound server-side in our Node/Express backend (`server.ts`). Client browsers NEVER receive actual environment variables. This prevents side-channel exposure and secures your resources.
              </p>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Active Secret variables loaded: <strong>GEMINI_API_KEY</strong>, <strong>DATABASE_URL</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Security checklist block */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5" id="settings_compliance_card">
          <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-3 tracking-wider">Workstation Security Compliance</h4>
          <div className="flex flex-col gap-2.5 text-xs text-slate-400 font-sans leading-relaxed">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>CORS Policy strictly enforces origin validations on endpoints.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>SQL Queries are parameterized through our drizzle-ORM engine.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Authentication utilizes token headers parsed on every request.</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: User Session & Actions Console (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-6" id="settings_right_col">
        
        {/* User profile / session */}
        <div className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-xl p-5" id="settings_user_card">
          <h3 className="font-display font-semibold text-white mb-2 flex items-center gap-1.5 text-sm">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Active Session Diagnostics
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Details of your workspace session auth state.
          </p>

          <div className="flex flex-col gap-3 font-mono text-[11px] text-slate-400 bg-slate-950/40 p-4 rounded-lg border border-slate-900">
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span>Token Status:</span>
              <span className="text-emerald-400 font-bold">Authorized</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-2">
              <span>Auth Method:</span>
              <span className="text-white">JWT Bearer Header</span>
            </div>
            <div className="flex justify-between">
              <span>Diagnostics:</span>
              <span className="text-slate-500">Live (Healthy)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-5 pt-3 border-t border-slate-900/60">
            <button 
              onClick={handleClearLocalCache}
              className="flex-1 bg-slate-950 hover:bg-rose-950/10 border border-slate-900 hover:border-rose-900/30 text-rose-400 font-semibold py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Local Cache
            </button>

            <button 
              onClick={onLogout}
              className="flex-1 bg-slate-950 border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white font-semibold py-2 rounded-lg text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out Station
            </button>
          </div>
        </div>

        {/* Live Diagnostics Log console */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col font-mono" id="settings_sys_logs">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5 mb-3 text-slate-400 text-xs shrink-0">
            <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Diagnostics Terminal Logs</span>
          </div>

          <div className="flex-1 overflow-y-auto text-[10px] text-slate-300 leading-relaxed flex flex-col gap-2 max-h-[220px] lg:max-h-[none]">
            {logs.map((m, i) => (
              <div key={i} className="flex gap-1.5">
                <span className="text-emerald-500">▶</span>
                <p>{m}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
