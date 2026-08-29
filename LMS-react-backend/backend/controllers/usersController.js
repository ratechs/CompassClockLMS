import bcrypt from 'bcrypt'
import generatedTokenAndCookie from '../utils/tokenGenerator.js'
import mongoose from 'mongoose'
import User from '../models/userModel.js'

export const saveUsers = async (req, res) => {

    try {
        const data = {
            users: [{ username: 'John Doe', email: 'john@example.com' }, { username: 'Jane Doe', email: 'jane@example.com' }]
        }

        const savedUsers = await Promise.all(data.users.map(userData => {
            const user = new User(userData)
            return user.save()
        }))
        res.status(201).json(savedUsers)
        console.log(savedUsers)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
        res.json(users)
        console.log(req.user)
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
};

export const getUser = async (req, res) => {
    try {

        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

export const signUpUser = async (req, res) => {
    try {
        console.log(req.body)
        const {
           fullname, username, password, confirmPassword, isAdmin, email, phoneNumber, schoolClass, institution, otherInstitution,
            educationLevel, collegeDegree, customCollegeDegree, experience, expertise, profilePicture, preferences, role
        } = req.body;


        if (!isValidEmail(email)) {
            console.log("Invalid email");

            return res.status(400).json({ message: 'Invalid email format' });
        }

        // let groups = [];
        // if (!isAdmin || isAdmin == null) {
        //     if(groupIds && Array.isArray(groupIds)){
        //         // Fetch groups only if the user is not an admin
        //         groups = await Group.find({ _id: { $in: groupIds } }); // Find all groups by IDs
        //         if (groups.length !== groupIds.length) {
        //             return res.status(404).json({ message: 'One or more groups not found' });
        //         }
        //     }
        // }

        // confirm passowrd mismatch
        if (password !== confirmPassword) {
             console.log("pasword doesnt match");
            return res.status(400).json({ message: 'Passwords do not match' })
        }

        // user already exists
        const user = await User.findOne({ $or: [{ username }, { email }] })
        if (user) {
             console.log("user Exist");
            return res.status(400).json({ message: 'User already exists' })
        }


        // hash the password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({ fullname, username, email, password: hashedPassword, isAdmin, phoneNumber, schoolClass, institution, educationLevel, collegeDegree, customCollegeDegree, experience, expertise, profilePicture, preferences, role: role })
        await newUser.save()

        const populatedUser = await User.findById(newUser._id).populate('institution')

        if (newUser) {
            generatedTokenAndCookie(newUser, res)
            return res.status(201).json({ message: 'User created successfully', user: populatedUser }
            )
        }

    } catch (error) {
        console.log("the error", error)
        return res.status(500).json({ error: error.message });
    }
};

export const signInUser = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        console.log("Login request:", {
            usernameOrEmail,
            password: password ? "********" : undefined
        });

        // Validate input
        if (!usernameOrEmail || !password) {
            return res.status(400).json({
                message: "Username/email and password are required"
            });
        }

        // Find user
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmail },
                { email: usernameOrEmail }
            ]
        }).populate("institution");

        // User not found
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // Check account status
        if (!user.isActive) {
            return res.status(403).json({
                message: "User is not active"
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        // ==========================================
        // LOGIN SUCCESSFUL
        // ==========================================

        // Set current server date/time
        user.lastLogin = new Date();

        // Save updated lastLogin
        await user.save();

        console.log("User logged in successfully:", {
            id: user._id,
            username: user.username,
            lastLogin: user.lastLogin
        });

        // Generate token and cookie
        generatedTokenAndCookie(user, res);

        // ==========================================
        // REMOVE PASSWORD FROM RESPONSE
        // ==========================================

        const userResponse = user.toObject();

        delete userResponse.password;

        return res.status(200).json({
            message: "User logged in successfully",
            user: userResponse,
            success: true
        });

    } catch (error) {

        console.error("Login error:", error);

        return res.status(500).json({
            message: "Failed to login user",
            error: error.message
        });
    }
};

export const signOutUser = async (req, res) => {
    try {
        res.clearCookie('jwt')
        return res.status(200).json({ message: 'User logged out successfully', success: true })
    } catch (error) {
        res.status(500).json(error)
    }
};

export const destroyAll = async (req, res) => {

    try {
        if (await User.deleteMany({})) {
            return res.status(200).json({ message: 'All users deleted' })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error, message: 'Failed to delete users' })
    }
};

export const destroyByUserNameOrId = async (req, res) => {

    try {
        const id = req.params.id
        let user

        if (mongoose.Types.ObjectId.isValid(id)) {
            user = await User.findById(id)
        }

        user = await User.findById(id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (await User.deleteOne({ _id: user._id })) {
            return res.status(200).json({ message: 'User deleted successfully' })
        }

    } catch (error) {
        res.status(404).json({ error: error })
    }
};

export const userCourses = async (req, res) => {
    try {
        // Find the user by their ID
        const user = await User.findById(req.params.id).populate('groups');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get the groups the user belongs to
        const groups = user.groups;

        // Fetch the courses for each group the user belongs to
        const courses = await Promise.all(groups.map(async (group) => {
            const groupData = await Group.findById(group._id).populate('course_ids');
            return groupData.course_ids;
        }));

        // Flatten the array of courses (since each group may have multiple courses)
        const flatCourses = courses.flat();

        res.status(200).json(flatCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error, message: 'Server error' });
    }
};

export const assignGroupsToUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { groupIds } = req.body;

        // Validate inputs
        if (!userId || !Array.isArray(groupIds)) {
            return res.status(400).json({ message: 'User ID and group IDs are required.' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Fetch groups by IDs
        const groups = await Group.find({ _id: { $in: groupIds } });
        if (groups.length !== groupIds.length) {
            return res.status(404).json({ message: 'One or more groups not found' });
        }

        // Assign groups to the user
        user.groups.push(...groups.map(group => group._id)); // Add groups to user
        await user.save();

        return res.status(200).json({ message: 'Groups assigned successfully', user });

    } catch (error) {
        console.error(error); // Log error for debugging
        return res.status(500).json({ error: error.message });
    }
};

export const removeGroupsFromUser = async (req, res) => {
    try {
        const { userId, groupIds } = req.body;

        // Validate inputs
        if (!userId || !Array.isArray(groupIds)) {
            return res.status(400).json({ message: 'User ID and group IDs are required.' });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the groups exist in the user's groups
        const currentGroups = user.groups;
        const groupsToRemove = groupIds.filter(groupId => currentGroups.includes(groupId));

        if (groupsToRemove.length === 0) {
            return res.status(404).json({ message: 'No matching groups found to remove' });
        }

        // Remove the specified groups from the user's groups
        user.groups = user.groups.filter(groupId => !groupsToRemove.includes(groupId));
        await user.save();

        return res.status(200).json({ message: 'Groups removed successfully', user });

    } catch (error) {
        console.error(error); // Log error for debugging
        return res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const userId = req.params.id; // Get the user ID from the route parameter
    const {
        fullname,
        username,
        email,
        password,
        confirmPassword,
        isAdmin,
        phoneNumber,
        schoolClass,
        institution,
        educationLevel,
        collegeDegree,
        customCollegeDegree,
        role
    } = req.body;

    try {
        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the new email is already taken by another user
        if (email && email !== user.email) {
            if (!isValidEmail(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email.toLowerCase(); // Ensure email is lowercase
        }

        // Check for password update and confirm match
        if (password) {
            if (password !== confirmPassword) {
                return res.status(400).json({ message: 'Passwords do not match' });
            }
            user.password = await bcrypt.hash(password, 10); // Hash the new password
        }

        // Update other user fields if provided
        if (fullname) user.fullname = fullname
        if (username) user.username = username;
        if (typeof isAdmin === 'boolean') user.isAdmin = isAdmin; // Ensure isAdmin is a boolean
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (schoolClass) user.schoolClass = schoolClass;
        if (institution) user.institution = institution;
        if (educationLevel) user.educationLevel = educationLevel;
        if (collegeDegree) user.collegeDegree = collegeDegree;
        if (customCollegeDegree) user.customCollegeDegree = customCollegeDegree;
        if (role) user.role = role; // Update role if provided

        // Save the updated user
        await user.save();

        return res.status(200).json({ message: 'User updated successfully', user });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUserGroups = async (req, res) => {
    const userId = req.params.id; // Get the user ID from the URL parameter

    try {
        // Find the user by ID and populate the groups field
        const user = await User.findById(userId).populate('groups');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the populated groups back in the response
        return res.status(200).json({ groups: user.groups });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic regex for email validation
    console.log(email);

    return regex.test(email);
};

export const toggleUserActiveStatus = async (req, res) => {
    const { id } = req.params; // Get the user ID from the route parameter
    const { isActive } = req.body; // Get the isActive value from the request body

    try {
        // Validate isActive input
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be a boolean value' });
        }

        // Find the user by ID
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the isActive status
        user.isActive = isActive;
        await user.save();

        return res.status(200).json({ message: 'User active status updated successfully', user });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getUserByRole = async (req, res) => {
    try {
        const { role } = req.params;

        if (!role) {
            return res.status(400).json({ message: 'Role parameter is required' });
        }

        // Find users by role (case-insensitive)
        const users = await User.find({ role: { $regex: new RegExp(`^${role}$`, 'i') } });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found with the specified role' });
        }

        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching users by role', error: error.message });
    }
};
export const getUserByINS = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'Id is required' });
        }

        // Find users by role (case-insensitive)
        const users = await User.find({ institution: id });

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found with the specified Id' });
        }

        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error fetching users by Id', error: error.message });
    }
};

export const getNotApprovedTeacherForInstitution = async (req, res) => {
    try {
        const { ins_id } = req.params;

        // Assuming "isApproved" is a boolean field in the User model
        const users = await User.find({
            institution: ins_id,
            role: 'teacher',
        }).populate('approved_by');

        console.log("Fetched non-approved teachers for institution:", ins_id);

        return res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching non-approved teachers:", error);
        return res.status(500).json({
            message: 'Error fetching users by Teacher for institution',
            error: error.message
        });
    }
};

export const ApprovingTeacher = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { approver_id, status } = req.body; // The ID of the user who is approving
        console.log(user_id, "the user id")
        console.log(approver_id, "the approver ID");
        console.log(status, "the status of the request")

        // Validate inputs
        if (!mongoose.Types.ObjectId.isValid(user_id) || !mongoose.Types.ObjectId.isValid(approver_id)) {
            return res.status(400).json({ message: "Invalid user or approver ID" });
        }

        // Find the user to approve
        const user = await User.findById(user_id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure the user is a teacher
        if (user?.isAdmin) {
            return res.status(400).json({ message: "Only users with role 'teacher', 'Students' can be approved" });
        }

        // Update approval status and approver
        user.isApproved = status;
        user.approved_by = approver_id;

        await user.save();

        return res.status(200).json({
            message: "User approved successfully",
            user
        });
    } catch (error) {
        console.error("Error approving User:", error);
        return res.status(500).json({
            message: 'Error approving User',
            error: error.message
        });
    }
};

