const express = require("express");
const app = express();
const path = require("path");
// const bodyParser = require("body-parser");
// const session = require("express-session");

const { Users } = require("./models");
const bcrypt = require('bcrypt');
const saltRounds = 10; // You can adjust the number of salt rounds
const plaintextPassword = 'user_password';

const { sequelize } = require('./initializeDatabase');

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
// eslint-disable-next-line no-undef
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");



bcrypt.hash(plaintextPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
        return;
    }
    // 'hash' is the hashed password
    console.log('Hashed Password:', hash);
});


app.get("/", (req, res) => {
    res.render("index", {
        title: "LMS APPLICATION *(BE A PRO)",
    });
});

app.get("/signup", (req, res) => {
    res.render("signup", {
        title: "Signup page",
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "Login page",
    });
});

app.post("/users", async (request, response) => {
    if (!request.body.role ||
         request.body.email.length === 0 ||
          request.body.firstName.length === 0 ||
           request.body.lastName.length === 0 ||
            request.body.password.length < 8) {
        // Redirect with an error message
        response.status(400).send("Invalid input. Please provide all required fields.");
        return;
    }

    try {
        // Hashing the password
        const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);

        // Create a user
        const user = await Users.create({
            firstName: request.body.firstName,
            lastName: request.body.lastName,
            email: request.body.email,
            password: hashedPwd,
            role: request.body.role,
        });

        // Log in the user
        request.login(user, (err) => {
            if (err) {
                console.log(err);
            }

            // Redirect based on the user's role
            if (user.role === "teacher") {
                response.redirect("/educator-center");
            } else if (user.role === "student") {
                response.redirect("/student-center");
            } else {
                // Handle other roles or scenarios as needed
                response.redirect("/signup");
            }
        });
    } catch (error) {
        console.log(error);
        response.status(500).send("Internal Server Error");
    }
});

sequelize.sync({ force: false }).then(() => {
    console.log('Database synced');
  }).catch((error) => {
    console.error('Error syncing database:', error);
  });

module.exports = app;
