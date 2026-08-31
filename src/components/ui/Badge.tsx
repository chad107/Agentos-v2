import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { ConfidenceLevel, JobReadinessStatus, PriorityLevel, RecommendationCategory } from "@/domain";
import { CONFIDENCE_COPY } from "@/domain";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}

const priorityStyles: Record<PriorityLevel, string> = {
  urgent: "bg-status-urgentBg text-status-urgent",
  high: "bg-status-attentionBg text-status-attention",
  normal: "bg-status-infoBg text-status-info",
  low: "bg-surface-muted text-ink-500"
};

export function PriorityChip({ priority }: { priority: PriorityLevel }) {
  const labels: Record<PriorityLevel, string> = { urgent: "Urgent", high: "High", normal: "Normal", low: "Low" };
  return <Badge className={priorityStyles[priority]}>{labels[priority]}</Badge>;
}

const categoryLabels: Record<RecommendationCategory, string> = {
  safety: "Safety",
  financial: "Financial",
  customer: "Customer",
  operations: "Operations",
  sales: "Sales",
  admin: "Admin"
};

export function CategoryChip({ category }: { category: RecommendationCategory }) {
  return <Badge className="bg-surface-muted text-ink-700">{categoryLabels[category]}</Badge>;
}

const confidenceStyles: Record<ConfidenceLevel, string> = {
  high: "bg-status-safeBg text-status-safe",
  medium: "bg-status-attentionBg text-status-attention",
  low: "bg-status-urgentBg text-status-urgent"
};

export function ConfidenceBadge({ confidence, title }: { confidence: ConfidenceLevel; title?: string }) {
  const labels: Record<ConfidenceLevel, string> = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
  return (
    <Badge className={confidenceStyles[confidence]} title={title ?? CONFIDENCE_COPY[confidence]}>
      {labels[confidence]}
    </Badge>
  );
}

const readinessStyles: Record<JobReadinessStatus, string> = {
  unknown: "bg-surface-muted text-ink-500",
  needs_review: "bg-status-infoBg text-status-info",
  blocked: "bg-status-urgentBg text-status-urgent",
  at_risk: "bg-status-attentionBg text-status-attention",
  ready: "bg-status-safeBg text-status-safe",
  in_progress: "bg-status-infoBg text-status-info",
  closeout_missing: "bg-status-attentionBg text-status-attention",
  complete: "bg-status-safeBg text-status-safe"
};

const readinessLabels: Record<JobReadinessStatus, string> = {
  unknown: "Unknown",
  needs_review: "Needs review",
  blocked: "Blocked",
  at_risk: "At risk",
  ready: "Ready",
  in_progress: "In progress",
  closeout_missing: "Closeout missing",
  complete: "Complete"
};

export function ReadinessBadge({ status }: { status: JobReadinessStatus }) {
  return <Badge className={readinessStyles[status]}>{readinessLabels[status]}</Badge>;
}

export function StatusPill({
  tone,
  children
}: {
  tone: "good" | "attention" | "urgent" | "info";
  children: ReactNode;
}) {
  const toneStyles: Record<typeof tone, string> = {
    good: "bg-status-safeBg text-status-safe",
    attention: "bg-status-attentionBg text-status-attention",
    urgent: "bg-status-urgentBg text-status-urgent",
    info: "bg-status-infoBg text-status-info"
  };
  return <Badge className={toneStyles[tone]}>{children}</Badge>;
}
