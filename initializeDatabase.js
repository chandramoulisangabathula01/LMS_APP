// initializeDatabase.js

const Sequelize = require("sequelize");

const database = "LMS_APP_DB";
// const database = "lms-app-dev"
const username = "postgres";
const password = "123456";

// Create a Sequelize instance with connection details
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
});




const connect = async () => {
  return sequelize.authenticate();
};

// Export the connect function and the Sequelize instance
module.exports = {
  connect,
  sequelize,
  
};
