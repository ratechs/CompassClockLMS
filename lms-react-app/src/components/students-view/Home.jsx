import React, { useEffect, useRef, useState } from "react";

import {
  FaRegLightbulb,
  FaRegCompass,
  FaRegHandshake,
  FaChartLine,
  FaShieldAlt,
  FaUsers,
  FaChevronRight,
  FaCheck,
  FaLaptopCode,
  FaBookOpen,
  FaChalkboardTeacher,
  FaUserGraduate,
  FaSearch,
  FaBalanceScale,
  FaComments,
  FaTasks,
  FaMobileAlt,
  FaPlayCircle,
} from "react-icons/fa";


/**
 * Course LMS Consultancy
 *
 * A platform guidance website for:
 *
 * - Students
 * - Teachers
 * - Trainers
 * - Educational institutions
 *
 * Purpose:
 * Help users understand, compare and choose
 * suitable learning and teaching platforms.
 */


// ============================================================
// PLATFORM GUIDANCE
// ============================================================

const PLATFORM_GUIDANCE = [
  {
    code: "01",
    icon: <FaUserGraduate />,
    label: "For Students",
    copy:
      "Discover learning platforms that make it easier to access courses, study materials, assignments, assessments and track your learning progress.",
  },
  {
    code: "02",
    icon: <FaChalkboardTeacher />,
    label: "For Teachers",
    copy:
      "Find teaching platforms that help you create courses, share resources, manage students, conduct assessments and communicate effectively.",
  },
  {
    code: "03",
    icon: <FaBookOpen />,
    label: "Courses & Content",
    copy:
      "Explore platforms for online courses, recorded lessons, documents, quizzes, assignments and structured learning paths.",
  },
  {
    code: "04",
    icon: <FaTasks />,
    label: "Teaching & Classroom",
    copy:
      "Understand platforms that support classroom management, assignments, discussions, assessments and student interaction.",
  },
  {
    code: "05",
    icon: <FaBalanceScale />,
    label: "Compare & Choose",
    copy:
      "Compare platform capabilities, usability and important features so you can choose a solution that fits your learning or teaching requirements.",
  },
];


// ============================================================
// HOW IT WORKS
// ============================================================

const STEPS = [
  {
    n: "01",
    icon: <FaSearch />,
    title: "Understand",
    body:
      "Tell us whether you are a student, teacher, trainer or institution and what you expect from a learning platform.",
  },
  {
    n: "02",
    icon: <FaBalanceScale />,
    title: "Explore",
    body:
      "Understand different platform options and compare the features that matter for your learning or teaching experience.",
  },
  {
    n: "03",
    icon: <FaCheck />,
    title: "Choose",
    body:
      "Make a confident decision based on your courses, users, teaching methods, learning goals and practical requirements.",
  },
];


// ============================================================
// STATS
// ============================================================

const STATS = [
  {
    value: 100,
    suffix: "%",
    label: "Learning-focused guidance",
  },
  {
    value: 2,
    suffix: "",
    label: "Student & Teacher perspectives",
  },
  {
    value: 24,
    suffix: "/7",
    label: "Digital learning possibilities",
  },
  {
    value: 1,
    suffix: "",
    label: "Goal — Better learning & teaching",
  },
];


// ============================================================
// WHY CHOOSE US
// ============================================================

const WHY_LMS = [
  {
    icon: <FaUserGraduate />,
    title: "Student-focused guidance",
    body:
      "Understand what makes a platform useful for students, from course access and resources to assignments, assessments and progress tracking.",
  },
  {
    icon: <FaChalkboardTeacher />,
    title: "Teacher-focused solutions",
    body:
      "Identify platforms that help teachers create, organize and deliver courses while managing students and assessments.",
  },
  {
    icon: <FaBalanceScale />,
    title: "Compare before choosing",
    body:
      "Understand the differences between learning platforms instead of choosing only because a platform is popular.",
  },
  {
    icon: <FaRegLightbulb />,
    title: "Simple & practical",
    body:
      "We explain learning technology in a simple way so you can make decisions without getting overwhelmed by technical terminology.",
  },
  {
    icon: <FaChartLine />,
    title: "Better learning experience",
    body:
      "The right platform can make courses easier to access, learning more organized and communication between students and teachers more effective.",
  },
  {
    icon: <FaRegCompass />,
    title: "Built around your needs",
    body:
      "Whether you are an individual student, teacher, trainer or educational institution, the platform should fit your specific requirements.",
  },
];


// ============================================================
// COUNT UP HOOK
// ============================================================

function useCountUp(target, duration = 1400) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return undefined;
    }

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      return undefined;
    }

    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            started = true;

            const start = performance.now();

            const step = (now) => {
              const progress = Math.min(
                (now - start) / duration,
                1
              );

              const eased =
                1 - Math.pow(1 - progress, 3);

              setValue(Math.floor(eased * target));

              if (progress < 1) {
                requestAnimationFrame(step);
              }
            };

            requestAnimationFrame(step);
          }
        });
      },
      {
        threshold: 0.4,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value];
}


// ============================================================
// STAT BLOCK
// ============================================================

const StatBlock = ({
  value,
  suffix,
  label,
}) => {
  const [ref, count] = useCountUp(value);

  return (
    <div
      className="stat-block"
      ref={ref}
    >
      <span className="stat-block__value">
        {count.toLocaleString()}
        {suffix}
      </span>

      <span className="stat-block__label">
        {label}
      </span>
    </div>
  );
};


// ============================================================
// HOME PAGE
// ============================================================

const HomePage = () => {
  return (
    <div className="hsags">


      {/* =====================================================
          HERO
      ===================================================== */}

      <header className="hero">

        <div
          className="hero__field"
          aria-hidden="true"
        />

        <div className="hero__inner">

          <div className="hero__brandrow">

            <span className="brandmark brandmark--company">
              Course LMS
            </span>

            <span className="brandmark__divider">
              /
            </span>

            <span className="brandmark brandmark--app">
              Consultancy
            </span>

          </div>


          <p className="hero__eyebrow text-light">
            LEARN
            <span className="hero__dot">·</span>
            TEACH
            <span className="hero__dot">·</span>
            GROW
          </p>


          <h1 className="hero__headline text-white">

            Choose the right platform
            <br />

            for a better learning experience.

          </h1>


          <p className="hero__sub text-light">

            Course LMS Consultancy helps students,
            teachers, trainers and educational organizations
            understand, compare and choose learning platforms
            that match the way they learn and teach.

          </p>


          <div className="hero__cta">

            <button
              className="btn btn--primary"
              onClick={() =>
                document
                  .getElementById("platforms")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >

              Find Your Platform

              <FaChevronRight />

            </button>


            <button
              className="btn btn--ghost"
              onClick={() =>
                document
                  .getElementById("services")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >

              Explore Platforms

            </button>

          </div>


          <p className="hero__footnote">

            One platform.
            Better learning.
            Better teaching.

          </p>

        </div>


        

      </header>



      {/* =====================================================
          ABOUT
      ===================================================== */}

      <section
        className="about"
        id="about"
      >

        <div className="about__grid">


          <div className="about__col">

            <span className="eyebrow">
              About Course LMS Consultancy
            </span>


            <h2>

              Technology that makes
              <br />
              learning easier.

            </h2>


            <p>

              Choosing a learning platform can be
              confusing. Students need simple access
              to courses and resources, while teachers
              need effective tools to create content,
              manage learners and conduct assessments.

            </p>


            <p>

              Course LMS Consultancy helps you understand
              different learning platforms and choose
              an approach that fits your real learning
              or teaching requirements.

            </p>


            <div className="about__mv">


              <div>

                <h4>
                  For Students
                </h4>

                <p>

                  Find platforms that make studying,
                  accessing courses and tracking progress
                  simple and organized.

                </p>

              </div>


              <div>

                <h4>
                  For Teachers
                </h4>

                <p>

                  Find platforms that simplify course
                  creation, student management,
                  assessments and communication.

                </p>

              </div>


            </div>


            <ul className="about__values">

              {[
                "Student First",
                "Teacher Focused",
                "Simple Technology",
                "Practical Guidance",
              ].map((value) => (

                <li key={value}>

                  <FaCheck />

                  {value}

                </li>

              ))}

            </ul>

          </div>



          <div className="about__col about__col--app">

            <span className="eyebrow eyebrow--accent">
              Our Purpose
            </span>


            <h3>

              Your learning platform
              <br />
              should fit you.

            </h3>


            <p>

              Every student learns differently
              and every teacher has a different
              way of teaching.

            </p>


            <p>

              Instead of adapting your learning
              or teaching process to a platform,
              understand the available options
              and choose technology that works
              for you.

            </p>


            <div className="about-platform-icons">

              <div>
                <FaUserGraduate />
                <span>Students</span>
              </div>

              <div>
                <FaChalkboardTeacher />
                <span>Teachers</span>
              </div>

              <div>
                <FaLaptopCode />
                <span>Platforms</span>
              </div>

            </div>

          </div>

        </div>

      </section>



      {/* =====================================================
          PLATFORM SERVICES
      ===================================================== */}

      <section
        className="features"
        id="services"
      >

        <div
          className="features__head"
          id="platforms"
        >

          <span className="eyebrow eyebrow--accent">
            Platform Guidance
          </span>


          <h2>

            Find the right platform
            <br />
            for your needs.

          </h2>


          <p>

            Explore learning and teaching platforms
            based on how you learn, teach, manage
            courses and interact with learners.

          </p>

        </div>



        <div className="features__spine">

          {PLATFORM_GUIDANCE.map(
            (service) => (

              <article
                className="feature-card"
                key={service.code}
              >

                <div className="feature-card__code">
                  {service.code}
                </div>


                <div className="feature-card__icon">
                  {service.icon}
                </div>


                <h3>
                  {service.label}
                </h3>


                <p>
                  {service.copy}
                </p>
              </article>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        className="how"
        id="how-it-works"
      >

        <div className="how__head">

          <span className="eyebrow">
            How It Works
          </span>


          <h2>

            From your requirement
            <br />
            to the right platform.

          </h2>

        </div>



        <div className="how__steps">

          {STEPS.map(
            (step, index) => (

              <React.Fragment key={step.n}>

                <div className="how-step">

                  <span className="how-step__n">
                    {step.n}
                  </span>


                  <div className="how-step__icon">
                    {step.icon}
                  </div>


                  <h3>
                    {step.title}
                  </h3>


                  <p>
                    {step.body}
                  </p>

                </div>


                {index <
                  STEPS.length - 1 && (

                  <div
                    className="how__connector"
                    aria-hidden="true"
                  />

                )}

              </React.Fragment>

            )
          )}

        </div>

      </section>



      {/* =====================================================
          STATS
      ===================================================== */}

      <section className="stats">

        <div className="stats__grid">

          {STATS.map((stat) => (

            <StatBlock
              key={stat.label}
              {...stat}
            />

          ))}

        </div>

      </section>



      {/* =====================================================
          WHY CHOOSE US
      ===================================================== */}

      <section
        className="why"
        id="why-choose-us"
      >

        <div className="why__head">

          <span className="eyebrow">
            Why Course LMS Consultancy
          </span>


          <h2>

            Technology should support people,
            <br />
            not complicate education.

          </h2>

        </div>



        <div className="why__grid">

          {WHY_LMS.map((item) => (

            <div
              className="why-card"
              key={item.title}
            >

              <div className="why-card__icon">
                {item.icon}
              </div>


              <h4>
                {item.title}
              </h4>


              <p>
                {item.body}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* =====================================================
          FINAL CTA
      ===================================================== */}

      <section
        className="final-cta"
        id="contact"
      >

        <div className="final-cta__inner">

          <span className="eyebrow">
            Start Your Journey
          </span>


          <h2>

            Looking for the right
            <br />
            learning or teaching platform?

          </h2>


          <p>

            Tell us what you need from your
            learning platform. We will help you
            understand your options and identify
            an approach that fits the way you
            learn or teach.

          </p>


          <div className="final-cta__buttons">

            <button className="btn btn--primary">

              Find My Platform

              <FaChevronRight />

            </button>


            <button className="btn btn--outline">

              Talk to Us

            </button>

          </div>

        </div>

      </section>
    </div>
  );
};


export default HomePage;
