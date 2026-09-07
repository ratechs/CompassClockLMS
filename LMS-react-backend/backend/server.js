import express from "express";
import "dotenv/config";
import mangoDb from "./db/mangoos.js";
import cookieParser from "cookie-parser";
import cors from "cors";

// ======================================================
// ROUTES
// ======================================================

import authRoutes from "./routes/userRoutes.js";
import MaterialRoutes from "./routes/materialsRoutes.js";
import CoursesRoutes from "./routes/coursesRoutes.js";
import SubjectRoutes from "./routes/subjectsRoutes.js";
import CreateFullCourse from "./routes/createFullCourse.js";
import UpdateFullCourse from "./routes/updateFullCourse.js";
import StudentRoutes from "./routes/studentRoutes.js";


// ======================================================
// EXPRESS APP
// ======================================================

const app = express();


// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json({
    limit: "100mb",
  })
);

app.use(
  express.urlencoded({
    limit: "100mb",
    extended: true,
  })
);


// ======================================================
// COOKIE
// ======================================================

app.use(cookieParser());


// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: [
      "https://lms.saandrone.com",
      "https://compass-clock-lms.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);


// ======================================================
// MONGODB CONNECTION
// ======================================================

app.use(async (req, res, next) => {
  try {
    await mangoDb();

    next();
  } catch (error) {
    console.error("❌ MongoDB connection error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


// ======================================================
// API ROUTES
// ======================================================

app.use("/api/users", authRoutes);

app.use("/api/courses", CoursesRoutes);

app.use("/api/subjects", SubjectRoutes);

app.use("/api/materials", MaterialRoutes);

app.use("/api/students", StudentRoutes);


// ======================================================
// FULL COURSE ROUTES
// ======================================================

// If these routes are actually used,
// uncomment the correct paths.

// app.use("/api/create-full-course", CreateFullCourse);
// app.use("/api/update-full-course", UpdateFullCourse);


// ======================================================
// NODE + DATABASE TEST
// ======================================================

app.get("/api/node-test", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Node.js API is working",
    database: "connected",
    environment: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
});


// ======================================================
// API 404
// ======================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found",
    path: req.originalUrl,
  });
});


// ======================================================
// LOCAL DEVELOPMENT SERVER
// ======================================================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 8001;

  mangoDb()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("❌ MongoDB Error:", error);
    });
}


// ======================================================
// EXPORT FOR VERCEL
// ======================================================

export default app;