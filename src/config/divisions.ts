/**
 * Division registry — the configuration-driven source for the Universal
 * Division Workspace (01_MASTER_SPEC.md "Universal Division Workspace").
 * One entry per division; the workspace UI (src/app/divisions/[key]) is a
 * single reusable page that reads this data rather than eight hand-built
 * pages. Manager/specialist rosters and KPI labels are copied verbatim from
 * 01_MASTER_SPEC.md "Divisions and agents".
 */

import type { DivisionConfig } from "@/domain/platform";

export const DIVISIONS: DivisionConfig[] = [
  {
    key: "sales",
    label: "Sales",
    missionSummary: "Lead intake through quote acceptance and deposit handoff to Operations.",
    roster: {
      manager: "Sales Manager Agent",
      specialists: ["Lead Intake", "Communications", "Estimating", "Follow-up", "CRM Intelligence", "Sales Analytics"]
    },
    kpiLabels: ["Lead response time", "Quote turnaround", "Quote conversion", "Pipeline value", "Forecast accuracy"],
    legacyRoute: "/sales",
    dataStatus: "live"
  },
  {
    key: "marketing",
    label: "Marketing",
    missionSummary:
      "Market/competitor intelligence, creative and campaign drafting, advertising, reputation, SEO and analytics — all approval-gated before publishing.",
    roster: {
      manager: "Marketing Manager Agent",
      specialists: [
        "Market Intelligence",
        "Content & Creative",
        "Advertising",
        "Reputation",
        "Website & SEO",
        "Campaign Analytics",
        "Brand Guardian"
      ]
    },
    kpiLabels: ["Qualified leads", "Cost per lead", "Lead-to-sale conversion", "Campaign ROI", "Reputation/review health"],
    legacyRoute: null,
    dataStatus: "mocked"
  },
  {
    key: "operations",
    label: "Operations",
    missionSummary: "Job readiness, scheduling, materials/procurement, crew coordination, quality and closeout.",
    roster: {
      manager: "Operations Manager Agent",
      specialists: [
        "Scheduling & Dispatch",
        "Materials & Inventory",
        "Procurement & Shipping",
        "Job Readiness",
        "Crew Coordination",
        "Quality",
        "Fleet & Equipment",
        "Closeout",
        "Capacity Planning"
      ]
    },
    kpiLabels: ["On-time completion", "Crew utilization", "First-time quality", "Schedule adherence", "Job profitability"],
    legacyRoute: "/operations",
    dataStatus: "live"
  },
  {
    key: "finance",
    label: "Finance",
    missionSummary:
      "Vendor bills, receivables and statement cross-checks within permitted scope. Never moves money autonomously.",
    roster: {
      manager: "Finance Manager Agent",
      specialists: [
        "Accounts Receivable",
        "Accounts Payable",
        "Payroll Intelligence",
        "Job Costing",
        "Financial Compliance",
        "Purchasing Intelligence",
        "Business Advisor",
        "Financial Risk"
      ]
    },
    kpiLabels: ["Cash flow", "Gross margin", "A/R aging", "Net profit", "Budget vs actual"],
    legacyRoute: "/accounting",
    dataStatus: "live"
  },
  {
    key: "safety",
    label: "Safety & Compliance",
    missionSummary: "Daily JSA cadence, inspections, incident and regulatory compliance.",
    roster: {
      manager: "Safety & Compliance Manager Agent",
      specialists: [
        "JSA Management",
        "Training & Certification",
        "Fleet/Ladder Inspection",
        "Incident Management",
        "Regulatory Compliance",
        "Risk Assessment",
        "Safety Analytics / Predictive Safety"
      ]
    },
    kpiLabels: ["JSA completion", "Training compliance", "Inspection compliance", "Incident rate", "Corrective-action closure"],
    legacyRoute: "/safety",
    dataStatus: "live"
  },
  {
    key: "customer_experience",
    label: "Customer Experience",
    missionSummary: "Customer success, warranty/service intake, reviews, retention and voice-of-customer.",
    roster: {
      manager: "Customer Experience Manager Agent",
      specialists: [
        "Customer Success",
        "Warranty & Service",
        "Reviews & Referrals",
        "Customer Communications",
        "Retention & Renewals",
        "Voice of Customer",
        "Customer Journey Intelligence"
      ]
    },
    kpiLabels: ["Customer satisfaction", "Review score", "Referral rate", "Warranty response time", "Retention/renewal rate"],
    legacyRoute: "/customers",
    dataStatus: "live"
  },
  {
    key: "administration",
    label: "Administration",
    missionSummary: "Executive assistance, document/knowledge management, workflow automation and governance support.",
    roster: {
      manager: "Administration Manager Agent",
      specialists: [
        "Executive Assistant",
        "Communications",
        "Document Management",
        "Knowledge Management",
        "Workflow Automation",
        "Meeting Intelligence",
        "Policy & Governance",
        "Implementation Manager"
      ]
    },
    kpiLabels: ["Time saved", "Automation rate", "Document compliance", "Knowledge freshness", "Action-item completion"],
    legacyRoute: null,
    dataStatus: "mocked"
  },
  {
    key: "executive_intelligence",
    label: "Executive Intelligence",
    missionSummary: "Cross-division briefing, forecasting, opportunity/risk detection and decision memory for Cohen.",
    roster: {
      manager: "Cohen — Executive Intelligence Manager capability",
      specialists: [
        "Daily Executive Briefing",
        "Business Intelligence",
        "Strategic Planning",
        "Forecasting",
        "Opportunity Detection",
        "Risk Intelligence",
        "Executive Advisor",
        "Decision Memory"
      ]
    },
    kpiLabels: ["Urgent exceptions", "Pending approvals", "Jobs at risk", "Leads outside SLA", "Bills due soon"],
    legacyRoute: "/",
    dataStatus: "live"
  }
];

export function getDivisionConfig(key: string): DivisionConfig | undefined {
  return DIVISIONS.find((d) => d.key === key);
}
