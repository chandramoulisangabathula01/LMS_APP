// enrollments.ejs

/*eslint-disable no-unused-vars*/
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Enrollments extends Model {
    
    static associate(models) {
      // define association here
    }
  }
  Enrollments.init({
    userId: DataTypes.INTEGER,
    courseId: DataTypes.INTEGER,
    chapterId: DataTypes.INTEGER,
    pageId: DataTypes.INTEGER,
    completed: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'Enrollments',
  });
  return Enrollments;
};