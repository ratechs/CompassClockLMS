import axios from 'axios';
import { useAuthcontext } from "../contexts/Authcontext";
import { isArray } from 'lodash';

export const courseListService = async () => {
  const data = await axios.get('/api/courses')

  return data
}

export const CourseService = async (id) => {
  const data = await axios.get(`/api/courses/${id}`)
  return data
}

export const getUser = async (id) => {
  const data = await axios.get(`/api/users/${id}`)
  return data
}

export const CurrentUserService = async (user) => {
  const courses = await courseListService();
  const getUserData = await getUser(user?._id);
  const currentUser = getUserData?.data;

  // Handle course lists returned directly or inside response.data
  const courseList = Array.isArray(courses)
    ? courses
    : Array.isArray(courses?.data)
      ? courses.data
      : [];
  if (!Array.isArray(currentUser?.courses) || currentUser.courses.length === 0) {
    return [];
  }

  const userCourseIds = new Set(
    currentUser.courses.map((course) =>
      String(typeof course === "object" ? course?._id : course)
    )
  );
  
  return courseList.filter((course) =>
    userCourseIds.has(String(course?._id))
  );
};

export const studentCourseListService = async (id) => {
  const data = await axios.get(`/api/groups/${id}/courses`)

  return data
}

export const fetchAllUsersService = async () => {
  const data = await axios.get(`/api/users`)

  return data
}

export const submitCommentService = async () => {
  const data = await axios.post(`/api/comments`)
  return data
}

export const submitRatingService = async (id, rating, comment) => {
  const data = await axios.post(`/api/courses/${id}/rate`, { rating, comment })
  return data
}

export const fetchRating = async (id) => {
  const data = await axios.get(`/api/courses/${id}/ratings`)
  return data
}

export const getUserById = async (id) => {
  try {
    const data = await axios.get(`/api/users/${id}`);
    return data
  } catch (error) {
    console.log('Erro Geting ID : ', error);
    throw error;
  }

}

export const getMaterialBySubject = async (id) => {
  try {
    const data = await axios.get(`/api/materials/${id}/materials`);
    console.log(data);
    
    return data        
  } catch (error) {
    console.log('Erro Geting ID : ', error);
    throw error;
  }
}

export const getMaterialById = async (id) => {
  try {
    const data = await axios.get(`/api/materials/${id}`);
    console.log(data);
    
    return data        
  } catch (error) {
    console.log('Erro Geting ID : ', error);
    throw error;
  }
}

export const dashboardStarterService = async (userID) => {
  try {
    const data = await axios.get(`/api/users/dashboard/${userID}`);
    return data
  } catch (error) {
    console.log('Error fetching dashboard starter data: ', error);
    throw error;
  }
}

export const adminOrderService = async () => {
  try {
    const data = await axios.get(`/api/order-management/orders`);
    return data
  } catch (error) {
    console.log('Error fetching orders: ', error);
    throw error;
  } 
}

export const adminOrderStatsService = async () => {
  try {
    const data = await axios.get(`/api/order-management/orders/stats`);
    console.log(data.data);
    return data.data;
  } catch (error) {
    console.log('Error fetching order stats: ', error);
    throw error;
  }
}

export const toggleUserIntrestedCourseService = async (intrestdCourses) => {
  const currentUser = JSON.parse(localStorage.getItem('lms-user'))?.user;
  const userId = currentUser?._id;
  try {
    const data = await axios.post(`/api/users/update-intrested-courses/${userId}`, { intrestedCourses: intrestdCourses });
    return data;
  } catch (error) {
    console.log('Error toggling interested course: ', error);
    throw error;
  } 
}

export const getCurrentUser = ()=>{
  const currentUser = JSON.parse(localStorage.getItem('lms-user'))?.user;
  return currentUser;
}

