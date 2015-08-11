define(function(require, exports) {
'use strict';

var AccountModel = require('models/account');
var CalendarModel = require('models/calendar');
var EventModel = require('models/event');
var client;
var thread;
var threads = require('ext/threads');

function stream(...args) {
  return exec('stream', args);
}

function method(...args) {
  return exec('method', args);
}

function exec(type, args) {
  if (!client) {
    thread = threads.create({
      src: '/js/backend/calendar_worker.js',
      type: 'worker'
    });

    thread.process.onerror = function(err) {
      console.error('Bridge Worker Error:', err);
    };

    client = threads.client('calendar', { thread: thread });
  }

  return client[type].apply(client, args);
}

/**
 * notify the backend about timeController updates
 */
exports.updateTime = function(data) {
  return method('time/update', data);
};

/**
 * Fetch all the data needed to display the busytime information on the event
 * views based on the busytimeId
 */
exports.fetchRecord = function(busytimeId) {
  return method('records/get', busytimeId).then(r => {
    r.event = new EventModel(r.event);
    r.calendar = new CalendarModel(r.calendar);
    r.account = new AccountModel(r.account);
    return r;
  });
};

/**
 * Fetch all the calendars from database and emits a new event every time the
 * values changes.
 *
 * @returns {ClientStream}
 */
exports.observeCalendars = function() {
  return stream('calendars/observe');
};

exports.updateCalendar = function(calendar) {
  return method('calendars/update', calendar);
};

exports.createEvent = function(event) {
  return method('events/create', event);
};

exports.updateEvent = function(event) {
  return method('events/update', event);
};

exports.deleteEvent = function(event) {
  return method('events/remove', event);
};

exports.getSetting = function(id) {
  return method('settings/get', id);
};

exports.setSetting = function(id, value) {
  return method('settings/set', id, value);
};

exports.observeSetting = function(id) {
  return stream('settings/observe', id);
};

exports.getAccount = function(id) {
  return method('accounts/get', id);
};

exports.deleteAccount = function(id) {
  return method('accounts/remove', id);
};

/**
 * Sends a request to create an account.
 *
 * @param {Calendar.Models.Account} model account details.
 */
exports.createAccount = function(model) {
  return method('accounts/create', model);
};

exports.observeAccounts = function() {
  return stream('accounts/observe');
};

exports.initDay = function() {
  return method('days/init');
};

exports.observeDay = function(date) {
  return stream('days/observe', date);
};

/**
 * Returns a list of available presets filtered by
 * the currently used presets in the database.
 * (can't create multiple local calendars)
 */
exports.availablePresets = function(presetList) {
  return method('accounts/presets', presetList);
};

});
