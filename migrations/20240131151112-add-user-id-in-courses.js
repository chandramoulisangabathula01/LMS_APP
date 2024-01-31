/*eslint-disable no-unused-vars*/
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Courses", "userId", {
      type: Sequelize.DataTypes.INTEGER,
    });

    await queryInterface.addConstraint("Courses", {
      fields: ["userId"],
      type: "foreign key",
      references: {
        table: "Users",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Courses", "userId");
  
  },
};