// models/Student.js
import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    // ====== STUDENT IDENTIFIER ======
    student_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      description: "Unique student identifier (e.g., STU2026001)",
    },

    // ====== REFERENCE TO YOUR EXISTING USER MODEL ======
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      description: "Reference to User model (student account)",
      index: true,
    },

    // ====== BASIC INFORMATION ======
    full_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date_of_birth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },

    // ====== ACADEMIC INFORMATION ======
    class: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    section: {
      type: String,
      trim: true,
      default: "",
    },
    roll_number: {
      type: String,
      trim: true,
    },
    academic_year: {
      type: String,
      trim: true,
    },

    // ====== PARENT / GUARDIAN INFORMATION ======
    parent_info: {
      father: {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        contact: {
          type: String,
          required: true,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        occupation: {
          type: String,
          trim: true,
        },
        education: {
          type: String,
          enum: [
            "primary",
            "secondary",
            "higher_secondary",
            "graduate",
            "post_graduate",
            "illiterate",
            "unknown",
          ],
          default: "unknown",
        },
      },
      mother: {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        contact: {
          type: String,
          trim: true,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
        occupation: {
          type: String,
          trim: true,
        },
        education: {
          type: String,
          enum: [
            "primary",
            "secondary",
            "higher_secondary",
            "graduate",
            "post_graduate",
            "illiterate",
            "unknown",
          ],
          default: "unknown",
        },
      },
    },

    // ====== EMERGENCY CONTACT ======
    emergency_contact: {
      name: {
        type: String,
        trim: true,
      },
      relationship: {
        type: String,
        trim: true,
      },
      contact: {
        type: String,
        trim: true,
      },
    },

    // ====== SCHOOL INFORMATION ======
    school_info: {
      name: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        trim: true,
        ref: "Institution",
      },
      contact: {
        type: String,
        trim: true,
      },
    },

    // ====== STATUS ======
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "transferred", "graduated", "suspended"],
      default: "active",
    },
    status_reason: {
      type: String,
      trim: true,
      default: "",
    },

    // ====== ATTENDANCE TRACKING ======
    attendance: {
      attendance_percentage: {
        type: Number,
        default: 0,
      },
    },

    // ====== METADATA ======
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ================================================================
// VIRTUALS
// ================================================================

// Calculate age from date of birth
studentSchema.virtual("age").get(function () {
  if (!this.date_of_birth) return null;
  const today = new Date();
  const birthDate = new Date(this.date_of_birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Get full parent name
studentSchema.virtual("parent_name").get(function () {
  return this.parent_info?.father?.name || "N/A";
});

// Get parent contact
studentSchema.virtual("parent_contact").get(function () {
  return this.parent_info?.father?.contact || "N/A";
});

// Get attendance percentage
studentSchema.virtual("attendance_percentage").get(function () {
  return this.attendance?.attendance_percentage || 0;
});

// ================================================================
// INDEXES
// ================================================================

studentSchema.index({ student_id: 1 });
studentSchema.index({ user_id: 1 });
studentSchema.index({ full_name: "text" });
studentSchema.index({ class: 1, section: 1 });
studentSchema.index({ "parent_info.father.contact": 1 });
studentSchema.index({ is_active: 1 });
studentSchema.index({ status: 1 });

// ================================================================
// STATIC METHODS
// ================================================================

// ----- FIND METHODS -----

studentSchema.statics.findByStudentId = function (studentId) {
  return this.findOne({ student_id: studentId });
};

studentSchema.statics.findByUserId = function (userId) {
  return this.findOne({ user_id: userId });
};

studentSchema.statics.findByClass = function (className, section = null) {
  const query = { class: className, is_active: true };
  if (section) query.section = section;
  return this.find(query).sort({ roll_number: 1 });
};

studentSchema.statics.findByParentContact = function (contact) {
  return this.findOne({
    $or: [
      { "parent_info.father.contact": contact },
      { "parent_info.mother.contact": contact },
    ],
    is_active: true,
  });
};

studentSchema.statics.searchStudents = function (searchTerm) {
  return this.find(
    {
      $text: { $search: searchTerm },
      is_active: true,
    },
    {
      score: { $meta: "textScore" },
    }
  ).sort({ score: { $meta: "textScore" } });
};

// ----- GET METHODS -----

studentSchema.statics.getLowAttendance = function (threshold = 75) {
  return this.find({
    is_active: true,
    "attendance.attendance_percentage": { $lt: threshold },
  });
};

studentSchema.statics.getCountByClass = function (className) {
  return this.countDocuments({ class: className, is_active: true });
};

studentSchema.statics.getAllWithUserDetails = function () {
  return this.find({ is_active: true })
    .populate("user_id", "username email phoneNumber role")
    .populate("school_info.name", "name address contact");
};

studentSchema.statics.getClassList = function (className, section = null) {
  const query = { class: className, is_active: true };
  if (section) query.section = section;
  return this.find(query)
    .select("student_id full_name roll_number parent_info.father contact")
    .sort({ roll_number: 1 });
};

// ================================================================
// INSTANCE METHODS
// ================================================================

// Update attendance percentage
studentSchema.methods.updateAttendance = async function (percentage) {
  if (percentage < 0 || percentage > 100) {
    throw new Error("Attendance percentage must be between 0 and 100");
  }
  this.attendance.attendance_percentage = percentage;
  await this.save();
  return this;
};

// Get full profile with all assessments
studentSchema.methods.getFullProfile = async function () {
  const [s1, s2, s3, s4, s5, report] = await Promise.all([
    mongoose.model("S1_LearningCulture")
      .findOne({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
    mongoose.model("S2_AcademicPerformance")
      .find({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
    mongoose.model("S3_RIASEC")
      .findOne({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
    mongoose.model("S4_SWOT")
      .findOne({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
    mongoose.model("S5_AttackAnalysis")
      .findOne({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
    mongoose.model("FinalReport")
      .findOne({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
  ]);

  return {
    student: this,
    s1,
    s2,
    s3,
    s4,
    s5,
    report,
  };
};

// Get summary for dashboard
studentSchema.methods.getDashboardSummary = async function () {
  const [s1, s2] = await Promise.all([
    mongoose.model("S1_LearningCulture")
      .findOne({ student_id: this.student_id })
      .sort({ createdAt: -1 }),
    mongoose.model("S2_AcademicPerformance")
      .find({ student_id: this.student_id, is_latest: true }),
  ]);

  return {
    student_id: this.student_id,
    name: this.full_name,
    class: this.class,
    section: this.section,
    attendance: this.attendance?.attendance_percentage || 0,
    s1_level: s1?.level || "Not Assessed",
    s1_score: s1?.overall_score || null,
    s2_health: s2?.[0]?.health_status || "Not Assessed",
    s2_avg: s2?.[0]?.academic_health || null,
  };
};

// ================================================================
// BULK UPLOAD METHODS
// ================================================================

/**
 * Bulk Upsert Students
 * @param {Array} records - Array of student records
 * @param {Object} options - { overwrite: true/false, validateOnly: true/false }
 * @returns {Object} Results with success, failed, skipped, errors
 */
studentSchema.statics.bulkUpsert = async function (records, options = {}) {
  const { overwrite = true, validateOnly = false } = options;
  const results = {
    success: [],
    failed: [],
    skipped: [],
    errors: [],
  };

  for (const [index, record] of records.entries()) {
    try {
      // Validate
      const validation = await this.validateRecord(record);
      if (!validation.isValid) {
        results.failed.push({
          row: index + 1,
          student_id: record.student_id || "unknown",
          errors: validation.errors,
        });
        continue;
      }

      if (validateOnly) {
        results.success.push({
          row: index + 1,
          student_id: record.student_id,
          status: "valid",
        });
        continue;
      }

      // Check if student exists
      const existing = await this.findOne({ student_id: record.student_id });

      if (existing && !overwrite) {
        results.skipped.push({
          row: index + 1,
          student_id: record.student_id,
          reason: "Student exists and overwrite is false",
        });
        continue;
      }

      // Verify user exists
      if (record.user_id) {
        const User = mongoose.model("User");
        const user = await User.findById(record.user_id);
        if (!user) {
          results.failed.push({
            row: index + 1,
            student_id: record.student_id,
            error: `User with id ${record.user_id} not found`,
          });
          continue;
        }
      }

      // Upsert
      const result = await this.findOneAndUpdate(
        { student_id: record.student_id },
        record,
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      results.success.push({
        row: index + 1,
        student_id: record.student_id,
        action: existing ? "updated" : "created",
        id: result._id,
      });
    } catch (error) {
      results.failed.push({
        row: index + 1,
        student_id: record.student_id || "unknown",
        error: error.message,
      });
      results.errors.push(error.message);
    }
  }

  return results;
};

// ================================================================
// VALIDATION
// ================================================================

studentSchema.statics.validateRecord = async function (data) {
  const errors = [];

  // Required fields
  if (!data.student_id) errors.push("student_id is required");
  if (!data.user_id) errors.push("user_id is required");
  if (!data.full_name) errors.push("full_name is required");
  if (!data.class) errors.push("class is required");
  if (!data.school_info?.name) errors.push("school_info.name is required");

  // Parent info validation
  if (!data.parent_info?.father?.name) errors.push("parent_info.father.name is required");
  if (!data.parent_info?.father?.contact) errors.push("parent_info.father.contact is required");
  if (!data.parent_info?.mother?.name) errors.push("parent_info.mother.name is required");

  // Check for duplicate student_id
  if (data.student_id) {
    const existing = await this.findOne({ student_id: data.student_id });
    if (existing) errors.push(`student_id ${data.student_id} already exists`);
  }

  // Check for duplicate user_id
  if (data.user_id) {
    const existing = await this.findOne({ user_id: data.user_id });
    if (existing) errors.push(`user_id ${data.user_id} already linked to another student`);
  }

  // Validate date format
  if (data.date_of_birth) {
    const date = new Date(data.date_of_birth);
    if (isNaN(date.getTime())) errors.push("Invalid date_of_birth format");
  }

  // Validate gender
  if (data.gender && !["male", "female", "other"].includes(data.gender)) {
    errors.push("Invalid gender");
  }

  // Validate attendance percentage
  if (data.attendance?.attendance_percentage !== undefined) {
    if (data.attendance.attendance_percentage < 0 || data.attendance.attendance_percentage > 100) {
      errors.push("attendance_percentage must be between 0 and 100");
    }
  }

  return { isValid: errors.length === 0, errors };
};

// ================================================================
// BULK DELETE
// ================================================================

studentSchema.statics.bulkDelete = async function (studentIds) {
  const results = {
    deleted: [],
    failed: [],
  };

  for (const studentId of studentIds) {
    try {
      const result = await this.findOneAndDelete({ student_id: studentId });
      if (result) {
        results.deleted.push({
          student_id: studentId,
          name: result.full_name,
        });
      } else {
        results.failed.push({
          student_id: studentId,
          reason: "Student not found",
        });
      }
    } catch (error) {
      results.failed.push({
        student_id: studentId,
        error: error.message,
      });
    }
  }

  return results;
};

// ================================================================
// BULK STATUS UPDATE
// ================================================================

studentSchema.statics.bulkUpdateStatus = async function (studentIds, newStatus) {
  const results = {
    updated: [],
    failed: [],
  };

  for (const studentId of studentIds) {
    try {
      const result = await this.findOneAndUpdate(
        { student_id: studentId },
        { status: newStatus },
        { new: true }
      );
      if (result) {
        results.updated.push({
          student_id: studentId,
          new_status: result.status,
        });
      } else {
        results.failed.push({
          student_id: studentId,
          reason: "Student not found",
        });
      }
    } catch (error) {
      results.failed.push({
        student_id: studentId,
        error: error.message,
      });
    }
  }

  return results;
};

// ================================================================
// BULK CLASS TRANSFER
// ================================================================

studentSchema.statics.bulkTransferClass = async function (studentIds, newClass, newSection = "") {
  const results = {
    updated: [],
    failed: [],
  };

  for (const studentId of studentIds) {
    try {
      const result = await this.findOneAndUpdate(
        { student_id: studentId },
        {
          class: newClass,
          section: newSection,
        },
        { new: true }
      );
      if (result) {
        results.updated.push({
          student_id: studentId,
          new_class: result.class,
          new_section: result.section,
        });
      } else {
        results.failed.push({
          student_id: studentId,
          reason: "Student not found",
        });
      }
    } catch (error) {
      results.failed.push({
        student_id: studentId,
        error: error.message,
      });
    }
  }

  return results;
};

// ================================================================
// BULK UPDATE ATTENDANCE
// ================================================================

studentSchema.statics.bulkUpdateAttendance = async function (updates) {
  const results = {
    updated: [],
    failed: [],
  };

  for (const update of updates) {
    try {
      const { student_id, attendance_percentage } = update;

      if (attendance_percentage < 0 || attendance_percentage > 100) {
        results.failed.push({
          student_id,
          reason: "attendance_percentage must be between 0 and 100",
        });
        continue;
      }

      const result = await this.findOneAndUpdate(
        { student_id },
        { "attendance.attendance_percentage": attendance_percentage },
        { new: true }
      );
      if (result) {
        results.updated.push({
          student_id,
          attendance_percentage: result.attendance.attendance_percentage,
        });
      } else {
        results.failed.push({
          student_id,
          reason: "Student not found",
        });
      }
    } catch (error) {
      results.failed.push({
        student_id: update.student_id || "unknown",
        error: error.message,
      });
    }
  }

  return results;
};

// ================================================================
// EXPORT
// ================================================================
export default mongoose.model("Student", studentSchema);