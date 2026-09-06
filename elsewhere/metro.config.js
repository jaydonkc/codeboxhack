const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const http = require('node:http');
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const next = enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware;
  return (req, res, nextHandler) => {
    if (req.url !== '/api/places') return next(req, res, nextHandler);
    const target = process.env.EXPO_PUBLIC_PLACES_API_URL;
    if (!target) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Place search is not configured.' })); return; }
    const upstream = new URL('/api/places', target);
    const transport = upstream.protocol === 'https:' ? require('node:https') : http;
    const proxy = transport.request(upstream, { method: req.method, headers: { ...req.headers, host: upstream.host } }, response => {
      res.writeHead(response.statusCode || 502, response.headers);
      response.pipe(res);
    });
    proxy.setTimeout(20000, () => proxy.destroy());
    proxy.on('error', () => {
      if (res.headersSent) { res.destroy(); return; }
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Place search could not connect. Please retry.' }));
    });
    req.pipe(proxy);
  };
};
// Keep server credentials and local signing material out of Metro's module graph.
const blocked = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(blocked) ? blocked : blocked ? [blocked] : []),
  /[/\\]\.env\.server(?:\.[^/\\]+)?$/,
  /[/\\]\.local[/\\].*/,
];
module.exports = config;
