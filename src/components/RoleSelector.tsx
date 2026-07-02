import { motion } from "motion/react";
import { User, Eye, ShieldAlert, FileText } from "lucide-react";

interface RoleSelectorProps {
  currentRole: "citizen" | "officer" | "supervisor";
  onRoleChange: (role: "citizen" | "officer" | "supervisor") => void;
}

export default function RoleSelector({ currentRole, onRoleChange }: RoleSelectorProps) {
  const roles = [
    {
      id: "citizen" as const,
      name: "Public Citizen",
      description: "Accesses the Public Web Portal. Explores approved projects, reads citizen-friendly summaries, tracks regional budgets, and submits constructive comments.",
      icon: Eye,
      color: "border-emerald-500/30 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
      activeColor: "bg-emerald-600 text-white ring-4 ring-emerald-100",
      badge: "Citizen Portal",
    },
    {
      id: "officer" as const,
      name: "Government Officer",
      description: "Identified with Department & Project ownership. Drafts and submits project progress updates, logs issues, structures milestones, and records budget expenditures.",
      icon: FileText,
      color: "border-blue-500/30 text-blue-600 bg-blue-50/50 hover:bg-blue-50 dark:hover:bg-blue-950/20",
      activeColor: "bg-blue-600 text-white ring-4 ring-blue-100",
      badge: "Internal API Gateway",
    },
    {
      id: "supervisor" as const,
      name: "Supervisor / Reviewer",
      description: "Controls the publishing workflow. Evaluates submitted updates, initiates Gemini AI summaries and risk predictions, and publishes updates to the public portal.",
      icon: ShieldAlert,
      color: "border-amber-500/30 text-amber-600 bg-amber-50/50 hover:bg-amber-50 dark:hover:bg-amber-950/20",
      activeColor: "bg-amber-600 text-white ring-4 ring-amber-100",
      badge: "Governance Gateway",
    },
  ];

  return (
    <div id="role-selector-root" className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            Bounded Context & Role Authorization
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select a security context to interact with the platform. Citizens only see approved information, while officers draft updates and supervisors govern publishing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            Role: <strong className="uppercase">{currentRole}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isActive = currentRole === role.id;

          return (
            <motion.button
              key={role.id}
              id={`role-btn-${role.id}`}
              onClick={() => onRoleChange(role.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`flex flex-col text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer h-full justify-between ${
                isActive
                  ? "border-transparent shadow-md"
                  : "border-slate-200"
              }`}
              style={{
                backgroundColor: isActive ? "transparent" : undefined,
              }}
              animate={{
                backgroundColor: isActive ? "rgb(255, 255, 255)" : "rgba(248, 250, 252, 0.5)",
                borderColor: isActive ? "rgb(99, 102, 241)" : "rgb(226, 232, 240)",
                boxShadow: isActive ? "0 4px 12px -2px rgba(99, 102, 241, 0.12)" : "none",
              }}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-lg transition-colors ${
                      isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                    {role.badge}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800">{role.name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{role.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between w-full">
                <span className="text-xs text-slate-400 font-medium">
                  {isActive ? "Currently Active" : "Click to Authenticate"}
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isActive ? "bg-indigo-500 animate-pulse" : "bg-slate-300"
                  }`}
                />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
