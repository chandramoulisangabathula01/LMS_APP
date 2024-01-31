// models/users.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {
      Users.hasMany(models.Courses, {
        foreignKey: 'userId',
        as: 'courses', // alias the association
      });
    }

    async retrieveCourses() {
      console.log('Before getCourses');
      const courses = await this.getCourses();
      console.log('After getCourses');
      return courses;
    }
  }

  Users.init(
    {
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      role: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'Users',
    }
  );

  return Users;
};
``
