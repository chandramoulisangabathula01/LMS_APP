'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chapters extends Model {
    static associate(models) {
      // define association here
    }
  }
  Chapters.init({
    chapterName: DataTypes.STRING,
    chapterContent: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Chapters',
  });
  return Chapters;
};