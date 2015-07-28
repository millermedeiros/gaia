'use strict';

require.config({
  paths: {
    common: '../common',
    ext: '../ext'
  }
});

require(['calendar_service'], service => service.start());
