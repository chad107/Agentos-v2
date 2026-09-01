import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PROHIBITED_ACTION_TYPES } from "@/core";

const POLICY_MATRIX: { action: string; prepare: string; approval: string; execution: string }[] = [
  { action: "Read Jobber/QBO/calendar", prepare: "Yes", approval: "Connection authorization only", execution: "Yes, read only" },
  { action: "Draft customer email/SMS", prepare: "Yes", approval: "Required", execution: "No" },
  { action: "Send customer email/SMS", prepare: "Proposed", approval: "Required", execution: "No" },
  { action: "Create internal reminder", prepare: "Yes", approval: "Configurable", execution: "Low-risk only if explicitly enabled" },
  { action: "Draft PO/order", prepare: "Yes", approval: "Required", execution: "No" },
  { action: "Place order", prepare: "Proposed", approval: "Required", execution: "No at launch" },
  { action: "Prepare QBO bill", prepare: "Yes", approval: "Required before write", execution: "No at launch" },
  { action: "Pay bill / move money", prepare: "No", approval: "N/A", execution: "Prohibited" },
  { action: "Delete record", prepare: "No", approval: "N/A", execution: "Prohibited" },
  { action: "Change system setting", prepare: "No", approval: "N/A", execution: "Prohibited" },
  { action: "Technical HVAC sign-off", prepare: "No", approval: "Human owns", execution: "Prohibited" }
];

export default function PermissionsSettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Settings — Permissions</h1>
        <p className="text-sm text-ink-500">
          Launch authority level: <strong>Level 2 — prepare everything and ask for approval.</strong> Permissions can
          only expand after explicit policy and demonstrated reliability (progressive autonomy — never broadened
          silently).
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Day-one policy matrix</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto pt-0">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">Agent may prepare</th>
                <th className="py-2 pr-3">Human approval</th>
                <th className="py-2">Autonomous execution</th>
              </tr>
            </thead>
            <tbody>
              {POLICY_MATRIX.map((row) => (
                <tr key={row.action} className="border-b border-surface-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-ink-900">{row.action}</td>
                  <td className="py-2 pr-3 text-ink-700">{row.prepare}</td>
                  <td className="py-2 pr-3 text-ink-700">{row.approval}</td>
                  <td className="py-2 text-ink-700">{row.execution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Always prohibited</h2>
        </CardHeader>
        <CardBody className="pt-0">
          <p className="mb-2 text-sm text-ink-500">
            Enforced in code (src/approvals/engine.ts + src/approvals/prohibited.ts) — no proposal of these types can
            ever be created or approved, regardless of who requests it.
          </p>
          <ul className="grid list-disc gap-1 pl-5 text-sm text-ink-700 sm:grid-cols-2">
            {PROHIBITED_ACTION_TYPES.map((type) => (
              <li key={type}>{type.replace(/_/g, " ")}</li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-ink-900">Permission classes</h2>
        </CardHeader>
        <CardBody className="pt-0 text-sm text-ink-700">
          <dl className="space-y-2">
            <div>
              <dt className="font-medium text-ink-900">READ / ANALYZE</dt>
              <dd className="text-ink-500">Read authorized data; classify, summarize, compare and score.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">DRAFT / PROPOSE</dt>
              <dd className="text-ink-500">Prepare a message, bill, checklist, task, PO or response; create an approval proposal.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">EXECUTE_LOW_RISK</dt>
              <dd className="text-ink-500">Disabled by default; may later be enabled for specific, approved repetitive actions.</dd>
            </div>
            <div>
              <dt className="font-medium text-ink-900">EXECUTE_CONSEQUENTIAL</dt>
              <dd className="text-ink-500">Requires explicit human approval and an enabled adapter capability (none enabled in this build).</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
