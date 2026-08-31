/** Source: CLAUDE.md "v1 screens", 03_DASHBOARD_UX_SPEC.md "Information architecture". */
export interface NavItem {
  href: string;
  label: string;
  icon: string; // inline glyph — no icon-library dependency required (network-independent build)
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/divisions", label: "Divisions", icon: "▦" },
  { href: "/work-queue", label: "Work Queue", icon: "☰" },
  { href: "/approvals", label: "Approvals", icon: "✓" },
  { href: "/tracked", label: "Nothing Left Behind", icon: "◐" },
  { href: "/sales", label: "Sales", icon: "◎" },
  { href: "/operations", label: "Operations", icon: "▣" },
  { href: "/safety", label: "Safety", icon: "⛑" },
  { href: "/accounting", label: "Accounting", icon: "$" },
  { href: "/customers", label: "Customers", icon: "☺" },
  { href: "/voice", label: "Voice", icon: "☎" },
  { href: "/agents", label: "Agents", icon: "◈" },
  { href: "/activity", label: "Activity", icon: "≡" },
  { href: "/knowledge", label: "Knowledge", icon: "▤" }
];

export const SETTINGS_NAV: NavItem[] = [
  { href: "/settings/integrations", label: "Integrations", icon: "⚙" },
  { href: "/settings/permissions", label: "Permissions", icon: "🔒" },
  { href: "/settings/governance", label: "Governance", icon: "⚖" },
  { href: "/settings/workflows", label: "Workflows", icon: "⇄" }
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/approvals", label: "Approvals", icon: "✓" },
  { href: "/sales", label: "Sales", icon: "◎" },
  { href: "/operations", label: "Operations", icon: "▣" }
];
