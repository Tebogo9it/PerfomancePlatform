import React, { useState } from "react";
import { Project, ProjectUpdate, Comment } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, Filter, Calendar, MapPin, CheckCircle2, ChevronRight, Award, 
  MessageSquare, AlertTriangle, FileText, Download, Users, Lightbulb, 
  ArrowLeft, DollarSign, Percent, TrendingUp, Sparkles, Clock, ShieldAlert, Info, Briefcase
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface PublicPortalProps {
  projects: Project[];
  onAddComment: (projectId: string, comment: { author: string; content: string }) => Promise<void>;
}

export default function PublicPortal({ projects, onAddComment }: PublicPortalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedProvince, setSelectedProvince] = useState<string>("All");
  const [activeLedgerTab, setActiveLedgerTab] = useState<"projects" | "evidence" | "milestones">("projects");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Comments Form State
  const [citizenName, setCitizenName] = useState("");
  const [citizenComment, setCitizenComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // --- 1. CALCULATE EXECUTIVE KPIs ---
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.budgetSpent, 0);
  const averageProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) 
    : 0;
  
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const delayedCount = projects.filter((p) => p.status === "Delayed").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;
  const planningCount = projects.filter((p) => p.status === "Planning").length;

  // --- 2. CALCULATE CHARTS DATA ---
  const depts = ["Health", "Education", "Transport", "Water", "Housing"] as const;
  const deptData = depts.map((dept) => {
    const deptProjects = projects.filter((p) => p.department === dept);
    const count = deptProjects.length;
    const budget = deptProjects.reduce((sum, p) => sum + p.budget, 0);
    const spent = deptProjects.reduce((sum, p) => sum + p.budgetSpent, 0);
    const avgProg = count > 0 ? Math.round(deptProjects.reduce((sum, p) => sum + p.progress, 0) / count) : 0;
    return {
      name: dept,
      count,
      budget: budget / 1000000, 
      spent: spent / 1000000,
      progress: avgProg,
    };
  });

  const provinces = Array.from(new Set(projects.map((p) => p.province)));
  const provinceData = provinces.map((province) => {
    const provProjects = projects.filter((p) => p.province === province);
    const budget = provProjects.reduce((sum, p) => sum + p.budget, 0);
    return {
      name: province,
      value: budget / 1000000, 
    };
  });

  const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

  // --- 3. FORMAT HELPERS ---
  const formatBudget = (value: number) => {
    if (value >= 1000000000) {
      return `R${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R${(value / 1000).toFixed(0)}K`;
    }
    return `R${value}`;
  };

  const getRelativeDateString = (dateStr: string) => {
    const current = new Date("2026-07-02T11:45:00Z"); 
    const target = new Date(dateStr);
    const diffTime = Math.abs(current.getTime() - target.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case "Water": return "💧";
      case "Health": return "🏥";
      case "Transport": return "🚧";
      case "Education": return "🎓";
      case "Housing": return "🏠";
      default: return "🏢";
    }
  };

  const getStatusStyle = (status: Project["status"]) => {
    switch (status) {
      case "Completed": return { text: "Completed", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "Active": return { text: "On Track", pill: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "Delayed": return { text: "Delayed", pill: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" };
      case "Planning": return { text: "Planning", pill: "bg-slate-50 text-slate-500 border-slate-200" };
    }
  };

  // --- 4. COMPUTE RECENTLY UPDATED PROJECTS ---
  const recentEvents = projects.map((p) => {
    const approvedUpdates = (p.updates || []).filter((u) => u.workflowStatus === "Approved");
    if (approvedUpdates.length > 0) {
      const sorted = [...approvedUpdates].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      return {
        project: p,
        date: sorted[0].date,
        type: "update" as const,
        label: `Update #${sorted[0].updateNumber}`,
        summary: sorted[0].aiAnalysis?.citizenFriendlySummary || sorted[0].summary,
      };
    } else {
      return {
        project: p,
        date: p.startDate,
        type: "registration" as const,
        label: "Registered",
        summary: `Framework initialized with ${formatBudget(p.budget)} capital allocation.`,
      };
    }
  })
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 4);

  // --- 5. FILTER PROJECTS FOR THE GRID ---
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.municipality.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All" || p.department === selectedDept;
    const matchesProvince = selectedProvince === "All" || p.province === selectedProvince;
    return matchesSearch && matchesDept && matchesProvince;
  });

  // Extract and filter consolidated evidence files across projects matching criteria
  const filteredEvidence = filteredProjects.flatMap((proj) => {
    const approvedUpdates = (proj.updates || []).filter((u) => u.workflowStatus === "Approved");
    return approvedUpdates.flatMap((upd) => 
      (upd.evidence || []).map((ev) => ({
        ...ev,
        project: proj,
        updateNumber: upd.updateNumber,
        updateDate: upd.date,
        updateAuthor: upd.author,
        updateSummary: upd.summary,
      }))
    );
  });

  // Extract and filter consolidated milestones across projects matching criteria
  const filteredMilestones = filteredProjects.flatMap((proj) => 
    (proj.milestones || []).map((m) => ({
      ...m,
      project: proj,
    }))
  ).sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

  // Handle Comment Submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !citizenName || !citizenComment) return;

    setIsSubmittingComment(true);
    try {
      await onAddComment(selectedProject.id, {
        author: citizenName,
        content: citizenComment,
      });
      
      // Update local comment list for instant visual feedback
      const updatedProject = projects.find((p) => p.id === selectedProject.id);
      if (updatedProject) {
        setSelectedProject({ ...updatedProject });
      }

      setCitizenName("");
      setCitizenComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div id="public-portal-root" className="space-y-10 text-left">
      
      {/* ========================================================
          SECTION 1: PORTFOLIO SUMMARY (EXECUTIVE KPIs) 
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Budget */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Portfolio Budget</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {formatBudget(totalBudget)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Spent: {formatBudget(totalSpent)} ({((totalSpent / (totalBudget || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 2: Average Progress */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Average Progress</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {averageProgress}%
            </span>
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-mono mt-1">
              <TrendingUp className="h-3 w-3" /> Event-linked citizen audits
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <Percent className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 3: Delivery Count */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Active Delivery</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {activeCount} / {projects.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Completed: {completedCount} | Planning: {planningCount}
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* KPI 4: Flagged Projects */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Projects Flagged</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block text-rose-600">
              {delayedCount}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold mt-1 block">
              Undergoing re-engineering
            </span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

      </div>

      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* ========================================================
                SECTION 2: RECENTLY UPDATED PROJECTS 
                ======================================================== */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recently Updated</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {recentEvents.map((ev, index) => (
                  <div
                    key={ev.project.id + index}
                    onClick={() => setSelectedProject(ev.project)}
                    className="bg-white hover:bg-slate-50/50 border border-slate-100 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all cursor-pointer text-left flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                        <span className="font-semibold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                          {ev.label}
                        </span>
                        <span className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {getRelativeDateString(ev.date)}
                        </span>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {getDepartmentIcon(ev.project.department)} {ev.project.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {ev.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[10px] text-indigo-600 font-semibold">
                      <span>Live status: {ev.project.progress}%</span>
                      <span className="flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Explore <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================
                SECTION 3: NATIONAL PROJECTS LEDGER
                ======================================================== */}
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-800">National Infrastructure Ledger</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Explore real-time government construction projects, audited evidence, and timeline milestones.</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80 shrink-0">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by clinic, pipeline, roads, province..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Dual Filter Row */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Sector Department</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {["All", "Health", "Education", "Transport", "Water", "Housing"].map((dept) => (
                      <button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          selectedDept === dept
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{dept === "All" ? "🏢" : getDepartmentIcon(dept)}</span>
                        <span>{dept === "All" ? "All Departments" : `Dept. of ${dept}`}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-left">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Provincial Territory</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                    {["All", ...provinces].map((prov) => (
                      <button
                        key={prov}
                        onClick={() => setSelectedProvince(prov)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          selectedProvince === prov
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <MapPin className={`h-3 w-3 ${selectedProvince === prov ? "text-white" : "text-slate-400"}`} />
                        <span>{prov === "All" ? "All Provinces" : prov}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ledger Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
                <div className="flex gap-6">
                  {[
                    { id: "projects", label: "Construction Projects", icon: Briefcase, count: filteredProjects.length },
                    { id: "evidence", label: "Audited Evidence Ledger", icon: FileText, count: filteredEvidence.length },
                    { id: "milestones", label: "Timeline Milestones", icon: Calendar, count: filteredMilestones.length }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeLedgerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveLedgerTab(tab.id as any)}
                        className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 -mb-[2px] ${
                          isActive
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pb-2.5 sm:pb-0 text-[10px] text-slate-400 font-bold font-mono flex items-center gap-1.5 uppercase">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Provinces Filtered &bull; Live Sync Active</span>
                </div>
              </div>

              {/* Dynamic Views Container */}
              <div className="pt-2">
                {activeLedgerTab === "projects" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => {
                      const statusInfo = getStatusStyle(project.status);
                      return (
                        <div
                          key={project.id}
                          onClick={() => setSelectedProject(project)}
                          className="bg-white border border-slate-100 hover:border-slate-300 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer text-left flex flex-col justify-between overflow-hidden relative group"
                        >
                          {/* Top Accent Strip color coded by department */}
                          <div className={`h-1 w-full ${
                            project.department === "Water" ? "bg-sky-500" :
                            project.department === "Health" ? "bg-teal-500" :
                            project.department === "Transport" ? "bg-purple-500" :
                            project.department === "Education" ? "bg-indigo-500" : "bg-amber-500"
                          }`} />

                          {project.imageUrl && (
                            <div id={`project-card-image-box-${project.id}`} className="h-40 w-full overflow-hidden border-b border-slate-100 relative">
                              <img 
                                src={project.imageUrl} 
                                alt={project.name} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute top-2 right-2 bg-slate-900/80 text-white text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Verified Proof Photo</span>
                              </div>
                            </div>
                          )}

                          <div className="p-5 space-y-4">
                            {/* Meta Tags */}
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-400 font-mono tracking-wider">ID: {project.id.toUpperCase()}</span>
                              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase border text-[9px] ${statusInfo?.pill}`}>
                                {statusInfo?.text}
                              </span>
                            </div>

                            {/* Title and description */}
                            <div>
                              <h4 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {getDepartmentIcon(project.department)} {project.name}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {project.description}
                              </p>
                            </div>

                            {/* Location Badge */}
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 bg-slate-50 p-2 rounded-lg">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{project.province}, {project.municipality}</span>
                            </div>

                            {/* Audited Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-500">
                                <span>Audited Completion</span>
                                <span className="font-bold text-indigo-600">{project.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    project.status === "Completed" ? "bg-emerald-500" : "bg-indigo-600"
                                  }`} 
                                  style={{ width: `${project.progress}%` }} 
                                />
                              </div>
                            </div>

                            {/* Cost & Suffix Info */}
                            <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                              <div>
                                <span className="block text-[9px] text-slate-400 uppercase font-semibold">Budget Allocation</span>
                                <strong className="text-slate-800 text-xs">{formatBudget(project.budget)}</strong>
                              </div>
                              <div className="text-right">
                                <span className="block text-[9px] text-slate-400 uppercase font-semibold">Capital Expended</span>
                                <strong className="text-slate-800 text-xs">{formatBudget(project.budgetSpent)}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Footer interactive button */}
                          <div className="bg-slate-50 group-hover:bg-indigo-50/40 p-3.5 border-t border-slate-50 transition-colors flex items-center justify-between text-xs text-indigo-600 font-bold">
                            <span>View Project Timeline</span>
                            <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      );
                    })}

                    {filteredProjects.length === 0 && (
                      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 col-span-full">
                        <Search className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-semibold">No active projects found</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">We couldn't find any verified project matching "{searchTerm}" or your selected filters.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeLedgerTab === "evidence" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEvidence.map((ev, index) => (
                      <div
                        key={ev.storagePath + index}
                        className="bg-white border border-slate-100 hover:border-slate-300 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                              UPDATE #{ev.updateNumber} EVIDENCE
                            </span>
                            <span className="font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {getRelativeDateString(ev.updateDate)}
                            </span>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left space-y-0.5">
                              <h4 className="text-xs font-extrabold text-slate-800 line-clamp-1">{ev.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono">
                                Size: {ev.size} | Uploader: {ev.uploader}
                              </p>
                            </div>
                          </div>

                          {/* Link to Parent Project */}
                          <div 
                            onClick={() => setSelectedProject(ev.project)}
                            className="text-left text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg hover:bg-indigo-50/50 hover:text-indigo-600 cursor-pointer transition-all border border-slate-100 hover:border-indigo-100 group"
                          >
                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Project Context</span>
                            <span className="font-bold flex items-center justify-between">
                              <span>{getDepartmentIcon(ev.project.department)} {ev.project.name}</span>
                              <ChevronRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform text-slate-400" />
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{ev.project.province}, {ev.project.municipality}</span>
                          </div>

                          <p className="text-[11px] text-slate-500 italic line-clamp-2 leading-relaxed">
                            " {ev.updateSummary} "
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-end">
                          <button
                            onClick={() => alert(`Simulated secure download of verified site proof: ${ev.storagePath}`)}
                            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Proof File</span>
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredEvidence.length === 0 && (
                      <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 col-span-full">
                        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 font-semibold">No audited evidence found</p>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">We couldn't find any uploaded evidence files for projects matching the selected criteria.</p>
                      </div>
                    )}
                  </div>
                )}

                {activeLedgerTab === "milestones" && (
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs text-left">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Consolidated Chronological Project Roadmap</span>
                    </div>

                    <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4 text-left">
                      {filteredMilestones.map((m, index) => {
                        const statusColor = 
                          m.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200 bg-emerald-50" :
                          m.status === "In progress" ? "bg-blue-50 text-blue-800 border-blue-200 bg-blue-50 animate-pulse" :
                          "bg-slate-100 text-slate-600 border-slate-200 bg-slate-50";

                        const deptAccent = 
                          m.project.department === "Water" ? "bg-sky-500" :
                          m.project.department === "Health" ? "bg-teal-500" :
                          m.project.department === "Transport" ? "bg-purple-500" :
                          m.project.department === "Education" ? "bg-indigo-500" : "bg-amber-500";

                        return (
                          <div key={m.id + index} className="relative pl-4 group">
                            {/* Chronological Connector Circle */}
                            <span className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs ${deptAccent}`} />
                            
                            <div className="bg-white border border-slate-100 hover:border-slate-300 rounded-xl p-4 shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1 text-left">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${deptAccent}`} />
                                  <h4 className="text-xs font-extrabold text-slate-800">{m.title}</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Target Delivery: <strong className="text-slate-600 font-semibold">{m.targetDate}</strong>
                                </p>
                                
                                {/* Link to Project Context */}
                                <div 
                                  onClick={() => setSelectedProject(m.project)}
                                  className="text-[10px] text-slate-500 hover:text-indigo-600 cursor-pointer mt-1 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded w-fit transition-colors border border-slate-100 hover:border-indigo-100"
                                >
                                  <span>{getDepartmentIcon(m.project.department)} {m.project.name}</span>
                                  <span className="text-slate-300">&bull;</span>
                                  <span className="font-semibold text-slate-400">{m.project.province}</span>
                                  <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
                                </div>
                              </div>

                              <span className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase border h-fit w-fit ${statusColor}`}>
                                {m.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {filteredMilestones.length === 0 && (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500 font-semibold">No milestones found</p>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">We couldn't find any milestones for projects matching the selected criteria.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================================
                SECTION 4: SUPPORTING ANALYTICS (CHARTS) AT THE BOTTOM
                ======================================================== */}
            <div className="pt-8 border-t border-slate-200 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-indigo-600" /> Supporting Portfolio Analytics
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Macro-level provincial and departmental insights backing the direct project ledger.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Department Budget vs Spent */}
                <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm lg:col-span-2">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase">Budget vs Spent by Department</h3>
                    <p className="text-[10px] text-slate-400">Expressed in Millions of South African Rand (R M)</p>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b", fontWeight: "bold" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                          itemStyle={{ fontSize: 11 }}
                          labelStyle={{ fontWeight: "bold", fontSize: 11, color: "#f1f5f9" }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                        <Bar dataKey="budget" name="Allocated Budget (R M)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="spent" name="Spent to Date (R M)" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Province Allocation Pie */}
                <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 uppercase">Provincial Allocation</h3>
                    <p className="text-[10px] text-slate-400">Capital split in millions (R M)</p>
                  </div>
                  <div className="h-48 w-full flex items-center justify-center relative my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={provinceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {provinceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `R${value.toFixed(1)}M`}
                          contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[9px] uppercase font-bold text-slate-400">Total Portfolio</span>
                      <span className="text-base font-black text-slate-800">R{(totalBudget / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                  
                  {/* Legends */}
                  <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-50">
                    {provinceData.map((prov, idx) => (
                      <div key={prov.name} className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span className="text-[10px] text-slate-600 truncate font-semibold">{prov.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 ml-auto">R{prov.value.toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Department Performance Efficiencies */}
              <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">Department Execution Efficiency</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {deptData.map((d) => (
                    <div key={d.name} className="bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{getDepartmentIcon(d.name)} {d.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">{d.count} active</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Average Progress</span>
                          <span className="text-xs font-bold text-indigo-600">{d.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${d.progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </motion.div>
        ) : (
          /* ========================================================
              SECTION 5: DETAILED PROJECT DEEP-DIVE WORKSPACE
              ======================================================== */
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Header / Back Action */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <button
                onClick={() => setSelectedProject(null)}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors group cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to National Portfolio</span>
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold font-mono">PROJECT LEAD CONTEXT: ACTIVE</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column (2/3 width): Hero, Description, Milestones, Timelines, Comments */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Project Identity Card */}
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden text-left relative">
                  <div className={`h-1.5 w-full ${
                    selectedProject.department === "Water" ? "bg-sky-500" :
                    selectedProject.department === "Health" ? "bg-teal-500" :
                    selectedProject.department === "Transport" ? "bg-purple-500" :
                    selectedProject.department === "Education" ? "bg-indigo-500" : "bg-amber-500"
                  }`} />
                  
                  {selectedProject.imageUrl && (
                    <div id="project-detail-banner-box" className="relative h-64 w-full overflow-hidden border-b border-slate-100">
                      <img 
                        src={selectedProject.imageUrl} 
                        alt={selectedProject.name} 
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 bg-emerald-600/90 text-white font-mono font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded shadow flex items-center gap-1.5 backdrop-blur-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        <span>Audited Site Photo Active</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl">{getDepartmentIcon(selectedProject.department)}</span>
                        <span className="text-xs font-extrabold text-indigo-600 font-mono tracking-wide">
                          DEPT. OF {selectedProject.department.toUpperCase()} &bull; {selectedProject.programme.toUpperCase()}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getStatusStyle(selectedProject.status)?.pill}`}>
                        {getStatusStyle(selectedProject.status)?.text}
                      </span>
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{selectedProject.name}</h2>
                    
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Detailed Technical Mandate</span>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedProject.description}</p>
                    </div>

                    {/* Big Audited Progress Bar */}
                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Audited Construction Progress</span>
                        <span className="font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-mono text-xs">
                          {selectedProject.progress}% Completion
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            selectedProject.status === "Completed" ? "bg-emerald-500" : "bg-indigo-600 animate-pulse"
                          }`} 
                          style={{ width: `${selectedProject.progress}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event-Based timeline visualization (Updates) */}
                <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Award className="h-4 w-4 text-indigo-500 animate-pulse" /> Approved Site Updates Timeline
                  </h3>

                  <div className="relative border-l-2 border-indigo-100 pl-6 space-y-8 ml-3 text-left">
                    
                    {/* Current State Indicator */}
                    <div className="relative">
                      <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center ring-2 ring-indigo-100" />
                      <div>
                        <span className="text-[9px] font-extrabold font-mono text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded-full">
                          Latest Audited Stage
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-800 mt-1.5">
                          Verified at {selectedProject.progress}% Overall Progress
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Site metrics have been verified by provincial engineers. Ongoing milestone:{" "}
                          <strong className="text-slate-700">
                            {selectedProject.milestones.find((m) => m.status !== "Completed")?.title || "Operational Phase (Completed)"}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* List Updates */}
                    {selectedProject.updates && selectedProject.updates.length > 0 ? (
                      selectedProject.updates
                        .slice()
                        .reverse()
                        .map((upd) => (
                          <div key={upd.id} className="relative group text-left">
                            <span className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-emerald-500 border-4 border-white shadow-sm transition-transform group-hover:scale-115 ring-2 ring-emerald-100" />
                            
                            <div className="bg-slate-50 group-hover:bg-slate-50/20 p-4 rounded-xl border border-slate-100 transition-colors">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 text-[10px]">
                                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 uppercase tracking-wide">
                                  Update #{upd.updateNumber} Verified
                                </span>
                                <span className="text-slate-400 font-mono font-bold">
                                  {getRelativeDateString(upd.date)} ({upd.date})
                                </span>
                              </div>

                              {/* Citizen-Friendly Summary highlighted beautifully */}
                              {upd.aiAnalysis?.citizenFriendlySummary ? (
                                <div className="bg-white border-l-4 border-emerald-500 p-4 rounded-r-lg shadow-xs mb-3 space-y-1.5">
                                  <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" /> Citizen-Friendly AI Summary
                                  </span>
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                    {upd.aiAnalysis.citizenFriendlySummary}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                                  {upd.summary}
                                </p>
                              )}

                              {upd.imageUrl && (
                                <div id={`update-image-proof-${upd.id}`} className="mb-3.5 rounded-lg overflow-hidden border border-slate-200 shadow-2xs relative group/updphoto">
                                  <img 
                                    src={upd.imageUrl} 
                                    alt={`Visual Proof for Update #${upd.updateNumber}`} 
                                    className="w-full h-48 object-cover transition-transform duration-500 group-hover/updphoto:scale-101"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white font-mono text-[8px] uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Inspection Photo &mdash; {upd.date}</span>
                                  </div>
                                </div>
                              )}

                              {/* Accordion dropdown for full technical logs */}
                              <details className="text-[11px] text-slate-500 cursor-pointer outline-none group/details">
                                <summary className="font-bold text-indigo-600 hover:underline py-1 list-none flex items-center gap-1">
                                  <span>View engineering logs & risk assessments</span>
                                  <ChevronRight className="h-3.5 w-3.5 transform group-open/details:rotate-90 transition-transform" />
                                </summary>
                                <div className="mt-3 bg-white border border-slate-100 p-3.5 rounded-lg space-y-2.5 shadow-inner">
                                  <p className="text-slate-600 leading-relaxed">
                                    <strong>Officer Accomplishments Log:</strong> {upd.summary}
                                  </p>
                                  {upd.issues && (
                                    <p className="text-amber-700 leading-relaxed bg-amber-50/50 p-2.5 rounded border border-amber-100">
                                      <strong>Flagged Bottleneck:</strong> {upd.issues}
                                    </p>
                                  )}
                                  {upd.aiAnalysis && (
                                    <div className="pt-2 border-t border-slate-50 space-y-2 text-[10px]">
                                      <p className="text-indigo-950 font-semibold uppercase">Executive AI Assessment:</p>
                                      <p className="text-slate-600 italic leading-relaxed bg-indigo-50/30 p-2.5 rounded">{upd.aiAnalysis.executiveSummary}</p>
                                      
                                      <p className="text-amber-950 font-semibold uppercase pt-1">AI Soil/Labor Risk critique:</p>
                                      <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">{upd.aiAnalysis.riskAssessment}</p>
                                      
                                      <div className="flex justify-between items-center bg-slate-100 p-2 rounded">
                                        <span className="font-bold">AI Flagged Risk Severity:</span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                          upd.aiAnalysis.riskLevel === "High" ? "bg-rose-500 text-white" :
                                          upd.aiAnalysis.riskLevel === "Medium" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                                        }`}>
                                          {upd.aiAnalysis.riskLevel}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </details>

                              {/* GCS Evidence download files */}
                              {upd.evidence && upd.evidence.length > 0 && (
                                <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                                  <span className="text-[9px] uppercase font-extrabold text-slate-400 block mb-2">Audited GCS Storage Evidence Files</span>
                                  <div className="flex flex-wrap gap-2">
                                    {upd.evidence.map((file) => (
                                      <button
                                        key={file.name}
                                        onClick={() => alert(`Simulated secure download of verified site proof: ${file.storagePath}`)}
                                        className="inline-flex items-center gap-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 px-3 py-1.5 rounded-lg text-[10px] font-semibold shadow-xs transition-colors cursor-pointer"
                                      >
                                        <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <span className="text-[8px] font-mono font-normal text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{file.size}</span>
                                        <Download className="h-3 w-3 text-slate-400 shrink-0" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-400 italic">
                        No approved updates have been published to the citizens timeline yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Target Milestones Trajectory */}
                <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Target Milestones Trajectory
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedProject.milestones.map((milestone) => (
                      <div key={milestone.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{milestone.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Target: {milestone.targetDate}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase border ${
                          milestone.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : milestone.status === "In progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}>
                          {milestone.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Constructive Comments Feed */}
                <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <MessageSquare className="h-4 w-4 text-blue-500" /> Public Constructive Comments & Site Observations ({selectedProject.comments.length})
                  </h3>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {selectedProject.comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
                        <div className="flex items-center justify-between mb-2 text-[10px]">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-800 text-xs">{comment.author}</strong>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold tracking-wider uppercase border ${
                              comment.role === "Citizen"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : comment.role === "System Event"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-200 text-slate-700"
                            }`}>
                              {comment.role}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono font-semibold">
                            {new Date(comment.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">{comment.content}</p>
                      </div>
                    ))}

                    {selectedProject.comments.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-6 bg-slate-50 rounded-xl">
                        No citizen observations have been submitted for this project yet. Submit your observation below!
                      </p>
                    )}
                  </div>

                  {/* Form */}
                  <form onSubmit={handleCommentSubmit} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 text-left">
                    <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Submit Community Observation</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          placeholder="e.g. Jane Doe"
                          className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <span className="text-[9px] text-slate-400 italic leading-tight">
                          Comments are reviewed by municipal site managers and system administrators. Please share concrete site observations.
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Your Observation / Feedback</label>
                      <textarea
                        required
                        value={citizenComment}
                        onChange={(e) => setCitizenComment(e.target.value)}
                        placeholder="e.g. Visited the site this morning. The foundation concrete looks solid and teachers tablets were fully unboxed in the computer lab."
                        rows={3}
                        className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-sans"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingComment}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmittingComment ? "Submitting Observation..." : "Publish Observation"}
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* Right Column (1/3 width): Capital Allocations, Leadership, Risks */}
              <div className="space-y-6">
                
                {/* 1. Capital Allocation Box */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                    Rand Capital Allocation
                  </span>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Budget Assigned</span>
                      <span className="text-xl font-black text-slate-800">{formatBudget(selectedProject.budget)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Audited spent to Date</span>
                      <span className="text-xl font-black text-emerald-600">{formatBudget(selectedProject.budgetSpent)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Ledger Balance</span>
                      <span className="text-xl font-black text-indigo-600">
                        {formatBudget(selectedProject.budget - selectedProject.budgetSpent)}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>SPENT RATIO</span>
                        <span>{((selectedProject.budgetSpent / (selectedProject.budget || 1)) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${(selectedProject.budgetSpent / (selectedProject.budget || 1)) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Delivery Leadership & Officers */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                    Delivery Leadership
                  </span>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned Project Director</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5">{selectedProject.owner}</span>
                      <span className="text-[10px] text-indigo-600 font-mono">Lead Officer</span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Site Delivery Engineers</span>
                      {selectedProject.team && selectedProject.team.map((t) => (
                        <div key={t.email} className="bg-slate-50 p-2.5 rounded border border-slate-100 text-[11px]">
                          <strong className="text-slate-800 block">{t.name}</strong>
                          <span className="text-slate-500 text-[10px] block">{t.role}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">{t.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Active Risk register */}
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3 text-left">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                    Active Risk Register
                  </span>

                  {selectedProject.risks && selectedProject.risks.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProject.risks.map((risk, index) => (
                        <div key={index} className="bg-rose-50/50 p-3 rounded-lg border border-rose-100 flex items-start gap-2 text-xs text-rose-800">
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                          <span className="leading-relaxed font-semibold">{risk}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">No critical risks flagged.</span>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
