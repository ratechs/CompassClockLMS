import React, { useEffect, useMemo } from "react";
import { useStudentContext } from "../../../contexts/Student-context";
import { courseListService } from "../../../service/baseService";
import defaultIMG from "../../../assets/images/default_images/images.jpg";

import {
    Card,
    CardBody,
    CardTitle,
    CardText,
    Col,
    Row,
    Container,
    Spinner,
    Button,
    Badge,
} from "reactstrap";

import ReactStarRatings from "react-star-ratings";

import {
    faClock,
    faUsers,
    faArrowRight,
    faBookOpen,
    faStar,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuthcontext } from "../../../contexts/Authcontext";
const CourseList = () => {

    const {
        studentCoursesList,
        setStudentCoursesList
    } = useStudentContext();

    const {authUser} = useAuthcontext();


    // =========================================================
    // CALCULATE RATING
    // =========================================================

    const calculateRating = (courseRating) => {

        if (
            !Array.isArray(courseRating) ||
            courseRating.length === 0
        ) {
            return 0;
        }

        const totalRating = courseRating.reduce(
            (sum, item) => sum + Number(item?.rating || 0),
            0
        );

        return totalRating / courseRating.length;
    };


    // =========================================================
    // FORMAT RATING
    // =========================================================

    const formatRating = (rating) => {
        return Number(rating || 0).toFixed(1);
    };


    // =========================================================
    // CONVERT DURATION
    // =========================================================

    const convertTime = (time) => {

        const hours = Number(time);

        if (!hours || hours <= 0) {
            return "Self paced";
        }

        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);

        if (days >= 7) {

            const weeks = Math.floor(days / 7);
            const remainingDays = days % 7;

            if (remainingDays === 0) {
                return `${weeks} ${
                    weeks === 1 ? "week" : "weeks"
                }`;
            }

            return `${weeks} ${
                weeks === 1 ? "week" : "weeks"
            } ${remainingDays} ${
                remainingDays === 1 ? "day" : "days"
            }`;
        }

        if (days === 0) {
            return `${remainingHours} ${
                remainingHours === 1 ? "hour" : "hours"
            }`;
        }

        if (remainingHours === 0) {
            return `${days} ${
                days === 1 ? "day" : "days"
            }`;
        }

        return `${days} ${
            days === 1 ? "day" : "days"
        } ${remainingHours} ${
            remainingHours === 1 ? "hour" : "hours"
        }`;
    };


    // =========================================================
    // FETCH COURSES
    // =========================================================

    const fetchCourseList = async () => {

        try {

            const res = await courseListService();

            const courses = Array.isArray(res?.data)
                ? res.data
                : [];

            const sortedCourses = [...courses].sort(
                (a, b) =>
                    calculateRating(b?.ratings) -
                    calculateRating(a?.ratings)
            );

            setStudentCoursesList(sortedCourses);

        } catch (error) {

            console.error(
                "Error fetching courses:",
                error
            );

            setStudentCoursesList([]);

        }
    };


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {

        fetchCourseList();

        return () => {
            setStudentCoursesList([]);
        };

    }, []);


    // =========================================================
    // TOTAL COURSES
    // =========================================================

    const totalCourses = useMemo(() => {

        return Array.isArray(studentCoursesList)
            ? studentCoursesList.length
            : 0;

    }, [studentCoursesList]);


    // =========================================================
    // LOADING
    // =========================================================

    if (studentCoursesList === null) {

        return (
            <Container className="course-list-container">

                <div className="course-page-header">

                    <div>
                        <h2 className="course-page-title">
                            Explore Courses
                        </h2>

                        <p className="course-page-subtitle">
                            Discover courses and build your skills
                        </p>
                    </div>

                </div>


                <Row>

                    {[1, 2, 3].map((item) => (

                        <Col
                            key={item}
                            xs="12"
                            sm="6"
                            lg="4"
                            className="mb-4"
                        >

                            <Card className="course-skeleton-card">

                                <div className="course-skeleton-image"></div>

                                <CardBody>

                                    <div className="skeleton-line skeleton-title"></div>

                                    <div className="skeleton-line"></div>

                                    <div className="skeleton-line skeleton-short"></div>

                                    <div className="skeleton-button"></div>

                                </CardBody>

                            </Card>

                        </Col>

                    ))}

                </Row>

            </Container>
        );
    }


    // =========================================================
    // EMPTY STATE
    // =========================================================

    if (totalCourses === 0) {

        return (
            <Container className="course-list-container">

                <div className="course-page-header">

                    <div>
                        <h2 className="course-page-title">
                            Explore Courses
                        </h2>

                        <p className="course-page-subtitle">
                            Discover courses and build your skills
                        </p>
                    </div>

                </div>


                <div className="course-empty-state">

                    <div className="course-empty-icon">

                        <FontAwesomeIcon
                            icon={faBookOpen}
                        />

                    </div>

                    <h4>
                        No courses available
                    </h4>

                    <p>
                        There are no courses available right now.
                        Please check again later.
                    </p>

                    <Button
                        color="primary"
                        onClick={fetchCourseList}
                    >
                        <FontAwesomeIcon
                            icon={faArrowRight}
                            className="me-2"
                        />

                        Refresh Courses
                    </Button>

                </div>

            </Container>
        );
    }


    // =========================================================
    // MAIN UI
    // =========================================================

    return (

        <Container fluid className="course-list-container">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="course-page-header">

                <div>

                    <div className="course-heading-row">

                        <div className="course-heading-icon">

                            <FontAwesomeIcon
                                icon={faBookOpen}
                            />

                        </div>

                        <div>

                            <h2 className="course-page-title">
                                Explore Courses
                            </h2>

                            <p className="course-page-subtitle">
                                Discover courses and build your skills
                            </p>

                        </div>

                    </div>

                </div>


                <div className="course-count">

                    <FontAwesomeIcon
                        icon={faBookOpen}
                    />

                    <span>
                        {totalCourses}{" "}
                        {totalCourses === 1
                            ? "Course"
                            : "Courses"}
                    </span>

                </div>

            </div>


            {/* =================================================
                COURSE GRID
            ================================================= */}

            <Row className="course-grid">

                {studentCoursesList.map((course) => {

                    const rating = calculateRating(
                        course?.ratings
                    );

                    const reviewCount =
                        Array.isArray(course?.ratings)
                            ? course.ratings.length
                            : 0;

                    const courseImage =
                        course?.imageUrl ||
                        defaultIMG;

                    return (

                        <Col
                            key={
                                course?._id ||
                                course?.id ||
                                course?.name
                            }
                            xs="12"
                            sm="6"
                            md="6"
                            lg="4"
                            xl="3"
                            className="course-grid-column"
                        >

                            <Card className="course-card-modern h-100">

                                {/* =================================================
                                    IMAGE
                                ================================================= */}

                                <div className="course-image-wrapper">

                                    <img
                                        src={courseImage}
                                        alt={
                                            course?.name ||
                                            "Course"
                                        }
                                        className="course-image"
                                        loading="lazy"
                                        onError={(event) => {
                                            event.currentTarget.src =
                                                defaultIMG;
                                        }}
                                    />


                                    {/* IMAGE OVERLAY */}

                                    <div className="course-image-overlay"></div>


                                    {/* STATUS */}

                                    {course?.status && (

                                        <Badge
                                            className={`course-status-badge  btn-gradient ${
                                                course.status
                                                    ?.toLowerCase()
                                                    ?.replace(
                                                        /\s+/g,
                                                        "-"
                                                    )
                                            }`}
                                        >
                                            {course.status}
                                        </Badge>

                                    )}


                                    {/* RATING */}

                                    {/* <div className="course-rating-badge">

                                        <FontAwesomeIcon
                                            icon={faStar}
                                        />

                                        <span>
                                            {formatRating(rating)}
                                        </span>

                                    </div> */}

                                </div>


                                {/* =================================================
                                    BODY
                                ================================================= */}

                                <CardBody className="course-card-body">

                                    {/* TITLE */}

                                    <CardTitle
                                        tag="h5"
                                        className="course-card-title"
                                    >
                                        {course?.name ||
                                            "Untitled Course"}
                                    </CardTitle>


                                    {/* DESCRIPTION */}

                                    <CardText className="course-card-description">

                                        {course?.description ||
                                            "Learn valuable skills with this course."}

                                    </CardText>


                                    {/* META */}

                                    <div className="course-meta">

                                        {/* Duration */}

                                        <div className="course-meta-item">

                                            <span className="course-meta-icon">

                                                <FontAwesomeIcon
                                                    icon={faClock}
                                                />

                                            </span>

                                            <div>

                                                <small>
                                                    Duration
                                                </small>

                                                <strong>
                                                    {convertTime(
                                                        course?.duration
                                                    )}
                                                </strong>

                                            </div>

                                        </div>


                                        {/* Reviews */}

                                        <div className="course-meta-item">

                                            <span className="course-meta-icon">

                                                <FontAwesomeIcon
                                                    icon={faUsers}
                                                />

                                            </span>

                                            <div>

                                                <small>
                                                    Reviews
                                                </small>

                                                <strong>
                                                    {reviewCount}
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {/* RATING */}

                                    {/* <div className="course-rating-section">

                                        <div className="course-stars">

                                            <ReactStarRatings
                                                rating={rating}
                                                starRatedColor="#f59e0b"
                                                starEmptyColor="#e5e7eb"
                                                numberOfStars={5}
                                                name="course-rating"
                                                starDimension="17px"
                                                starSpacing="1px"
                                            />

                                        </div>

                                        <span className="course-rating-number">

                                            {formatRating(
                                                rating
                                            )}

                                        </span>

                                    </div> */}


                                    {/* FOOTER */}

                                    <div className="course-card-footer">

                                        <Button
                                            color="primary"
                                            className="course-view-button"
                                            href={`/course/explore-details/${course?._id}`}
                                            disabled={!authUser?.user?.isApproved}
                                        >

                                            
                                                <span>
                                                    Explore Course
                                                </span>

                                            <FontAwesomeIcon
                                                icon={faArrowRight}
                                            />

                                        </Button>
                                         {
                                            !authUser?.user?.isApproved && (
                                                <span className ="text-danger notice-text">
                                                    You will explore Course once you get approved
                                                </span>
                                            )
                                        }

                                    </div>

                                </CardBody>

                            </Card>

                        </Col>

                    );
                })}

            </Row>

        </Container>
    );
};


export default CourseList;
