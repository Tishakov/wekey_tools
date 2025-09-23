'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'googleAccessToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'googleRefreshToken', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'googleTokenExpiry', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'googleAccessToken');
    await queryInterface.removeColumn('users', 'googleRefreshToken');
    await queryInterface.removeColumn('users', 'googleTokenExpiry');
  }
};