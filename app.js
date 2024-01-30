// const express = require("express");
// const app = express();
// const path = require("path");
// // const bodyParser = require("body-parser");
// // const session = require("express-session");

// const { Users } = require("./models");
// const bcrypt = require('bcrypt');
// const saltRounds = 10; // You can adjust the number of salt rounds
// const plaintextPassword = 'user_password';
// const passport = require('passport');
// const session = require('express-session');
// const LocalStrategy = require('passport-local').Strategy;

// const { sequelize } = require('./initializeDatabase.js');

// // eslint-disable-next-line no-undef
// app.use(express.static(path.join(__dirname, "public")));
// // eslint-disable-next-line no-undef
// app.set("views", path.join(__dirname, "views"));
// app.use(express.urlencoded({ extended: false }));
// app.set("view engine", "ejs");
// app.use(session({ /* session configuration */ }));
// app.use(passport.initialize());
// app.use(passport.session());



// bcrypt.hash(plaintextPassword, saltRounds, (err, hash) => {
//     if (err) {
//         console.error('Error hashing password:', err);
//         return;
//     }
//     // 'hash' is the hashed password
//     console.log('Hashed Password:', hash);
// });

// passport.use(new LocalStrategy(
    
// ));


// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await Users.findById(id);
//         done(null, user);
//     } catch (error) {
//         done(error, null);
//     }
// });



// app.post('/login', passport.authenticate('local', {
//     successRedirect: '/',
//     failureRedirect: '/login',
//     failureFlash: true,
// }));



// app.get("/", (req, res) => {
//     res.render("index", {
//         title: "LMS APPLICATION *(BE A PRO)",
//     });
// });

// app.get("/signup", (req, res) => {
//     res.render("signup", {
//         title: "Signup page",
//     });
// });

// app.get("/login", (req, res) => {
//     res.render("login", {
//         title: "Login page",
//     });
// });

// app.post("/users", async (request, response) => {
//     if (!request.body.role ||
//          request.body.email.length === 0 ||
//           request.body.firstName.length === 0 ||
//            request.body.lastName.length === 0 ||
//             request.body.password.length < 8) {
//         // Redirect with an error message
//         response.status(400).send("Invalid input. Please provide all required fields.");
//         return;
//     }

//     try {
//         // Hashing the password
//         const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);

//         // Create a user
//         const user = await Users.create({
//             firstName: request.body.firstName,
//             lastName: request.body.lastName,
//             email: request.body.email,
//             password: hashedPwd,
//             role: request.body.role,
//         });

//         // Log in the user
//         request.login(user, (err) => {
//             if (err) {
//                 console.log(err);
//             }

//             // Redirect based on the user's role
//             if (user.role === "teacher") {
//                 response.redirect("/educator-center");
//             } else if (user.role === "student") {
//                 response.redirect("/student-center");
//             } else {
//                 // Handle other roles or scenarios as needed
//                 response.redirect("/signup");
//             }
//         });
//     } catch (error) {
//         console.log(error);
//         response.status(500).send("Internal Server Error");
//     }
// });


// app.post("/users",async (req,res) => {
//     console.log("firstName",req.body.firstName)
// })


// sequelize.sync({ force: false }).then(() => {
//     console.log('Database synced');
//   }).catch((error) => {
//     console.error('Error syncing database:', error);
//   });

// module.exports = app;



const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require('bcrypt');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const flash = require("express-flash");

const { User } = require("./models");
const { sequelize } = require('./initializeDatabase');

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Passport local strategy
passport.use(new LocalStrategy(
    { usernameField: 'email' },
    async (email, password, done) => {
        try {
            const user = await User.findOne({ where: { email: { [sequelize.Op.iLike]: email } } });

            if (!user) {
                return done(null, false, { message: 'Incorrect email.' });
            }

            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return done(null, false, { message: 'Incorrect password.' });
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));

// Passport serialize and deserialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

app.get("/", (req, res) => {
    res.render("index", { title: "LMS APPLICATION *(BE A PRO)" });
});

app.get("/signup", (req, res) => {
    res.render("signup", { title: "Signup page" });
});

app.get("/login", (req, res) => {
    res.render("login", { title: "Login page" });
});

app.post("/users", async (req, res) => {
    try {
        const hashedPwd = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPwd,
            role: req.body.role,
        });

        req.login(user, (err) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal Server Error");
            }

            // Redirect based on the user's role
            if (user.role === "teacher") {
                req.flash('success', 'Account created successfully! Welcome to the Educator Center.');
                res.redirect("/educator-center");
            } else if (user.role === "student") {
                req.flash('success', 'Account created successfully! Welcome to the Student Center.');
                res.redirect("/student-center");
            } else {
                req.flash('success', 'Account created successfully!');
                res.redirect("/signup");
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

sequelize.sync({ force: false }).then(() => {
    console.log('Database synced');
}).catch((error) => {
    console.error('Error syncing database:', error);
});

module.exports = app;
