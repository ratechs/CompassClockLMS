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

app.use(express.json({
  limit: '100mb'
}));

app.use(express.urlencoded({
  limit: '100mb',
  extended: true
}));

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
// REACT FRONTEND
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientBuildPath = path.resolve(
  __dirname,
  '../../lms-react-app/build'
);

console.log('Current directory:', __dirname);
console.log('Build path:', clientBuildPath);

if (!fs.existsSync(clientBuildPath)) {
  console.error(
    chalk.red('❌ React build directory not found')
  );
} else {
  console.log(
    chalk.green('✅ React build directory found')
  );
}

app.use(express.static(clientBuildPath));

// ======================================================
// NODE.JS CONNECTION TEST
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
// FRONTEND FALLBACK
// ======================================================

app.use((req, res) => {

  if (!req.path.startsWith('/api')) {
    return res.sendFile(
      path.join(clientBuildPath, 'index.html')
    );
  }

  return res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 8001;

mangoDb()
  .then(() => {
    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch(err => {
    console.error('MongoDB Error:', err);
  });