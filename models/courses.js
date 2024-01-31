// models/courses.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Courses extends Model {
    static associate(models) {
      Courses.belongsTo(models.Users, {
        foreignKey: 'userId',
      });
    }
  }

  Courses.init(
    {
      courseName: DataTypes.STRING,
      courseContent: DataTypes.TEXT,
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      },
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
