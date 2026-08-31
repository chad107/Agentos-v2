import { WORKFLOWS } from "@/config/workflows";
import { listActivity } from "@/repositories";
import { getDivisionConfig } from "@/config/divisions";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Workflow registry (01_MASTER_SPEC.md "Event-driven orchestration",
 * Milestone 9). Shows what each canonical workflow is, whether this build
 * actually implements it today, and the real routing decisions the event
 * dispatcher (src/events/dispatcher.ts) has made this session.
 */
export default function WorkflowsPage() {
  const routedEvents = listActivity({ eventType: "workflow.routed", limit: 20 });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Workflow registry</h1>
        <p className="text-sm text-ink-500">
          Canonical business workflows (01_MASTER_SPEC.md). &ldquo;Active&rdquo; means the described behavior is
          implemented by existing logic today — not necessarily via this registry&apos;s dispatch loop.
          &ldquo;Inactive&rdquo; means only the definition exists.
        </p>
      </div>

      <section className="space-y-3">
        <div className="space-y-3">
          {WORKFLOWS.map((wf) => {
            const division = getDivisionConfig(wf.ownerDivision);
            return (
              <Card key={wf.id}>
                <CardHeader>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink-900">{wf.name}</p>
                      <Badge className={wf.status === "active" ? "bg-status-safeBg text-status-safe" : "bg-surface-muted text-ink-500"}>
                        {wf.status}
                      </Badge>
                      <Badge className="bg-surface-muted text-ink-700">v{wf.currentVersion}</Badge>
                    </div>
                    <p className="text-xs text-ink-400">
                      {division?.label ?? wf.ownerDivision} ·{" "}
                      {wf.triggerType === "event" ? `on event: ${wf.triggerEventType}` : wf.triggerType}
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <p className="text-xs text-ink-500">{wf.description}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">Recent routing decisions</h2>
        {routedEvents.length ? (
          <ul className="space-y-1.5">
            {routedEvents.map((e) => (
              <li key={e.id} className="text-xs text-ink-500">
                <span className="font-medium text-ink-700">{new Date(e.occurredAt).toLocaleString()}</span> — {e.summary}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No events have been routed yet."
            hint="Approve, reject, or edit-and-approve a proposal in the Approval Centre — its approval.resolved event dispatches to the Executive loop workflow and appears here."
          />
        )}
      </section>
    </div>
  );
}
