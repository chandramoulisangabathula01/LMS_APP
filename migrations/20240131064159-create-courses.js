'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      courseName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      courseContent: {
        type: Sequelize.TEXT
      },
      // created_at: {
      //   allowNull: false,
      //   defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      //   type: Sequelize.DATE
      // },
      // updated_at: {
      //   allowNull: false,
      //   type: Sequelize.DATE
      // },
      // createdAt: {
      //   allowNull: false,
      //   defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      //   type: Sequelize.DATE
      // },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface,) {
    await queryInterface.dropTable('Courses');
  }
};