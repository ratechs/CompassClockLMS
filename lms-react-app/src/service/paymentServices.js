import axios from "axios";

export const createCoursePayment = async (courseId) => {
  const response = await axios.post(
    "/api/payments/course/create-order",
    {
      courseId
    }
  );

  return response.data;
};