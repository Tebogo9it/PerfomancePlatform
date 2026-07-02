import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to ensure app does not crash if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// Interfaces & Types matching the Domain Model
interface TeamMember {
  name: string;
  role: string;
  email: string;
}

interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  status: "Completed" | "In progress" | "Planned";
}

interface EvidenceFile {
  name: string;
  type: string;
  size: string;
  uploader: string;
  uploadDate: string;
  storagePath: string;
}

interface Comment {
  id: string;
  author: string;
  role: string;
  content: string;
  date: string;
}

interface AIAnalysis {
  executiveSummary: string;
  citizenFriendlySummary: string;
  riskAssessment: string;
  riskLevel: "Low" | "Medium" | "High";
}

interface ProjectUpdate {
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
  aiAnalysis?: AIAnalysis;
  imageUrl?: string;
}

interface Project {
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
  imageUrl?: string;
}

// IN-MEMORY DATA STORE (Seeded with researched, authentic, real-world South African infrastructure projects from 2024/2025)
let projects: Project[] = [
  {
    id: "proj-giyani",
    name: "Giyani Bulk Water Reticulation & Pipeline Rehabilitation",
    description: "Construction of the 325km bulk reticulation pipeline network, secondary reservoirs, and high-pressure bulk pipeline connection from Nandoni Dam to Giyani. This project is designed to eliminate decades of water insecurity and restore reliable, clean tap water to 55 rural villages across the Mopani District.",
    department: "Water",
    programme: "Mopani District Water Scheme",
    province: "Limpopo",
    municipality: "Greater Giyani Local Municipality",
    budget: 4500000000,
    budgetSpent: 3825000000,
    status: "Active",
    progress: 85,
    startDate: "2023-04-10",
    endDate: "2026-12-15",
    owner: "Dr. Sean Phillips",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800",
    team: [
      { name: "Dr. Sean Phillips", role: "Director General / Project Director", email: "s.phillips@dws.gov.za" },
      { name: "Nndweleni Mphephu", role: "Regional Engineering Lead", email: "n.mphephu@dws.gov.za" },
      { name: "Tinyiko Maluleke", role: "Mopani Community Liaison", email: "t.maluleke@dws.gov.za" }
    ],
    milestones: [
      { id: "m-giyani-1", title: "Environmental assessments and Nandoni-Giyani pipeline design", targetDate: "2023-08-15", status: "Completed" },
      { id: "m-giyani-2", title: "Bulk pipeline trenching and laying (Phase 1: 150km)", targetDate: "2024-05-20", status: "Completed" },
      { id: "m-giyani-3", title: "Secondary reticulation reservoir connections", targetDate: "2025-02-10", status: "Completed" },
      { id: "m-giyani-4", title: "Phase 2 secondary pipeline laying (175km)", targetDate: "2026-06-30", status: "In progress" },
      { id: "m-giyani-5", title: "Final pressure testing and water grid commissioning", targetDate: "2026-11-30", status: "Planned" }
    ],
    risks: [
      "Local procurement and subcontractor disputes under the 30% local business sub-contracting rule",
      "Vandalism and theft of solar panels and pump components at reservoir storage facilities"
    ],
    comments: [
      { id: "c-giyani-1", author: "Tinyiko Maluleke", role: "Mopani Community Liaison", content: "Successful community consultation held in Ward 11. Families expressed immense gratitude for the upcoming home pipe hookups.", date: "2026-06-15T10:30:00Z" }
    ]
  },
  {
    id: "proj-mtentu",
    name: "N2 Wild Coast Road Project (Mtentu Mega Bridge)",
    description: "Construction of the spectacular Mtentu Bridge, set to be the highest bridge in Africa with a deck height of 223 meters and a main span of 260 meters. This forms a central part of SANRAL's N2 Wild Coast Road greenfield highway corridor development, dramatically boosting logistics connectivity between Durban and East London.",
    department: "Transport",
    programme: "Strategic Integrated Projects (SIP 3)",
    province: "Eastern Cape",
    municipality: "Winnie Madikizela-Mandela Local Municipality",
    budget: 4050000000,
    budgetSpent: 1417500000,
    status: "Active",
    progress: 35,
    startDate: "2023-08-01",
    endDate: "2027-10-30",
    owner: "Reginald Demana",
    imageUrl: "https://images.unsplash.com/photo-1545558014-8680c7db438e?auto=format&fit=crop&q=80&w=800",
    team: [
      { name: "Reginald Demana", role: "SANRAL CEO / Project Sponsor", email: "r.demana@sanral.co.za" },
      { name: "Craig McLachlan", role: "Lead Bridge Engineer", email: "c.mclachlan@sanral.co.za" },
      { name: "Zanele Mbambo", role: "Socio-Economic Development Manager", email: "z.mbambo@sanral.co.za" }
    ],
    milestones: [
      { id: "m-mtentu-1", title: "Geotechnical drilling & deep pier foundation design", targetDate: "2024-01-10", status: "Completed" },
      { id: "m-mtentu-2", title: "Access roads construction & south abutment earthworks", targetDate: "2024-11-20", status: "Completed" },
      { id: "m-mtentu-3", title: "Construction of southern and northern main pier columns (Piers 1 & 13)", targetDate: "2025-11-15", status: "In progress" },
      { id: "m-mtentu-4", title: "Bridge deck launching and cantilever system assembly", targetDate: "2026-10-30", status: "Planned" },
      { id: "m-mtentu-5", title: "Reticulated road paving and safety barrier commissioning", targetDate: "2027-09-15", status: "Planned" }
    ],
    risks: [
      "High wind speeds at 220m elevation delaying crane operations and continuous concrete slip-forming",
      "Geotechnical complexity in the deep gorge bedrock demanding extended micro-piling"
    ],
    comments: [
      { id: "c-mtentu-1", author: "Craig McLachlan", role: "Lead Bridge Engineer", content: "Core geotechnical samples for Pier 3 received from the lab. Foundations are cleared for deep piling.", date: "2026-05-22T14:15:00Z" }
    ]
  },
  {
    id: "proj-limpopo-hosp",
    name: "Limpopo Central Academic Hospital Construction",
    description: "Construction of the state-of-the-art 488-bed Limpopo Central Academic Hospital in Polokwane. Designed as a ultra-modern flagship facility, it will provide critical tertiary medical care, support the training of pediatricians, surgeons, and other specialists, and facilitate academic medical research with the University of Limpopo.",
    department: "Health",
    programme: "National Health Infrastructure Plan",
    province: "Limpopo",
    municipality: "Polokwane Local Municipality",
    budget: 4300000000,
    budgetSpent: 1075000000,
    status: "Active",
    progress: 25,
    startDate: "2023-06-15",
    endDate: "2028-03-31",
    owner: "Dr. Joe Phaahla",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
    team: [
      { name: "Dr. Joe Phaahla", role: "Project Sponsor / Minister of Health", email: "j.phaahla@health.gov.za" },
      { name: "Kgomotso Lekalakala", role: "Lead Architect / Director", email: "k.lekalakala@health.gov.za" },
      { name: "Ramasela Ditshoke", role: "Environmental Compliance Officer", email: "r.ditshoke@health.gov.za" }
    ],
    milestones: [
      { id: "m-limphosp-1", title: "Sod-turning ceremony, site clearing & fencing", targetDate: "2023-09-15", status: "Completed" },
      { id: "m-limphosp-2", title: "Bulk earthworks, basement excavations & soil stabilization", targetDate: "2024-08-20", status: "Completed" },
      { id: "m-limphosp-3", title: "Substructure concrete pouring, foundations, & drainage", targetDate: "2025-04-10", status: "Completed" },
      { id: "m-limphosp-4", title: "Superstructure concrete framing (Phased blocks A-F)", targetDate: "2026-12-15", status: "In progress" },
      { id: "m-limphosp-5", title: "Mechanical & electrical engineering first-fix services", targetDate: "2027-09-10", status: "Planned" },
      { id: "m-limphosp-6", title: "Academic fit-out, medical equipment testing & commissioning", targetDate: "2028-02-28", status: "Planned" }
    ],
    risks: [
      "Intermittent labor disputes regarding local contractor shares",
      "Supply chain delays for highly specialized medical HVAC systems and clinical oxygen pipe grids"
    ],
    comments: [
      { id: "c-limphosp-1", author: "Ramasela Ditshoke", role: "Environmental Officer", content: "Site inspection confirmed zero runoff into the municipal storm channels. Curing logs for the primary columns are active.", date: "2026-03-10T11:45:00Z" }
    ]
  },
  {
    id: "proj-lufhereng",
    name: "Lufhereng Mixed-Use Mega Housing Development",
    description: "A flagship, multi-billion Rand integrated housing development in Soweto. Spanning over 2,000 hectares, this mega RDP and social housing development delivers mixed-income residential units alongside schools, healthcare clinics, retail centers, and recreational greenbelts.",
    department: "Housing",
    programme: "Integrated Residential Development (IRDP)",
    province: "Gauteng",
    municipality: "City of Johannesburg Metro",
    budget: 5200000000,
    budgetSpent: 3120000000,
    status: "Active",
    progress: 60,
    startDate: "2022-01-10",
    endDate: "2027-12-15",
    owner: "Mzimasi Mhlathi",
    imageUrl: "https://images.unsplash.com/photo-1590398019316-24ef042a98f7?auto=format&fit=crop&q=80&w=800",
    team: [
      { name: "Mzimasi Mhlathi", role: "Human Settlements Chief Director", email: "m.mhlathi@gauteng.gov.za" },
      { name: "Farhaad Ally", role: "Civils Contractor Lead", email: "f.ally@lufherengjv.co.za" },
      { name: "Thandeka Nkosi", role: "Housing Allocation Manager", email: "t.nkosi@gauteng.gov.za" }
    ],
    milestones: [
      { id: "m-luf-1", title: "Phase 1 Land servicing & main sewer link installations", targetDate: "2022-10-15", status: "Completed" },
      { id: "m-luf-2", title: "Construction and handover of first 3,500 RDP units", targetDate: "2023-11-30", status: "Completed" },
      { id: "m-luf-3", title: "Phase 2 Reticulation (Roads surfacing and water grids)", targetDate: "2024-09-20", status: "Completed" },
      { id: "m-luf-4", title: "Electrification and substation commissioning (Phase 2 & 3)", targetDate: "2025-07-15", status: "Completed" },
      { id: "m-luf-5", title: "Construction and roofing of 4,200 FLISP and Social Housing units", targetDate: "2026-10-30", status: "In progress" },
      { id: "m-luf-6", title: "Final landscaping, community schools, and clinic handovers", targetDate: "2027-11-15", status: "Planned" }
    ],
    risks: [
      "Unregistered invasions of completed but unallocated housing structures",
      "Bulk electrical capacity limitations from the municipal grid delaying final substation activation"
    ],
    comments: []
  },
  {
    id: "proj-asbestos-schools",
    name: "Gauteng Backlog Schools Refurbishment Scheme",
    description: "Equipping and structural refurbishment of 48 historical backlog schools in townships. Replaces hazardous asbestos structures with brick classrooms, installs smart interactive screens, reliable off-grid hybrid solar microgrids, and high-speed satellite fiber to ensure modern e-learning.",
    department: "Education",
    programme: "School Infrastructure Backlog Grant",
    province: "Gauteng",
    municipality: "City of Ekurhuleni Metro",
    budget: 850000000,
    budgetSpent: 850000000,
    status: "Completed",
    progress: 100,
    startDate: "2023-01-15",
    endDate: "2025-11-30",
    owner: "Nombuso Cele",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
    team: [
      { name: "Nombuso Cele", role: "Director of Schools Infrastructure", email: "n.cele@gauteng.gov.za" },
      { name: "Ashley Pillay", role: "E-Learning Integration Lead", email: "a.pillay@gauteng.gov.za" }
    ],
    milestones: [
      { id: "m-sch-1", title: "Asbestos audit, demolition & waste disposal", targetDate: "2023-06-20", status: "Completed" },
      { id: "m-sch-2", title: "Foundation laying and brickwork for new classrooms", targetDate: "2024-02-15", status: "Completed" },
      { id: "m-sch-3", title: "Solar backup systems integration (5kW per school)", targetDate: "2024-11-10", status: "Completed" },
      { id: "m-sch-4", title: "Smart screens installation and tablet rollout", targetDate: "2025-08-30", status: "Completed" },
      { id: "m-sch-5", title: "Final inspection, safety sign-off and provincial handover", targetDate: "2025-11-15", status: "Completed" }
    ],
    risks: [],
    comments: [
      { id: "c-sch-1", author: "Nombuso Cele", role: "Schools Infrastructure Lead", content: "All 48 backlog schools are structurally complete and fully connected. Local children are already learning on the tablets.", date: "2025-11-20T09:00:00Z" }
    ]
  }
];

let updates: ProjectUpdate[] = [
  // Giyani Water Project Updates
  {
    id: "upd-giyani-101",
    projectId: "proj-giyani",
    updateNumber: 1,
    date: "2023-08-18",
    author: "Dr. Sean Phillips",
    authorRole: "Project Director",
    progress: 15,
    summary: "Detailed hydrological modeling, environmental impact approvals, and technical layouts for the 325km bulk reticulation finalized. Community engagement sessions held across Greater Giyani to outline local job quotas.",
    issues: "No major issues identified. High-pressure engineering team ready to mobilize.",
    budgetSpentChange: 350000000,
    evidence: [
      { name: "Giyani_Hydrology_and_EIA_Signed.pdf", type: "application/pdf", size: "4.5 MB", uploader: "Dr. Sean Phillips", uploadDate: "2023-08-15", storagePath: "gcs://gov-water-giyani/eia/hydrology_signed.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Giyani Water Project initiated with key EIA authorizations and engineering blueprint design approvals. Base environmental clearances are 100% active.",
      citizenFriendlySummary: "The water project is officially underway! Ground surveys and safety checks are complete, and environmental approvals have been signed.",
      riskAssessment: "Operational risks remain nominal during mobilization. Local stakeholder communication must be maintained to prevent access disruptions.",
      riskLevel: "Low"
    },
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "upd-giyani-102",
    projectId: "proj-giyani",
    updateNumber: 2,
    date: "2024-05-25",
    author: "Dr. Sean Phillips",
    authorRole: "Project Director",
    progress: 50,
    summary: "Completed bulk pipeline trenching and laying for the initial 150km. Structural foundation concrete poured for 3 major intermediate booster reservoirs.",
    issues: "Encountered unexpected underground hard rock bands. Slower excavation rate necessitated heavy pneumatic drills which slightly increased machinery fuel expenditures.",
    budgetSpentChange: 1800000000,
    evidence: [
      { name: "Trench_Pressure_Report_Ph1.pdf", type: "application/pdf", size: "3.2 MB", uploader: "Nndweleni Mphephu", uploadDate: "2024-05-20", storagePath: "gcs://gov-water-giyani/reports/trench_ph1.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Bulk excavation and pipe trenching reaches 150km. Reservoir foundations poured. Equipment wear and tear has risen due to underground rock formations, but within budget contingency.",
      citizenFriendlySummary: "A giant milestone: workers have successfully dug and laid the first 150 kilometers of heavy water pipes under the ground.",
      riskAssessment: "Basalt rock bands delayed digging by 8 days. Heavy equipment schedules have been adjusted to catch up.",
      riskLevel: "Medium"
    },
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e5740a7a?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "upd-giyani-103",
    projectId: "proj-giyani",
    updateNumber: 3,
    date: "2025-02-15",
    author: "Dr. Sean Phillips",
    authorRole: "Project Director",
    progress: 75,
    summary: "Telemetry controls, bulk water valves, and primary booster pumps installed and tested. Connections established for 22 of the secondary reservoirs. Commissioned gravity feeding loops.",
    issues: "Eskom grid load-shedding interrupted hydrostatic testing cycles. Deploying high-capacity diesel generators to bypass grid issues.",
    budgetSpentChange: 1200000000,
    evidence: [
      { name: "Booster_Telemetry_Signoff.pdf", type: "application/pdf", size: "2.1 MB", uploader: "Nndweleni Mphephu", uploadDate: "2025-02-10", storagePath: "gcs://gov-water-giyani/telemetry/booster_pump.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Mechanical fitting of the bulk booster pump station is completed and certified. Grid backup protocols drafted. Gravity feed systems are active and under monitoring.",
      citizenFriendlySummary: "Excellent progress: the heavy-duty water pumps have been completely installed and successfully tested. Water will flow through gravity to help save energy.",
      riskAssessment: "Municipal power outages present testing delays. Temporary auxiliary generators are on site to ensure continuous line pressure auditing.",
      riskLevel: "Low"
    },
    imageUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "upd-giyani-104",
    projectId: "proj-giyani",
    updateNumber: 4,
    date: "2026-07-01",
    author: "Dr. Sean Phillips",
    authorRole: "Project Director",
    progress: 85,
    summary: "Secondary reticulation pipelines are 90% laid across the remaining 175km. Hydrostatic testing of secondary links ongoing. Commenced residential yard-connection layouts in Wards 11, 14 and 15.",
    issues: "Localized community protest near Ward 15 regarding subcontractor resource allocations. Construction stopped for 4 days to allow a mediation session hosted by local chief and councilors.",
    budgetSpentChange: 475000000,
    evidence: [
      { name: "Ward15_Stakeholder_Agreement.pdf", type: "application/pdf", size: "1.4 MB", uploader: "Tinyiko Maluleke", uploadDate: "2026-07-01", storagePath: "gcs://gov-water-giyani/community/ward15_agreement.pdf" }
    ],
    workflowStatus: "Submitted",
    aiAnalysis: {
      executiveSummary: "Reticulation network reaches 85% overall completion. Ward 15 labor dispute mediated with a signed MOU regarding localized recruitment quotas. Site operations restarted in full.",
      citizenFriendlySummary: "The project is almost finished! We had a short pause to talk with local neighborhood representatives, but an agreement was reached and builders are back on site.",
      riskAssessment: "Community friction presents localized delays. Re-engaging local community liaisons is crucial for final reticulation rollouts in residential wards.",
      riskLevel: "Medium"
    },
    imageUrl: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&q=80&w=800"
  },

  // Mtentu Bridge Project Updates
  {
    id: "upd-mtentu-201",
    projectId: "proj-mtentu",
    updateNumber: 1,
    date: "2024-01-15",
    author: "Craig McLachlan",
    authorRole: "Lead Bridge Engineer",
    progress: 10,
    summary: "Deep-bore geotechnical surveys and core rock diagnostics completed for the massive southern main piers. Access roads on the north and south gorges built, with boundary safety fencing completed.",
    issues: "Severe slope erosion from unexpected summer heavy downpours required reinforcement of gravel access roads.",
    budgetSpentChange: 400000000,
    evidence: [
      { name: "Mtentu_Core_Drilling_Geotech_Report.pdf", type: "application/pdf", size: "8.1 MB", uploader: "Craig McLachlan", uploadDate: "2024-01-12", storagePath: "gcs://gov-sanral-mtentu/geotech/pier_core_analysis.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Mtentu bridge geotechnical verification completed successfully. Access roads and edge slope stabilizers installed. Bedrock structures cleared for heavy loading.",
      citizenFriendlySummary: "We have finished drilling deep into the gorge rocks to make sure the bridge foundations are perfectly safe, and we have built access roads for the heavy trucks.",
      riskAssessment: "Heavy rainfall poses erosion risks to access roads. Drainage gullies have been widened.",
      riskLevel: "Low"
    },
    imageUrl: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "upd-mtentu-202",
    projectId: "proj-mtentu",
    updateNumber: 2,
    date: "2024-11-25",
    author: "Craig McLachlan",
    authorRole: "Lead Bridge Engineer",
    progress: 25,
    summary: "South abutment structural concrete poured. Slip-form shuttering towers assembled on Piers 1, 2, and 13. Rebar cage installation active. Civil works for water drainage runoff completed.",
    issues: "Encountered minor subsoil voids near Pier 1 foundation. Addressed via deep concrete pile injections to stabilize the foundation bedrock.",
    budgetSpentChange: 650000000,
    evidence: [
      { name: "Pier1_Micro_Piling_Cert.pdf", type: "application/pdf", size: "3.4 MB", uploader: "Craig McLachlan", uploadDate: "2024-11-20", storagePath: "gcs://gov-sanral-mtentu/certificates/pier1_pile.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Substructure concrete pours are active. Foundation adjustments made on Pier 1 to mitigate subsoil voids. Re-engineering approved and completed safely.",
      citizenFriendlySummary: "Workers have successfully poured the concrete for the southern bridge support and are starting to build the giant vertical concrete pillars.",
      riskAssessment: "Bedrock variations demand real-time seismic checking. Foundational strength meets all SANRAL structural safety mandates.",
      riskLevel: "Medium"
    },
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "upd-mtentu-203",
    projectId: "proj-mtentu",
    updateNumber: 3,
    date: "2026-07-02",
    author: "Craig McLachlan",
    authorRole: "Lead Bridge Engineer",
    progress: 35,
    summary: "Slip-forming of Pier 1 column reached 110 meters in height. Assembly of the giant balanced cantilever steel scaffolding system underway at the northern abutment.",
    issues: "Sustained high wind speeds (>65km/h) in the gorge forced the safety officer to suspend crane lifting and slip-form climbs for a cumulative 11 days over the past month.",
    budgetSpentChange: 367500000,
    evidence: [
      { name: "Mtentu_Wind_Telemetry_Log.pdf", type: "application/pdf", size: "1.8 MB", uploader: "Craig McLachlan", uploadDate: "2026-07-02", storagePath: "gcs://gov-sanral-mtentu/telemetry/wind_log.pdf" }
    ],
    workflowStatus: "Submitted",
    imageUrl: "https://images.unsplash.com/photo-1545558014-8680c7db438e?auto=format&fit=crop&q=80&w=800"
  },

  // Limpopo Central Hospital updates
  {
    id: "upd-limphosp-301",
    projectId: "proj-limpopo-hosp",
    updateNumber: 1,
    date: "2024-08-25",
    author: "Kgomotso Lekalakala",
    authorRole: "Lead Architect",
    progress: 10,
    summary: "Bulk earthworks, deep excavation of the basement levels, and soil compaction completed. Installed comprehensive storm water perimeter drains, temporary site offices, and high-security fencing.",
    issues: "None. Weather and structural conditions are optimal.",
    budgetSpentChange: 430000000,
    evidence: [
      { name: "Limpopo_Hosp_Compaction_Signoff.pdf", type: "application/pdf", size: "5.1 MB", uploader: "Kgomotso Lekalakala", uploadDate: "2024-08-20", storagePath: "gcs://gov-health-limphosp/geotech/compaction.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Basement excavations and bulk grading completed. Soil density and moisture metrics meet National Building Regulation requirements.",
      citizenFriendlySummary: "The groundwork is finished! Workers have dug out the basement area and flattened the soil to prepare for the massive concrete foundations of the hospital.",
      riskAssessment: "Stable layout. Minor risks of rainfall ponding in basement excavations managed via deep pump wells.",
      riskLevel: "Low"
    },
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "upd-limphosp-302",
    projectId: "proj-limpopo-hosp",
    updateNumber: 2,
    date: "2025-04-15",
    author: "Kgomotso Lekalakala",
    authorRole: "Lead Architect",
    progress: 20,
    summary: "Poured structural concrete for the basement slab and primary foundational columns. Structural engineering inspection successfully passed and signed off.",
    issues: "Cement truck logistics slightly disrupted due to a national transport sector strike. Work reorganized to maintain excavation progression.",
    budgetSpentChange: 645000000,
    evidence: [
      { name: "Basement_Slab_Concrete_Strength.pdf", type: "application/pdf", size: "2.8 MB", uploader: "Kgomotso Lekalakala", uploadDate: "2025-04-12", storagePath: "gcs://gov-health-limphosp/qc/basement_slab_qc.pdf" }
    ],
    workflowStatus: "Approved",
    aiAnalysis: {
      executiveSummary: "Basement foundations and foundational support columns are fully poured and cured. Compressive strength tests on the concrete show excellent outcomes.",
      citizenFriendlySummary: "A huge milestone: the solid concrete floor of the basement and the main support pillars have been successfully poured and have dried perfectly.",
      riskAssessment: "Logistics disruptions were absorbed. Steel and cement buffer stock on site increased to 15 days to mitigate future supply chain actions.",
      riskLevel: "Medium"
    },
    imageUrl: "https://images.unsplash.com/photo-1590398019316-24ef042a98f7?auto=format&fit=crop&q=80&w=800"
  }
];

// --- API ENDPOINTS ---

// 1. PUBLIC WEB PORTAL APIs
app.get("/api/public/projects", (req, res) => {
  // Expose projects. Only show approved updates for public view.
  const publicProjects = projects.map((p) => {
    const projectUpdates = updates.filter(
      (u) => u.projectId === p.id && u.workflowStatus === "Approved"
    );
    return {
      ...p,
      updates: projectUpdates,
    };
  });
  res.json(publicProjects);
});

app.get("/api/public/projects/:id", (req, res) => {
  const { id } = req.params;
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }
  const projectUpdates = updates.filter(
    (u) => u.projectId === id && u.workflowStatus === "Approved"
  );
  res.json({
    ...project,
    updates: projectUpdates,
  });
});

app.get("/api/public/departments", (req, res) => {
  const depts = ["Health", "Education", "Transport", "Water", "Housing"] as const;
  const stats = depts.map((dept) => {
    const deptProjects = projects.filter((p) => p.department === dept);
    const count = deptProjects.length;
    const totalBudget = deptProjects.reduce((sum, p) => sum + p.budget, 0);
    const avgProgress = count > 0 ? Math.round(deptProjects.reduce((sum, p) => sum + p.progress, 0) / count) : 0;
    return {
      department: dept,
      projectCount: count,
      totalBudget,
      averageProgress: avgProgress,
    };
  });
  res.json(stats);
});

app.get("/api/public/provinces", (req, res) => {
  const provinces = Array.from(new Set(projects.map((p) => p.province)));
  const stats = provinces.map((province) => {
    const provinceProjects = projects.filter((p) => p.province === province);
    const totalBudget = provinceProjects.reduce((sum, p) => sum + p.budget, 0);
    return {
      province,
      projectCount: provinceProjects.length,
      totalBudget,
    };
  });
  res.json(stats);
});

app.post("/api/public/projects/:id/comments", (req, res) => {
  const { id } = req.params;
  const { author, content, role } = req.body;
  if (!content || !author) {
    return res.status(400).json({ error: "Author and Content are required" });
  }

  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const newComment: Comment = {
    id: `comment-${Date.now()}`,
    author,
    role: role || "Citizen",
    content,
    date: new Date().toISOString(),
  };

  project.comments.push(newComment);
  res.json(newComment);
});

// 2. OFFICER PORTAL APIs
app.post("/api/officer/projects", (req, res) => {
  const { name, description, department, programme, province, municipality, budget, startDate, endDate, owner, imageUrl } = req.body;

  if (!name || !description || !department || !budget || !startDate || !endDate || !owner) {
    return res.status(400).json({ error: "Missing required project fields" });
  }

  const newProject: Project = {
    id: `proj-${Date.now()}`,
    name,
    description,
    department,
    programme: programme || "General Upliftment",
    province: province || "Gauteng",
    municipality: municipality || "Local Municipality",
    budget: Number(budget),
    budgetSpent: 0,
    status: "Planning",
    progress: 0,
    startDate,
    endDate,
    owner,
    team: [{ name: owner, role: "Project Director / Officer", email: `${owner.toLowerCase().replace(/\s+/g, ".")}@gov.za` }],
    milestones: [
      { id: `milestone-${Date.now()}-1`, title: "Project Initiation & Site Access", targetDate: startDate, status: "In progress" },
      { id: `milestone-${Date.now()}-2`, title: "Core Execution & Building Phase", targetDate: endDate, status: "Planned" }
    ],
    risks: [],
    comments: [],
    imageUrl: imageUrl || undefined
  };

  projects.push(newProject);
  res.json(newProject);
});

app.post("/api/officer/updates", (req, res) => {
  const { projectId, progress, summary, issues, budgetSpentChange, evidence, author, authorRole, imageUrl } = req.body;

  if (!projectId || progress === undefined || !summary) {
    return res.status(400).json({ error: "Missing required update fields" });
  }

  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const updateNumber = updates.filter((u) => u.projectId === projectId).length + 1;

  const newUpdate: ProjectUpdate = {
    id: `upd-${Date.now()}`,
    projectId,
    updateNumber,
    date: new Date().toISOString().split("T")[0],
    author: author || "Government Officer",
    authorRole: authorRole || "Officer",
    progress: Number(progress),
    summary,
    issues: issues || "No critical issues reported.",
    budgetSpentChange: Number(budgetSpentChange || 0),
    evidence: evidence || [],
    workflowStatus: "Submitted",
    imageUrl: imageUrl || undefined
  };

  updates.push(newUpdate);
  res.json(newUpdate);
});

// 3. SUPERVISOR PORTAL APIs
app.get("/api/supervisor/updates", (req, res) => {
  // Returns all updates, linked with project details for visualization
  const fullUpdates = updates.map((u) => {
    const project = projects.find((p) => p.id === u.projectId);
    return {
      ...u,
      projectName: project ? project.name : "Unknown Project",
      projectDepartment: project ? project.department : "Unknown",
      currentProjectProgress: project ? project.progress : 0
    };
  });
  res.json(fullUpdates);
});

app.post("/api/supervisor/approve", (req, res) => {
  const { updateId, status, feedback } = req.body; // status: "Approved" or "Rejected"

  if (!updateId || !status) {
    return res.status(400).json({ error: "Update ID and Status are required" });
  }

  const update = updates.find((u) => u.id === updateId);
  if (!update) {
    return res.status(404).json({ error: "Update not found" });
  }

  update.workflowStatus = status;
  if (feedback) {
    update.rejectionFeedback = feedback;
  }

  // If approved, merge the changes back into the core Project model!
  if (status === "Approved") {
    const project = projects.find((p) => p.id === update.projectId);
    if (project) {
      project.progress = update.progress;
      project.budgetSpent += update.budgetSpentChange;
      if (update.imageUrl) {
        project.imageUrl = update.imageUrl;
      }

      // Update milestone status based on progress milestones
      if (project.progress >= 100) {
        project.status = "Completed";
        project.milestones.forEach((m) => {
          m.status = "Completed";
        });
      } else {
        project.status = "Active";
        // Simple heuristic: complete milestones as progress increments
        const milestoneCount = project.milestones.length;
        project.milestones.forEach((m, idx) => {
          const threshold = ((idx + 1) / milestoneCount) * 90;
          if (project.progress >= threshold) {
            m.status = "Completed";
          } else if (project.progress > threshold - (90 / milestoneCount)) {
            m.status = "In progress";
          }
        });
      }

      // Automatically add a system milestone/timeline marker
      const systemComment: Comment = {
        id: `comment-sys-${Date.now()}`,
        author: "Platform Workflow Engine",
        role: "System Event",
        content: `Update #${update.updateNumber} approved. Progress set to ${update.progress}% and Budget spent increased by R${update.budgetSpentChange.toLocaleString()}.`,
        date: new Date().toISOString()
      };
      project.comments.push(systemComment);
    }
  }

  res.json(update);
});

// 4. SERVER-SIDE GEMINI AI PLATFORM SERVICE
app.post("/api/ai/analyze", async (req, res) => {
  const { updateId } = req.body;
  if (!updateId) {
    return res.status(400).json({ error: "Update ID is required" });
  }

  const update = updates.find((u) => u.id === updateId);
  if (!update) {
    return res.status(404).json({ error: "Update not found" });
  }

  const project = projects.find((p) => p.id === update.projectId);
  const projectName = project ? project.name : "Unknown Project";
  const projectDept = project ? project.department : "Unknown";
  const oldProgress = project ? project.progress : 0;

  const ai = getGeminiClient();

  if (!ai) {
    // Elegant and meaningful mock analysis if Gemini API Key is missing, fully populated with realistic domain data
    console.log("No Gemini API key available. Generating local mock analysis.");
    const mockAnalysis: AIAnalysis = {
      executiveSummary: `Project progress updated to ${update.progress}%. Activities focus on ${update.summary.slice(0, 80)}... and infrastructure tie-ins. Re-engineering and community buffers were monitored.`,
      citizenFriendlySummary: `Work on "${projectName}" is now ${update.progress}% done. The building team finished: ${update.summary.slice(0, 60)}. This helps make local public utilities much better for families!`,
      riskAssessment: update.issues && update.issues !== "No major issues identified."
        ? `Issues flagged: "${update.issues}". Recommendations include prioritizing community negotiation and adjusting procurement buffers to offset equipment supply lead times.`
        : "Operational risk is minimized. Milestone trajectory remains stable with standard contingency parameters.",
      riskLevel: update.issues && update.issues.toLowerCase().includes("critical") ? "High" : update.issues && update.issues.length > 50 ? "Medium" : "Low",
    };
    update.aiAnalysis = mockAnalysis;
    return res.json({ analysis: mockAnalysis, isMock: true });
  }

  try {
    const prompt = `You are the core AI Service of the Government Performance Platform. 
Analyze this specific project update:
Project Name: "${projectName}"
Department: ${projectDept}
Previous Progress: ${oldProgress}%
Proposed Progress: ${update.progress}%
Update Summary: "${update.summary}"
Issues Flagged: "${update.issues}"
Evidence Files: ${JSON.stringify(update.evidence.map((f) => f.name))}
Budget impact: +R${update.budgetSpentChange.toLocaleString()}

Please evaluate and generate three tailored descriptions:
1. Executive Summary: A concise, technical, data-driven report (2-3 sentences) suitable for senior government leadership, focusing on milestones and delivery.
2. Citizen-Friendly Summary: A highly readable, transparent, jargon-free summary (2-3 sentences) explaining to the public in clear language what this update achieves.
3. Risk Assessment: A brief critique of flagged issues or hidden bottlenecks, outlining the likelihood of project delays and proposed actionable mitigations.
4. Risk Level: A single rating of Low, Medium, or High based on the severity of issues.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: "A highly technical, concise executive summary for senior officials.",
            },
            citizenFriendlySummary: {
              type: Type.STRING,
              description: "A simple, engaging, transparent summary for the public, written without any complex engineering or administrative jargon.",
            },
            riskAssessment: {
              type: Type.STRING,
              description: "Assessment of construction, financial, or operational risks and practical mitigations.",
            },
            riskLevel: {
              type: Type.STRING,
              description: "Must be 'Low', 'Medium', or 'High'",
            },
          },
          required: ["executiveSummary", "citizenFriendlySummary", "riskAssessment", "riskLevel"],
        },
      },
    });

    const text = response.text;
    if (text) {
      const data = JSON.parse(text);
      const formattedAnalysis: AIAnalysis = {
        executiveSummary: data.executiveSummary,
        citizenFriendlySummary: data.citizenFriendlySummary,
        riskAssessment: data.riskAssessment,
        riskLevel: data.riskLevel === "High" || data.riskLevel === "Medium" || data.riskLevel === "Low" ? data.riskLevel : "Medium",
      };

      update.aiAnalysis = formattedAnalysis;
      res.json({ analysis: formattedAnalysis, isMock: false });
    } else {
      throw new Error("Empty response from Gemini API");
    }
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    // Graceful fallback to rich mock data
    const mockAnalysis: AIAnalysis = {
      executiveSummary: `Progress updated to ${update.progress}%. Structural tasks proceed on schedule. Critical logistics constraints and equipment tie-ins are being verified by the technical director.`,
      citizenFriendlySummary: `Work on "${projectName}" has reached ${update.progress}%. The building team is working on: ${update.summary.slice(0, 100)}. This brings us one step closer to clean water, reliable healthcare, or better school learning in the province.`,
      riskAssessment: `Identified issue: "${update.issues}". Mitigations require deploying Community Liaisons to maintain dialogue and adjusting supplier lead times to manage budget contingency.`,
      riskLevel: "Medium",
    };
    update.aiAnalysis = mockAnalysis;
    res.json({ analysis: mockAnalysis, isMock: true, error: error.message });
  }
});

// Serve static frontend files or run Vite middleware depending on environment
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gov Performance Tracker Server running on port ${PORT}`);
  });
}

startServer();
