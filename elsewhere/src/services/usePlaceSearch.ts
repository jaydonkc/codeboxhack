import { useEffect, useRef, useState } from "react";
import type { Experience, MapBounds, SearchOrigin } from "../data/catalog";
import { livePlacesEnabled, requestPlaces } from "./places";
import { isGoogleId } from "./placesTypes";

export function usePlaceSearch(origin: SearchOrigin | undefined, radius: number | null, bounds: MapBounds | undefined, query: string, enabled: boolean, savedIds: string[]) {
  const [registry, setRegistry] = useState<Record<string, Experience>>({});
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string>();
  const [revision, setRevision] = useState(0);
  const generation = useRef(0);
  const merge = (entries: Experience[]) => setRegistry(old => ({ ...old, ...Object.fromEntries(entries.map(e => [e.id, e])) }));
  const request = origin && { action: "search" as const, origin, radius: Math.min(50000, Math.max(1, (radius ?? 25) * 1609.344)), bounds, query };
  const signature = JSON.stringify(request);
  useEffect(() => {
    const gen = ++generation.current;
    const controller = new AbortController();
    setItems([]); setNextPageToken(undefined); setError(""); setLoading(false);
    if (!enabled || !livePlacesEnabled || !request) return;
    setLoading(true);
    requestPlaces(request, controller.signal).then(result => {
      if (generation.current !== gen || controller.signal.aborted) return;
      const entries = result.experiences ?? [];
      merge(entries); setItems(entries); setNextPageToken(result.nextPageToken);
    }).catch(e => { if (!controller.signal.aborted && generation.current === gen) setError(e.name === "AbortError" ? "Search timed out. Try again." : e.message); })
      .finally(() => { if (!controller.signal.aborted && generation.current === gen) setLoading(false); });
    return () => controller.abort();
  }, [signature, enabled, revision]);
  useEffect(() => {
    if (!livePlacesEnabled) return;
    let cancelled = false;
    const pending = [...new Set(savedIds.filter(isGoogleId))];
    // Refresh references after launch without persisting Google venue content.
    async function worker() {
      while (pending.length && !cancelled) {
        const id = pending.shift()!;
        try { const result = await requestPlaces({ action: "details", id }); if (!cancelled) merge(result.experiences ?? []); }
        catch { /* Keep the saved reference visible; opening/retrying can refresh it later. */ }
      }
    }
    void Promise.all([worker(), worker()]);
    return () => { cancelled = true; };
  }, [savedIds.filter(isGoogleId).sort().join("|")]);
  async function loadMore() {
    if (!request || !nextPageToken || loading) return;
    const gen = generation.current;
    setLoading(true); setError("");
    try {
      const result = await requestPlaces({ ...request, pageToken: nextPageToken });
      if (generation.current !== gen) return;
      const entries = result.experiences ?? [];
      merge(entries); setItems(old => [...new Map([...old, ...entries].map(e => [e.id, e])).values()]); setNextPageToken(result.nextPageToken);
    } catch (e) { if (generation.current === gen) setError(e instanceof Error ? e.message : "Couldn’t load more places."); }
    finally { if (generation.current === gen) setLoading(false); }
  }
  return { registry, items, loading, error, nextPageToken, loadMore, retry: () => setRevision(r => r + 1), refresh: async (id: string) => { const result = await requestPlaces({ action: "details", id }); merge(result.experiences ?? []); } };
}
