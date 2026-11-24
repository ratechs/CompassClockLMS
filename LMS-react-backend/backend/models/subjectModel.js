import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    course_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    materials: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Material' 
    }],
    duration: { 
        type: Number, 
        required: true 
    },
    duration_unit: { 
        type: String, 
        enum: ["minute", "hour", "day", "week", "month"],
        default: "hours"
    },
    status: { 
        type: String, 
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
