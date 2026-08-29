// controllers/courseController.js
import mongoose from 'mongoose';
import Course from '../models/courseModel.js';
import Material from '../models/meterialModel.js';
import Subject from '../models/subjectModel.js';
import User from '../models/userModel.js';

// Get all courses (no change needed here)
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate({
        path: 'subjects',
        populate: {
          path: 'materials',
          model: 'Material'
        }
      })
      .populate({
        path: 'joinRequests',
        populate: {
          path: 'user',
          model: 'User',
          populate: {
            path: 'institution',
            model: 'Institution',
            select: 'name', // keep only needed fields
          }
        }
      });

    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching courses', details: error.message });
  }
};


// Create a course
export const createCourse = async (req, res) => {
  try {
    console.log(req.body);
    const newCourse = new Course(req.body);
    console.log(newCourse);
    await newCourse.save();

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error creating course', details: error.message });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(200).json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Error updating course', details: error.message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start a transaction to ensure atomicity

  try {
    // Step 1: Find the course and associated subjects
    const course = await Course.findById(req.params.id).populate('subjects').session(session);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Capture course details for notification *before* deleting
    const courseName = course.course_name;
    const courseId = course._id.toString();

    // Step 2: Extract subject IDs from the course
    const subjectIds = course.subjects.map(subject => subject._id);

    // Step 3: Delete associated materials for each subject
    await Material.deleteMany({ subject_id: { $in: subjectIds } }).session(session);

    // Step 4: Delete associated subjects
    await Subject.deleteMany({ _id: { $in: subjectIds } }).session(session);

    // Step 5: Delete the course itself
    await Course.findByIdAndDelete(req.params.id).session(session);

    // Commit the transaction if everything is successful
    await session.commitTransaction();
    session.endSession();
    res.status(204).send(); // Successfully deleted, no content to return

  } catch (error) {
    // Abort the transaction in case of failure
    await session.abortTransaction();
    session.endSession();

    console.error(error);
    res.status(500).json({ error: 'Error deleting course', details: error.message });
  }
};

// Get details of a specific course (no change needed here)
export const getCourseDetails = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'subjects',
      populate: {
        path: 'materials',
        model: 'Material'
      }
    }).populate({
      path: 'joinRequests',
      populate: {
        path: 'user',
        model: 'User'
      }
    });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Submit a user rating for the course (no change needed here)
export const submitUserRating = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find if user already rated
    const existingIndex = course.ratings.findIndex(
      (r) => r.user.toString() === req.user.id.toString()
    );

    if (existingIndex !== -1) {
      // Update rating & comment
      course.ratings[existingIndex].rating = rating;
      course.ratings[existingIndex].comment = comment;
    } else {
      // Add new rating
      course.ratings.push({ user: req.user.id, rating, comment });
    }

    await course.save();

    return res.status(201).json({ message: 'Rating submitted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message, error });
  }
};

// Get average rating for the course (no change needed here)
export const getRating = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const ratings = course.ratings;
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / totalRatings
      : 0;

    res.status(200).json({ averageRating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get user progress for a course (no change needed here)
export const getCourseProgress = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('progress.user');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const userProgress = course.progress.find(p => p.user._id.toString() === req.user.id);
    if (!userProgress) {
      return res.status(404).json({ message: 'Progress not found for the user in this course' });
    }

    res.json({ progress: userProgress.progress, completedMaterials: userProgress.completedMaterials });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update user progress for a course (no change needed here)
export const updateCourseProgress = async (req, res) => {
  try {
    const { materialId } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId).populate('materials');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const userProgress = course.progress.find(p => p.user.toString() === req.user.id);

    // If user progress doesn't exist, create it
    if (!userProgress) {
      const newProgress = {
        user: req.user.id,
        completedMaterials: [materialId],
        progress: (1 / course.materials.length) * 100
      };
      course.progress.push(newProgress);
    } else {
      // If user progress exists, update it
      if (!userProgress.completedMaterials.includes(materialId)) {
        userProgress.completedMaterials.push(materialId);
        userProgress.progress = (userProgress.completedMaterials.length / course.materials.length) * 100;
      }
    }

    await course.save();
    res.status(200).json({ message: 'Progress updated successfully', progress: userProgress.progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export const getCoursesByType = async (req, res) => {
  try {
    const { type } = req.params;

    const allowedTypes = ['public', 'private'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid course type' });
    }

    const courses = await Course.find({ course_type: type }).populate({
      path: 'subjects',
      populate: {
        path: 'materials',
        model: 'Material'
      }
    }).populate({
      path: 'course_institution',
      populate: {
        path: 'institution',
        model: 'Institution'
      }
    });

    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching courses by type', details: error.message });
  }
};

export const getCourseByJoinCode = async (req, res) => {
  try {
    const { joinCode } = req.params;

    const course = await Course.findOne({ join_code: joinCode }).populate({
      path: 'subjects',
      populate: {
        path: 'materials',
        model: 'Material'
      }
    }).populate({
      path: 'course_institution',
      populate: {
        path: 'institution',
        model: 'Institution'
      }
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching course by join code', details: error.message });
  }
};

// Removed notification for requestCourseJoin as per your latest request
export const requestCourseJoin = async (req, res) => {
  try {
    const { joinCode, userId } = req.body; // Prefer keeping both in body
    if (!joinCode || !userId) {
      return res.status(400).json({ message: 'Join code and userId are required' });
    }

    const course = await Course.findOne({ join_code: joinCode });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const alreadyRequested = course.joinRequests.some(
      (joinReq) => joinReq.user.toString() === userId
    );

    const user = await User.findById(userId); // Use await here
    if (!user) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    if (alreadyRequested) {
      return res.status(400).json({ message: 'You have already requested to join this course', status: 'already_requested' });
    }

    course.joinRequests.push({ user: userId });
    await course.save();

    res.status(200).json({ message: 'Join request submitted successfully', status: 'requested' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error requesting course join', error: error.message });
  }
};

export const getJoinRequestsForCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: 'joinRequests.user',
        select: 'username email role institution',
        populate: {
          path: 'institution',
          model: 'Institution',
          select: 'name address type', // pick fields you actually need
        },
      })
      .populate({
        path: 'course_institution',
        populate: {
          path: 'institution',
          model: 'Institution',
        },
      });

    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Optional: Only allow creator/admin to view
    if (req.user.id !== course.creator?.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.status(200).json({ joinRequests: course.joinRequests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching join requests', error });
  }
};


export const handleJoinRequest = async (req, res) => {
  try {
    const { courseId, userId, action } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.isActive) {
      return res.status(403).json({ message: 'User is not active' });
    }

    const request = course.joinRequests.find((r) => r.user.toString() === userId);
    if (!request) return res.status(404).json({ message: 'Join request not found' });

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    request.status = action;

    await course.save();

    // --- Push Notification Logic for Handle Join Request (Approved/Rejected) ---
    // Notify the requesting user about the status of their request

    res.status(200).json({ message: `Request ${action} successfully` });
  } catch (error) {
    console.error("Join request error:", error);
    res.status(500).json({ message: 'Error handling request', error: error.message });
    console.log(`Handling join request: courseId=${courseId}, userId=${userId}, action=${action}`);

  }
};

export const getAllJoinRequests = async (req, res) => {
  try {
    const allCourses = await Course.find()
      .populate('joinRequests.user', 'name email'); // Convert documents to plain JS objects

    const allJoinRequests = allCourses.flatMap(course =>
      course.joinRequests.map(req => ({
        course: course._id,
        user: req.user,
        status: req.status,
        requestedAt: req.requestedAt
      }))
    );

    res.status(200).json(allJoinRequests); // Send the response
  } catch (error) {
    res.status(500).json({ message: 'Error fetching join requests', error }); // Handle errors
  }
};