// initializeDatabase.js

const Sequelize = require("sequelize");

// const database = "LMS_APP_DB";
const database = "lms-app-dev"
const username = "postgres";
const password = "123456";

// Create a Sequelize instance with connection details
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
  llogging: (sql) => {
    console.log(sql);
  },
});




const connect = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

// Export the connect function and the Sequelize instance
module.exports = {
  connect,
  sequelize,
  
};
