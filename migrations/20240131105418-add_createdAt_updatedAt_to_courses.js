'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Courses', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });

    await queryInterface.addColumn('Courses', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Courses', 'createdAt');
    await queryInterface.removeColumn('Courses', 'updatedAt');
  },
};
