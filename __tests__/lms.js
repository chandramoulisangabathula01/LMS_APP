/* eslint-disable no-undef */
const request = require('supertest');
const app = require('../app'); // Assuming the app.js is in the same directory
const csrfToken = 'this_should_be_32_character_long';

describe('LMS App Tests', () => {
  // Test for the root route
  // eslint-disable-next-line no-undef
  test('GET /', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('LMS app');
  });

  // Test for the signup route
  test('GET /signup', async () => {
    const response = await request(app).get('/signup');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Signup');
  });

  // Test for the login route
  test('GET /login', async () => {
    const response = await request(app).get('/login');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Login');
  });

  // Test for creating a new user
  test('POST /users', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'student',
      });
    
      expect(response.statusCode).toBe(500); 
  });

  // Test for logging in
  test('POST /logging', async () => {
    const response = await request(app)
      .post('/logging')
      .send({
        email: 'john.doe@example.com',
        password: 'password123',
      });
    
      expect(response.statusCode).toBe(500);
  });

  // Test for viewing courses in educator-center
  test('GET /educator-center', async () => {
    // Assuming you have a user with a role 'teacher' in the test database
    const response = await request(app).get('/educator-center');
    expect(response.statusCode).toBe(302);
    
    expect(response.text).toContain('Found. Redirecting to /login') 
  });

  // Test for creating a new course
  test('POST /createcourse', async () => {
    const response = await request(app)
      .post('/createcourse')
      .send({
        courseName: 'New Course',
        courseContent: 'Course content goes here',
      });
    
      expect(response.statusCode).toBe(500);
  });

  // Test for viewing my-courses
  test('GET /my-courses', async () => {
    // Assuming you have a user with associated courses in the test database
    const response = await request(app).get('/my-courses');
    expect(response.statusCode).toBe(302);
  
    expect(response.text).toContain('Found. Redirecting to /login');
  });

  test('GET /view-course/:id/buildChapter', async () => {
    // Assuming you have a course with the given id in the test database
    const response = await request(app).get('/view-course/1/buildChapter');
    expect(response.statusCode).toBe(302);
    expect(response.text).toContain('Found. Redirecting to /login');
  });

  // Test for creating a new page
  test('POST /view-chapter/:id/createpage', async () => {
    const response = await request(app)
      .post('/view-chapter/1/createpage')
      .set('Cookie', ['csrf-token=' + csrfToken])
      .send({
        pageName: 'New Page',
        pageContent: 'Page content goes here',
      });
  
    expect(response.statusCode).toBe(500);
    
  });

  // Test for viewing a course report
  test('GET /view-report', async () => {
    // Assuming a logged-in user in the test database
    const response = await request(app).get('/view-report');
    expect(response.statusCode).toBe(302);
    expect(response.text).toContain('Found. Redirecting to /login');
  });

  // Test for the student center
  test('GET /student-center', async () => {
    // Assuming a logged-in user in the test database
    const response = await request(app).get('/student-center');
    expect(response.statusCode).toBe(302);
    expect(response.text).toContain('Found. Redirecting to /login');
  });

  test('POST /enrol-course/:courseId', async () => {
    const response = await request(app)
      .post('/enrol-course/1')
      .set('Cookie', ['csrf-token=' + csrfToken]);
  
    expect(response.statusCode).toBe(500);
    
  });
  
  

  // Test for signing out
  test('GET /signout', async () => {
    const response = await request(app).get('/signout');
    expect(response.statusCode).toBe(302);
    expect(response.text).toContain('Found. Redirecting to /');
  });

});
