import axios from 'axios';
import { useAuthcontext } from "../contexts/Authcontext";
import { isArray } from 'lodash';
import toast from 'react-hot-toast';

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

export const CurrentUserEnrollments = async (user) => {
  console.log("The user data inside the current user service", user)
  try {
    const data = await axios.get(`/api/enrollments/${user}`)
    return data?.data
  } catch (error) {
    toast.error("Error", error?.message)
  }
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

export const getDurationUnits = (duration, unit) => {
  if (unit?.includes("s")) {
    unit = unit.slice(0, -1); // Remove the 's' at the end
  }
  const getCurrentUnit = duration > 1 ? `${unit}s` : unit;
  return getCurrentUnit;
}

export const listInstitution = async () => {
  try {
    const getAllIns = await axios.get("api/institutions");

    const institutions = getAllIns?.data?.data || [];

    const institutionList = institutions.reduce((acc, institution) => {
      acc[institution._id] = institution.name;
      return acc;
    }, {});
    return institutionList;

  } catch (error) {
    toast.error("Error getting institutions");
    return {};
  }
};

