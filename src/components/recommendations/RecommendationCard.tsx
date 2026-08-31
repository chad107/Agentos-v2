"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CategoryChip, ConfidenceBadge, PriorityChip } from "@/components/ui/Badge";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { useAskCohen } from "@/components/cohen/ask-cohen-context";
import type { Recommendation } from "@/domain";

function linkedEntityHref(recommendation: Recommendation): string | null {
  const linked = recommendation.linkedEntity;
  if (!linked) return null;
  switch (linked.type) {
    case "job":
      return `/operations/${linked.id}`;
    case "lead":
      return `/sales#${linked.id}`;
    case "accounting_item":
      return `/accounting#${linked.id}`;
    case "customer_case":
      return `/customers#${linked.id}`;
    default:
      return null;
  }
}

/**
 * Compact by default (V2 spec, "Compact the Top 3 cards") — a person should
 * see recommendations #1-3 without scrolling several screens. Expanding
 * "Details" reveals the explanation, "Why this matters", evidence and
 * source references inline; "Review" opens the full evidence drawer for
 * the decision itself and the audit trail behind it.
 */
export function RecommendationCard({ recommendation, emphasize = false }: { recommendation: Recommendation; emphasize?: boolean }) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { openPanel } = useAskCohen();
  const entityHref = linkedEntityHref(recommendation);

  return (
    <Card className={emphasize ? "border-brand-200 ring-1 ring-brand-100" : undefined}>
      <CardHeader className="pb-0">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              emphasize ? "bg-brand-600 text-white" : "bg-surface-muted text-ink-700"
            }`}
          >
            #{recommendation.cohenRank ?? "–"}
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <PriorityChip priority={recommendation.priority} />
              <CategoryChip category={recommendation.category} />
            </div>
            <h3 className="text-sm font-semibold leading-snug text-ink-900">{recommendation.title}</h3>
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-2 pt-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          {recommendation.impact ? <span>{recommendation.impact.label}</span> : null}
          {recommendation.dueAt ? (
            <span>
              Due{" "}
              {new Date(recommendation.dueAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })}
            </span>
          ) : null}
          <ConfidenceBadge confidence={recommendation.confidence} />
        </div>

        <p className="text-sm">
          <span className="font-medium text-ink-900">Decision: </span>
          <span className="text-ink-700">{recommendation.decisionRequired}</span>
        </p>

        {detailsOpen ? (
          <div className="space-y-2 rounded-lg bg-surface-subtle p-3 text-sm">
            <p className="text-ink-700">
              <span className="font-medium text-ink-900">Why this matters: </span>
              {recommendation.whyItMatters}
            </p>
            <p className="text-xs text-ink-500">{recommendation.confidenceReason}</p>
            {recommendation.sourceRefs.length ? (
              <div className="flex flex-wrap gap-1.5">
                {recommendation.sourceRefs.map((ref) => (
                  <span key={ref} className="rounded-full bg-surface-muted px-2 py-0.5 font-mono text-[11px] text-ink-500">
                    {ref}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardBody>

      <CardFooter>
        <Button size="sm" onClick={() => setEvidenceOpen(true)}>
          Review
        </Button>
        <Button size="sm" variant="ghost" onClick={() => openPanel(recommendation)}>
          Ask Cohen
        </Button>
        <button
          onClick={() => setDetailsOpen((v) => !v)}
          aria-expanded={detailsOpen}
          className="text-sm font-medium text-ink-500 hover:text-ink-700"
        >
          Details {detailsOpen ? "▴" : "▾"}
        </button>
        {entityHref ? (
          <Link href={entityHref} className="ml-auto text-sm font-medium text-brand-700 hover:underline">
            Open linked record →
          </Link>
        ) : null}
      </CardFooter>

      <EvidenceDrawer recommendation={recommendation} open={evidenceOpen} onClose={() => setEvidenceOpen(false)} />
    </Card>
  );
}
