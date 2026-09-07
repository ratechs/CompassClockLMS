import express from 'express';
import 'dotenv/config';
import mangoDb from './db/mangoos.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

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
    'http://localhost:3000',
    'http://localhost:5000'
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

// If these are actually used in your project,
// keep/add their routes here.
//
// app.use('/api/create-full-course', CreateFullCourse);
// app.use('/api/update-full-course', UpdateFullCourse);

// ======================================================
// NODE.JS CONNECTION TEST
// ======================================================

app.get('/node-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Node.js application is receiving requests',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// ======================================================
// API 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// ======================================================
// DATABASE + LOCAL SERVER
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

// ======================================================
// EXPORT EXPRESS APP
// ======================================================

export default app;