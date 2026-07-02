import React, { useState } from "react";
import { Project, ProjectUpdate, EvidenceFile } from "../types";
import { 
  Plus, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  HelpCircle, 
  DollarSign, 
  Percent, 
  AlertCircle, 
  FilePlus, 
  Sparkles, 
  Lock, 
  LogOut, 
  ShieldCheck, 
  Image, 
  Camera, 
  UserCheck, 
  ChevronRight,
  User
} from "lucide-react";

interface OfficerPortalProps {
  projects: Project[];
  onAddProject: (project: Partial<Project>) => Promise<void>;
  onAddUpdate: (update: Partial<ProjectUpdate>) => Promise<void>;
}

// Researched South African Government Administrative Accounts
const ADMIN_ACCOUNTS = [
  {
    email: "s.phillips@dws.gov.za",
    password: "admin",
    name: "Dr. Sean Phillips",
    role: "Director General",
    department: "Water" as const,
    badge: "National DG"
  },
  {
    email: "n.cele@gauteng.gov.za",
    password: "admin",
    name: "Nombuso Cele",
    role: "Director of Schools Infrastructure",
    department: "Education" as const,
    badge: "Provincial Director"
  },
  {
    email: "s.dlamini@gov.za",
    password: "admin",
    name: "Sipho Dlamini",
    role: "Senior Infrastructure Officer",
    department: "Transport" as const,
    badge: "Senior Engineer"
  }
];

// Visual site verification presets for projects
const PROJECT_IMAGE_PRESETS = [
  {
    name: "Pipeline Excavation & Trenching",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
    description: "Bulk water & piping"
  },
  {
    name: "Mega Bridge Pier Foundation",
    url: "https://images.unsplash.com/photo-1545558014-8680c7db438e?auto=format&fit=crop&q=80&w=800",
    description: "Highways & transport"
  },
  {
    name: "Core Hospital Excavation & Crane",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    description: "Health & civil structures"
  },
  {
    name: "Refurbished Classroom / School",
    url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
    description: "Education & learning"
  },
  {
    name: "Social Housing & Infrastructure",
    url: "https://images.unsplash.com/photo-1590398019316-24ef042a98f7?auto=format&fit=crop&q=80&w=800",
    description: "Housing & townships"
  }
];

// Visual progress inspection presets for updates
const UPDATE_IMAGE_PRESETS = [
  {
    name: "Telemetry Controls & Valves",
    url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800",
    category: "Pipes & Water Pumps"
  },
  {
    name: "Booster Telemetry & Testing",
    url: "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&q=80&w=800",
    category: "Booster Stations"
  },
  {
    name: "Main Reticulation Pipelines",
    url: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=800",
    category: "Pipelaying Site"
  },
  {
    name: "South Abutment Piers Column",
    url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=800",
    category: "Mega Bridges"
  },
  {
    name: "Concrete Column Slab Curing",
    url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800",
    category: "Superstructure Civils"
  },
  {
    name: "Slipform Climbing Progress",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
    category: "Tall Structures"
  }
];

export default function OfficerPortal({ projects, onAddProject, onAddUpdate }: OfficerPortalProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("gov_officer_authenticated") === "true";
  });
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  
  // Current Active User (retrieved from localStorage or matched upon login)
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    role: string;
    department: "Health" | "Education" | "Transport" | "Water" | "Housing";
    email: string;
    badge: string;
  } | null>(() => {
    const saved = localStorage.getItem("gov_officer_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<"projects" | "new-project" | "new-update">("projects");

  // Project Form State
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projDept, setProjDept] = useState<"Health" | "Education" | "Transport" | "Water" | "Housing">("Water");
  const [projProg, setProjProg] = useState("");
  const [projProv, setProjProv] = useState("Gauteng");
  const [projMun, setProjMun] = useState("");
  const [projBudget, setProjBudget] = useState("");
  const [projStart, setProjStart] = useState("");
  const [projEnd, setProjEnd] = useState("");
  const [projOwner, setProjOwner] = useState("");
  const [projImageUrl, setProjImageUrl] = useState(PROJECT_IMAGE_PRESETS[0].url);
  const [projCustomImage, setProjCustomImage] = useState("");
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);

  // Update Form State
  const [selectedProjId, setSelectedProjId] = useState("");
  const [updateProg, setUpdateProg] = useState("");
  const [updateSummary, setUpdateSummary] = useState("");
  const [updateIssues, setUpdateIssues] = useState("");
  const [updateBudgetChange, setUpdateBudgetChange] = useState("");
  const [evidenceFileName, setEvidenceFileName] = useState("");
  const [updateImageUrl, setUpdateImageUrl] = useState(UPDATE_IMAGE_PRESETS[0].url);
  const [updateCustomImage, setUpdateCustomImage] = useState("");
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const provinces = ["Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape", "Limpopo", "Mpumalanga", "North West", "Free State", "Northern Cape"];

  // Handle Admin Authorization
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // Standard fallback master login
    if (authEmail.trim().toLowerCase() === "officer@gov.za" && authPassword === "admin123") {
      const defaultUser = {
        name: "Senior Infrastructure Officer",
        role: "Technical Portfolio Director",
        department: "Water" as const,
        email: "officer@gov.za",
        badge: "GIG Administrator"
      };
      setIsAuthenticated(true);
      setCurrentUser(defaultUser);
      localStorage.setItem("gov_officer_authenticated", "true");
      localStorage.setItem("gov_officer_user", JSON.stringify(defaultUser));
      // Set default project lead name
      setProjOwner(defaultUser.name);
      return;
    }

    // Match exact preset admin accounts
    const match = ADMIN_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === authEmail.trim().toLowerCase() && acc.password === authPassword
    );

    if (match) {
      const loggedInUser = {
        name: match.name,
        role: match.role,
        department: match.department,
        email: match.email,
        badge: match.badge
      };
      setIsAuthenticated(true);
      setCurrentUser(loggedInUser);
      localStorage.setItem("gov_officer_authenticated", "true");
      localStorage.setItem("gov_officer_user", JSON.stringify(loggedInUser));
      // Pre-fill fields matching current authenticated profile
      setProjOwner(match.name);
      setProjDept(match.department);
      return;
    }

    setAuthError("Invalid administrator credentials. Please check details or click a prefilled account below.");
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("gov_officer_authenticated");
    localStorage.removeItem("gov_officer_user");
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName || !projDesc || !projDept || !projBudget || !projStart || !projEnd || !projOwner) return;

    setIsSubmittingProject(true);
    try {
      const finalImage = projCustomImage.trim() !== "" ? projCustomImage.trim() : projImageUrl;

      await onAddProject({
        name: projName,
        description: projDesc,
        department: projDept,
        programme: projProg,
        province: projProv,
        municipality: projMun,
        budget: Number(projBudget),
        startDate: projStart,
        endDate: projEnd,
        owner: projOwner,
        imageUrl: finalImage
      });

      // Reset fields
      setProjName("");
      setProjDesc("");
      setProjProg("");
      setProjMun("");
      setProjBudget("");
      setProjStart("");
      setProjEnd("");
      setProjCustomImage("");
      // Retain authenticated owner unless signing out
      setActiveTab("projects");
      alert("Core Project Entity registered successfully! Visual proof has been locked into the portfolio ledger.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjId || !updateProg || !updateSummary) return;

    const currentProj = projects.find((p) => p.id === selectedProjId);
    if (!currentProj) return;

    if (Number(updateProg) < currentProj.progress) {
      alert(`Error: Proposed progress (${updateProg}%) cannot be less than the current approved project progress (${currentProj.progress}%).`);
      return;
    }

    setIsSubmittingUpdate(true);
    try {
      const mockEvidence: EvidenceFile[] = [];
      const authorName = currentUser ? currentUser.name : "Internal Engineering Officer";
      const finalImage = updateCustomImage.trim() !== "" ? updateCustomImage.trim() : updateImageUrl;

      if (evidenceFileName) {
        mockEvidence.push({
          name: evidenceFileName,
          type: "application/pdf",
          size: "2.4 MB",
          uploader: authorName,
          uploadDate: new Date().toISOString().split("T")[0],
          storagePath: `gcs://gov-evidence-bucket/officers/${evidenceFileName}`,
        });
      }

      await onAddUpdate({
        projectId: selectedProjId,
        progress: Number(updateProg),
        summary: updateSummary,
        issues: updateIssues,
        budgetSpentChange: Number(updateBudgetChange || 0),
        evidence: mockEvidence,
        author: authorName,
        authorRole: currentUser ? `${currentUser.role} (${currentUser.badge})` : "Engineering Officer",
        imageUrl: finalImage
      });

      // Reset
      setSelectedProjId("");
      setUpdateProg("");
      setUpdateSummary("");
      setUpdateIssues("");
      setUpdateBudgetChange("");
      setEvidenceFileName("");
      setUpdateCustomImage("");
      alert("Project Update with photo proof submitted successfully! It has been dispatched to the Supervisor Review queue.");
      setActiveTab("projects");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  // 1. RENDER UNAUTHORIZED ADMIN LOGIN PANEL
  if (!isAuthenticated) {
    return (
      <div id="officer-login-root" className="max-w-md mx-auto my-8 space-y-6">
        
        {/* South African Crest Inspired Emblem Header */}
        <div className="bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl border border-slate-800 text-left">
          <div className="bg-gradient-to-r from-emerald-800 via-amber-700 to-indigo-800 h-2 w-full" />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-xl text-amber-500 border border-slate-700">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase">Secure Portal Authorization</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">Republic of South Africa &bull; Government OS</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 shrink-0" /> Administrative Access Mandate
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Adding new public works projects or submitting certified progress updates requires 
                validation of an active Government Officer admin account.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Departmental Email Address</label>
                <input
                  id="admin-email-input"
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. s.phillips@dws.gov.za"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Password</label>
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-white placeholder-slate-600 rounded text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              {authError && (
                <div className="text-[10px] bg-rose-950/50 border border-rose-900/60 p-2.5 rounded text-rose-300 flex items-start gap-1.5 leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                id="admin-login-submit"
                type="submit"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black text-xs uppercase tracking-widest rounded transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span>Authorize & Unlock Gateway</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Quick Seeding Demo Admin Credentials Selector */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs text-left space-y-3">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
            <UserCheck className="h-4 w-4 text-slate-400" /> Preconfigured Admin Accounts
          </span>
          <p className="text-[11px] text-slate-500 leading-normal">
            For evaluation, select one of these live South African public service accounts to authenticate automatically:
          </p>
          
          <div className="space-y-2">
            {ADMIN_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setAuthEmail(acc.email);
                  setAuthPassword(acc.password);
                }}
                className="w-full text-left p-3 border border-slate-100 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/25 rounded-lg transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{acc.name}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.email} | password: <strong className="text-slate-700 font-semibold">{acc.password}</strong></p>
                </div>
                <span className="text-[9px] font-bold font-mono uppercase bg-slate-200 group-hover:bg-indigo-600 group-hover:text-white px-2 py-0.5 rounded transition-colors text-slate-600">
                  {acc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // 2. RENDER AUTHORIZED ADMINISTRATIVE CONSOLE
  return (
    <div id="officer-portal-root" className="space-y-6">
      
      {/* Administrative Profile Header */}
      <div className="bg-indigo-950 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-900 rounded-xl text-indigo-300 border border-indigo-800">
            <User className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold tracking-wide text-slate-100">{currentUser?.name}</h4>
              <span className="text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                {currentUser?.badge}
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              {currentUser?.role} &bull; Dept. of {currentUser?.department}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 bg-indigo-900 hover:bg-rose-950 hover:text-rose-200 border border-indigo-800 hover:border-rose-900 px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-200 transition-all cursor-pointer shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out Admin Account</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("projects")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "projects"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          My Portfolio
        </button>
        <button
          onClick={() => {
            setActiveTab("new-project");
            // Set fields default values
            if (currentUser) {
              setProjOwner(currentUser.name);
              setProjDept(currentUser.department);
            }
          }}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "new-project"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Register New Project
        </button>
        <button
          onClick={() => {
            setActiveTab("new-update");
            if (projects.length > 0 && !selectedProjId) {
              setSelectedProjId(projects[0].id);
            }
          }}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "new-update"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Submit Progress Update
        </button>
      </div>

      {/* RENDER ACTIVE TABS */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-sm font-semibold text-slate-800">Assigned Project Assets</h3>
              <p className="text-xs text-slate-500">Internal tracking grid for department owners.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {projects.length} Total Registered Projects
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const isMine = currentUser && (proj.owner.toLowerCase().includes(currentUser.name.split(" ")[currentUser.name.split(" ").length - 1].toLowerCase()) || proj.department === currentUser.department);
              
              return (
                <div key={proj.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm text-left relative flex flex-col justify-between group hover:shadow-md transition-all">
                  
                  {proj.imageUrl ? (
                    <div className="h-32 w-full overflow-hidden relative">
                      <img 
                        src={proj.imageUrl} 
                        alt={proj.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-slate-900/80 text-white text-[8px] font-mono uppercase px-2 py-0.5 rounded backdrop-blur-xs">
                        <span>📷 Site Photo Locked</span>
                      </div>
                      {isMine && (
                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded shadow flex items-center gap-1.5 animate-pulse">
                          <UserCheck className="h-3 w-3" />
                          <span>Managed by You</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-indigo-500" />
                  )}

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2 text-[10px]">
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                          {proj.department}
                        </span>
                        <span className="text-slate-400 font-mono">ID: {proj.id}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-800 mb-1 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-1">{proj.name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{proj.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-slate-50 text-[10px] text-slate-500">
                      <div>
                        <span className="block font-medium text-slate-400">Budget</span>
                        <strong className="text-slate-700">R{(proj.budget / 1000000).toFixed(1)}M</strong>
                      </div>
                      <div>
                        <span className="block font-medium text-slate-400">Spent</span>
                        <strong className="text-slate-700">R{(proj.budgetSpent / 1000000).toFixed(1)}M</strong>
                      </div>
                      <div>
                        <span className="block font-medium text-slate-400">Officer Lead</span>
                        <strong className="text-slate-700 truncate block font-semibold">{proj.owner}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
                      <div className="flex-1 mr-4">
                        <div className="flex justify-between text-[9px] text-slate-400 mb-1">
                          <span>Live Progress</span>
                          <strong className="text-slate-600">{proj.progress}%</strong>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${proj.progress}%` }} />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProjId(proj.id);
                          setUpdateProg(String(Math.min(100, proj.progress + 5)));
                          setActiveTab("new-update");
                        }}
                        className="shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] px-3 py-1.5 rounded transition-all cursor-pointer"
                      >
                        Submit Update
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "new-project" && (
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm text-left max-w-3xl mx-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-600" /> Register National Project Framework
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a core project entity into the bounded database. Everything else (milestones, budget, updates) derives from this model.
            </p>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. Zululand Bulk Water Expansion Project"
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Detailed Description & Objectives</label>
                <textarea
                  required
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Summarize engineering plans, target beneficiaries, and geographical outcomes..."
                  rows={4}
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Government Department</label>
                <select
                  value={projDept}
                  onChange={(e) => setProjDept(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold"
                >
                  <option value="Water">Water & Sanitation</option>
                  <option value="Health">Health</option>
                  <option value="Transport">Transport</option>
                  <option value="Education">Education</option>
                  <option value="Housing">Human Settlements (Housing)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Programme Association</label>
                <input
                  type="text"
                  required
                  value={projProg}
                  onChange={(e) => setProjProg(e.target.value)}
                  placeholder="e.g. Municipal Infrastructure Grant (MIG)"
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Province</label>
                <select
                  value={projProv}
                  onChange={(e) => setProjProv(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold"
                >
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Municipality / District</label>
                <input
                  type="text"
                  required
                  value={projMun}
                  onChange={(e) => setProjMun(e.target.value)}
                  placeholder="e.g. Zululand District Municipality"
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Total Budget Allocation (ZAR - R)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">R</span>
                  <input
                    type="number"
                    required
                    value={projBudget}
                    onChange={(e) => setProjBudget(e.target.value)}
                    placeholder="e.g. 12500000"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Lead Officer Name</label>
                <input
                  type="text"
                  required
                  value={projOwner}
                  onChange={(e) => setProjOwner(e.target.value)}
                  placeholder="e.g. Sipho Dlamini"
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-indigo-950 bg-indigo-50/10"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Scheduled Start Date</label>
                <input
                  type="date"
                  required
                  value={projStart}
                  onChange={(e) => setProjStart(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Target Completion Date</label>
                <input
                  type="date"
                  required
                  value={projEnd}
                  onChange={(e) => setProjEnd(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* PROJECT IMAGE AUDIT PROOF SECTION */}
              <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                  📸 Official Visual Verification Image (Completion Proof)
                </span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Select a certified physical site photo preset that represents the initial status of the infrastructure project:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PROJECT_IMAGE_PRESETS.map((preset) => {
                    const isSelected = projImageUrl === preset.url && !projCustomImage;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setProjImageUrl(preset.url);
                          setProjCustomImage("");
                        }}
                        className={`text-left p-1.5 rounded-lg border transition-all cursor-pointer group ${
                          isSelected ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <div className="h-16 w-full rounded overflow-hidden mb-1 bg-slate-100">
                          <img 
                            src={preset.url} 
                            alt={preset.name} 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-800 line-clamp-1 block leading-tight">{preset.name}</span>
                        <span className="text-[8px] text-slate-400 block line-clamp-1">{preset.description}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Or enter custom inspection image URL</label>
                  <input
                    type="url"
                    value={projCustomImage}
                    onChange={(e) => setProjCustomImage(e.target.value)}
                    placeholder="https://images.unsplash.com/... (optional)"
                    className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingProject}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmittingProject ? "Registering Ledger..." : (
                  <>
                    <Plus className="h-4 w-4" /> Create Core Project Entity
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "new-update" && (
        <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-sm text-left max-w-3xl mx-auto">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-indigo-600" /> Submit Progress Update
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Submit structured accomplishments, budget expended changes, and community constraints. All updates must be reviewed and published by a Supervisor.
            </p>
          </div>

          {projects.length > 0 ? (
            <form onSubmit={handleCreateUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Select Public Works Project</label>
                  <select
                    value={selectedProjId}
                    onChange={(e) => setSelectedProjId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-slate-800"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current Approved Completion: {p.progress}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Proposed Progress Completion (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={updateProg}
                      onChange={(e) => setUpdateProg(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Incremental Budget Expended (ZAR - R)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">R</span>
                    <input
                      type="number"
                      required
                      min={0}
                      value={updateBudgetChange}
                      onChange={(e) => setUpdateBudgetChange(e.target.value)}
                      placeholder="Amount spent in this update cycle..."
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Summary of Construction/Operational Accomplishments</label>
                  <textarea
                    required
                    value={updateSummary}
                    onChange={(e) => setUpdateSummary(e.target.value)}
                    placeholder="Provide a detailed log of structural achievements, milestones met, and local labor integrations..."
                    rows={4}
                    className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Issues, Delays, or Community Risks Flagged (Optional)</label>
                  <textarea
                    value={updateIssues}
                    onChange={(e) => setUpdateIssues(e.target.value)}
                    placeholder="Specify physical bottlenecks, local labor strikes, logistics constraints, subsoil instability, or weather disruptions..."
                    rows={3}
                    className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block mb-1">Evidence File Name (Logs to GCS Metadata)</label>
                  <input
                    type="text"
                    value={evidenceFileName}
                    onChange={(e) => setEvidenceFileName(e.target.value)}
                    placeholder="e.g. Zululand_Hydrostatic_Test_Certificate.pdf"
                    className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                  />
                </div>

                {/* UPDATE IMAGE AUDIT PROOF SECTION */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                    📸 Visual Site Verification Progress Photo
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Attach a certified inspection photo matching this specific progress milestone as visual evidence of works:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {UPDATE_IMAGE_PRESETS.map((preset) => {
                      const isSelected = updateImageUrl === preset.url && !updateCustomImage;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setUpdateImageUrl(preset.url);
                            setUpdateCustomImage("");
                          }}
                          className={`text-left p-1.5 rounded-lg border transition-all cursor-pointer group ${
                            isSelected ? "border-indigo-600 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className="h-14 w-full rounded overflow-hidden mb-1 bg-slate-100">
                            <img 
                              src={preset.url} 
                              alt={preset.name} 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-[8px] font-extrabold text-slate-800 line-clamp-1 leading-tight">{preset.name}</span>
                          <span className="text-[7px] text-slate-400 block line-clamp-1 uppercase tracking-tight">{preset.category}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <label className="text-[9px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">Or enter custom site photo URL</label>
                    <input
                      type="url"
                      value={updateCustomImage}
                      onChange={(e) => setUpdateCustomImage(e.target.value)}
                      placeholder="https://images.unsplash.com/... (optional)"
                      className="w-full p-2.5 border border-slate-200 rounded text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[10px] text-indigo-700 font-bold flex items-center gap-1.5 bg-indigo-50 px-3 py-2 rounded">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-600" /> 
                  <span>Gemini AI automatically audits and grades this update upon supervisor validation.</span>
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingUpdate ? "Submitting Ledger..." : "Submit to Supervisor"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No active projects registered to submit updates for.</p>
              <button
                onClick={() => setActiveTab("new-project")}
                className="text-xs text-indigo-600 font-semibold hover:underline mt-2"
              >
                Register a project first.
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
