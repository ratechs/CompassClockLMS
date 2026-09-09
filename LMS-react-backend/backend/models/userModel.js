import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false, // Initial default is null, logic handled below
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin', 'teacher', 'coordinator'],
      default: 'student',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    preferences: {
      type: Object,
      default: {},
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
    },
    otherInstitution: {
      type: String,
      default: null,
    },
    phoneNumber: { 
      type: Number,
      required: true,
    },
    educationLevel: {
      type: String,
      default: null,
    },
    schoolClass: {
      type: String,
      default: null,
    },
    collegeDegree: {
      type: String,
      default: null,
    },
    customCollegeDegree: {
      type: String,
      default: null,
    },
    experience: {
      type: Number,
      default: null,
    },
    expertise: {
      type: String, 
      default: null,
    },
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: []
    }],

    approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// 🧠 Set `isApproved` based on role before saving
userSchema.pre('save', function (next) {
  if (this.isApproved === null) { // Only apply default if not explicitly set
    if (this.role === 'teacher') {
      this.isApproved = false;
    } else {
      this.isApproved = true;
    }
  }
  next();
});

export default mongoose.model("User", userSchema);
