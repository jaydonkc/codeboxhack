import test from "node:test";
import assert from "node:assert/strict";
import { formatVisitDate, localDateKey, parseVisitDate } from "./visitDate";

test("visit dates use the local calendar day near midnight without a UTC conversion", () => {
  for (const hour of [0, 12, 23]) {
    assert.equal(localDateKey(new Date(2026, 8, 6, hour, 59)), "2026-09-06");
  }
  assert.equal(formatVisitDate("2026-09-06"), "Sep 6, 2026");
  assert.equal(localDateKey(parseVisitDate("2026-09-06")!), "2026-09-06");
});

test("invalid and missing dates remain unknown instead of rolling over to another day", () => {
  for (const value of [undefined, null, "", "2026-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-09-00", "09/06/2026"]) {
    assert.equal(parseVisitDate(value), null);
  }
  assert.equal(formatVisitDate("invalid"), "");
  assert.equal(formatVisitDate("2024-02-29"), "Feb 29, 2024");
});
