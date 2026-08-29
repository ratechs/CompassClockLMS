// routes/studentExcelRoutes.js
import express from "express";
import multer from "multer";
import {
  uploadStudents,
  downloadStudentTemplate,
} from "../../controllers/excel/student_excel_handling_controller.js";

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = (req, file, cb) => {
  const allowed = [".xlsx", ".xls", ".csv"];
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
  allowed.includes(ext) ? cb(null, true) : cb(new Error("Only Excel files allowed"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});


router.get(
  "/template/students",
  downloadStudentTemplate
);

router.post(
  "/students/:institutionId",
  upload.single("file"),
  uploadStudents
);

export default router;