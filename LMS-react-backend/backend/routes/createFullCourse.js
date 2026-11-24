import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/courseModel.js';
import Subject from '../models/subjectModel.js';
import Material from '../models/meterialModel.js';

const router = express.Router();

router.post('/create-course', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const courseData = req.body; 
    console.log(courseData)
  
    if (!courseData.name || !courseData.description || !courseData.duration || !courseData.imageUrl) {
      console.log('Course data is missing:', courseData);
      
      return res.status(400).json({ message: 'Course name, description, duration, duration_units, and image URL are required.' });
    }

    // if (!Array.isArray(courseData.subjects) || courseData.subjects.length === 0) {
    //   return res.status(400).json({ message: 'At least one subject is required.' });
    // }

  
    for (const subject of courseData.subjects) {
      if (!subject.name || !subject.description || !subject.duration) {
        return res.status(400).json({ message: 'Each subject must have a name, description, and duration.' });
      }

      if (!Array.isArray(subject.materials) || subject.materials.length === 0) {
        return res.status(400).json({ message: 'Each subject must have at least one material.' });
      }

      for (const material of subject.materials) {
        if (!material.name || !material.content_type || !material.content_url) {
          return res.status(400).json({ message: 'Each material must have a name, content type, and content URL.' });
        }
      }
    }

  
    const newCourse = new Course({
      name: courseData.name,
      description: courseData.description,
      duration: courseData.duration,
      duration_unit: courseData.duration_unit || 'hours',
      imageUrl: courseData.imageUrl, 
      join_code: courseData.join_code || null,
      course_type: courseData.course_type || 'public',
      created_by: courseData.created_by || 'admin',
      subjects: [],
    });

    await newCourse.save({ session });

  
    for (let subjectData of courseData.subjects) {
      const materialIds = [];

      for (let materialData of subjectData.materials) {
        const newMaterial = new Material({
          name: materialData.name,
          description: materialData.description,
          content_type: materialData.content_type,
          subject_id: newCourse._id,
          content_url: materialData.content_url,
        });

        await newMaterial.save({ session });
        materialIds.push(newMaterial._id);
      }

    
      const newSubject = new Subject({
        name: subjectData.name,
        description: subjectData.description,
        course_id: newCourse._id,
        materials: materialIds,
        duration: subjectData.duration,
        duration_unit: subjectData.duration_unit || 'hours',
      });

      await newSubject.save({ session });
      newCourse.subjects.push(newSubject._id);
    }

  
    await newCourse.save({ session });

  
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Course, subjects, and materials created successfully',
      course: newCourse,
    });

  } catch (error) {
  
    await session.abortTransaction();
    session.endSession();

  
    console.error('Error creating course:', error);
    
  
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }

    res.status(500).json({ message: 'Failed to create course', error });
  }
});

export default router;
