"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Recommendation } from "@/domain";

interface AskCohenState {
  open: boolean;
  contextRecommendation: Recommendation | null;
  openPanel: (recommendation?: Recommendation | null) => void;
  closePanel: () => void;
}

const AskCohenCtx = createContext<AskCohenState | null>(null);

export function AskCohenProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [contextRecommendation, setContextRecommendation] = useState<Recommendation | null>(null);

  const openPanel = useCallback((recommendation?: Recommendation | null) => {
    if (recommendation !== undefined) setContextRecommendation(recommendation);
    setOpen(true);
  }, []);
  const closePanel = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ open, contextRecommendation, openPanel, closePanel }),
    [open, contextRecommendation, openPanel, closePanel]
  );

  return <AskCohenCtx.Provider value={value}>{children}</AskCohenCtx.Provider>;
}

export function useAskCohen(): AskCohenState {
  const ctx = useContext(AskCohenCtx);
  if (!ctx) throw new Error("useAskCohen must be used within AskCohenProvider");
  return ctx;
}
