// /home/chandu/LMS_APP/migrations/20240131082433-add-createdAt-to-courses.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Courses', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Courses', 'createdAt');
  },
};
