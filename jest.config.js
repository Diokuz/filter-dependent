'use strict'

module.exports = {
  // Маска для поиска тестов
  testMatch: [
    '<rootDir>/packs/**/__tests__/*.spec.(js|ts)',
    '<rootDir>/src/**/__tests__/*.spec.(js|ts)',
  ],

  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Для резолва ts и js
  moduleFileExtensions: [
    'json',
    'js',
    'ts'
  ],

  testEnvironment: 'node',
}
