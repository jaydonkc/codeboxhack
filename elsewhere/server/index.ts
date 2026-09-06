import { createServer } from "node:http";
import { queryPlaces, RequestError } from "./places";

const key = process.env.GOOGLE_PLACES_API_KEY ?? "";
const allowed = new Set((process.env.ALLOWED_ORIGINS ?? "http://localhost:8081,http://127.0.0.1:8081").split(","));
const limit = Number(process.env.PLACES_REQUESTS_PER_MINUTE ?? 60);
let windowStart = Date.now(), requests = 0;
const server = createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  if (origin && !allowed.has(origin)) { res.writeHead(403); res.end(JSON.stringify({ error: "Origin not allowed." })); return; }
  if (origin) { res.setHeader("Access-Control-Allow-Origin", origin); res.setHeader("Vary", "Origin"); }
  if (req.method === "OPTIONS") { res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); res.writeHead(204); res.end(); return; }
  if (req.url === "/health" && req.method === "GET") { res.end(JSON.stringify({ configured: !!key })); return; }
  if (req.url !== "/api/places" || req.method !== "POST") { res.writeHead(404); res.end(JSON.stringify({ error: "Not found." })); return; }
  if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); requests = 0; }
  if (++requests > limit) { res.writeHead(429); res.end(JSON.stringify({ error: "Search limit reached. Please try again shortly." })); return; }
  try {
    let body = "";
    for await (const chunk of req) { body += chunk; if (body.length > 8192) throw new RequestError(413, "Request too large."); }
    let input; try { input = JSON.parse(body); } catch { throw new RequestError(400, "Invalid JSON."); }
    res.end(JSON.stringify(await queryPlaces(input, key)));
  } catch (error) {
    const known = error instanceof RequestError;
    res.writeHead(known ? error.status : 502);
    res.end(JSON.stringify({ error: known ? error.message : "Place search timed out or could not connect. Please try again." }));
  }
});
server.requestTimeout = 20000;
server.listen(Number(process.env.PORT ?? 8787), process.env.HOST ?? "127.0.0.1", () => console.log(`Places server ready. Live discovery ${key ? "configured" : "needs GOOGLE_PLACES_API_KEY"}.`));
