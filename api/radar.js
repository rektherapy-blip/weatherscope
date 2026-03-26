// api/radar.js
// Returns RainViewer frame list (past radar + nowcast timestamps)

module.exports = async function handler(req, res) {
  try {
    const up = await fetch('https://api.rainviewer.com/public/weather-maps.json', {
      headers: { 'User-Agent': 'NEPlainsWeatherScope/1.0' },
    });
    if (!up.ok) throw new Error('RainViewer returned ' + up.status);
    const data = await up.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=120');
    return res.status(200).json(data);
  } catch (e) {
    console.error('[radar]', e.message);
    return res.status(502).json({ error: e.message });
  }
};
