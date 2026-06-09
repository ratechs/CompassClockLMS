import mongoose from "mongoose";

// Define question options with strict typing
const questionSchema = new mongoose.Schema({
    question_text: String,
    question_lang: {
        type: String,
        enum: ['en', 'fr', 'es', 'de'],  // Add supported languages as needed
        default: 'en'
    },
        question_options: [
            {
                text: String,
            }
        ],
    correct_options: {
        type: [String],
        required: true
    },
    question_type: {
        type: String,
        enum: ['MCQ'],
        default: 'MCQ'
    },
    negative_mark: {
        type: Number,
        min: 0  // Ensure no negative negative marks
    },
    positive_mark: {
        type: Number,
        min: 0,  // Ensure no negative positive marks
        required: true
    },
    solution: {
        type: String,
        default: ''        
    }
});

const testSchema = new mongoose.Schema({
    test_name: {
        type: String,
        required: true
    },
    test_type: {
        type: String,
        enum: ['pre-test', 'post-test', 'assessment'],
        required: true
    },
    test_subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',  // Ensure the 'Course' model exists
        required: true
    },
    test_lesson: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',  // Ensure the 'Subject' model exists
        required: true
    },
    test_questions: [questionSchema],

    test_status: {
        type: String,
        enum: ['enabled', 'disabled'],
        default: 'enabled'
    },
    

    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

}, { timestamps: true });

export default mongoose.model('Test', testSchema);
