/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  // roda unit-tests (*.spec.ts) e e2e-tests (*.e2e-spec.ts)
  testRegex: '.*\\.(spec|e2e-spec)\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],

  // transpila TS via ts-jest
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // mapeia imports absolutos com base em src/
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

  