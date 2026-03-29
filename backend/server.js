import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from frontend dist folder
const frontendPath = path.join(__dirname, '../frontend/cq/dist');
app.use(express.static(frontendPath));

// API routes can go here
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// SPA routing - serve index.html for all non-API routes
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
  console.log(`Serving frontend from: ${frontendPath}`);
});