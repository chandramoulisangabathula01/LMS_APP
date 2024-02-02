/*eslint-disable no-unused-vars*/
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Pages extends Model {
    static associate(models) {
      Pages.belongsTo(models.Chapters, {
        foreignKey: "chapterId",
      });
    }
  }
  Pages.init(
    {
      title: DataTypes.STRING,
      content: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Pages",
    },
  );
  return Pages;
};