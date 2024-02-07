// module.exports = app;/*eslint-disable no-undef */
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const csrf = require("tiny-csrf");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ConnectionSyncLogin = require("connect-ensure-login");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;
const { Users, Courses, Chapters, Pages, Enrollments } = require("./models");



// app.set and app.use

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("baby shark doo doo baby shark!:-O"));
app.use(bodyParser.json());
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());

// Configure session middleware

app.use(
  session({
    secret: "super-secret-key-345636636633878999023",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// passport initialize and app.use

app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});

// LocalStrategy setup 

passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await Users.findOne({ where: { email: email } });
        if (!user) {
          return done(null, false, { message: "User-not-found" });
        }
        const result = await bcrypt.compare(password, user.password);

        if (!result) {
          return done(null, false, { message: "Invalid password" });
        }

        if (user.role === "teacher") {
          return done(null, user, { role: "teacher" });
        } else if (user.role === "student") {
          return done(null, user, { role: "student" });
        } else {
          return done(null, false, { message: "Role Unknown" });
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialization and Deserialization

passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser((id, done) => {
  Users.findByPk(id)
    .then((user) => {
      if (user) {
        done(null, user);
      } else {
        done(new Error("User not found"), null);
      }
    })
    .catch((error) => {
      done(error, null);
    });
});

// common setup routes

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.role == "teacher") {
      return res.redirect("/eduator-center");
    } else {
      return res.redirect("/student-center");
    }
  }
  res.render("index", {
    title: "LMS app",
    csrfToken: req.csrfToken(),
  });
});


// signup route
app.get("/signup", async (req, res) => {
  res.render("signup", {
    title: "Signup",
    csrfToken: req.csrfToken(),
  });
});

// login route
app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    csrfToken: req.csrfToken(),
  });
});

// /users route

app.post("/users", async (req, res) => {

  if (!req.body.role) {
    req.flash("error", "Role can't be empty!");
    return res.redirect("/signup");
  }
  if (req.body.email.length == 0) {
    req.flash("error", "Email can not be empty!");
    return res.redirect("/signup");
  }

  if (req.body.firstName.length == 0) {
    req.flash("error", "First name cannot be empty!");
    return res.redirect("/signup");
  }

  if (req.body.lastName.length == 0) {
    req.flash("error", "Last name cannot be empty!");
    return res.redirect("/signup");
  }

  if (req.body.password.length < 8) {
    req.flash("error", "Password must be at least 8 characters");
    return res.redirect("/signup");
  }

  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);

  // create a user 
  try {
    const User = await Users.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPwd,
      role: req.body.role,
    });
    req.login(User, (err) => {
      if (err) {
        console.log(err);
      }

      // Redirect user as per their role selected

      if (User.role === "teacher") {
        res.redirect("/educator-center");
      } else if (User.role === "student") {
        res.redirect("/student-center");
      } else {
        res.redirect("/signup");
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.post(
  "/logging",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    // if authentication was successful
    if (req.user.role === "student") {
      res.redirect("/student-center");
    } else if (req.user.role === "teacher") {
      res.redirect("/educator-center");
    } else {
      // if auth failed
      res.redirect("/login");
    }
  }
);


//forget password code
app.get("/resetpassword", (req, reponse) => {
  reponse.render("resetPassword", {
    title: "Reset Password",
    csrfToken: req.csrfToken(),
  });
});

// updating the password / reseting the password 
app.post("/resetpassword", async (req, res) => {
  const userEmail = req.body.email;
  const newPassword = req.body.password;

  try {
    const user = await Users.findOne({ where: { email: userEmail } });

    if (!user) {
      req.flash("error", "User with that email does not exist.");
      return res.redirect("/resetpassword");
    }

    // Hash password
    const hashedPwd = await bcrypt.hash(newPassword, saltRounds);

    // Updating the user's password in database
    await user.update({ password: hashedPwd });

    return res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("error", "Error while updating the password.");
    return res.redirect("/resetpassword");
  }
});

// educator center contains & info
app.get(
  ["/educator-center"],
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {

    const currentUser = req.user;
    try {
      // Fetch the existing courses 
      const existingCourses = await Courses.findAll();
      const existingUsers = await Users.findAll();
      const existingEnrollments = await Enrollments.findAll();

      const userCourses = await currentUser.getCourses();

      const coursesWithEnrollment = [];

      for (const course of userCourses) {
        const enrollmentCount = await Enrollments.count({
          where: { courseId: course.id },
        });

        coursesWithEnrollment.push({
          id: course.id,
          courseName: course.courseName,
          enrollmentCount: enrollmentCount,
        });
      }

      res.render("educator-center", {
        title: `${currentUser.firstName} Educator Center `,
        courses: existingCourses,
        users: existingUsers,
        enrols: existingEnrollments,
        currentUser,
        csrfToken: req.csrfToken(),

      });
    } catch (error) {
      console.error(error);
      return res.status(422).json(error);
    }
  }
);

// creating course 

app.get("/createcourse",ConnectionSyncLogin.ensureLoggedIn(),async (req, res) => {
    const currentUser = await Users.findByPk(req.user.id);
    res.render("createCourse", {
      title: "Create New Course",
      currentUser,
      csrfToken: req.csrfToken(),
    });
  },
);


app.post("/createcourse", ConnectionSyncLogin.ensureLoggedIn(), async (req, res) => {
  if (req.body.courseName.length == 0) {
    req.flash("error", "Course name cannot be empty!");
    return res.redirect("/educator-center");
  }
  if (req.body.courseContent.length == 0) {
    req.flash("error", "Content field cannot be empty!");
    return res.redirect("/educator-center");
  }
  try {
    await Courses.create({
      courseName: req.body.courseName,
      courseContent: req.body.courseContent,
      userId: req.user.id,
    });
    // after successful course created redirect to the educator console
    res.redirect("/educator-center");
  } catch (error) {
    console.log(error);
    return res.status(422).json(error);
  }
});



// Update your route handler to use retrieveCourses method

app.get("/teacherMyCourses", ConnectionSyncLogin.ensureLoggedIn(), async (req, res) => {

  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    const currentUser = req.user;
    if (!currentUser) {

      return res.status(404).json({ message: "Unable to found User." });
    }
    
    const userCourses = await currentUser.getCourses();

    res.render("teacherMyCourses", {
      title: "My Courses",
      courses: userCourses,currentUser,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


// view report
app.get(
  "/view-report",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    if (!req.isAuthenticated()) {
      //check user is authorized
      return res.redirect("/login");
    }

    try {
      const currentUser = req.user; // get the current logged user

      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const userCourses = await currentUser.getCourses(); // get courses belongst to  the user

      const coursesWithEnrollment = []; // array which helps to store the courses

      // trying to find the enrolled courses
      for (const course of userCourses) {
        const enrollmentCount = await Enrollments.count({
          where: { courseId: course.id },
          distinct: true,
          col: "userId",
        });

        coursesWithEnrollment.push({
          id: course.id,
          courseName: course.courseName,
          enrollmentCount: enrollmentCount,
        });
      }

      // finding the popularity 
      const sortedCourses = coursesWithEnrollment.sort(
        (a, b) => b.enrollmentCount - a.enrollmentCount,
      );

      const allCourses = await Courses.findAll();

      // Loop for enrollment count
      const allCoursesWithEnrollment = [];
      for (const course of allCourses) {
        const enrollmentCount = await Enrollments.count({
          where: { courseId: course.id },
          distinct: true,
          col: "userId",
        });

        const userId = course.userId;
        const userOfCourse = await Users.findByPk(userId);

        allCoursesWithEnrollment.push({
          id: course.id,
          userFName: userOfCourse.firstName,
          userLName: userOfCourse.lastName,
          courseName: course.courseName,
          enrollmentCount: enrollmentCount,
        });
      }

      // Sort all courses based on enrollment count
      const sortedAllCourses = allCoursesWithEnrollment.sort(
        (a, b) => b.enrollmentCount - a.enrollmentCount,
      );

      res.render("viewReport", {
        title: `${currentUser.firstName}'s Courses Report`,
        courses: sortedCourses,
        allCourses: sortedAllCourses,
        currentUser,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

app.get("/view-course/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Courses.findByPk(courseId);
    const userofCourse = await Users.findByPk(course.userId);
    const currentUserId = req.query.currentUserId;
    const currentUser = await Users.findByPk(decodeURIComponent(currentUserId));
    const existingEnrollments = await Enrollments.findAll();
    const chapters = await Chapters.findAll({ where: { courseId } });

    if (!course) {
      // error handle where the course is not found
      return res.status(404).json({ message: "Course unable to  found" });
    }
    res.render("courseinfo", {
      title: "Course Details",
      course,
      chapters,
      userofCourse,
      enrols: existingEnrollments,
      currentUser,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Build A New Chapters

app.get(
  "/view-course/:id/buildChapter", // Endpoint for viewing and building a new chapter for a course
  ConnectionSyncLogin.ensureLoggedIn(), // Middleware to ensure user is logged in
  async (req, res) => {
    // Extracting course ID from request parameters
    const courseId = req.params.id;
    
    // Finding the course by its ID
    const course = await Courses.findByPk(courseId);
    
    // Extracting the ID of the user who created the course
    const userOfCourseId = course.userId;
    
    // Finding the user who created the course
    const userOfCourse = await Users.findByPk(userOfCourseId);
    
    // Extracting the current user's ID from the query string
    const currentUserId = req.query.currentUserId;
    
    // Finding the current user by their ID
    const currentUser = await Users.findByPk(decodeURIComponent(currentUserId));

    // Rendering the buildChapter page with necessary data
    res.render("buildChapter", {
      title: "Create A New Chapter", 
      courseId, 
      course, 
      userOfCourse, 
      currentUser, 
      csrfToken: req.csrfToken(),
    });
  },
);

// Route to handle creating a new chapter for a course
app.post(
  "/view-course/:id/createchapter", 
  ConnectionSyncLogin.ensureLoggedIn(), // Middleware to ensure user is logged in
  async (req, res) => {
    // Extracting course ID from request body
    const courseId = req.body.courseId;
    
    // Checking if chapter name is empty
    if (req.body.chapterName.length == 0) {
      req.flash("error", "Chapter name cannot be empty!"); 
      return res.redirect( // Redirecting back to the course view page
        `/view-course/${req.body.courseId}?currentUserId=${req.query.currentUserId}`,
      );
    }
    
    // Checking if chapter content is empty
    if (req.body.chapterContent.length == 0) {
      req.flash("error", "Content can't be empty!"); 
      return res.redirect( 
        `/view-course/${req.body.courseId}?currentUserId=${req.query.currentUserId}`,
      );
    }
    
    try {
      // Creating a new chapter in the database
      await Chapters.create({
        chapterName: req.body.chapterName, 
        chapterContent: req.body.chapterContent, 
        courseId,
      });
      
      // Redirecting back to the course view page after successfully creating the chapter
      res.redirect(
        `/view-course/${req.body.courseId}?currentUserId=${req.query.currentUserId}`,
      );
    } catch (error) {
      console.log(error); 
      return res.status(422).json(error); 
    }
  },
);



// Create A New Page

app.get(
  "/view-chapter/:id/createpage",ConnectionSyncLogin.ensureLoggedIn(),async (req, res) => {
    const chapterId = req.params.id;
    const chapter = await Chapters.findByPk(chapterId);
    const courseId = chapter.courseId;
    const course = await Courses.findByPk(courseId);
    const userOfCourseId = course.userId;
    const userOfCourse = await Users.findByPk(userOfCourseId);
    const currentUserId = req.query.currentUserId;
    const currentUser = await Users.findByPk(decodeURIComponent(currentUserId));
    const pages = await Pages.findAll({ where: { chapterId } });
    const existingEnrollments = await Enrollments.findAll();



    res.render("createPage", {
      title: "Create New Page",
      chapterId,chapter,pages,course,
      userOfCourse,currentUser,
      enrols:existingEnrollments,
      csrfToken: req.csrfToken(),
    });
  },
);

//create page
app.post(
  "/view-chapter/:id/createpage",ConnectionSyncLogin.ensureLoggedIn(),async (req, res) => {
    if (req.body.pageName.length == 0) {
      req.flash("error", "Page name cannot be empty!");
      return res.redirect(
        `/view-chapter/${req.body.chapterId}/createpage?currentUserId=${req.query.currentUserId}`,
      );
    }

    if (req.body.pageContent.length == 0) {
      req.flash("error", "Page content cannot be empty!");
      return res.redirect(
        `/view-chapter/${req.body.chapterId}/createpage?currentUserId=${req.query.currentUserId}`,
      );
    }

    try {
      await Pages.create({
        title: req.body.pageName,
        content: req.body.pageContent,
        chapterId: req.body.chapterId,
      });

      res.redirect(
        `/view-chapter/${req.body.chapterId}/createpage?currentUserId=${req.query.currentUserId}`,
      );
    } catch (error) {
      console.log(error);
      return res.status(422).json(error);
    }
  },
);

// Route to handle viewing pages within a chapter for enrolled students
app.get(
  "/view-chapter/:id/viewpage",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const chapterId = req.params.id;
    const chapter = await Chapters.findByPk(chapterId);// Finding the chapter details using the chapter ID
    const courseId = chapter.courseId;
    const course = await Courses.findByPk(courseId);
    const userOfCourseId = course.userId;
    const userOfCourse = await Users.findByPk(userOfCourseId);// Finding the user details of the course creator using the user ID
    const existingEnrollments = await Enrollments.findAll();

    const currentUserId = req.query.currentUserId;
    const currentUser = await Users.findByPk(decodeURIComponent(currentUserId));
    const currentPageIndex = req.query.currentPageIndex || 0; // Get currentPageIndex from the query parameter or set it to 0 by default

    const pages = await Pages.findAll({ where: { chapterId } }); // Finding all pages associated with the current chapter
    // Rendering the enrolled student view page with necessary data
    res.render("enrolledStudentViewPage", {
      title: "Pages",
      chapterId,
      chapter,
      pages,
      course,
      userOfCourse,
      enrols: existingEnrollments,
      currentUser,
      currentPageIndex,
      csrfToken: req.csrfToken(),
    });
  },
);


// Student Center

app.get("/student-center",ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.user;
    try {
      const existingCourses = await Courses.findAll();
      const existingUsers = await Users.findAll();
      const existingEnrollments = await Enrollments.findAll();
      res.render("student-center", {
        title: `Student ${currentUser.firstName} Center`,
        courses: existingCourses,
        users: existingUsers,
        currentUser,
        enrols: existingEnrollments,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(422).json(error);
    }
  },
);



// enroll in a course

app.post(
  "/enrol-course/:courseId",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.courseId;
    const currentUserId = req.query.currentUserId;
    const existingEnrollment = await Enrollments.findOne({
      where: { userId: currentUserId, courseId },
    });

    if (existingEnrollment) { return res
        .status(400)
        .json({ message: "Already enrolled." });
    }

    await Enrollments.create({
      userId: currentUserId,courseId,
      
    });
    res.redirect("/student-center");
  },
);

// show all enrolled courses

app.get(
  "/student-dashboard",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.user;

    try {
      // Fetch the existing courses, users, enrollments from the database
      const existingCourses = await Courses.findAll();
      const existingUsers = await Users.findAll();
      const existingEnrollments = await Enrollments.findAll();

      // Render the teacher-dashboard page and pass the courses to it
      res.render("student-dashboard", {
        title: `Student ${currentUser.firstName} Dashboard`,
        courses: existingCourses,
        users: existingUsers,
        enrols: existingEnrollments,
        currentUser,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(422).json(error);
    }
  },
);

// Route to handle enrolling in a course
app.post(
  "/enrol-course/:courseId",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    // Extracting courseId from URL paramete
    const courseId = req.params.courseId;

    // Extracting currentUserId from query parameter
    const currentUserId = req.query.currentUserId;
    // Checking if the user is already enrolled in the course
    const existingEnrollment = await Enrollments.findOne({
      where: { userId: currentUserId, courseId },
    });

    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "You are already enrolled in this course." });
    }
    // Creating a new enrollment record for the user and course
    await Enrollments.create({
      userId: currentUserId,
      courseId,
    });

    res.redirect("/student-dashboard");
  },
);

//Route to display enrolled courses by the student
app.get(
  "/studentMyCourses",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.user;

    try {
      const enrolledCourses = await Enrollments.findAll({
        where: { userId: currentUser.id },
      });

      const coursesWithPageInfo = [];  // Array to store courses with page information
      // Looping through each enrolled course
      for (const enrollment of enrolledCourses) {
        // Finding the course details along with chapters and pages
        const course = await Courses.findByPk(enrollment.courseId, {
          include: [
            {
              model: Chapters,
              include: [Pages],
            },
          ],
        });
        // If the course exists
        if (course) {
           // Checking if the course is already added to coursesWithPageInfo
          const existingCourse = coursesWithPageInfo.find(
            (c) => c.courseId === course.id,
          );
          // If the course is not already added
          if (!existingCourse) {
            // Calculating total pages in the course
            const totalPages = course.Chapters.reduce(
              (total, chapter) => total + chapter.Pages.length,
              0,
            );
            // Counting the number of completed pages by the user
            const donePagesCount = await Enrollments.count({
              where: {
                courseId: course.id,
                userId: currentUser.id,
                completed: true,
              },
            });
            // Pushing course details with page information to coursesWithPageInfo array
            coursesWithPageInfo.push({
              userId: course.userId,
              courseId: course.id,
              courseName: course.courseName,
              donePagesCount: donePagesCount,
              totalPages: totalPages,
            });
          }
        }
      }
      // Logging coursesWithPageInfo to console for debugging
      console.log(coursesWithPageInfo);

      const existingUsers = await Users.findAll();

      res.render("studentMyCourses", {
        title: `${currentUser.firstName}'s Enrolled Courses`,
        courses: coursesWithPageInfo,
        users: existingUsers,
        currentUser,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(422).json(error);
    }
  },
);


//mark page as complete
app.post("/mark-as-complete", async (request, response) => {
  try {
    const userId = request.body.userId;
    const courseId = request.body.courseId;
    const chapterId = request.body.chapterId;
    var pageId = parseInt(request.body.pageId) + 1;

    console.log(userId);
    console.log(courseId);
    console.log(chapterId);
    console.log(pageId);
    // Creating a new enrollment record for the completed page
    await Enrollments.create({
      userId,
      courseId,
      chapterId,
      pageId,
      completed: true, // Marking the page as completed
    });

    // Redirecting the user to the next page or the current page if it's the first page
    if (pageId === 1) {
      response.redirect(
        `/view-chapter/${chapterId}/viewpage?currentUserId=${userId}`,
      );
    } else {
      // Redirecting to the view page of the chapter with the updated enrollment and currentPageIndex
      response.redirect(
        `/view-chapter/${chapterId}/viewpage?currentUserId=${userId}&currentPageIndex=${
          pageId - 1
        }`,
      );
    }
  } catch (error) {
    // Handling errors
    console.error("Error marking page as complete", error);
    response
      .status(500)
      .send("An error occurred while marking the page as complete");
  }
});

// Delete A Course



app.delete(
  "/courses/:id",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const courseId = req.params.id;

    console.log("We have to delete a course with ID: ", courseId);

    try {

      const chapters = await Chapters.findAll({ where: { courseId } });

      // Delete all pages matching with the chapters
      for (const chapter of chapters) {
        await Pages.destroy({ where: { chapterId: chapter.id } });
      }

      // Deleting all chapters matching with the course
      await Chapters.destroy({ where: { courseId } });

      // Delete the course with coursesId matches
      const status = await Courses.remove(courseId);

      return res.json(status ? true : false);
    } catch (err) {
      console.error(err);
      return res.status(422).json(err);
    }
  },
);

//change password routes
app.get("/changePassword", (req, reponse) => {
  const currentUser = req.user;

  reponse.render("changePassword", {
    title: "Change Password",
    currentUser,
    csrfToken: req.csrfToken(),
  });
});

// Route to handle the password change request
app.post("/changePassword", async (req, res) => {
  // Extracting email and new password from the request body
  const userEmail = req.body.email;
  const newPassword = req.body.password;

  try {
    // Finding the user by email
    const user = await Users.findOne({ where: { email: userEmail } });
     // Checking if the user exists
    if (!user) {
      req.flash("error", "User with that email does not exist.");
      return res.redirect("/resetpassword");
    }

  // Hashing the new password
    const hashedPwd = await bcrypt.hash(newPassword, saltRounds);

    // Updating the user's password with the hashed one
    await user.update({ password: hashedPwd });

    return res.redirect("/login");
  } catch (error) {
    console.log(error);
    req.flash("error", "Error updating the password.");
    return res.redirect("/changePassword");
  }
});

//signout

app.get("/signout", (req, res, next) => {
  
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = app;
