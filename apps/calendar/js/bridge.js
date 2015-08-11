define(function(require, exports) {
'use strict';

var AccountModel = require('models/account');
var CalendarModel = require('models/calendar');
var EventEmitter2 = require('ext/eventemitter2');
var EventModel = require('models/event');
var client;
var dayObserver = require('day_observer');
var nextTick = require('common/next_tick');
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

    client = threads.client('calendar', { thread: thread });
  }

  return client[type].apply(client, args);
}

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

exports.observeDay = function(date) {
  var stream = new FakeClientStream();
  var emit = stream.write.bind(stream);

  stream.cancel = function() {
    dayObserver.off(date, emit);
    stream._cancel();
  };

  // FIXME: nextTick only really needed because dayObserver dispatches the
  // first callback synchronously, easier to solve it here than to change
  // dayObserver; we can remove this nextTick call after moving to threads.js
  // (since it will always be async)
  nextTick(() => dayObserver.on(date, emit));

  return stream;
};


/**
 * Returns a list of available presets filtered by
 * the currently used presets in the database.
 * (can't create multiple local calendars)
 */
exports.availablePresets = function(presetList) {
  return method('accounts/presets', presetList);
};

/**
 * FakeClientStream is used as a temporary solution while we move all the db
 * calls into the worker. In the end all the methods inside this file will be
 * transfered into the "backend/calendar_service.js" and we will simply call
 * the `threads.client('calendar')` API
 */
function FakeClientStream() {
  this._emitter = new EventEmitter2();
  this._enabled = true;
}

FakeClientStream.prototype.write = function(data) {
  this._enabled && this._emitter.emit('data', data);
};

FakeClientStream.prototype.listen = function(callback) {
  this._enabled && this._emitter.on('data', callback);
};

FakeClientStream.prototype.unlisten = function(callback) {
  this._enabled && this._emitter.off('data', callback);
};

FakeClientStream.prototype._cancel = function() {
  this._emitter.removeAllListeners();
  this._enabled = false;
};

});
