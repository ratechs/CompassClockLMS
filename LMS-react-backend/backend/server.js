import express from 'express';
import mangoDb from './db/mangoos.js';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ======================================================
// ROUTES
// ======================================================

import authRoutes from './routes/userRoutes.js';
import MaterialRoutes from './routes/materialsRoutes.js';
import CoursesRoutes from './routes/coursesRoutes.js';
import SubjectRoutes from './routes/subjectsRoutes.js';
import CreateFullCourse from './routes/createFullCourse.js';
import UpdateFullCourse from './routes/updateFullCourse.js';
import StudentRoutes from './routes/studentRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import enrollmentRoutes from './routes/enrollment/enrollmentRoutes.js';
import paymentRoutes from './routes/payment/paymentRoutes.js';

// ======================================================
// PATH SETUP
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// APPLICATION
// ======================================================

const app = express();

// ======================================================
// ENVIRONMENT VARIABLES
// ======================================================

console.log(chalk.cyan('========================================='));
console.log(chalk.cyan('        ENVIRONMENT CONFIGURATION'));
console.log(chalk.cyan('========================================='));

console.log(
    chalk.blue(
        `RAZORPAY_KEY_ID: ${
            process.env.RAZORPAY_KEY_ID ? 'LOADED' : 'MISSING'
        }`
    )
);

console.log(
    chalk.blue(
        `RAZORPAY_KEY_SECRET: ${
            process.env.RAZORPAY_KEY_SECRET ? 'LOADED' : 'MISSING'
        }`
    )
);

console.log(
    chalk.blue(
        `MONGODB_URI: ${
            process.env.MONGODB_URI ? 'LOADED' : 'MISSING'
        }`
    )
);

console.log(
    chalk.blue(
        `NODE_ENV: ${process.env.NODE_ENV || 'not specified'}`
    )
);

console.log(
    chalk.blue(
        `PORT: ${process.env.PORT || '8001'}`
    )
);

console.log(chalk.cyan('========================================='));

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    express.json({
        limit: '100mb',
    })
);

app.use(
    express.urlencoded({
        limit: '100mb',
        extended: true,
    })
);

app.use(cookieParser());

// ======================================================
// CORS
// ======================================================

app.use(
    cors({
        origin: [
            'https://lms.saandrone.com',
            'http://localhost:5173',
        ],
        credentials: true,
    })
);

// ======================================================
// API ROUTES
// ======================================================

// Users
app.use('/api/users', authRoutes);

// Courses
app.use('/api/courses', CoursesRoutes);

// Subjects
app.use('/api/subjects', SubjectRoutes);

// Materials
app.use('/api/materials', MaterialRoutes);

// Students
app.use('/api/students', StudentRoutes);

// Institutions
app.use('/api/institutions', institutionRoutes);

// Enrollments
app.use('/api/enrollments', enrollmentRoutes);

// Payments
app.use('/api/payments', paymentRoutes);

// ======================================================
// OPTIONAL FULL COURSE ROUTES
// ======================================================

app.use('/api/courses', CreateFullCourse);
app.use('/api/courses', UpdateFullCourse);

// ======================================================
// REACT FRONTEND PATH
// ======================================================

const clientBuildPath = path.resolve(
    __dirname,
    '../../lms-react-app/build'
);

console.log(
    chalk.blue(
        `Current backend directory: ${__dirname}`
    )
);

console.log(
    chalk.blue(
        `React build path: ${clientBuildPath}`
    )
);

// ======================================================
// CHECK REACT BUILD
// ======================================================

if (!fs.existsSync(clientBuildPath)) {
    console.error(
        chalk.red(
            `❌ React build directory not found at: ${clientBuildPath}`
        )
    );
} else {
    console.log(
        chalk.green(
            `✅ React build directory found`
        )
    );

    app.use(
        express.static(clientBuildPath)
    );
}

// ======================================================
// NODE TEST ROUTE
// ======================================================

app.get('/node-test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Node.js application is receiving requests',
        domain: 'lms.saandrone.com',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
    });
});

// ======================================================
// ENVIRONMENT TEST ROUTE
// ======================================================
//
// This route is useful for checking whether environment
// variables are loaded.
//
// IMPORTANT:
// Do NOT return the actual Razorpay secret.
// Only return whether it exists.
//

app.get('/env-test', (req, res) => {
    res.status(200).json({
        success: true,

        environment: {
            nodeEnv: process.env.NODE_ENV || null,
            port: process.env.PORT || null,

            razorpayKeyIdLoaded:
                Boolean(process.env.RAZORPAY_KEY_ID),

            razorpaySecretLoaded:
                Boolean(process.env.RAZORPAY_KEY_SECRET),

            mongodbLoaded:
                Boolean(process.env.MONGODB_URI),
        },
    });
});

// ======================================================
// API 404 HANDLER
// ======================================================

app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            error: 'API route not found',
            path: req.originalUrl,
        });
    }

    next();
});

// ======================================================
// REACT FRONTEND FALLBACK
// ======================================================

app.use((req, res) => {
    const indexPath = path.join(
        clientBuildPath,
        'index.html'
    );

    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }

    return res.status(404).send(
        'React build index.html not found'
    );
});

// ======================================================
// PORT
// ======================================================

const PORT = process.env.PORT || 8001;

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
    console.log(chalk.green('========================================='));
    console.log(
        chalk.green(
            `✅ Server running on port ${PORT}`
        )
    );
    console.log(
        chalk.green(
            `🌐 Application: https://lms.saandrone.com`
        )
    );
    console.log(
        chalk.green(
            `🔗 Local: http://localhost:${PORT}`
        )
    );
    console.log(chalk.green('========================================='));
});

// ======================================================
// DATABASE CONNECTION
// ======================================================

mangoDb()
    .then(() => {
        console.log(
            chalk.green(
                '✅ MongoDB connection initialized'
            )
        );
    })
    .catch((error) => {
        console.error(
            chalk.red(
                '❌ Database connection error on startup:'
            ),
            error.message
        );
    });