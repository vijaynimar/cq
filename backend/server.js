import express from 'express';
import cors from 'cors';
import appRouter from './app.js';
import { connectDB } from './db/db.js';
const app = express();
app.use(cors());
app.use(express.json());
// Connect to MongoDB
connectDB();

// Use the app router
app.use(appRouter);


// API routes can go here 
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});