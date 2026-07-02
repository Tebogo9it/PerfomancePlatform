import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Project, DepartmentStats, ProvinceStats } from "../types";
import { DollarSign, Percent, FolderCheck, AlertCircle, TrendingUp } from "lucide-react";

interface AnalyticsDashboardProps {
  projects: Project[];
}

export default function AnalyticsDashboard({ projects }: AnalyticsDashboardProps) {
  // 1. Calculate General Metrics
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.budgetSpent, 0);
  const averageProgress = projects.length > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) 
    : 0;
  
  const activeCount = projects.filter((p) => p.status === "Active").length;
  const delayedCount = projects.filter((p) => p.status === "Delayed").length;
  const completedCount = projects.filter((p) => p.status === "Completed").length;
  const planningCount = projects.filter((p) => p.status === "Planning").length;

  // 2. Department Breakdown Data
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
      budget: budget / 1000000, // Show in millions
      spent: spent / 1000000,
      progress: avgProg,
    };
  });

  // 3. Province Distribution Data
  const provinces = Array.from(new Set(projects.map((p) => p.province)));
  const provinceData = provinces.map((province, index) => {
    const provProjects = projects.filter((p) => p.province === province);
    const budget = provProjects.reduce((sum, p) => sum + p.budget, 0);
    return {
      name: province,
      value: budget / 1000000, // Show in millions
    };
  });

  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

  return (
    <div id="analytics-dashboard-root" className="space-y-6">
      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Budget */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Total Portfolio Budget</span>
            <span className="text-2xl font-bold text-slate-800 font-sans mt-1 block">
              {totalBudget >= 1000000000 
                ? `R${(totalBudget / 1000000000).toFixed(2)}B` 
                : `R${(totalBudget / 1000000).toFixed(1)}M`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Spent: {totalSpent >= 1000000000 
                ? `R${(totalSpent / 1000000000).toFixed(2)}B` 
                : `R${(totalSpent / 1000000).toFixed(1)}M`} ({((totalSpent / (totalBudget || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Average Progress */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Average Progress</span>
            <span className="text-2xl font-bold text-slate-800 font-sans mt-1 block">
              {averageProgress}%
            </span>
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-mono mt-1">
              <TrendingUp className="h-3 w-3" /> Event-linked auditable progress
            </span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Percent className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Active Projects */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Active Delivery</span>
            <span className="text-2xl font-bold text-slate-800 font-sans mt-1 block">
              {activeCount} / {projects.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Completed: {completedCount} | Planning: {planningCount}
            </span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <FolderCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Delayed Risks */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400 block uppercase tracking-wider">Projects Flagged</span>
            <span className="text-2xl font-bold text-slate-800 font-sans mt-1 block">
              {delayedCount}
            </span>
            <span className="text-[10px] text-amber-600 font-mono mt-1 block">
              Undergoing subsoil / labor audits
            </span>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Budget vs Spent (Bar Chart) */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Budget vs Spent by Department</h3>
            <p className="text-xs text-slate-500">Expressed in Millions of Rands (RM)</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                  itemStyle={{ fontSize: 12 }}
                  labelStyle={{ fontWeight: "bold", fontSize: 12, color: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar dataKey="budget" name="Allocated Budget (RM)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" name="Spent to Date (RM)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Budget Share by Province (Pie Chart) */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Provincial Budget Allocation</h3>
            <p className="text-xs text-slate-500">Proportional share in portfolio (RM)</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={provinceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {provinceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R${value.toFixed(1)}M`}
                  contentStyle={{ backgroundColor: "#1e293b", borderRadius: "8px", border: "none", color: "#f8fafc" }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Centered Total label */}
            <div className="absolute flex flex-col items-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
              <span className="text-lg font-bold text-slate-800">
                {totalBudget >= 1000000000 
                  ? `R${(totalBudget / 1000000000).toFixed(2)}B` 
                  : `R${(totalBudget / 1000000).toFixed(1)}M`}
              </span>
            </div>
          </div>
          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
            {provinceData.map((prov, idx) => (
              <div key={prov.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[11px] font-medium text-slate-600 truncate">{prov.name}</span>
                <span className="text-[10px] font-mono text-slate-400 ml-auto">R{prov.value.toFixed(1)}M</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress KPIs Breakdown List */}
      <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Department Execution Efficiency</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {deptData.map((d, index) => (
            <div key={d.name} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700">{d.name}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{d.count} Projects Active</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-medium text-slate-400">Average Progress</span>
                  <span className="text-xs font-bold text-slate-800">{d.progress}%</span>
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
  );
}
