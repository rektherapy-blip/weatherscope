// api/tiles.js
// Tile proxy for NOAA/IEM data.
//
// Called as: /api/tiles?base=ENCODED_BASE_URL&z={z}&x={x}&y={y}
//
// The frontend passes the IEM base URL (everything before /{z}/{x}/{y}.png)
// as the "base" param. Leaflet replaces {z}/{x}/{y} with real tile coords.
// This proxy reconstructs the full IEM tile URL and fetches it server-side,
// bypassing the browser's CORS restrictions.

const ALLOWED = [
  'mesonet.agron.iastate.edu',
  'noaa.gov', 'ncep.noaa.gov', 'weather.gov',
  'tilecache.rainviewer.com', 'api.rainviewer.com',
];

module.exports = async function handler(req, res) {
  const { base, z, x, y } = req.query;

  if (!base || !z || !x || !y) {
    return res.status(400).json({ error: 'Missing params: base, z, x, y required' });
  }

  // Decode the base URL and append tile coordinates
  let baseDecoded;
  try {
    baseDecoded = decodeURIComponent(base);
  } catch {
    return res.status(400).json({ error: 'Invalid base URL encoding' });
  }

  const fullUrl = `${baseDecoded}/${z}/${x}/${y}.png`;

  // Validate domain
  let parsed;
  try {
    parsed = new URL(fullUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL: ' + fullUrl });
  }

  const allowed = ALLOWED.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  if (!allowed) {
    return res.status(403).json({ error: 'Domain not allowed: ' + parsed.hostname });
  }

  try {
    const up = await fetch(fullUrl, {
      headers: { 'User-Agent': 'NEPlainsWeatherScope/1.0', 'Accept': 'image/png,image/*' },
    });
    if (!up.ok) return res.status(up.status).end();

    const ct  = up.headers.get('content-type') || 'image/png';
    const buf = await up.arrayBuffer();

    res.setHeader('Content-Type', ct);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(Buffer.from(buf));
  } catch (e) {
    console.error('[tiles proxy error]', e.message, '| URL:', fullUrl);
    return res.status(502).end();
  }
};
