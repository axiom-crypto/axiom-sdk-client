/** @type {import('ts-jest').JestConfigWithTsJest} */
require('dotenv').config({
  path: '.env'
});

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};