const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const dataPath = path.join(__dirname, 'dashboard_data.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const statesArray = Object.entries(rawData.states).map(([abbr, s]) => ({
  abbr,
  ...s
}));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/summary', (req, res) => {
  res.json(rawData.summary);
});

app.get('/api/states', (req, res) => {
  res.json(statesArray);
});

app.get('/api/states/:abbr', (req, res) => {
  const abbr = req.params.abbr.toUpperCase();
  const state = rawData.states[abbr];
  if (!state) return res.status(404).json({ error: 'State not found' });
  res.json({ abbr, ...state });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  America250 Dashboard`);
  console.log(`  http://localhost:${PORT}\n`);
});
