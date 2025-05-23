const config = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{ts,js,tsx,jsx}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts'
  ],
  testMatch: [
    '<rootDir>/src/**/?(*.)(spec).(j|t)s?(x)'
  ],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/test/__mocks__/fileMock.js',
    '\\.(css|less|scss)$': '<rootDir>/test/__mocks__/styleMock.js'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(ol|color-space|color-rgba|color-name|color-*[a-z]*|@camptocamp|@terrestris|quickselect|' +
    'd3-*[a-z]*|query-string|decode-uri-component|split-on-first|filter-obj|shpjs|geostyler-openlayers-parser|geostyler-style|jsts))'
  ],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ]
};

module.exports = config;
