"use client";

import { createContext, useContext } from "react";

import type { TimelineStore } from "./store";

export type TimelineStoreApi = ReturnType<typeof import("./store").createTimelineStore>;

export const TimelineStoreContext = createContext<TimelineStoreApi | null>(null);

export function useTimelineStoreApi(): TimelineStoreApi {
  const store = useContext(TimelineStoreContext);
  if (!store) throw new Error("useTimelineStoreApi must be used within a TimelineStoreContext.Provider");
  return store;
}

export function useTimelineStore<T>(selector: (state: TimelineStore) => T): T {
  const store = useTimelineStoreApi();
  return store(selector);
}
