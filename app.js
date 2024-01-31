// module.exports = app;
/*eslint-disable no-undef */
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ConnectionSyncLogin = require("connect-ensure-login");
const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const saltRounds = 10;
const { Users, Courses } = require("./models");


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
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
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
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

// index route
app.get("/", (request, response) => {
  response.render("index", {
    title: "LMS app",
  });
});

// signup route
app.get("/signup", (_request, response) => {
  response.render("signup", {
    title: "Signup",
  });
});

// login route
app.get("/login", (_request, response) => {
  response.render("login", {
    title: "Login",
  });
});

app.get("/login", (_req, res) => {
  res.send("Login page here");
});


// /users route

app.post("/users", async (request, response) => {

  if (!request.body.role) {
    request.flash("error", "Role can't be empty!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Email can not be empty!");
    return response.redirect("/signup");
  }

  if (request.body.firstName.length == 0) {
    request.flash("error", "First name cannot be empty!");
    return response.redirect("/signup");
  }

  if (request.body.lastName.length == 0) {
    request.flash("error", "Last name cannot be empty!");
    return response.redirect("/signup");
  }

  if (request.body.password.length < 8) {
    request.flash("error", "Password must be at least 8 characters");
    return response.redirect("/signup");
  }

  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);

  // create a user 
  try {
    const User = await Users.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      role: request.body.role,
    });
    request.login(User, (err) => {
      if (err) {
        console.log(err);
      }

      // Redirect the user based on their role selected
      if (User.role === "teacher") {
        response.redirect("/educator-center");
      } else if (User.role === "student") {
        response.redirect("/student-center");
      } else {
        response.redirect("/signup");
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
  (request, response) => {
    // if authentication was successful
    if (request.user.role === "student") {
      response.redirect("/student-center");
    } else if (request.user.role === "teacher") {
      response.redirect("/educator-center");
    } else {
      // if auth failed
      response.redirect("/login");
    }
  }
);

//route to fetch all existing courses
app.get(
  [ "/educator-center"],
  ConnectionSyncLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      // Fetch the existing courses 
      const existingCourses = await Courses.findAll();
      console.log(existingCourses);
      res.render("educator-center", {
        title: "Educator Center",
        courses: existingCourses,
      });
    } catch (error) {
      console.error(error);
      return res.status(422).json(error);
    }
  }
);

app.get("/createcourse", ConnectionSyncLogin.ensureLoggedIn(), async (req, res) => {
  const currentUser = await Users.findByPk(req.user.id);
    res.render("createCourse", {
      title: "Create New Course",
      currentUser,
      
    });
});


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
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }

    const currentUser = await Users.findByPk(req.user.id); // Use req.user.id to get the current user's ID

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve courses associated with the user using retrieveCourses method
    const userCourses = await currentUser.retrieveCourses();

    // Render the my-courses page and pass the user's courses to it
    res.render("my-courses", {
      title: "My Courses",
      courses: userCourses,
      user: currentUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
});






app.get(
  "/student-center",
  ConnectionSyncLogin.ensureLoggedIn(),
  (req, res) => {
    res.render("student-center",);
  }
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
