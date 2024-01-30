const Sequelize = require("sequelize");

const database = "LMS_APP_DB";
const username = "postgres";
const password = "123456";

// Create a Sequelize instance with connection details
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
});

const Users = require('./models/user')(sequelize, Sequelize);
// Define a connect function to authenticate the connection
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
  Users,
};
