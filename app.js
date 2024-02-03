// app.js

// module.exports = app;
/*eslint-disable no-undef */
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

      // Redirect the user based on their role selected
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

//route to fetch all existing courses
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

      res.render("educator-center", {
        title: "Educator Center",
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
app.get("/my-courses", ConnectionSyncLogin.ensureLoggedIn(), async (req, res) => {

  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    const currentUser = req.user;
    if (!currentUser) {

      return res.status(404).json({ message: "User unable to  found" });
    }
    
    const userCourses = await currentUser.getCourses();

    res.render("my-courses", {
      title: "My Courses",
      courses: userCourses,currentUser,
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});



app.get(
  "/view-report",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    if (!req.isAuthenticated()) {
      // Ensure the user is authenticated
      return res.redirect("/login");
    }

    try {
      // Retrieve the currently logged-in user
      const currentUser = req.user;

      if (!currentUser) {
        // Handle cases where the user is not found
        return res.status(404).json({ message: "User not found" });
      }

      // Retrieve courses associated with the user
      const userCourses = await currentUser.getCourses();

      // Render the my-courses page and pass the user's courses to it
      res.render("viewReport", {
        title: `${currentUser.firstName}'s Courses Report`,
        courses: userCourses,currentUser,
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
    const enrols = await Enrollments.findAll();
    const chapters = await Chapters.findAll({ where: { courseId } });

    if (!course) {
      // Handle cases where the course is not found
      return res.status(404).json({ message: "Course unable to  found" });
    }
    res.render("courseinfo", {
      title: "Course Details",
      course,
      chapters,
      userofCourse,
      currentUser,
      enrols, 
      csrfToken: req.csrfToken(),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get(
  "/view-course/:id/buildChapter",ConnectionSyncLogin.ensureLoggedIn(),async (req, res) => {
    const courseId = req.params.id;
    const course = await Courses.findByPk(courseId);
    const userOfCourseId = course.userId;
    const userOfCourse = await Users.findByPk(userOfCourseId);

    const currentUserId = req.query.currentUserId;
    const currentUser = await Users.findByPk(decodeURIComponent(currentUserId));

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

app.post(
  "/view-course/:id/createchapter",ConnectionSyncLogin.ensureLoggedIn(),async (req, res) => {
    const courseId = req.body.courseId;
    if (req.body.chapterName.length == 0) {
      req.flash("error", "Chapter name cannot be empty!");
      return res.redirect(
        `/view-course/${req.body.courseId}?currentUserId=${req.query.currentUserId}`,
      );
    }
    if (req.body.chapterContent.length == 0) {
      req.flash("error", "Content can't be empty!");
      return res.redirect(
        `/view-course/${req.body.courseId}?currentUserId=${req.query.currentUserId}`,
      );
    }
    try {
      await Chapters.create({
        chapterName: req.body.chapterName,
        chapterContent: req.body.chapterContent,
        courseId,
      });
      res.redirect(
        `/view-course/${req.body.courseId}?currentUserId=${req.query.currentUserId}`,
      );
    } catch (error) {
      console.log(error);
      return res.status(422).json(error);
    }
  },
);

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
      existingEnrollments,
      csrfToken: req.csrfToken(),
    });
  },
);

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


app.get("/student-center",ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.user;
    try {
      const existingCourses = await Courses.findAll();
      const existingUsers = await Users.findAll();
      const existingEnrollments = await Enrollments.findAll();
      res.render("student-center", {
        title: "Student Center",
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

app.delete(
  "/courses/:id",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("We have to delete a course with ID: ", req.params.id);

    try {
      const status = await Courses.remove(req.params.id);
      return res.json(status ? true : false);
    } catch (err) {
      return res.status(422).json(err);
    }
  },
);

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
      noOfChapCompleted: 0,totChapInTheCourse: 0,
    });
    res.redirect("/student-center");
  },
);

// show all enrolled courses
app.get(
  "/MyCourses",
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    const currentUser = req.user;
    try {
      const enrolledCourses = await Enrollments.findAll({
        where: { userId: currentUser.id },
      });
      const courseIds = enrolledCourses.map(
        (enrollment) => enrollment.courseId,
      );
      const courses = await Courses.findAll({ where: { id: courseIds } });
      res.render("studentMyCourses", {
        title: `${currentUser.firstName}'s Enrolled Courses`,
        courses: courses,currentUser,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      console.error(error);
      return res.status(422).json(error);
    }
  },
);

app.get("/signout", (req, res, next) => {
  //signout
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = app;
