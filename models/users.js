"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      Users.hasMany(models.Courses, {
        foreignKey: "userId",
      });
    }
  }
  Users.init(
    {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'Users',
    },
  );
  return Users;
};