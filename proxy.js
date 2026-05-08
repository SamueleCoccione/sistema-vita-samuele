import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/api/sleepcloud', async (req, res) => {
  const { user_token, timestamp = 0 } = req.query;
  if (!user_token) {
    return res.status(400).json({ error: 'user_token mancante' });
  }
  try {
    const url = `https://sleep-cloud.appspot.com/fetchRecords?timestamp=${timestamp}&user_token=${encodeURIComponent(user_token)}`;
    const response = await fetch(url);
    const text = await response.text();
    console.log('[proxy] SleepCloud status:', response.status, '— body:', text.slice(0, 300) || '(vuoto)');
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (err) {
    console.error('[proxy] errore:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('[proxy] attivo su http://localhost:3001'));
