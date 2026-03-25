// api/tiles.js
const ALLOWED = [
  'mesonet.agron.iastate.edu',
  'noaa.gov', 'ncep.noaa.gov', 'weather.gov',
  'tilecache.rainviewer.com', 'api.rainviewer.com',
  'basemaps.cartocdn.com',
];

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url' });

  let parsed;
  try { parsed = new URL(decodeURIComponent(url)); }
  catch { return res.status(400).json({ error: 'Invalid URL' }); }

  const ok = ALLOWED.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  if (!ok) return res.status(403).json({ error: `Not allowed: ${parsed.hostname}` });

  try {
    const up = await fetch(parsed.toString(), {
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
    console.error('[tiles]', e.message);
    return res.status(502).end();
  }
}
