import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader from './layouts/loader/Loader';
import { Toaster } from 'react-hot-toast';
import FullLayout from './layouts/FullLayout';
import StudentFullLayout from './layouts/StudentFullLayout';
import Starter from './views/Starter';
import Groups from './components/groups/Groups';
import Home from './components/students-view/Home';
import Login from './login/Login';
import SignUp from './signup/SignUp';
import ProtectedRoute from './routes/ProtectedRoute';
import AuthRedirect from './routes/AuthRedirect';
import { useAuthcontext } from './contexts/Authcontext';
import CourseList from './components/students-view/course/CourseList';
import CourseDetails from './components/students-view/course/course-details';
import StudentCourseList from './components/students-view/course/StudentCourseList';
import StudentProfile from './components/students-view/StudentProfile';
import CourseForm from './components/instructor/course/CourseForm';
import TeacherForm from './components/instructor/course/TeacherCourseForm';
import InstructorCourseList from './components/instructor/course/CourseList';
import TeacherCourseList from './components/instructor/course/TeacherCourseList';
import GroupList from './components/instructor/group/GroupList';
import GroupForm from './components/instructor/group/GroupForm';
import ExploreDetails from './components/students-view/course/ExploreDetails';
import UnitsPage from './components/students-view/course/unitsPage';
import MaterialPage from './components/students-view/course/materialPage';
import TestOverview from './views/ui/Test';
import PsychometricTestOverview from './views/ui/PsycometricTest';
import PsychometricTestForm from './views/ui/PsychometricTestForm';
import TeacherTestOverview from './views/ui/TeacherTest';
import TestFormReact from './views/ui/TestForm';
import UserList from './views/ui/UserList'
import UserView from './views/ui/UserView'
import StudentList from './views/ui/TeacherStudentList'
import ApprovalList from './views/ui/ApprovalList';
import UserForm from './views/ui/UserForm';
import TeacherStarter from './views/teacherStarter';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEdit, faTrash, faBan, faTrophy } from '@fortawesome/free-solid-svg-icons';
import TestEditForm from './views/ui/TestEditForm';
import InstitutionTable from './views/ui/InstitutionList';
import InstitutionForm from './views/ui/institutionForm';
import TeacherApprovals from './views/ui/TeacherApprovals';
import InsStudentList from './views/ui/StudentList';
import StudentUpload from './views/ui/excel/upload_page';



const App = () => {
  const { authUser } = useAuthcontext();
  library.add(faEdit, faTrash, faBan, faTrophy);
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Instructor routes */}
        <Route
          path='/instructor'
          element={
            <ProtectedRoute condition={authUser && authUser.user.isAdmin} redirectTo="/login">
              <FullLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/instructor" element={<Navigate to="/instructor/starter" />} />
          <Route path="/instructor/starter" element={<Starter />} />
          <Route path="/instructor/groups" element={<GroupList />} />
          <Route path="/instructor/create-group" element={<GroupForm />} />
          <Route path="/instructor/edit-group/:id" element={<GroupForm />} />
          <Route path="/instructor/courses" element={<InstructorCourseList />} />
          <Route path="/instructor/create-course" element={<CourseForm />} />
          <Route path="/instructor/edit-course/:courseId" element={<CourseForm />} />
          <Route path="/instructor/test/" element={<TestOverview />} />
          <Route path="/instructor/psychometric-test/" element={<PsychometricTestOverview />} />
          <Route path="/instructor/psychometric-test/new" element={<PsychometricTestForm />} />
          <Route path="/instructor/psychometric-test/:id" element={<PsychometricTestForm />} />
          <Route path="/instructor/test/new" element={<TestFormReact />} />
          <Route path="/instructor/test/:id" element={<TestFormReact />} />
          <Route path="/instructor/users" element={<UserList />} />
          <Route path="/instructor/users/edit/:id" element={<UserForm />} />
          <Route path="/instructor/users/view/:id" element={<UserView />} />
          <Route path="/instructor/approvals" element={<ApprovalList />} />
          <Route path="/instructor/institution" element={<InstitutionTable />} />
          <Route path="/instructor/institutions/create" element={<InstitutionForm />} />
          <Route path="/instructor/institutions/edit/:id" element={<InstitutionForm />} />
          <Route path="/instructor/institutions/:id/students" element={<InsStudentList />} />
          <Route path="/instructor/institutions/:id/students/upload" element={<StudentUpload />} />
          <Route path="/instructor/teacher-approvals" element={<TeacherApprovals />} />
        </Route>

        {/* Coordinator routes */}
        <Route
          path='/coordinator'
          element={
            <ProtectedRoute condition={authUser && authUser.user.role === 'coordinator'} redirectTo="/login">
              <FullLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/coordinator" element={<Navigate to="/coordinator/institution" />} />
          <Route path="/coordinator/institution" element={<InstitutionTable />} />
          <Route path="/coordinator/institutions/create" element={<InstitutionForm />} />
          <Route path="/coordinator/institutions/edit/:id" element={<InstitutionForm />} />
          <Route path="/coordinator/teacher-approvals" element={<TeacherApprovals />} />

        </Route>

        {/*Teacher Routes*/}
        <Route
          path='/teacher'
          element={
            <ProtectedRoute condition={authUser && authUser.user.role === 'teacher'} redirectTo="/login">
              <FullLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/teacher" element={<Navigate to="/teacher/starter" />} />
          <Route path="/teacher/starter" element={<TeacherStarter />} />
          <Route path="/teacher/groups" element={<GroupList />} />
          <Route path="/teacher/create-group" element={<GroupForm />} />
          <Route path="/teacher/edit-group/:id" element={<GroupForm />} />
          <Route path="/teacher/courses" element={<TeacherCourseList />} />
          <Route path="/teacher/create-course" element={<TeacherForm />} />
          <Route path="/teacher/edit-course/:courseId" element={<TeacherForm />} />
          <Route path="/teacher/test/" element={<TeacherTestOverview />} />
          <Route path="/teacher/test/new" element={<TestFormReact />} />
          <Route path="/teacher/test/:id" element={<TestFormReact />} />
          <Route path="/teacher/users" element={<StudentList />} />
          <Route path="/teacher/users/edit/:id" element={<UserForm />} />
          <Route path="/teacher/approvals" element={<ApprovalList />} />
        </Route>

        {/* Home route for regular users */}
        <Route
          path='/'
          element={
            <StudentFullLayout />
          }
        >
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/student-courses" element={<StudentCourseList />} />
          <Route path="/course/details/:id" element={<CourseDetails />} />
          <Route path="/course/explore-details/:id" element={<ExploreDetails />} />
          <Route path="/course/units/:id" element={<UnitsPage />} />
          <Route path="/course/materials/:id" element={<MaterialPage />} />

          <Route path="/home" element={<Home />} />
        </Route>

        {/* Login route */}
        <Route
          path='/login'
          element={
            authUser ? (
              authUser.user.isAdmin ? (
                <Navigate to="/instructor" />
              ) : authUser.user.role === 'teacher' ? (
                <Navigate to="/teacher" />
              ) :  authUser.user.role === 'coordinator' ? (
                <Navigate to="/coordinator" />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Login />
            )
          }
        />

        {/* Signup route, accessible even if not authenticated */}
        <Route path='/signup' element={authUser ? (
          authUser.user.isAdmin ? (
            <Navigate to="/instructor" />
          ) : authUser.user.role === 'teacher' ? (
            <Navigate to="/teacher" />
          ) : (
            <Navigate to="/" />
          )
        ) : (
          <SignUp />
        )} />

        {/* Catch-all route */}
        <Route
          path='*'
          element={
            <AuthRedirect authUser={authUser} adminPath="/instructor" userPath="/" />
          }
        />
      </Routes>
      <Toaster />
    </Suspense>
  );
};

export default App;
