import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

const app = express();
const PORT = 5000;
dotenv.config(); // Load environment variables
const SERPAPI_KEY = process.env.SERPAPI_KEY;

app.use(cors());

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  try {
    const response = await axios.get(`https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching results from SerpAPI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
