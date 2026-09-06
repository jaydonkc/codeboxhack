import test from "node:test";
import assert from "node:assert/strict";
import { normalizePlace, queryPlaces, RequestError, validateRequest } from "./places";
import { matches } from "../src/data/catalog";
import { unresolvedPlace } from "../src/services/placesTypes";
const museum = { id: "ChIJ-test", displayName: { text: "City Museum" }, formattedAddress: "Los Angeles, CA", location: { latitude: 34.05, longitude: -118.24 }, primaryType: "museum", attributions: [{ provider: "Data partner", providerUri: "https://example.org" }] };
function mock(data: unknown, status = 200) {
  const calls: { url: string; options?: RequestInit }[] = [];
  const fetcher = (async (url: any, options?: RequestInit) => { calls.push({ url: String(url), options }); return new Response(JSON.stringify(data), { status }); }) as typeof fetch;
  return { calls, fetcher };
}
test("city autocomplete restricts to cities and resolves the selected city coordinates", async () => {
  const m = mock({ suggestions: [{ placePrediction: { placeId: "abc", text: { text: "Paris, France" } } }] });
  assert.deepEqual((await queryPlaces({ action: "cities", query: "Paris" }, "private-key", m.fetcher)).cities, [{ id: "abc", label: "Paris, France" }]);
  assert.deepEqual(JSON.parse(m.calls[0].options!.body as string).includedPrimaryTypes, ["(cities)"]);
  const d = mock(museum);
  assert.deepEqual((await queryPlaces({ action: "city", id: "abc" }, "key", d.fetcher)).city?.origin, { lat: 34.05, lng: -118.24 });
});
test("nearby discovery sends the actual user position and normalized venue evidence", async () => {
  const m = mock({ places: [museum] });
  const result = await queryPlaces({ action: "search", origin: { lat: 34.05, lng: -118.24 }, radius: 1000 }, "private-key", m.fetcher);
  const request = JSON.parse(m.calls[0].options!.body as string);
  assert.deepEqual(request.locationRestriction.circle.center, { latitude: 34.05, longitude: -118.24 });
  assert.equal(request.maxResultCount, 20);
  assert.equal(result.experiences?.[0].id, "google:ChIJ-test");
  assert.equal(result.experiences?.[0].priceUSD, null);
  assert.equal(result.experiences?.[0].durationMinutesSuggested, null);
  assert.equal(result.experiences?.[0].attributions?.[0].name, "Data partner");
  assert.ok(!JSON.stringify(result).includes("private-key"));
});
test("map search uses a geographic rectangle and forwards pagination", async () => {
  const m = mock({ places: [museum], nextPageToken: "next" });
  const bounds = { south: 33, north: 35, west: -119, east: -117 };
  const result = await queryPlaces({ action: "search", origin: { lat: 34, lng: -118 }, radius: 1000, bounds, query: "pottery class", pageToken: "previous" }, "key", m.fetcher);
  assert.ok(m.calls[0].url.endsWith("places:searchText"));
  const request = JSON.parse(m.calls[0].options!.body as string);
  assert.deepEqual(request.locationRestriction.rectangle.low, { latitude: 33, longitude: -119 });
  assert.equal(request.pageToken, "previous");
  assert.equal(result.nextPageToken, "next");
});
test("city text queries restrict results to the selected area instead of only biasing", async () => {
  const m = mock({ places: [] });
  await queryPlaces({ action: "search", origin: { lat: 48.86, lng: 2.35 }, radius: 5000, query: "museum" }, "key", m.fetcher);
  const request = JSON.parse(m.calls[0].options!.body as string);
  assert.ok(request.locationRestriction.rectangle.low.latitude < 48.86);
  assert.ok(request.locationRestriction.rectangle.high.longitude > 2.35);
  assert.equal(request.locationBias, undefined);
});
test("invalid coordinates, huge radii, and path injection never reach Google", async () => {
  for (const input of [{ action: "search", origin: { lat: 999, lng: 0 }, radius: 100 }, { action: "search", origin: { lat: 0, lng: 0 }, radius: 50001 }, { action: "details", id: "../../secret" }, { action: "cities", query: "x" }]) {
    const m = mock({});
    await assert.rejects(queryPlaces(input, "key", m.fetcher), RequestError);
    assert.equal(m.calls.length, 0);
  }
});
test("missing credentials and Google quota failures are explicit and do not expose provider responses", async () => {
  await assert.rejects(queryPlaces({ action: "cities", query: "Paris" }, ""), /not configured/);
  const m = mock({ error: { message: "private-key" } }, 429);
  await assert.rejects(queryPlaces({ action: "cities", query: "Paris" }, "private-key", m.fetcher), e => e instanceof RequestError && e.status === 429 && !e.message.includes("private-key"));
});
test("invalid, permanently closed, and unsafe metadata are not invented or passed through", () => {
  assert.equal(normalizePlace({ ...museum, businessStatus: "CLOSED_PERMANENTLY" }), null);
  assert.equal(normalizePlace({ ...museum, location: { latitude: NaN, longitude: 1 } }), null);
  const e = normalizePlace({ ...museum, googleMapsUri: "javascript:alert(1)", attributions: [{ provider: "Partner", providerUri: "javascript:bad" }] })!;
  assert.match(e.sourceUrl, /^https:\/\/www.google.com\/maps/);
  assert.equal(e.attributions![0].url, undefined);
  assert.equal(matches(e, { budget: null, duration: 90, radius: null, query: "", vibes: [] }), false);
});
test("unresolved saved references preserve IDs without fabricating a name or location", () => {
  const e = unresolvedPlace("google:saved-reference");
  assert.equal(e.id, "google:saved-reference");
  assert.equal(e.lat, null);
  assert.equal(e.name, "Saved place");
  assert.equal(e.city, "");
});
test("date-line rectangles validate and match both sides of longitude 180", () => {
  const bounds = { south: -20, north: 20, west: 170, east: -170 };
  validateRequest({ action: "search", origin: { lat: 0, lng: 180 }, radius: 100, bounds });
  const e = { ...normalizePlace(museum)!, lat: 0, lng: -179 };
  assert.equal(matches(e, { bounds, radius: null, budget: null, duration: null, query: "", vibes: [] }), true);
});

test("live places never silently measure distance from SLO when location is unset", async () => {
  const { distance } = await import("../src/data/catalog");
  const item = normalizePlace(museum)!;
  assert.equal(distance(item), null);
  assert.equal(distance(item, { lat: 34.05, lng: -118.24 }), 0);
});
