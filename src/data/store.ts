/**
 * Single in-memory store, seeded once per process. This stands in for a
 * real database in the demo (02_SYSTEM_ARCHITECTURE.md notes a
 * PostgreSQL-compatible data model as the production target — see
 * BUILD_STATUS.md for the swap-in plan). Repositories (src/repositories/*)
 * are the only code that should import this module directly; API routes and
 * UI code go through repositories.
 */

import type {
  AccountingItem,
  ActionProposal,
  Agent,
  AgentRun,
  ApprovalDecision,
  CustomerCase,
  EquipmentItem,
  Finding,
  IntegrationSettings,
  Job,
  JobRequirement,
  KnowledgeItem,
  Lead,
  Notification,
  Recommendation,
  SafetyRequirement,
  SourceRecord,
  User,
  VoiceCall
} from "@/domain";
import * as seed from "./seed";
import { buildTop3 } from "@/cohen/orchestrate";
import { recordEvent } from "@/audit/log";
import { loadSnapshot, saveSnapshot, persistenceEnabled } from "./persistence";

interface Store {
  users: User[];
  agents: Agent[];
  agentRuns: AgentRun[];
  sourceRecords: SourceRecord[];
  findings: Finding[];
  recommendations: Recommendation[];
  actionProposals: ActionProposal[];
  approvalDecisions: ApprovalDecision[];
  leads: Lead[];
  jobs: Job[];
  jobRequirements: JobRequirement[];
  equipmentItems: EquipmentItem[];
  safetyRequirements: SafetyRequirement[];
  accountingItems: AccountingItem[];
  customerCases: CustomerCase[];
  voiceCalls: VoiceCall[];
  knowledgeItems: KnowledgeItem[];
  integrationSettings: IntegrationSettings[];
  notifications: Notification[];
}

function computeOpenFindingsCounts(agents: Agent[], findings: Finding[]): Agent[] {
  return agents.map((agent) => ({
    ...agent,
    openFindingsCount: findings.filter((f) => f.agentId === agent.id && f.status === "open").length
  }));
}

function seedAuditTrail(recommendations: Recommendation[], proposals: ActionProposal[]): void {
  for (const rec of recommendations) {
    recordEvent({
      actorType: "cohen",
      actorId: "cohen",
      eventType: "cohen.recommendation_created",
      entityType: "recommendation",
      entityId: rec.id,
      summary: `Cohen created recommendation "${rec.title}".`,
      metadata: { category: rec.category, priority: rec.priority, sourceRefs: rec.sourceRefs }
    });
  }
  for (const proposal of proposals) {
    recordEvent({
      actorType: "agent",
      actorId: proposal.initiatorAgentId,
      eventType: "approval.requested",
      entityType: "action_proposal",
      entityId: proposal.id,
      summary: `${proposal.initiatorAgentId} proposed: ${proposal.description}`,
      metadata: { actionType: proposal.actionType, permissionClass: proposal.permissionClass }
    });
    if (proposal.status === "approved_simulation" || proposal.status === "rejected") {
      recordEvent({
        actorType: "human",
        actorId: "u_tanya",
        eventType: "approval.decided",
        entityType: "action_proposal",
        entityId: proposal.id,
        summary: `Decision recorded for "${proposal.description}": ${proposal.status}.`,
        metadata: { status: proposal.status }
      });
    }
  }
}

function createStore(): Store {
  const rankedRecommendations = buildTop3(seed.recommendations);
  const agentsWithCounts = computeOpenFindingsCounts(seed.agents, seed.findings);

  seed.recordGuardrailProofOfConcept();
  seedAuditTrail(rankedRecommendations, seed.actionProposals);

  return {
    users: [...seed.users],
    agents: agentsWithCounts,
    agentRuns: [...seed.agentRuns],
    sourceRecords: [...seed.sourceRecords],
    findings: [...seed.findings],
    recommendations: rankedRecommendations,
    actionProposals: [...seed.actionProposals],
    approvalDecisions: [...seed.approvalDecisions],
    leads: [...seed.leads],
    jobs: [...seed.jobs],
    jobRequirements: [...seed.jobRequirements],
    equipmentItems: [...seed.equipmentItems],
    safetyRequirements: [...seed.safetyRequirements],
    accountingItems: [...seed.accountingItems],
    customerCases: [...seed.customerCases],
    voiceCalls: [...seed.voiceCalls],
    knowledgeItems: [...seed.knowledgeItems],
    integrationSettings: [...seed.integrationSettings],
    notifications: [...seed.notifications]
  };
}

// A dev-mode hot-reload in Next.js can re-evaluate this module; stash the
// store on `globalThis` so state (e.g. an approval a user just made) survives
// a hot reload during a local dev session instead of silently resetting.
// The same slot also survives a full process restart when persistence is
// enabled (src/data/persistence.ts) — hydrated from disk instead of rebuilt
// from seed data.
declare global {
  // eslint-disable-next-line no-var
  var __agentosStore: Store | undefined;
  // eslint-disable-next-line no-var
  var __agentosPersistenceStarted: boolean | undefined;
}

const FLUSH_INTERVAL_MS = 5000;

/** Registered once per process. Periodic snapshot + a final flush on shutdown, so a hard restart loses at most FLUSH_INTERVAL_MS of writes. */
function startPersistenceLoop(): void {
  if (globalThis.__agentosPersistenceStarted || !persistenceEnabled()) return;
  globalThis.__agentosPersistenceStarted = true;

  const flush = () => {
    if (globalThis.__agentosStore) saveSnapshot(globalThis.__agentosStore);
  };
  const interval = setInterval(flush, FLUSH_INTERVAL_MS);
  interval.unref?.(); // never keep the process alive just for this timer
  for (const signal of ["beforeExit", "SIGINT", "SIGTERM"] as const) {
    process.on(signal, flush);
  }
}

export function getStore(): Store {
  if (!globalThis.__agentosStore) {
    const hydrated = loadSnapshot<Store>();
    globalThis.__agentosStore = hydrated ?? createStore();
    if (!hydrated) saveSnapshot(globalThis.__agentosStore); // first run: persist the initial seeded state
    startPersistenceLoop();
  }
  return globalThis.__agentosStore;
}

/** Test-only: force a fresh store. Never called from API/UI code. */
export function _resetStoreForTests(): Store {
  globalThis.__agentosStore = createStore();
  return globalThis.__agentosStore;
}
