import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        trim: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    completedMaterials: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Material"
        }
    ],

    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
});

const courseSchema = new mongoose.Schema(
    {
        // ==========================================
        // BASIC COURSE INFORMATION
        // ==========================================

        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        duration: {
            type: Number,
            required: true,
            min: 1
        },

        imageUrl: {
            type: String,
            default: null
        },

        // ==========================================
        // COURSE STATUS
        // ==========================================

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },

        is_published: {
            type: Boolean,
            default: false
        },

        // ==========================================
        // COURSE VISIBILITY
        // ==========================================

        course_type: {
            type: String,
            enum: ["public", "private"],
            default: "public"
        },

        // ==========================================
        // INSTITUTION
        // ==========================================

        course_institution: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Institution",
            default: null
        },

        // ==========================================
        // PAYMENT
        // ==========================================

        is_paidCourse: {
            type: Boolean,
            default: false
        },

        price: {
            type: Number,
            default: 0,
            min: 0
        },

        currency: {
            type: String,
            default: "INR"
        },

        // ==========================================
        // COURSE JOIN
        // ==========================================

        join_code: {
            type: String,
            default: null
        },

        joinRequests: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },

                status: {
                    type: String,
                    enum: [
                        "pending",
                        "approved",
                        "rejected"
                    ],
                    default: "pending"
                },

                requestedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        // ==========================================
        // SUBJECTS
        // ==========================================

        subjects: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Subject"
            }
        ],

        // ==========================================
        // COURSE CREATOR
        // ==========================================

        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        // ==========================================
        // RATINGS
        // ==========================================

        ratings: [ratingSchema],

        // ==========================================
        // STUDENT PROGRESS
        // ==========================================

        progress: [progressSchema]
    },
    {
        timestamps: true
    }
);

const Course = mongoose.model("Course", courseSchema);

export default Course;