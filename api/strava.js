export default async function handler(req, res) {
  const { path = '' } = req.query;
  const stravaPath = Array.isArray(path) ? path.join('/') : path;
  const stravaUrl  = `https://www.strava.com/${stravaPath}`;

  const headers = { 'Content-Type': req.headers['content-type'] || 'application/json' };
  if (req.headers['authorization']) headers['Authorization'] = req.headers['authorization'];

  const upstream = await fetch(stravaUrl, {
    method:  req.method,
    headers,
    body:    req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  const ct   = upstream.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await upstream.json() : await upstream.text();

  res.status(upstream.status).json(data);
}
