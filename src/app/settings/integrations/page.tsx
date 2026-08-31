import { listIntegrations } from "@/repositories";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TestConnectionButton } from "@/components/settings/TestConnectionButton";

const healthStyles: Record<string, string> = {
  ok: "bg-status-safeBg text-status-safe",
  degraded: "bg-status-attentionBg text-status-attention",
  error: "bg-status-urgentBg text-status-urgent",
  not_configured: "bg-surface-muted text-ink-500"
};

export default function IntegrationSettingsPage() {
  const integrations = listIntegrations();

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Settings — Integrations</h1>
        <p className="text-sm text-ink-500">
          Credentials are never shown here. v1 runs entirely on mock adapters — see .env.example for the real
          configuration surface (Phase 6 of 09_IMPLEMENTATION_PLAN.md).
        </p>
      </div>

      <div className="space-y-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardBody className="flex flex-wrap items-start justify-between gap-3 pt-4">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink-900">{integration.label}</p>
                  <Badge className="bg-surface-muted text-ink-500">Tier {integration.tier}</Badge>
                  <Badge className={healthStyles[integration.health]}>{integration.health.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-ink-500">{integration.healthMessage}</p>
                <p className="mt-1 text-xs text-ink-500">
                  <span className="font-medium text-ink-700">Read: </span>
                  {integration.readCapabilities.join(", ") || "—"}
                </p>
                <p className="text-xs text-ink-500">
                  <span className="font-medium text-ink-700">Write: </span>
                  {integration.writeCapabilities.join(", ") || "None enabled"}
                </p>
                <p className="text-xs text-ink-400">
                  Scope: {integration.permissionScope} · Last sync:{" "}
                  {integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString() : "never"}
                </p>
              </div>
              <TestConnectionButton integrationId={integration.id} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
