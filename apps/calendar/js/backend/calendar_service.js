define(function(require, exports) {
'use strict';

var CaldavManager = require('caldav/manager');
var Db = require('db');
var RecurringEvents = require('recurring_events');
var accounts = require('services/accounts');
var busytimes = require('services/busytimes');
var calendars = require('services/calendars');
var co = require('ext/co');
var core = require('core');
var events = require('services/events');
var notifications = require('services/notifications');
var settings = require('services/settings');
var threads = require('ext/threads');

var loadDb;
var recurringEvents;
var service = threads.service('calendar');

core.db = new Db('b2g-calendar');
core.providerFactory = require('provider/factory');
core.storeFactory = require('store/factory');
core.timeModel = require('time_model');
core.caldavManager = new CaldavManager();
core.service = service;
core.syncService = require('services/sync');

function start() {
  if (loadDb != null) {
    return loadDb;
  }

  broadcastEvents(core.syncService, [
    'syncStart',
    'syncComplete',
    'syncOffline'
  ]);

  recurringEvents = new RecurringEvents();
  broadcastEvents(recurringEvents, [
    'expandStart',
    'expandComplete'
  ]);
  recurringEvents.observe();

  loadDb = core.db.load();
  core.caldavManager.start(false);
  return loadDb;
}

// notify frontend about events
function broadcastEvents(target, events) {
  events.forEach(type => target.on(type, data => {
    service.broadcast(type, data);
  }));
}

function method(endpoint, handler) {
  service.method(endpoint, () => {
    var args = Array.slice(arguments);
    return co(function *() {
      yield start();
      return handler.apply(null, args);
    });
  });
}

function stream(endpoint, handler) {
  service.stream(endpoint, () => {
    var args = Array.slice(arguments);
    return co(function *() {
      yield start();
      handler.apply(null, args);
    });
  });
}

function echo() {
  return Array.slice(arguments);
}

method('echo', echo);

method('accounts', accounts.all);
method('accounts/get', accounts.get);
method('accounts/create', accounts.persist);
method('accounts/remove', accounts.remove);
method('accounts/presets', accounts.availablePresets);
stream('accounts/observe', accounts.observe);

method('events/create', events.create);
method('events/update', events.update);
method('events/remove', events.remove);

method('records/get', busytimes.fetchRecord);
method('days/init', busytimes.init);
stream('days/observe', busytimes.observeDay);

method('settings/get', settings.get);
method('settings/set', settings.set);
stream('settings/observe', settings.observe);

method('calendars/update', calendars.update);
stream('calendars/observe', calendars.observe);

method('time/update', core.timeModel.update);

method('notifications/get', notifications.get);

method('sync/all', core.syncService.all);

exports.start = start;

});
