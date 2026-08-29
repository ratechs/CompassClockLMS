// services/excel/handlers/StudentHandler.js
import BaseExcelHandler from "../BaseHandler.js";
import Student from "../../../models/studentModel.js";
import User from "../../../models/userModel.js";
import bcrypt from "bcryptjs";

class StudentHandler extends BaseExcelHandler {
  constructor() {
    super();
    this.uploadType = "students";
    this.mapping = {
      student_id: "student_id",
      full_name: "full_name",
      date_of_birth: "date_of_birth",
      gender: "gender",
      class: "class",
      section: "section",
      roll_number: "roll_number",
      academic_year: "academic_year",
      father_name: "father_name",
      father_contact: "father_contact",
      father_email: "father_email",
      father_occupation: "father_occupation",
      father_education: "father_education",
      mother_name: "mother_name",
      mother_contact: "mother_contact",
      mother_email: "mother_email",
      mother_occupation: "mother_occupation",
      mother_education: "mother_education",
      school_contact: "school_contact",
      username: "username",
      email: "email",
      password:"password"
    };
    this.requiredFields = [
      "student_id",
      "full_name",
      "class",
      "father_name",
      "father_contact",
      "mother_name",
    ];
  }

  getMapping() {
    return this.mapping;
  }

  getRequiredFields() {
    return this.requiredFields;
  }

  async processRow(row, context) {
    const { institutionId, userId } = context;

    // Check if student exists
    const existingStudent = await Student.findOne({ student_id: row.student_id });

    // Create or update user
    let user = await User.findOne({
      $or: [
        { username: row.username || row.email || row.student_id },
        { email: row.email || `${row.student_id}@hsags.com` },
      ],
    });

    if (!user) {
      const hashedPassword = await bcrypt.hash("tempPassword123", 10);
      user = new User({
        username: row.username || row.email || row.student_id,
        email: row.email || `${row.student_id}@hsags.com`,
        password: hashedPassword,
        role: "student",
        phoneNumber: row.father_contact || row.mother_contact,
        institution: institutionId,
        isApproved: true,
        isActive: true,
      });
      await user.save();
    }

    // Prepare student data
    const studentData = {
      student_id: row.student_id,
      user_id: user._id,
      full_name: row.full_name,
      date_of_birth: row.date_of_birth ? new Date(row.date_of_birth) : null,
      gender: row.gender.toLowerCase() || "male",
      class: row.class,
      section: row.section || "",
      roll_number: row.roll_number || "",
      academic_year: row.academic_year || new Date().getFullYear().toString(),
      parent_info: {
        father: {
          name: row.father_name,
          contact: row.father_contact,
          email: row.father_email || "",
          occupation: row.father_occupation || "",
          education: row.father_education || "unknown",
        },
        mother: {
          name: row.mother_name,
          contact: row.mother_contact || "",
          email: row.mother_email || "",
          occupation: row.mother_occupation || "",
          education: row.mother_education || "unknown",
        },
      },
      school_info: {
        name: institutionId,
        contact: row.school_contact || "",
      },
      status: "active",
      is_active: true,
      created_by: userId,
    };

    let student;
    if (existingStudent) {
      student = await Student.findOneAndUpdate(
        { student_id: row.student_id },
        studentData,
        { new: true }
      );
      return { success: true, action: "updated", id: student._id };
    } else {
      student = new Student(studentData);
      await student.save();
      return { success: true, action: "created", id: student._id };
    }
  }
}

export default StudentHandler;