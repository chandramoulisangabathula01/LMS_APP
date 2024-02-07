/* eslint-disable no-undef */
// Import necessary modules
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

// Define variables to hold server and agent
let server, agent;

// Function to extract CSRF token from response
function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

// Function to log in a user
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/logging").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

// Test suite for LMS application
describe("LMS App Tests", () => {
  // Before all tests, sync database and start server
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  // After all tests, close database connection and server
  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  // Test to prevent unauthorized access to center
  test("Prevent unauthorized access to center", async () => {
    let response = await request(app).get("/educator-center");
    expect(response.status).toBe(302);
    response = await request(app).get("/educator-center");
    expect(response.status).toBe(302);
  });

  // Test to register a new user
  test("Register a new user", async () => {
    const res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);

    const newUser = {
      firstName: "Test",
      lastName: "User",
      email: "testuser@example.com",
      password: "password123",
      role: "student",
      _csrf: csrfToken,
    };

    const signupRes = await agent.post("/users").send(newUser);
    expect(signupRes.statusCode).toBe(302);
  });

  // Test to authenticate a user
  test("Authenticate a user", async () => {
    await login(agent, "john.doe@example.com", "password123");
  });

  // Test to view courses created by an educator
  test("View courses created by an educator", async () => {
    await login(agent, "schanduteacher@gmail.com", "password123");

    const teacherMyCoursesRes = await agent.get("/teacherMyCourses");
    expect(teacherMyCoursesRes.statusCode).toBe(200);
  });

  // Test to view enrolled courses for a student
  test("View enrolled courses for a student", async () => {
    await login(agent, "schandustudent@gmail.com", "password123");

    const studentMyCoursesRes = await agent.get("/studentMyCourses");
    expect(studentMyCoursesRes.statusCode).toBe(200);
  });

  // Test to access instructor center
  test("Access instructor center", async () => {
    await login(agent, "schanduteacher@gmail.com", "password123");

    const educatorCenterRes = await agent.get("/educator-center");
    expect(educatorCenterRes.statusCode).toBe(200);
  });

  // Test to access educator's report
  test("Access educator's report", async () => {
    await login(agent, "schanduteacher@gmail.com", "password123");

    const teacherReportRes = await agent.get("/view-report");
    expect(teacherReportRes.statusCode).toBe(200);
  });

  // Test to access student center
  test("Access student center", async () => {
    await login(agent, "schandustudent@gmail.com", "password123");

    const studentCenterRes = await agent.get("/student-center");
    expect(studentCenterRes.statusCode).toBe(200);
  });

  // Test to create a new course
  test("Create a new course", async () => {
    await login(agent, "schanduteacher@gmail.com", "password123");

    const csrfToken = extractCsrfToken(await agent.get("/createcourse"));
    const newCourse = {
      courseName: "New Course",
      courseContent: "Content for the new course.",
      _csrf: csrfToken,
    };

    const createCourseRes = await agent.post("/createcourse").send(newCourse);
    expect(createCourseRes.statusCode).toBe(302);
  });

  // Test to create a new chapter
  test("Create a new chapter", async () => {
    await login(agent, "schanduteacher@gmail.com", "password123");

    let csrfToken = extractCsrfToken(await agent.get("/buildChapter"));

    //create test course
    const createdCourse = {
      courseName: "Test Course",
      courseContent: "Content for the new course.",
      _csrf: csrfToken,
    };

    await agent.post("/createcourse").send(createdCourse);

    //create test chapter
    csrfToken = extractCsrfToken(
      await agent.get(`/view-course/${1}/buildChapter?currentUserId=${1}`),
    );
    const newChapter = {
      chapterName: "Test Chapter",
      chapterContent: "Content for the new chapter.",
      _csrf: csrfToken,
    };

    // Send a request to create a chapter for the created course
    const createChapterRes = await agent
      .post(`/view-course/${createdCourse.id}/createchapter`)
      .send(newChapter);

    expect(createChapterRes.statusCode).toBe(302);
  });

  // Test to change password
  test("Change Password", async () => {
    await login(agent, "schandustudent@gmail.com", "password123");

    const csrfToken = extractCsrfToken(await agent.get("/changePassword"));

    const newPassword = "newPass123";

    const changePasswordResponse = await agent.post("/changePassword").send({
      userEmail: "schandustudent@gmail.com",
      newPassword: newPassword,
      _csrf: csrfToken,
    });

    expect(changePasswordResponse.statusCode).toBe(302);
    await login(agent, "schandustudent@gmail.com", newPassword);

    const loginResponse = await agent.get("/student-center");
    expect(loginResponse.statusCode).toBe(200);
  });

  // Test to sign out the user
  test("Sign out the user", async () => {
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);

    res = await agent.get("/educator-center");
    expect(res.statusCode).toBe(302);

    res = await agent.get("/student-center");
    expect(res.statusCode).toBe(302);
  });
  
});
