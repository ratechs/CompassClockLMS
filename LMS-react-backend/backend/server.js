import express from 'express';
import 'dotenv/config';
import mangoDb from './db/mangoos.js';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// === ROUTES ===
import authRoutes from './routes/userRoutes.js';
import MaterialRoutes from './routes/materialsRoutes.js';
import CoursesRoutes from './routes/coursesRoutes.js';
import SubjectRoutes from './routes/subjectsRoutes.js';
import CreateFullCourse from './routes/createFullCourse.js';
import UpdateFullCourse from './routes/updateFullCourse.js';
import StudentRoutes from './routes/studentRoutes.js';

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: [
    'https://lms.saandrone.com',
    'http://localhost:5173'
  ],
  credentials: true
}));

// ======================================================
// API ROUTES
// ======================================================

app.use('/api/users', authRoutes);
app.use('/api/courses', CoursesRoutes);
app.use('/api/subjects', SubjectRoutes);
app.use('/api/materials', MaterialRoutes);
app.use('/api/students', StudentRoutes);

// ======================================================
// REACT FRONTEND PATH SETUP
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path relative to backend directory structure
const clientBuildPath = path.resolve(__dirname, '../frontend/build');

console.log('Current directory:', __dirname);
console.log('Build path:', clientBuildPath);

if (!fs.existsSync(clientBuildPath)) {
  console.error(chalk.red('❌ React build directory not found at:', clientBuildPath));
} else {
  console.log(chalk.green('✅ React build directory found'));
  app.use(express.static(clientBuildPath));
}

// ======================================================
// TEST ROUTE
// ======================================================

app.get('/node-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Node.js application is receiving requests',
    domain: 'lms.saandrone.com',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// ======================================================
// FRONTEND FALLBACK ROUTE
// ======================================================

app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    return res.status(404).send('React build index.html not found');
  }

  return res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// ======================================================
// START SERVER & DATABASE (NON-BLOCKING)
// ======================================================

const PORT = process.env.PORT || 8001;

// 1. Start Server Immediately (Required for Passenger)
app.listen(PORT, () => {
  console.log(chalk.green(`✅ Server running on port ${PORT}`));
  console.log(chalk.blue(`🌐 Application: https://lms.saandrone.com`));
});

// 2. Connect Database Asynchronously without blocking port listener
mangoDb().catch(err => {
  console.error(chalk.red('❌ Database connection error on startup:', err.message));
});