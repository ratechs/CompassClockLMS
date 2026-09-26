import React, { useEffect, useMemo, useState } from "react";

import {
  Button,
  Col,
  Container,
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Row,
  Spinner,
} from "reactstrap";

import { useNavigate } from "react-router-dom";

import axios from "axios";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";

import { useStudentContext } from "../../../contexts/Student-context";
import { useAuthcontext } from "../../../contexts/Authcontext";

import { courseListService } from "../../../service/baseService";

import defaultIMG from "../../../assets/images/default_images/images.jpg";

import {
  faArrowRight,
  faBookOpen,
  faCheck,
  faClock,
  faHeart,
  faSearch,
  faUserPlus,
  faUsers,
  faXmark,
  faGraduationCap,
  faLock,
  faUnlock,
  faIndianRupeeSign,
  faCartShopping,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CourseList = () => {
  const navigate = useNavigate();

  const {
    studentCoursesList,
    setStudentCoursesList,
  } = useStudentContext();

  const { authUser } = useAuthcontext();

  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [requestLoading, setRequestLoading] = useState(null);
  const [freeEnrollLoading, setFreeEnrollLoading] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Interested Courses
  |--------------------------------------------------------------------------
  */

  const [interestedCourses, setInterestedCourses] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "student_interested_courses"
      );

      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Fetch Courses
  |--------------------------------------------------------------------------
  */

  const fetchCourseList = async () => {
    try {
      const response = await courseListService();

      if (Array.isArray(response?.data)) {
        setStudentCoursesList(response.data);
      } else if (Array.isArray(response)) {
        setStudentCoursesList(response);
      } else {
        setStudentCoursesList([]);
      }
    } catch (error) {
      console.error("Course list error:", error);

      toast.error(
        error?.response?.data?.message ||
        "Unable to load courses."
      );

      setStudentCoursesList([]);
    }
  };

  useEffect(() => {
    fetchCourseList();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const getCourseName = (course) => {
    return (
      course?.name ||
      course?.course_name ||
      "Untitled Course"
    );
  };

  const getCourseVisibility = (course) => {
    return (
      course?.course_type ||
      "public"
    ).toLowerCase();
  };

  const isPaidCourse = (course) => {
    return Boolean(course?.is_paidCourse);
  };

  const getCoursePrice = (course) => {
    const price = Number(course?.price || 0);

    return price > 0 ? price : 0;
  };

  const getCurrency = (course) => {
    return course?.currency || "INR";
  };

  const formatPrice = (course) => {
    const price = getCoursePrice(course);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: getCurrency(course),
      maximumFractionDigits: 0,
    }).format(price);
  };

  /*
  |--------------------------------------------------------------------------
  | Course Filters
  |--------------------------------------------------------------------------
  */

  const filteredCourses = useMemo(() => {
    if (!Array.isArray(studentCoursesList)) {
      return [];
    }

    const search = searchTerm.trim().toLowerCase();

    return studentCoursesList.filter((course) => {
      const name = getCourseName(course);

      const description =
        course?.description || "";

      const visibility =
        getCourseVisibility(course);

      const paymentType = isPaidCourse(course)
        ? "paid"
        : "free";

      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search) ||
        description.toLowerCase().includes(search) ||
        visibility.includes(search) ||
        paymentType.includes(search);

      const matchesCourseFilter =
        courseFilter === "all" ||
        visibility === courseFilter;

      const matchesPaymentFilter =
        paymentFilter === "all" ||
        paymentType === paymentFilter;

      return (
        matchesSearch &&
        matchesCourseFilter &&
        matchesPaymentFilter
      );
    });
  }, [
    studentCoursesList,
    searchTerm,
    courseFilter,
    paymentFilter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | JOIN REQUEST STATUS
  |
  | IMPORTANT:
  | "approved" here means the admin approved the JOIN REQUEST.
  | It does NOT mean the student is enrolled.
  |--------------------------------------------------------------------------
  */

  const getJoinStatus = (course) => {
    const userId = authUser?.user?._id;

    if (!userId) {
      return null;
    }

    if (!Array.isArray(course?.joinRequests)) {
      return null;
    }

    const request = course.joinRequests.find((item) => {
      const requestUserId =
        typeof item?.user === "object"
          ? item?.user?._id
          : item?.user;

      return (
        requestUserId &&
        requestUserId.toString() ===
        userId.toString()
      );
    });

    return request?.status || null;
  };

  /*
  |--------------------------------------------------------------------------
  | ENROLLMENT STATUS
  |
  | This is different from join request status.
  |
  | approved = admin approved request
  | active   = actual enrollment/payment completed
  |--------------------------------------------------------------------------
  */

  const getEnrollmentStatus = (course) => {
    /*
     * Support API response:
     *
     * enrollment: {
     *   status: "active"
     * }
     */

    if (
      course?.enrollment?.status === "active"
    ) {
      return "active";
    }

    if (
      course?.userEnrollment?.status === "active"
    ) {
      return "active";
    }

    /*
     * Support:
     *
     * enrolled: true
     * isEnrolled: true
     */

    if (
      course?.enrolled === true ||
      course?.isEnrolled === true
    ) {
      return "active";
    }

    return null;
  };

  /*
  |--------------------------------------------------------------------------
  | CHECK ACTUAL COURSE ACCESS
  |--------------------------------------------------------------------------
  */

  const isCourseEnrolled = (course) => {
    return (
      getEnrollmentStatus(course) === "active"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Mark Course As Enrolled
  |
  | This is called ONLY after:
  | - free enrollment succeeds
  | - paid payment verification succeeds
  |--------------------------------------------------------------------------
  */

  const markCourseAsEnrolled = (courseId) => {
    if (!Array.isArray(studentCoursesList)) {
      return;
    }

    const updatedCourses =
      studentCoursesList.map((course) => {
        if (
          course?._id?.toString() !==
          courseId?.toString()
        ) {
          return course;
        }

        return {
          ...course,

          /*
           * Actual enrollment
           */
          enrolled: true,
          isEnrolled: true,

          enrollment: {
            ...(course?.enrollment || {}),
            status: "active",
          },
        };
      });

    setStudentCoursesList(updatedCourses);

    if (
      selectedCourse?._id?.toString() ===
      courseId?.toString()
    ) {
      setSelectedCourse((prev) => ({
        ...prev,

        enrolled: true,
        isEnrolled: true,

        enrollment: {
          ...(prev?.enrollment || {}),
          status: "active",
        },
      }));
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Update Join Request Status Locally
  |--------------------------------------------------------------------------
  */

  const updateCourseJoinStatus = (
    courseId,
    userId,
    newStatus
  ) => {
    if (!Array.isArray(studentCoursesList)) {
      return;
    }

    const updatedCourses =
      studentCoursesList.map((course) => {
        if (
          course?._id?.toString() !==
          courseId?.toString()
        ) {
          return course;
        }

        const existingRequests =
          Array.isArray(course.joinRequests)
            ? [...course.joinRequests]
            : [];

        const requestIndex =
          existingRequests.findIndex((item) => {
            const requestUserId =
              typeof item?.user === "object"
                ? item?.user?._id
                : item?.user;

            return (
              requestUserId &&
              requestUserId.toString() ===
              userId.toString()
            );
          });

        if (requestIndex >= 0) {
          existingRequests[requestIndex] = {
            ...existingRequests[requestIndex],
            status: newStatus,
          };
        } else {
          existingRequests.push({
            user: userId,
            status: newStatus,
          });
        }

        return {
          ...course,
          joinRequests: existingRequests,
        };
      });

    setStudentCoursesList(updatedCourses);

    if (
      selectedCourse?._id?.toString() ===
      courseId?.toString()
    ) {
      const updatedSelectedCourse =
        updatedCourses.find(
          (course) =>
            course?._id?.toString() ===
            courseId?.toString()
        );

      if (updatedSelectedCourse) {
        setSelectedCourse(
          updatedSelectedCourse
        );
      }
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Interested Courses
  |--------------------------------------------------------------------------
  */

  const isInterested = (courseId) => {
    return interestedCourses.includes(courseId);
  };

  const toggleInterested = (courseId) => {
    let updated;

    if (interestedCourses.includes(courseId)) {
      updated = interestedCourses.filter(
        (id) => id !== courseId
      );

      toast("Removed from interested courses");
    } else {
      updated = [
        ...interestedCourses,
        courseId,
      ];

      toast.success(
        "Added to interested courses"
      );
    }

    setInterestedCourses(updated);

    localStorage.setItem(
      "student_interested_courses",
      JSON.stringify(updated)
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Request Private Course
  |--------------------------------------------------------------------------
  */

  const requestCourseJoin = async (course) => {
    const userId = authUser?.user?._id;

    if (!userId) {
      toast.error(
        "Please login to request this course."
      );

      return;
    }

    if (!course?.join_code) {
      toast.error(
        "This course does not have a valid join code."
      );

      return;
    }

    const currentStatus =
      getJoinStatus(course);

    /*
     * If already enrolled, go to learning.
     */

    if (isCourseEnrolled(course)) {
      continueLearning(course);
      return;
    }

    /*
     * If request is pending, do nothing.
     */

    if (currentStatus === "pending") {
      toast(
        "Your request is already pending."
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * Rejected request can be requested again
     * because your backend changes rejected -> pending.
     */

    try {
      setRequestLoading(course._id);

      const response = await axios.post(
        "/api/courses/request-join",
        {
          joinCode: course.join_code,
          userId,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const status =
        response?.data?.status;

      if (
        status === "requested" ||
        status === "already_requested"
      ) {
        updateCourseJoinStatus(
          course._id,
          userId,
          "pending"
        );

        toast.success(
          response?.data?.message ||
          "Course join request submitted successfully."
        );
      } else {
        updateCourseJoinStatus(
          course._id,
          userId,
          "pending"
        );

        toast.success(
          response?.data?.message ||
          "Request submitted successfully."
        );
      }
    } catch (error) {
      console.error(
        "Course join request error:",
        error
      );

      const responseStatus =
        error?.response?.data?.status;

      if (
        responseStatus ===
        "already_requested"
      ) {
        updateCourseJoinStatus(
          course._id,
          userId,
          "pending"
        );

        toast(
          "You have already requested this course."
        );
      } else {
        toast.error(
          error?.response?.data?.message ||
          "Unable to submit join request."
        );
      }
    } finally {
      setRequestLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Free Course Enrollment
  |--------------------------------------------------------------------------
  */

  const enrollFreeCourse = async (course) => {
    const userId = authUser?.user?._id;

    if (!userId) {
      toast.error(
        "Please login to enroll in this course."
      );

      return;
    }

    if (isPaidCourse(course)) {
      toast.error(
        "This is a paid course."
      );

      return;
    }

    /*
     * PRIVATE COURSE
     *
     * Student must be approved first.
     */

    if (
      getCourseVisibility(course) ===
      "private" &&
      getJoinStatus(course) !== "approved"
    ) {
      toast.error(
        "Admin approval is required before enrollment."
      );

      return;
    }

    try {
      setFreeEnrollLoading(course._id);

      const response = await axios.post(
        "/api/courses/enroll-free",
        {
          courseId: course._id,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      toast.success(
        response?.data?.message ||
        "Successfully enrolled in the course."
      );

      /*
       * IMPORTANT:
       *
       * Only now do we mark the student enrolled.
       */

      markCourseAsEnrolled(course._id);
    } catch (error) {
      console.error(
        "Free enrollment error:",
        error
      );

      if (
        error?.response?.data?.message
          ?.toLowerCase()
          .includes("already enrolled")
      ) {
        markCourseAsEnrolled(
          course._id
        );

        toast(
          "You are already enrolled in this course."
        );
      } else {
        toast.error(
          error?.response?.data?.message ||
          "Unable to enroll in this course."
        );
      }
    } finally {
      setFreeEnrollLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Razorpay Script
  |--------------------------------------------------------------------------
  */

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (
        document.getElementById(
          "razorpay-checkout-script"
        )
      ) {
        resolve(true);
        return;
      }

      const script =
        document.createElement("script");

      script.id =
        "razorpay-checkout-script";

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => {
        resolve(true);
      };

      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Buy Paid Course
  |--------------------------------------------------------------------------
  */

  const buyPaidCourse = async (course) => {
    const userId = authUser?.user?._id;

    if (!userId) {
      toast.error(
        "Please login before purchasing a course."
      );

      return;
    }

    if (!isPaidCourse(course)) {
      toast.error(
        "This is a free course."
      );

      return;
    }

    if (getCoursePrice(course) <= 0) {
      toast.error(
        "This course has an invalid price."
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * Private paid course can only be purchased
     * after admin approval.
     */

    if (
      getCourseVisibility(course) ===
      "private" &&
      getJoinStatus(course) !== "approved"
    ) {
      toast.error(
        "Admin approval is required before payment."
      );

      return;
    }

    /*
     * Already enrolled
     */

    if (isCourseEnrolled(course)) {
      continueLearning(course);
      return;
    }

    try {
      setPaymentLoading(course._id);

      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        toast.error(
          "Unable to load Razorpay checkout."
        );

        return;
      }

      /*
       * Create Razorpay order on backend.
       */

      const orderResponse =
        await axios.post(
          "/api/payments/course/create-order",
          {
            courseId: course._id,
            userId: userId,
          },
          {
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const orderData =
        orderResponse?.data;
      console.log("Razorpay order data:", orderData);
      if (!orderData?.providerOrderId) {
        throw new Error(
          "Invalid payment order response."
        );
      }

      /*
       * Open Razorpay
       */

      const options = {
        key: orderData.key,

        amount: orderData.amount,

        currency:
          orderData.currency ||
          getCurrency(course),

        name: "Saandrone",

        description:
          getCourseName(course),

        order_id:
          orderData.providerOrderId,

        prefill: {
          name:
            authUser?.user?.name ||
            authUser?.user?.full_name ||
            "",

          email:
            authUser?.user?.email ||
            "",

          contact:
            authUser?.user?.phone ||
            "",
        },

        notes: {
          courseId: course._id,
          userId,
        },

        theme: {
          color: "#6c63ff",
        },

        /*
         * PAYMENT SUCCESS
         */

        handler:
          async function (paymentResponse) {
            try {
              toast.loading(
                "Verifying payment...",
                {
                  id: "payment-verification",
                }
              );

              /*
               * Verify payment on backend.
               */

              const verifyResponse =
                await axios.post(
                  "/api/payments/course/verify",
                  {
                    razorpay_order_id:
                      paymentResponse.razorpay_order_id,

                    razorpay_payment_id:
                      paymentResponse.razorpay_payment_id,

                    razorpay_signature:
                      paymentResponse.razorpay_signature,

                    orderId:
                      orderData.orderId,
                  },
                  {
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                  }
                );


              toast.dismiss(
                "payment-verification"
              );

              /*
               * IMPORTANT:
               *
               * Only after backend verifies payment
               * do we mark the course enrolled.
               */

              markCourseAsEnrolled(
                course._id
              );

              if(verifyResponse?.data?.orderStatus === "paid") {
                markCourseAsEnrolled(course._id);
              }

              toast.success(
                verifyResponse?.data
                  ?.message ||
                "Payment successful! You are now enrolled."
              );

              /*
               * Refresh course data.
               */

              await fetchCourseList();
            } catch (error) {
              toast.dismiss(
                "payment-verification"
              );

              console.error(
                "Payment verification error:",
                error
              );

              toast.error(
                error?.response?.data
                  ?.message ||
                "Payment verification failed."
              );
            }
          },

        /*
         * Payment modal closed
         */

        modal: {
          ondismiss: function () {
            toast(
              "Payment window closed."
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      /*
       * Payment failed
       */

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          toast.error(
            response?.error?.description ||
            "Payment failed."
          );
        }
      );

      razorpay.open();
    } catch (error) {
      console.error(
        "Payment initialization error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Unable to start payment."
      );
    } finally {
      setPaymentLoading(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Time Formatter
  |--------------------------------------------------------------------------
  */

  const convertTime = (time) => {
    if (
      time === undefined ||
      time === null ||
      time === ""
    ) {
      return "Self paced";
    }

    const numericTime = Number(time);

    if (Number.isNaN(numericTime)) {
      return time;
    }

    if (numericTime === 0) {
      return "Self paced";
    }

    if (numericTime >= 168) {
      const weeks = Math.round(
        numericTime / 168
      );

      return `${weeks} ${weeks === 1
          ? "week"
          : "weeks"
        }`;
    }

    if (numericTime >= 24) {
      const days = Math.round(
        numericTime / 24
      );

      return `${days} ${days === 1
          ? "day"
          : "days"
        }`;
    }

    return `${numericTime} ${numericTime === 1
        ? "hour"
        : "hours"
      }`;
  };

  /*
  |--------------------------------------------------------------------------
  | Approved Student Count
  |--------------------------------------------------------------------------
  */

  const getApprovedStudentCount = (
    course
  ) => {
    if (
      !Array.isArray(
        course?.joinRequests
      )
    ) {
      return 0;
    }

    return course.joinRequests.filter(
      (request) =>
        request?.status ===
        "approved"
    ).length;
  };

  /*
  |--------------------------------------------------------------------------
  | Open / Close Details
  |--------------------------------------------------------------------------
  */

  const openCourseDetails = (
    course
  ) => {
    setSelectedCourse(course);
    setDetailsOpen(true);
  };

  const closeCourseDetails = () => {
    setDetailsOpen(false);
    setSelectedCourse(null);
  };

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const continueLearning = (
    course
  ) => {
    navigate(
      `/course/details/${course._id}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PAYMENT / ENROLLMENT BUTTON
  |
  | THIS IS THE MOST IMPORTANT SECTION
  |--------------------------------------------------------------------------
  */

  const renderPaymentButton = (
    course,
    location = "card"
  ) => {
    const joinStatus =
      getJoinStatus(course);

    const enrollmentStatus =
      getEnrollmentStatus(course);

    const isEnrolled =
      enrollmentStatus === "active";

    const isPrivate =
      getCourseVisibility(course) ===
      "private";

    const isPaid =
      isPaidCourse(course);

    const freeLoading =
      freeEnrollLoading === course?._id;

    const paymentLoadingState =
      paymentLoading === course?._id;

    const requestLoadingState =
      requestLoading === course?._id;

    /*
     |--------------------------------------------------------------------------
     | 1. ACTUAL ENROLLMENT
     |
     | Continue Learning ONLY when enrollment is active.
     |--------------------------------------------------------------------------
     */

    if (isEnrolled) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-continue-btn"
              : "student-course-action-btn enrolled"
          }
          onClick={() =>
            continueLearning(course)
          }
        >
          <FontAwesomeIcon
            icon={faCheck}
          />

          <span>
            Continue Learning
          </span>

          {location === "modal" && (
            <FontAwesomeIcon
              icon={faArrowRight}
            />
          )}
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 2. PRIVATE COURSE + PENDING
     |--------------------------------------------------------------------------
     */

    if (
      isPrivate &&
      joinStatus === "pending"
    ) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-pending-btn"
              : "student-course-action-btn pending"
          }
          disabled
        >
          <FontAwesomeIcon
            icon={faClock}
          />

          <span>
            Request Pending
          </span>
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 3. PRIVATE COURSE + REJECTED
     |
     | Allow Request to Join again.
     |--------------------------------------------------------------------------
     */

    if (
      isPrivate &&
      joinStatus === "rejected"
    ) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-join-btn"
              : "student-course-action-btn join"
          }
          disabled={
            requestLoadingState
          }
          onClick={() =>
            requestCourseJoin(course)
          }
        >
          {requestLoadingState ? (
            <>
              <Spinner size="sm" />

              <span>
                Requesting...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faUserPlus}
              />

              <span>
                Request Again
              </span>
            </>
          )}
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 4. PRIVATE + NOT APPROVED
     |
     | This includes:
     | - no request
     | - rejected/request again handled above
     |--------------------------------------------------------------------------
     */

    if (
      isPrivate &&
      joinStatus !== "approved"
    ) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-join-btn"
              : "student-course-action-btn join"
          }
          disabled={
            requestLoadingState
          }
          onClick={() =>
            requestCourseJoin(course)
          }
        >
          {requestLoadingState ? (
            <>
              <Spinner size="sm" />

              <span>
                Requesting...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faUserPlus}
              />

              <span>
                Request to Join
              </span>
            </>
          )}
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 5. PRIVATE + APPROVED + PAID
     |
     | IMPORTANT:
     |
     | Admin approval DOES NOT mean enrolled.
     |
     | Show Buy Now.
     |--------------------------------------------------------------------------
     */

    if (
      isPrivate &&
      joinStatus === "approved" &&
      isPaid
    ) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-buy-btn"
              : "student-course-action-btn buy"
          }
          disabled={
            paymentLoadingState
          }
          onClick={() =>
            buyPaidCourse(course)
          }
        >
          {paymentLoadingState ? (
            <>
              <Spinner size="sm" />

              <span>
                Processing...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faCartShopping}
              />

              <span>
                Buy Now
              </span>
            </>
          )}
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 6. PRIVATE + APPROVED + FREE
     |
     | Admin approved → now allow free enrollment.
     |--------------------------------------------------------------------------
     */

    if (
      isPrivate &&
      joinStatus === "approved" &&
      !isPaid
    ) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-free-btn"
              : "student-course-action-btn free"
          }
          disabled={freeLoading}
          onClick={() =>
            enrollFreeCourse(course)
          }
        >
          {freeLoading ? (
            <>
              <Spinner size="sm" />

              <span>
                Enrolling...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faCircleCheck}
              />

              <span>
                Enroll Free
              </span>
            </>
          )}
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 7. PUBLIC FREE
     |--------------------------------------------------------------------------
     */

    if (!isPaid) {
      return (
        <Button
          type="button"
          className={
            location === "modal"
              ? "modal-free-btn"
              : "student-course-action-btn free"
          }
          disabled={freeLoading}
          onClick={() =>
            enrollFreeCourse(course)
          }
        >
          {freeLoading ? (
            <>
              <Spinner size="sm" />

              <span>
                Enrolling...
              </span>
            </>
          ) : (
            <>
              <FontAwesomeIcon
                icon={faCircleCheck}
              />

              <span>
                Enroll Free
              </span>
            </>
          )}
        </Button>
      );
    }

    /*
     |--------------------------------------------------------------------------
     | 8. PUBLIC PAID
     |--------------------------------------------------------------------------
     */

    return (
      <Button
        type="button"
        className={
          location === "modal"
            ? "modal-buy-btn"
            : "student-course-action-btn buy"
        }
        disabled={
          paymentLoadingState
        }
        onClick={() =>
          buyPaidCourse(course)
        }
      >
        {paymentLoadingState ? (
          <>
            <Spinner size="sm" />

            <span>
              Processing...
            </span>
          </>
        ) : (
          <>
            <FontAwesomeIcon
              icon={faCartShopping}
            />

            <span>
              Buy Now
            </span>
          </>
        )}
      </Button>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Status Banner
  |--------------------------------------------------------------------------
  */

  const renderStatusBanner = (
    course
  ) => {
    const joinStatus =
      getJoinStatus(course);

    const isEnrolled =
      isCourseEnrolled(course);

    /*
     * ACTUAL ENROLLMENT
     */

    if (isEnrolled) {
      return (
        <div className="course-status-banner approved">
          <FontAwesomeIcon
            icon={faCheck}
          />

          <span>
            You are enrolled in this course
          </span>
        </div>
      );
    }

    /*
     * PRIVATE + PENDING
     */

    if (
      getCourseVisibility(course) ===
      "private" &&
      joinStatus === "pending"
    ) {
      return (
        <div className="course-status-banner pending">
          <FontAwesomeIcon
            icon={faClock}
          />

          <span>
            Your join request is pending
          </span>
        </div>
      );
    }

    /*
     * PRIVATE + APPROVED
     *
     * This is NOT enrollment.
     */

    if (
      getCourseVisibility(course) ===
      "private" &&
      joinStatus === "approved"
    ) {
      if (isPaidCourse(course)) {
        return (
          <div className="course-status-banner paid">
            <FontAwesomeIcon
              icon={faCheck}
            />

            <span>
              Request approved — payment required
            </span>
          </div>
        );
      }

      return (
        <div className="course-status-banner approved">
          <FontAwesomeIcon
            icon={faCheck}
          />

          <span>
            Request approved — enrollment available
          </span>
        </div>
      );
    }

    /*
     * PRIVATE
     */

    if (
      getCourseVisibility(course) ===
      "private"
    ) {
      return (
        <div className="course-status-banner private">
          <FontAwesomeIcon
            icon={faLock}
          />

          <span>
            Private course — approval required
          </span>
        </div>
      );
    }

    /*
     * PUBLIC PAID
     */

    if (isPaidCourse(course)) {
      return (
        <div className="course-status-banner paid">
          <FontAwesomeIcon
            icon={faIndianRupeeSign}
          />

          <span>
            Paid course
          </span>
        </div>
      );
    }

    /*
     * PUBLIC FREE
     */

    return (
      <div className="course-status-banner free">
        <FontAwesomeIcon
          icon={faCircleCheck}
        />

        <span>
          Free course
        </span>
      </div>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  const isLoading =
    studentCoursesList === null ||
    studentCoursesList === undefined;

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div className="student-course-page">
      <Container
        fluid
        className="student-course-container"
      >
        {/* HEADER */}

        <div className="student-course-header">
          <div className="student-course-header-content">
            <div className="student-course-header-icon">
              <FontAwesomeIcon
                icon={faGraduationCap}
              />
            </div>

            <div>
              <h1>
                Explore Courses
              </h1>

              <p>
                Discover courses and continue
                your learning journey.
              </p>
            </div>
          </div>

          {!isLoading && (
            <div className="course-count-box">
              <span>
                {filteredCourses.length}
              </span>

              <small>
                Courses
              </small>
            </div>
          )}
        </div>

        {/* FILTER BAR */}

        <div className="student-course-filter-card">
          <Row className="align-items-center g-3">
            <Col
              xs="12"
              lg="5"
            >
              <div className="course-search-wrapper">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="course-search-icon"
                />

                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  className="course-search-input"
                />
              </div>
            </Col>

            <Col
              xs="12"
              lg="7"
            >
              <div className="course-filter-groups">
                {/* Visibility */}

                <div className="course-filter-group">
                  <span className="course-filter-label">
                    Visibility
                  </span>

                  <button
                    type="button"
                    className={`course-filter-btn ${courseFilter ===
                        "all"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setCourseFilter(
                        "all"
                      )
                    }
                  >
                    All
                  </button>

                  <button
                    type="button"
                    className={`course-filter-btn ${courseFilter ===
                        "public"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setCourseFilter(
                        "public"
                      )
                    }
                  >
                    <FontAwesomeIcon
                      icon={faUnlock}
                    />

                    Public
                  </button>

                  <button
                    type="button"
                    className={`course-filter-btn ${courseFilter ===
                        "private"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setCourseFilter(
                        "private"
                      )
                    }
                  >
                    <FontAwesomeIcon
                      icon={faLock}
                    />

                    Private
                  </button>
                </div>

                {/* Payment */}

                <div className="course-filter-group">
                  <span className="course-filter-label">
                    Price
                  </span>

                  <button
                    type="button"
                    className={`course-filter-btn ${paymentFilter ===
                        "all"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setPaymentFilter(
                        "all"
                      )
                    }
                  >
                    All
                  </button>

                  <button
                    type="button"
                    className={`course-filter-btn ${paymentFilter ===
                        "free"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setPaymentFilter(
                        "free"
                      )
                    }
                  >
                    Free
                  </button>

                  <button
                    type="button"
                    className={`course-filter-btn ${paymentFilter ===
                        "paid"
                        ? "active"
                        : ""
                      }`}
                    onClick={() =>
                      setPaymentFilter(
                        "paid"
                      )
                    }
                  >
                    Paid
                  </button>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* LOADING */}

        {isLoading ? (
          <div className="course-loading-state">
            <div className="course-loading-spinner">
              <Spinner />
            </div>

            <h4>
              Loading courses...
            </h4>

            <p>
              Please wait while we load
              available courses.
            </p>
          </div>
        ) : (
          <>
            {/* EMPTY */}

            {filteredCourses.length ===
              0 ? (
              <div className="course-empty-state">
                <div className="course-empty-icon">
                  <FontAwesomeIcon
                    icon={faBookOpen}
                  />
                </div>

                <h3>
                  No courses found
                </h3>

                <p>
                  Try changing your search
                  or course filters.
                </p>

                {(searchTerm ||
                  courseFilter !==
                  "all" ||
                  paymentFilter !==
                  "all") && (
                    <Button
                      type="button"
                      className="clear-course-filter-btn"
                      onClick={() => {
                        setSearchTerm("");
                        setCourseFilter(
                          "all"
                        );
                        setPaymentFilter(
                          "all"
                        );
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
              </div>
            ) : (
              /* COURSE GRID */

              <Row className="student-course-grid">
                {filteredCourses.map(
                  (course) => {
                    const interested =
                      isInterested(
                        course._id
                      );

                    return (
                      <Col
                        key={course._id}
                        xs="12"
                        sm="6"
                        xl="4"
                        className="student-course-column"
                      >
                        <div className="student-course-card">
                          {/* IMAGE */}

                          <div className="student-course-image-wrapper">
                            <img
                              src={
                                course?.imageUrl ||
                                defaultIMG
                              }
                              alt={getCourseName(
                                course
                              )}
                              className="student-course-image"
                              onError={(e) => {
                                e.currentTarget.src =
                                  defaultIMG;
                              }}
                            />

                            <div className="course-image-overlay" />

                            {/* Visibility */}

                            <div className="course-type-badge">
                              <FontAwesomeIcon
                                icon={
                                  getCourseVisibility(
                                    course
                                  ) ===
                                    "private"
                                    ? faLock
                                    : faUnlock
                                }
                              />

                              <span>
                                {getCourseVisibility(
                                  course
                                ) ===
                                  "private"
                                  ? "Private"
                                  : "Public"}
                              </span>
                            </div>

                            {/* Price */}

                            <div
                              className={`course-price-badge ${isPaidCourse(
                                course
                              )
                                  ? "paid"
                                  : "free"
                                }`}
                            >
                              {isPaidCourse(
                                course
                              ) ? (
                                <>
                                  <FontAwesomeIcon
                                    icon={
                                      faIndianRupeeSign
                                    }
                                  />

                                  <span>
                                    {
                                      getCoursePrice(
                                        course
                                      )
                                    }
                                  </span>
                                </>
                              ) : (
                                <>
                                  <FontAwesomeIcon
                                    icon={
                                      faCircleCheck
                                    }
                                  />

                                  <span>
                                    FREE
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Interested */}

                            <button
                              type="button"
                              className={`course-interest-btn ${interested
                                  ? "active"
                                  : ""
                                }`}
                              onClick={() =>
                                toggleInterested(
                                  course._id
                                )
                              }
                              aria-label={
                                interested
                                  ? "Remove from interested"
                                  : "Add to interested"
                              }
                            >
                              <FontAwesomeIcon
                                icon={
                                  faHeart
                                }
                              />
                            </button>
                          </div>

                          {/* CONTENT */}

                          <div className="student-course-content">
                            <div className="course-card-heading">
                              <h3
                                className="student-course-title"
                                title={getCourseName(
                                  course
                                )}
                              >
                                {getCourseName(
                                  course
                                )}
                              </h3>
                            </div>

                            {/* Description */}

                            <div
                              className="student-course-description"
                              dangerouslySetInnerHTML={{
                                __html:
                                  DOMPurify.sanitize(
                                    course?.description ||
                                    "<p>No course description available.</p>"
                                  ),
                              }}
                            />

                            {/* Meta */}

                            <div className="student-course-meta">
                              <div className="course-meta-item">
                                <FontAwesomeIcon
                                  icon={
                                    faClock
                                  }
                                />

                                <span>
                                  {convertTime(
                                    course?.duration
                                  )}
                                </span>
                              </div>

                              <div className="course-meta-item">
                                <FontAwesomeIcon
                                  icon={
                                    faUsers
                                  }
                                />

                                <span>
                                  {
                                    getApprovedStudentCount(
                                      course
                                    )
                                  }{" "}
                                  enrolled
                                </span>
                              </div>
                            </div>

                            {/* Status */}

                            {renderStatusBanner(
                              course
                            )}

                            {/* Actions */}

                            <div className="student-course-actions">
                              <Button
                                type="button"
                                className="student-course-view-btn"
                                onClick={() =>
                                  openCourseDetails(
                                    course
                                  )
                                }
                              >
                                <span>
                                  View Details
                                </span>

                                <FontAwesomeIcon
                                  icon={
                                    faArrowRight
                                  }
                                />
                              </Button>

                              {renderPaymentButton(
                                course
                              )}
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  }
                )}
              </Row>
            )}
          </>
        )}
      </Container>

      {/* COURSE DETAILS MODAL */}

      <Modal
        isOpen={detailsOpen}
        toggle={
          closeCourseDetails
        }
        centered
        size="lg"
        className="student-course-details-modal"
      >
        <ModalHeader
          toggle={
            closeCourseDetails
          }
          className="student-course-modal-header"
        >
          <div className="student-course-modal-title">
            <div className="student-course-modal-title-icon">
              <FontAwesomeIcon
                icon={faBookOpen}
              />
            </div>

            <div>
              <h4>
                {selectedCourse
                  ? getCourseName(
                    selectedCourse
                  )
                  : "Course Details"}
              </h4>

              <span>
                {selectedCourse
                  ? getCourseVisibility(
                    selectedCourse
                  )
                  : "Course"}
              </span>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="student-course-modal-body">
          {selectedCourse && (
            <>
              {/* MODAL IMAGE */}

              <div className="student-course-modal-image-wrapper">
                <img
                  src={
                    selectedCourse?.imageUrl ||
                    defaultIMG
                  }
                  alt={getCourseName(
                    selectedCourse
                  )}
                  className="student-course-modal-image"
                  onError={(e) => {
                    e.currentTarget.src =
                      defaultIMG;
                  }}
                />

                <div className="modal-image-overlay">
                  <div
                    className={`modal-course-price ${isPaidCourse(
                      selectedCourse
                    )
                        ? "paid"
                        : "free"
                      }`}
                  >
                    {isPaidCourse(
                      selectedCourse
                    ) ? (
                      <>
                        <FontAwesomeIcon
                          icon={
                            faIndianRupeeSign
                          }
                        />

                        <span>
                          {getCoursePrice(
                            selectedCourse
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon
                          icon={
                            faCircleCheck
                          }
                        />

                        <span>
                          FREE
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* MODAL META */}

              <div className="student-course-modal-meta">
                <div>
                  <FontAwesomeIcon
                    icon={faClock}
                  />

                  <div>
                    <small>
                      Duration
                    </small>

                    <strong>
                      {convertTime(
                        selectedCourse?.duration
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <FontAwesomeIcon
                    icon={faUsers}
                  />

                  <div>
                    <small>
                      Students
                    </small>

                    <strong>
                      {
                        getApprovedStudentCount(
                          selectedCourse
                        )
                      }
                    </strong>
                  </div>
                </div>

                <div>
                  <FontAwesomeIcon
                    icon={
                      getCourseVisibility(
                        selectedCourse
                      ) ===
                        "private"
                        ? faLock
                        : faUnlock
                    }
                  />

                  <div>
                    <small>
                      Access
                    </small>

                    <strong>
                      {getCourseVisibility(
                        selectedCourse
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <FontAwesomeIcon
                    icon={
                      isPaidCourse(
                        selectedCourse
                      )
                        ? faIndianRupeeSign
                        : faCircleCheck
                    }
                  />

                  <div>
                    <small>
                      Price
                    </small>

                    <strong>
                      {isPaidCourse(
                        selectedCourse
                      )
                        ? formatPrice(
                          selectedCourse
                        )
                        : "Free"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* DESCRIPTION */}

              <div className="student-course-modal-description">
                <div className="modal-section-heading">
                  <FontAwesomeIcon
                    icon={faBookOpen}
                  />

                  <h5>
                    About This Course
                  </h5>
                </div>

                <div
                  className="student-course-description-full"
                  dangerouslySetInnerHTML={{
                    __html:
                      DOMPurify.sanitize(
                        selectedCourse?.description ||
                        "<p>No course description available.</p>"
                      ),
                  }}
                />
              </div>

              {/* MODAL ACTIONS */}

              <div className="student-course-modal-actions">
                <Button
                  type="button"
                  className={`modal-interest-btn ${isInterested(
                    selectedCourse._id
                  )
                      ? "active"
                      : ""
                    }`}
                  onClick={() =>
                    toggleInterested(
                      selectedCourse._id
                    )
                  }
                >
                  <FontAwesomeIcon
                    icon={faHeart}
                  />

                  <span>
                    {isInterested(
                      selectedCourse._id
                    )
                      ? "Interested"
                      : "Add to Interested"}
                  </span>
                </Button>

                {renderPaymentButton(
                  selectedCourse,
                  "modal"
                )}
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default CourseList;