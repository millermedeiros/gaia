({
  logLevel: 1,
  baseUrl: 'js',
  name: 'almond',
  out: '../../build_stage/calendar/js/built.js',
  include: ['app'],
  insertRequire: ['app'],
  paths: {
    // toggle the react version here !!!
    // react: 'fake-react'
    react: 'react-min'
  }
})
