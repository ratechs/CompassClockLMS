import express from 'express';
import 'dotenv/config';
import mangoDb from './db/mangoos.js';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// === ROUTES ===
import authRoutes from './routes/userRoutes.js';
import MaterialRoutes from './routes/materialsRoutes.js';
import CoursesRoutes from './routes/coursesRoutes.js';
import SubjectRoutes from './routes/subjectsRoutes.js';
import CreateFullCourse from './routes/createFullCourse.js';
import UpdateFullCourse from './routes/updateFullCourse.js';
import StudentRoutes from './routes/studentRoutes.js'
const app = express();

// === MIDDLEWARE ===
app.use(express.json({ limit: '100mb' }));

// For URL-encoded payloads
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());
app.use(cors());

// === API ROUTES ===
app.use('/api/users', authRoutes);
app.use('/api/courses', CoursesRoutes);
app.use('/api/subjects', SubjectRoutes);
app.use('/api/materials', MaterialRoutes);
app.use('/api/students/', StudentRoutes);

// === SERVE REACT FRONTEND BUILD ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug the path
console.log('Current directory:', __dirname);
const clientBuildPath = path.resolve(__dirname, '../../lms-react-app/build');
console.log('Build path:', clientBuildPath);

// Check if build directory exists
import fs from 'fs';
if (!fs.existsSync(clientBuildPath)) {
  console.error(chalk.red('❌ React build directory not found at:', clientBuildPath));
} else {
  console.log(chalk.green('✅ React build directory found'));
}

app.use(express.static(clientBuildPath));

// === CATCH-ALL ROUTE TO SERVE REACT (except for API paths) ===
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API route not found' });
  }
});

// === START SERVER ===
const PORT = process.env.PORT || 8001;

mangoDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.green(`✅ Server is running on http://0.0.0.0:${PORT}`));
    console.log(chalk.blue(`   Access from browser: http://13.62.103.169:${PORT}`));
  });
}).catch(err => {
  console.error(chalk.red('❌ Failed to connect to MongoDB:', err.message));
});