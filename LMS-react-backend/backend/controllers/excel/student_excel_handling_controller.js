// controllers/StudentExcelController.js
import StudentHandler from "../../services/excel/handlers/student_handler.js";

export const uploadStudents = async (req, res) => {
  try {
    const { institutionId } = req.params;
    const userId = req.user?._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const handler = new StudentHandler();
    const results = await handler.processFile(req.file.path, {
      institutionId,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Students uploaded successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error uploading students:", error);
    return res.status(500).json({
      success: false,
      message: "Error uploading students",
      error: error.message,
    });
  }
};

export const downloadStudentTemplate = async (req, res) => {
  try {
    const handler = new StudentHandler();
    const buffer = handler.getTemplateBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=students_template.xlsx"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error downloading template:", error);
    return res.status(500).json({
      success: false,
      message: "Error downloading template",
      error: error.message,
    });
  }
};