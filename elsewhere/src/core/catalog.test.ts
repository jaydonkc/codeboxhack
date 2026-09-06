import test from "node:test";
import assert from "node:assert/strict";
import {
  byId,
  catalog,
  distance,
  matches,
  type Experience,
  type Filters,
} from "../data/catalog";

const any: Filters = {
  budget: null,
  radius: null,
  duration: null,
  vibes: [],
  query: "",
};
const ids = (filters: Filters) =>
  catalog.filter((item) => matches(item, filters)).map(({ id }) => id);

test("catalog uses recorded geographic coordinates and retains coordinate provenance", () => {
  assert.equal(catalog.length, 11);
  const museum = byId("sloma");
  assert.equal(museum.lat, 35.2795773);
  assert.equal(museum.lng, -120.664934);
  assert.match(museum.coordinateSource ?? "", /nominatim\.openstreetmap\.org/);
  const arboretum = byId("leaning-pine-arboretum");
  assert.ok(
    Math.abs((arboretum.lat as number) - (35 + 18 / 60 + 38 / 3600)) <
      0.00000001,
  );
  assert.ok(
    Math.abs((arboretum.lng as number) - -(120 + 39 / 60 + 46 / 3600)) <
      0.00000001,
  );
  assert.match(
    arboretum.coordinateSource ?? "",
    /^https:\/\/plantsciences\.calpoly\.edu\//,
  );
  for (const item of catalog) {
    assert.ok(
      item.lat !== null && item.lat > 35.25 && item.lat < 35.35,
      item.id,
    );
    assert.ok(
      item.lng !== null && item.lng > -120.75 && item.lng < -120.64,
      item.id,
    );
    assert.ok(item.coordinateSource?.startsWith("https://"), item.id);
  }
  assert.equal(
    new Set(catalog.map(({ lat, lng }) => `${lat},${lng}`)).size,
    catalog.length,
  );
});

test("distances use actual points from Downtown SLO, not item index or a user position", () => {
  const museumDistance = distance(byId("sloma")) as number;
  const arboretumDistance = distance(byId("leaning-pine-arboretum")) as number;
  assert.ok(museumDistance > 0.1 && museumDistance < 0.2);
  assert.ok(arboretumDistance > 2 && arboretumDistance < 2.2);
  assert.equal(matches(byId("sloma"), { ...any, radius: 1 }), true);
  assert.equal(
    matches(byId("leaning-pine-arboretum"), { ...any, radius: 1 }),
    false,
  );
  assert.equal(
    matches(byId("leaning-pine-arboretum"), { ...any, radius: 3 }),
    true,
  );
});

test("every finite budget excludes unknown prices while Any keeps them discoverable", () => {
  const unknown = catalog.filter(({ priceUSD }) => priceUSD === null);
  assert.ok(unknown.length > 0);
  for (const item of unknown) {
    assert.equal(matches(item, any), true, item.id);
    for (const budget of [0, 15, 30, 50, 100000]) {
      assert.equal(
        matches(item, { ...any, budget }),
        false,
        `${item.id} at budget ${budget}`,
      );
    }
  }
  assert.deepEqual(ids({ ...any, budget: 0 }), [
    "sloma",
    "leaning-pine-arboretum",
    "slo-skate-park",
    "bubblegum-alley",
  ]);
  assert.equal(
    matches(byId("slo-botanical-garden"), { ...any, budget: 9 }),
    false,
  );
  assert.equal(
    matches(byId("slo-botanical-garden"), { ...any, budget: 10 }),
    true,
  );
});

test("bounds, radius, and mood combine with AND across real catalog entries", () => {
  const combined: Filters = {
    ...any,
    bounds: { south: 35.279, north: 35.28, west: -120.666, east: -120.66 },
    radius: 1,
    vibes: ["Relax"],
  };
  assert.deepEqual(ids(combined), ["sloma"]);
  assert.equal(matches(byId("history-center"), combined), false); // Outside the northern map edge.
  assert.equal(matches(byId("bubblegum-alley"), combined), false); // Inside map/radius, wrong mood.
  assert.equal(matches(byId("sloma"), { ...combined, radius: 0.01 }), false); // Bounds and mood do not override radius.
  assert.equal(
    matches(byId("sloma"), { ...combined, vibes: ["Active"] }),
    false,
  );
  assert.equal(
    matches(byId("sloma"), {
      ...combined,
      bounds: { south: 35.3, north: 35.32, west: -120.67, east: -120.66 },
    }),
    false,
  );
  assert.deepEqual(ids({ ...combined, bounds: undefined }), [
    "sloma",
    "history-center",
    "downtown-creek-walk",
  ]);
});

test("price, duration, and search remain constraints when map filters are active", () => {
  const combined: Filters = {
    budget: 0,
    radius: 1,
    duration: 60,
    vibes: ["Creative"],
    query: "  museum  ",
    bounds: { south: 35.27, north: 35.29, west: -120.68, east: -120.65 },
  };
  assert.deepEqual(ids(combined), ["sloma"]);
  assert.deepEqual(ids({ ...combined, duration: 59 }), []);
  assert.deepEqual(ids({ ...combined, query: "hike" }), []);
  assert.deepEqual(ids({ ...combined, query: "MUSEUM" }), ["sloma"]);
  assert.equal(
    matches(byId("anam-cre-pottery"), {
      ...combined,
      query: "",
      duration: 180,
    }),
    false,
  );
});

test("unknown locations fail radius and map bounds, and geographic boundaries are inclusive", () => {
  const museum = byId("sloma");
  const noLocation: Experience = { ...museum, lat: null, lng: null };
  const exactBounds = {
    south: museum.lat as number,
    north: museum.lat as number,
    west: museum.lng as number,
    east: museum.lng as number,
  };
  assert.equal(distance(noLocation), null);
  assert.equal(matches(noLocation, any), true);
  assert.equal(matches(noLocation, { ...any, radius: 50 }), false);
  assert.equal(matches(noLocation, { ...any, bounds: exactBounds }), false);
  assert.equal(
    matches(museum, { ...any, bounds: exactBounds, radius: distance(museum) }),
    true,
  );
});
