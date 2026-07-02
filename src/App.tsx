import { useState, useEffect } from "react";
import RoleSelector from "./components/RoleSelector";
import PublicPortal from "./components/PublicPortal";
import OfficerPortal from "./components/OfficerPortal";
import SupervisorPortal from "./components/SupervisorPortal";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { Project, ProjectUpdate, AIAnalysis } from "./types";
import { ShieldAlert, BarChart3, Users, Landmark, FileCheck, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

export default function App() {
  const [currentRole, setCurrentRole] = useState<"citizen" | "officer" | "supervisor">("citizen");
  const [projects, setProjects] = useState<Project[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<(ProjectUpdate & {
    projectName: string;
    projectDepartment: string;
    currentProjectProgress: number;
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePublicTab, setActivePublicTab] = useState<"explorer" | "analytics">("explorer");

  // Fetch initial data from the Express backend API
  const fetchState = async () => {
    try {
      setLoading(true);
      // Fetch all public projects
      const resProj = await fetch("/api/public/projects");
      if (resProj.ok) {
        const dataProj = await resProj.json();
        setProjects(dataProj);
      }

      // Fetch supervisor/officer pending updates
      const resUpd = await fetch("/api/supervisor/updates");
      if (resUpd.ok) {
        const dataUpd = await resUpd.json();
        setPendingUpdates(dataUpd);
      }
    } catch (err) {
      console.error("Error fetching state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // 1. Citizen API call - Submit a comment
  const handleAddComment = async (projectId: string, comment: { author: string; content: string }) => {
    try {
      const res = await fetch(`/api/public/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment),
      });
      if (res.ok) {
        // Reload state to sync
        await fetchState();
      } else {
        alert("Failed to submit comment.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Officer API call - Create Project
  const handleAddProject = async (projectData: Partial<Project>) => {
    try {
      const res = await fetch("/api/officer/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        await fetchState();
        alert("Project created successfully in the Platform Master ledger!");
      } else {
        const errData = await res.json();
        alert(`Error creating project: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Officer API call - Submit update
  const handleAddUpdate = async (updateData: Partial<ProjectUpdate>) => {
    try {
      const res = await fetch("/api/officer/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (res.ok) {
        await fetchState();
      } else {
        const errData = await res.json();
        alert(`Error submitting update: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Supervisor API call - Approve / Reject Update
  const handleApproveUpdate = async (updateId: string, status: "Approved" | "Rejected", feedback?: string) => {
    try {
      const res = await fetch("/api/supervisor/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, status, feedback }),
      });
      if (res.ok) {
        await fetchState();
      } else {
        alert("Failed to process approval workflow action.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. AI API call - Trigger Gemini summary and risk assessment
  const handleTriggerAI = async (updateId: string): Promise<AIAnalysis> => {
    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId }),
    });
    if (res.ok) {
      const data = await res.json();
      // Sync local state as well
      await fetchState();
      return data.analysis;
    } else {
      throw new Error("AI analysis endpoint returned an error");
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Header Banner */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                National Performance Platform
                <span className="text-[10px] font-bold font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase border border-emerald-200">
                  MVP Active
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Auditable development monitoring, project workflows, and public transparency.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">SYSTEM TIME (UTC)</span>
              <span className="text-xs font-mono font-bold text-slate-700">2026-07-02 11:45</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Role Selector Context */}
        <RoleSelector currentRole={currentRole} onRoleChange={(role) => setCurrentRole(role)} />

        {/* Loading Overlay */}
        {loading && projects.length === 0 ? (
          <div className="py-24 text-center">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm text-slate-500 mt-2 font-medium">Booting Platform Ledgers...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* CITIZEN WORKSPACE */}
            {currentRole === "citizen" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm text-left">
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    🛡️ National Public Transparency Portal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official public registry of the Reconstruction and Development Programme (RDP). Built with fully auditable updates, direct engineer uploads, and citizen-friendly AI analysis summaries.
                  </p>
                </div>
                <PublicPortal projects={projects} onAddComment={handleAddComment} />
              </div>
            )}

            {/* OFFICER WORKSPACE */}
            {currentRole === "officer" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-left">
                  <h3 className="text-sm font-bold text-slate-800">Officer Admin Console</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Secure gateway for departmental officers to create projects and report accomplishments.</p>
                </div>
                <OfficerPortal
                  projects={projects}
                  onAddProject={handleAddProject}
                  onAddUpdate={handleAddUpdate}
                />
              </div>
            )}

            {/* SUPERVISOR WORKSPACE */}
            {currentRole === "supervisor" && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-left">
                  <h3 className="text-sm font-bold text-slate-800">Workflow Governance Board</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supervisors audit officer submissions, call Gemini AI for insights, and publish items to the public.</p>
                </div>
                <SupervisorPortal
                  pendingUpdates={pendingUpdates}
                  onApproveUpdate={handleApproveUpdate}
                  onTriggerAI={handleTriggerAI}
                />
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2">
          <p className="text-xs text-slate-500">
            &copy; 2026 Government Infrastructure Performance Monitoring System. All Rights Reserved.
          </p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-mono">
            <span>Security: AES-256</span>
            <span>&bull;</span>
            <span>Database: PostgreSQL (In-Memory Sandbox)</span>
            <span>&bull;</span>
            <span>Auditing: Blockchain-Ready Ledger</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
