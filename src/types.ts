export interface TeamMember {
  name: string;
  role: string;
  email: string;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  status: "Completed" | "In progress" | "Planned";
}

export interface EvidenceFile {
  name: string;
  type: string;
  size: string;
  uploader: string;
  uploadDate: string;
  storagePath: string;
}

export interface Comment {
  id: string;
  author: string;
  role: string;
  content: string;
  date: string;
}

export interface AIAnalysis {
  executiveSummary: string;
  citizenFriendlySummary: string;
  riskAssessment: string;
  riskLevel: "Low" | "Medium" | "High";
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  updateNumber: number;
  date: string;
  author: string;
  authorRole: string;
  progress: number;
  summary: string;
  issues: string;
  budgetSpentChange: number;
  evidence: EvidenceFile[];
  workflowStatus: "Draft" | "Submitted" | "Under Review" | "Approved" | "Published" | "Rejected";
  rejectionFeedback?: string;
  projectName?: string;
  projectDepartment?: string;
  currentProjectProgress?: number;
  aiAnalysis?: AIAnalysis;
  imageUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  department: "Health" | "Education" | "Transport" | "Water" | "Housing";
  programme: string;
  province: string;
  municipality: string;
  budget: number;
  budgetSpent: number;
  status: "Planning" | "Active" | "Delayed" | "Completed";
  progress: number;
  startDate: string;
  endDate: string;
  owner: string;
  team: TeamMember[];
  milestones: Milestone[];
  risks: string[];
  comments: Comment[];
  updates?: ProjectUpdate[];
  imageUrl?: string;
}

export interface DepartmentStats {
  department: string;
  projectCount: number;
  totalBudget: number;
  averageProgress: number;
}

export interface ProvinceStats {
  province: string;
  projectCount: number;
  totalBudget: number;
}
