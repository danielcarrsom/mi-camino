"use client";
import { useMemo } from "react";
import { useMe, summarize, type Summary } from "./store";
import { categoryById } from "./catalog";

export function useSummary(): Summary | null {
  const me = useMe();
  return useMemo(() => (me ? summarize(me, (id) => categoryById(id).group) : null), [me]);
}
