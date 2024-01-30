const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const { Users } = require("./models");

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index", {
    title: "LMS APPLICATION *(BE A PRO)",
  });
});



module.exports = app;
