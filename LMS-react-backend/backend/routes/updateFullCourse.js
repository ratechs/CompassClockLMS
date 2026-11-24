import express from "express";
import mongoose from "mongoose";

import Course from "../models/courseModel.js";
import Subject from "../models/subjectModel.js";
import Material from "../models/meterialModel.js";

const router = express.Router();

router.put("/update-course/:courseId", async (req, res) => {
  const { courseId } = req.params;
  const courseData = req.body;

  // Validate course ID
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      message: "Invalid course ID",
    });
  }

  // Validate course data
  if (
    !courseData.name ||
    !courseData.description ||
    !courseData.duration ||
    !courseData.imageUrl
  ) {
    return res.status(400).json({
      message: "Course name, description, duration, and image URL are required.",
    });
  }

  // Backward compatibility for previously created courses
  const courseDurationUnit = courseData.duration_unit || "months";

  const session = await mongoose.startSession();

  try {
    let updatedCourse;

    await session.withTransaction(async () => {
      const updatedSubjects = [];

      // Process subjects
      for (const subjectData of courseData.subjects || []) {
        if (
          !subjectData.name ||
          !subjectData.description ||
          !subjectData.duration
        ) {
          throw new Error(
            "Each subject must have a name, description, and duration."
          );
        }

        // Backward compatibility for existing subjects
        const subjectDurationUnit =
          subjectData.duration_unit || "hours";

        let subject;

        // Step 1: Update or create subject first
        if (subjectData._id) {
          subject = await Subject.findByIdAndUpdate(
            subjectData._id,
            {
              $set: {
                name: subjectData.name,
                description: subjectData.description,
                course_id: courseId,
                duration: Number(subjectData.duration),
                duration_unit: subjectDurationUnit,
              },
            },
            {
              new: true,
              session,
              runValidators: true,
            }
          );

          if (!subject) {
            throw new Error(
              `Subject not found: ${subjectData._id}`
            );
          }
        } else {
          subject = new Subject({
            name: subjectData.name,
            description: subjectData.description,
            course_id: courseId,
            duration: Number(subjectData.duration),
            duration_unit: subjectDurationUnit,
            materials: [],
          });

          await subject.save({ session });
        }

        // Step 2: Process materials
        const materialIds = [];

        for (const materialData of subjectData.materials || []) {
          if (
            !materialData.name ||
            !materialData.content_type ||
            !materialData.content_url
          ) {
            throw new Error(
              "Each material must have a name, content type, and content URL."
            );
          }

          let material;

          if (materialData._id) {
            // Update existing material and ensure subject relationship
            material = await Material.findByIdAndUpdate(
              materialData._id,
              {
                $set: {
                  name: materialData.name,
                  description: materialData.description,
                  content_type: materialData.content_type,
                  content_url: materialData.content_url,
                  subject_id: subject._id,
                },
              },
              {
                new: true,
                session,
                runValidators: true,
              }
            );

            if (!material) {
              throw new Error(
                `Material not found: ${materialData._id}`
              );
            }
          } else {
            // Create new material
            material = new Material({
              name: materialData.name,
              description: materialData.description,
              content_type: materialData.content_type,
              content_url: materialData.content_url,
              subject_id: subject._id,
            });

            await material.save({ session });
          }

          materialIds.push(material._id);
        }

        // Step 3: Update subject materials
        subject.materials = materialIds;
        await subject.save({ session });

        updatedSubjects.push(subject._id);
      }

      // Step 4: Update course
      updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
          $set: {
            name: courseData.name,
            description: courseData.description,
            duration: Number(courseData.duration),

            // IMPORTANT: Explicitly save duration unit
            duration_unit: courseDurationUnit,

            imageUrl: courseData.imageUrl,
            subjects: updatedSubjects,
          },
        },
        {
          new: true,
          session,
          runValidators: true,
        }
      );

      if (!updatedCourse) {
        throw new Error("Course not found");
      }
    });

    return res.status(200).json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);

    return res.status(500).json({
      message: "Failed to update course",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
});

export default router;