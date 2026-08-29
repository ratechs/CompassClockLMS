import express, { Router } from 'express'
import {ApprovingTeacher, assignGroupsToUser, destroyAll, destroyByUserNameOrId, getNotApprovedTeacherForInstitution, getUser,  getUserByINS,  getUserByRole,  getUserGroups, getUsers, removeGroupsFromUser, saveUsers, signInUser, signOutUser, signUpUser, toggleUserActiveStatus, updateUser, userCourses} from '../controllers/usersController.js'
import authenticate from '../middleware/authenticate.js'
import { AddUserCourse, getUserCourses } from '../controllers/userCoursesController.js'

const router = express.Router()

// User save
// router.get('/save', saveUsers)

router.post('/sign_up', signUpUser)

router.post('/sign_in', signInUser)

router.post('/sign_out', signOutUser)

// get users

router.get('/', authenticate, getUsers)

router.get('/:id', getUser);

router.delete('/destroy_all', destroyAll)

router.delete('/destroy/:id', destroyByUserNameOrId)

router.get('/:id/courses', userCourses)

router.post('/remove-groups', removeGroupsFromUser);

router.post('/:userId/groups/assign', assignGroupsToUser);

router.put('/:id', updateUser);

router.get('/:id/groups', getUserGroups);

router.get('/:userId/courses', getUserCourses);

router.post('/add-course/:userId', AddUserCourse);

router.put('/update-userStatus/:id', toggleUserActiveStatus);

router.get('/role/:role', getUserByRole);

router.get('/institution/:ins_id', getNotApprovedTeacherForInstitution);

router.put('/approve-teacher/:user_id', ApprovingTeacher);
router.get('/institution/:id/students', getUserByINS);

export default router