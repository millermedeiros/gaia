define(function(require, exports, module) {
'use strict';

// load all the dependencies needed by "core" and initialize them to avoid
// circular dependencies (many modules depend on "core")

var Db = require('db');
var ErrorController = require('controllers/error');
var ServiceController = require('controllers/service');
var SyncController = require('controllers/sync');
var TimeController = require('controllers/time');
var bridge = require('bridge');
var core = require('core');
var providerFactory = require('provider/factory');
var storeFactory = require('store/factory');
var viewFactory = require('views/factory');
var notificationsController = require('controllers/notifications');
var periodicSyncController = require('controllers/periodic_sync');

module.exports = function(dbName) {
  if (core.db) {
    return;
  }
  core.bridge = bridge;
  core.db = new Db(dbName || 'b2g-calendar');
  core.errorController = new ErrorController();
  core.notificationsController = notificationsController;
  core.periodicSyncController = periodicSyncController;
  core.providerFactory = providerFactory;
  core.serviceController = new ServiceController();
  core.storeFactory = storeFactory;
  core.syncController = new SyncController();
  core.timeController = new TimeController();
  core.viewFactory = viewFactory;
};

});
