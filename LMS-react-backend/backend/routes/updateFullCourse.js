import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/courseModel.js';
import Subject from '../models/subjectModel.js';
import Material from '../models/meterialModel.js';

const router = express.Router();
router.put('/update-course/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const courseData = req.body;
  console.log(courseData)

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Validate the course data
    if (!courseData.name || !courseData.description || !courseData.duration) {
      return res.status(400).json({ message: 'Course name, description, and duration are required.' });
    }

    // Step 2: Validate subjects
    // if (!Array.isArray(courseData.subjects) || courseData.subjects.length === 0) {
    //   return res.status(400).json({ message: 'At least one subject is required.' });
    // }

    const updatedSubjects = [];
    
    // Step 3: Handle subject and material updates/creation
    for (const subjectData of courseData.subjects) {
      if (!subjectData.name || !subjectData.description || !subjectData.duration) {
        return res.status(400).json({ message: 'Each subject must have a name, description, and duration.' });
      }

      // Step 4: Validate and create/update materials
      const materialIds = [];
      for (const materialData of subjectData.materials) {
        if (!materialData.name || !materialData.content_type || !materialData.content_url) {
          return res.status(400).json({ message: 'Each material must have a name, content type, and content URL.' });
        }

        let material;
        if (materialData._id) {
          // Update existing material
          material = await Material.findByIdAndUpdate(materialData._id, materialData, { new: true, session });
        } else {
          // Create new material
          material = new Material({
            name: materialData.name,
            description: materialData.description,
            content_type: materialData.content_type,
            subject_id: subjectData._id, // To be updated later
            content_url: materialData.content_url,
          });
          await material.save({ session });
        }

        materialIds.push(material._id);
      }

      let subject;
      if (subjectData._id) {
        // Update existing subject
        subject = await Subject.findByIdAndUpdate(
          subjectData._id,
          { ...subjectData, materials: materialIds }, // Update materials
          { new: true, session }
        );
      } else {
        // Create new subject
        subject = new Subject({
          name: subjectData.name,
          description: subjectData.description,
          course_id: courseId, // Link the subject to the course
          materials: materialIds,
          duration: subjectData.duration,
        });
        await subject.save({ session });
      }

      updatedSubjects.push(subject._id); // Collect subject IDs
    }

    // Step 5: Update the course with new subjects
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        ...courseData,
        subjects: updatedSubjects, // Reference the updated subjects
      },
      { new: true, session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Course updated successfully',
      course: updatedCourse,
    });

  } catch (error) {
    // Rollback transaction in case of failure
    await session.abortTransaction();
    session.endSession();

    // Handle error and return response
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Failed to update course', error });
  }
});


export default router;
