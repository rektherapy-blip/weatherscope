
// api/tiles.js
// Receives a fully-constructed IEM tile URL (z/x/y already substituted by browser)
// Fetches it server-side and returns the image, bypassing CORS.

const ALLOWED = [
  'mesonet.agron.iastate.edu',
];

module.exports = async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing url param' });
  }

  let fullUrl;
  try {
    fullUrl = decodeURIComponent(url);
  } catch (e) {
    return res.status(400).json({ error: 'Bad URL encoding' });
  }

  // Validate domain
  let parsed;
  try {
    parsed = new URL(fullUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL: ' + fullUrl });
  }

  const allowed = ALLOWED.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  if (!allowed) {
    return res.status(403).json({ error: 'Domain not allowed: ' + parsed.hostname });
  }

  try {
    const up = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'NEPlainsWeatherScope/1.0',
        'Accept': 'image/png,image/*',
        'Referer': 'https://mesonet.agron.iastate.edu/',
      },
    });

    // Return empty transparent tile if IEM has no data for this frame
    if (!up.ok) {
      return res.status(204).end();
    }

    const ct  = up.headers.get('content-type') || 'image/png';
    const buf = await up.arrayBuffer();

    res.setHeader('Content-Type', ct);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(Buffer.from(buf));

  } catch (e) {
    console.error('[tiles]', e.message, '|', fullUrl);
    return res.status(204).end();
  }
};
