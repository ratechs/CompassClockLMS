import axios from 'axios'

export const courseListService = async () => {
  const data = await axios.get('/api/courses')

  return data
}

export const CourseService = async (id) => {
  const data = await axios.get(`/api/courses/${id}`)

  return data
}


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