function dispatch(eventType) {
  window.dispatchEvent(new CustomEvent(eventType));
}

// as soon as file is loaded/executed
dispatch('moz-chrome-dom-loaded');


define(function(require) {

  // uncoment this line if using the fake-react to test how much this file adds
  // to the load time

  // require('react-min');

  // seeded random to always get same events so we make sure we are testing
  // performance always under the same conditions
  var random = require('mout/random/random');
  var SeedRandom = require('seedrandom');
  var seeded = new SeedRandom('gaia-calendar');
  random.get = seeded;

  // ----

  // before views are executed
  dispatch('moz-chrome-interactive');

  var React = require('react');
  var WeekView = require('./views/week');

  // after views are instantiated
  dispatch('moz-app-visually-complete');

  var outlet = document.getElementById('outlet');
  outlet.innerHTML = React.renderComponentToString(WeekView());

  // after renderToString
  dispatch('moz-content-interactive');

  React.renderComponent(WeekView(), outlet, function() {
    dispatch('moz-app-loaded');
  });

});
