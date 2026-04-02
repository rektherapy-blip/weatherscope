// api/tiles.js
module.exports = async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).end('Missing url');

  const fullUrl = decodeURIComponent(url);
  if (!fullUrl.includes('mesonet.agron.iastate.edu')) {
    return res.status(403).end('Domain not allowed');
  }

  try {
    const up = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 WeatherScope/1.0',
        'Referer': 'https://mesonet.agron.iastate.edu/',
        'Accept': 'image/png,image/*',
      },
    });

    const buf = await up.arrayBuffer();
    res.setHeader('Content-Type', up.headers.get('content-type') || 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(Buffer.from(buf));
  } catch (e) {
    return res.status(500).end(e.message);
  }
};
