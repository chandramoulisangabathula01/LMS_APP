/*eslint-disable no-unused-vars*/
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Courses extends Model {
    
    static associate(models) {
      Courses.belongsTo(models.Users, {
        foreignKey: "userId",
      });
      Courses.hasMany(models.Chapters, {
        foreignKey: "courseId",
      });
    }
  }
  Courses.init(
    {
      courseName: DataTypes.STRING,
      courseContent: DataTypes.TEXT,
      
  
    },
    {
      sequelize,
      modelName: 'Courses',
      timestamps: true, // Enable timestamps
      // other options...
    }
  );
  return Courses;
};