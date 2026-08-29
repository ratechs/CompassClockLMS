import React from 'react'

const StudentFooter = () => {
  const name = "LMS Platform";
  const website = "lmsplatform.com";
  return (

      <footer className="footer">

        <div className="footer__grid">

          <div className="footer__col footer__col--brand">

            <div className="brandmark brandmark--company">

              Course LMS Consultancy

            </div>


            <p className="footer__tagline text-light">

              Your guide to better learning
              and teaching platforms.

            </p>


            <div className="brandmark brandmark--app footer__app">

              LMS

            </div>


            <p className="footer__app-tagline text-light">

              Learn · Teach · Grow —
              One connected learning experience.

            </p>

          </div>



          {/* QUICK LINKS */}

          <div className="footer__col">

            <h5>
              Quick Links
            </h5>


            <ul>

              <li>
                Home
              </li>

              <li>
                About Us
              </li>

              <li>
                Student Platforms
              </li>

              <li>
                Teacher Platforms
              </li>

              <li>
                Contact
              </li>

            </ul>

          </div>



          {/* STUDENTS */}

          <div className="footer__col">

            <h5>
              For Students
            </h5>


            <ul>

              <li>
                Learning Platforms
              </li>

              <li>
                Online Courses
              </li>

              <li>
                Study Tools
              </li>

              <li>
                Learning Resources
              </li>

              <li>
                Progress Tracking
              </li>

            </ul>

          </div>



          {/* TEACHERS */}

          <div className="footer__col">

            <h5>
              For Teachers
            </h5>


            <ul>

              <li>
                Teaching Platforms
              </li>

              <li>
                Course Creation
              </li>

              <li>
                Student Management
              </li>

              <li>
                Assessments
              </li>

              <li>
                Teaching Resources
              </li>

            </ul>

          </div>



          {/* CONTACT */}

          <div className="footer__col">

            <h5>
              Contact
            </h5>


            <ul className="footer__contact">

              <li>
                support@compassclock.in
              </li>

              <li>
                +91 784 50 50 100
              </li>

              <li>

                2nd Floor, Real Enclave,
                43, Josier St,
                Tirumurthy Nagar,
                Nungambakkam,
                Chennai,
                Tamil Nadu 600034

              </li>

            </ul>

          </div>


        </div>


        <div className="footer__bottom">

          <p>

            © 2026 Course LMS Consultancy.
            All rights reserved.

          </p>

        </div>

      </footer>

  )
}

export default StudentFooter