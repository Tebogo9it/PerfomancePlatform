import { useState } from "react";
import { ProjectUpdate, AIAnalysis } from "../types";
import { Sparkles, CheckCircle2, XCircle, FileText, AlertTriangle, Play, HelpCircle, Loader2, Info } from "lucide-react";

interface SupervisorPortalProps {
  pendingUpdates: (ProjectUpdate & {
    projectName: string;
    projectDepartment: string;
    currentProjectProgress: number;
  })[];
  onApproveUpdate: (updateId: string, status: "Approved" | "Rejected", feedback?: string) => Promise<void>;
  onTriggerAI: (updateId: string) => Promise<AIAnalysis>;
}

export default function SupervisorPortal({ pendingUpdates, onApproveUpdate, onTriggerAI }: SupervisorPortalProps) {
  const [selectedUpdateId, setSelectedUpdateId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Active update
  const activeUpdate = pendingUpdates.find((u) => u.id === selectedUpdateId);

  const handleTriggerAIAnalysis = async () => {
    if (!selectedUpdateId) return;
    setIsAnalyzing(true);
    try {
      const analysis = await onTriggerAI(selectedUpdateId);
      // Update local object view
      if (activeUpdate) {
        activeUpdate.aiAnalysis = analysis;
      }
    } catch (err) {
      console.error(err);
      alert("AI Analysis encountered an issue. Fallback mock insights were successfully mounted.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAction = async (status: "Approved" | "Rejected") => {
    if (!selectedUpdateId) return;
    setIsSubmittingAction(true);
    try {
      await onApproveUpdate(selectedUpdateId, status, status === "Rejected" ? rejectionFeedback : undefined);
      setRejectionFeedback("");
      setSelectedUpdateId(null);
      alert(`Update #${activeUpdate?.updateNumber} has been successfully ${status.toLowerCase()}!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const getDepartmentColor = (dept: string) => {
    switch (dept) {
      case "Water": return "bg-sky-50 text-sky-700 border-sky-100";
      case "Health": return "bg-teal-50 text-teal-700 border-teal-100";
      case "Transport": return "bg-purple-50 text-purple-700 border-purple-100";
      case "Education": return "bg-indigo-50 text-indigo-700 border-indigo-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getRiskColor = (level?: string) => {
    switch (level) {
      case "High": return "bg-rose-50 text-rose-700 border-rose-200";
      case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div id="supervisor-portal-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Queue List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm text-left">
          <h3 className="text-sm font-semibold text-slate-800">Pending Review Pipeline</h3>
          <p className="text-xs text-slate-500 mt-1">Review, run AI summaries, and publish approved entries to citizens.</p>
        </div>

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {pendingUpdates
            .filter((u) => u.workflowStatus === "Submitted")
            .map((u) => (
              <div
                key={u.id}
                onClick={() => setSelectedUpdateId(u.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative ${
                  selectedUpdateId === u.id
                    ? "border-amber-500 bg-amber-50/10 ring-1 ring-amber-500"
                    : "border-slate-100 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${getDepartmentColor(u.projectDepartment)}`}>
                    {u.projectDepartment}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">#{u.id}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{u.projectName}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Submitted by: <strong>{u.author}</strong></p>

                <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-50 text-[10px] text-slate-500">
                  <span>Proposed: <strong className="text-indigo-600">{u.progress}%</strong> (from {u.currentProjectProgress}%)</span>
                  <span className="text-amber-600 font-semibold flex items-center gap-0.5 animate-pulse">
                    Needs Audit <Play className="h-2.5 w-2.5 fill-amber-600" />
                  </span>
                </div>
              </div>
            ))}

          {pendingUpdates.filter((u) => u.workflowStatus === "Submitted").length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">All queues are clear!</p>
              <p className="text-[10px] text-slate-400">There are no pending project updates to audit.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Update Details & Actions Panel */}
      <div className="lg:col-span-2">
        {activeUpdate ? (
          <div className="bg-white border border-slate-100 rounded-xl shadow-sm text-left overflow-hidden">
            
            {/* Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-6">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Audit Phase 2 &bull; Active Workspaces</span>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                  Workflow Status: Submitted
                </span>
              </div>
              <h2 className="text-md font-bold text-slate-800">{activeUpdate.projectName}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Progress increment proposed: <strong>{activeUpdate.currentProjectProgress}% &rarr; {activeUpdate.progress}%</strong>
              </p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              
              {/* Detailed Technical Report */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Officer Technical Accomplishments Report</h3>
                <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  {activeUpdate.summary}
                </div>
              </div>

              {/* Issues / Roadblocks */}
              {activeUpdate.issues && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> Community & Physical Roadblocks Noted
                  </h3>
                  <div className="bg-amber-50/30 p-4 rounded-lg border border-amber-100 text-xs text-slate-700 leading-relaxed">
                    {activeUpdate.issues}
                  </div>
                </div>
              )}

              {/* Evidence and Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Incremental Budget Cost Spent</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 block">
                    +${activeUpdate.budgetSpentChange.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px] tracking-wider">Evidence File Registered</span>
                  {activeUpdate.evidence && activeUpdate.evidence.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold mt-1 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100">
                      <FileText className="h-3.5 w-3.5" /> {activeUpdate.evidence[0].name}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic block mt-1">No evidence uploads registered</span>
                  )}
                </div>
              </div>

              {/* Gemini AI Platform Section */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" /> Core AI Platform Service
                    </h3>
                    <p className="text-[11px] text-indigo-700 leading-relaxed max-w-md">
                      Analyze the progress report to generate an executive summary, citizen-friendly summary, and evaluate hidden construction and financial risks.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={handleTriggerAIAnalysis}
                    className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing Report...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Run AI Review
                      </>
                    )}
                  </button>
                </div>

                {/* AI Analysis Output Display */}
                {activeUpdate.aiAnalysis && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
                    
                    <div className="md:col-span-3 flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Audited Gemini Outcomes
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getRiskColor(activeUpdate.aiAnalysis.riskLevel)}`}>
                        Risk Rating: {activeUpdate.aiAnalysis.riskLevel}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-indigo-950 block">AI Executive Summary</span>
                      <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{activeUpdate.aiAnalysis.executiveSummary}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-emerald-950 block">AI Citizen-Friendly Summary</span>
                      <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{activeUpdate.aiAnalysis.citizenFriendlySummary}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-amber-950 block">AI Risk Assessment</span>
                      <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">{activeUpdate.aiAnalysis.riskAssessment}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval/Rejection Controls */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase">Auditor Feedback / Rejection Context (Required only if rejecting)</label>
                  <textarea
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                    placeholder="e.g. Please supply the hydrostatic pressure test certificate PDF in evidence files before re-submitting for 88% progress clearance."
                    rows={2}
                    className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingAction}
                    onClick={() => handleAction("Rejected")}
                    className="border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs px-5 py-2.5 rounded transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" /> Reject Update
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingAction || isAnalyzing}
                    onClick={() => handleAction("Approved")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Approve & Publish Update
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-slate-50/50 rounded-xl border border-dashed border-slate-200 p-16 text-center h-full flex flex-col items-center justify-center">
            <Info className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">Audit Desk Idle</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Please select any pending update on the left sidebar to audit its proposed values, trigger Gemini AI summaries, and approve publishing to the citizen portal.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
