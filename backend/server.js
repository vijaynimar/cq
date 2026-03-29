import express from 'express';
import cors from 'cors';
import path from 'path';
const app = express();

app.use(cors());
app.use(express.json());

// API routes can go here
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});