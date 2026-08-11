require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'zeon-fitness-api',
    time: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Zeon Fitness API listening on http://localhost:${PORT}`);
});
