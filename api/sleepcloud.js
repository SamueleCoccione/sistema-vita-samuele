export default async function handler(req, res) {
  const { user_token, timestamp = 0 } = req.query;

  if (!user_token) {
    return res.status(400).json({ error: 'user_token mancante' });
  }

  try {
    const url = `https://sleep-cloud.appspot.com/fetchRecords?timestamp=${timestamp}&user_token=${encodeURIComponent(user_token)}`;
    const response = await fetch(url);
    const text = await response.text();

    res.setHeader('Content-Type', 'application/json');
    res.status(response.status).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
