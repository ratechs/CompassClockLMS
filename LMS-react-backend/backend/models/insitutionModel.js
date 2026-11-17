// models/Institution.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const InstitutionSchema = new Schema({
    institution_image: String,
    institution_id: String,
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['College', 'School', 'Educational Center', 'Other'],
        required: true
    },
    location: {
        address: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    contact: {
        person_name: String,
        person_email: String,
        person_phoneNumber: String
    },
    registered_year: {
        type: Date
    },
    reffered_by: {
        type: String
    },
    status: {
        type: String,
        enum: ['Approved', 'Pending', 'Rejected'],
        default: 'Pending',
        required: true
    },
    institution_management_access: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    course_access: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Course'
        }
    ]
}, {
    timestamps: true // Optional: Adds createdAt and updatedAt
});

const Institution = model('Institution', InstitutionSchema);
export default Institution;
