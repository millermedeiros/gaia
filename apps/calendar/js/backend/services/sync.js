define(function(require, exports, module) {
'use strict';

var Responder = require('common/responder');
var accountsService = require('./accounts');
var calendarsService = require('./calendars');
var co = require('ext/co');
var core = require('core');
var isOffline = require('common/is_offline');

/**
 * Handles all synchronization related
 * tasks. The intent is that this will
 * be the focal point for any view
 * to observe sync events and this
 * controller will decide when to actually
 * tell the stores when to sync.
 */
function Sync() {
  this.pending = 0;

  Responder.call(this);
}

Sync.prototype = {
  __proto__: Responder.prototype,

  _incrementPending: function() {
    if (!this.pending) {
      this.emit('syncStart');
    }

    this.pending++;
  },

  _resolvePending: function() {
    if (!(--this.pending)) {
      this.emit('syncComplete');
    }

    if (this.pending < 0) {
      dump('\n\n Error calendar sync .pending is < 0 \n\n');
    }
  },

  /**
   * Sync all accounts, calendars, events.
   * There is no callback for all intentionally.
   *
   * Use:
   *
   *    controller.once('syncComplete', cb);
   *
   */
  all: co.wrap(function *(callback) {
    // this is for backwards compatibility... in reality we should remove
    // callbacks from .all.
    if (callback) {
      this.once('syncComplete', callback);
    }

    if (isOffline()) {
      this.emit('syncOffline');
      this.emit('syncComplete');
      return;
    }

    var accounts = yield accountsService.all();
    accounts = accounts.map(a => a.account);
    accounts.forEach(this.account, this);

    // If we have nothing to sync
    if (!this.pending) {
      this.emit('syncComplete');
    }
 }),

  /**
   * Initiates a sync for a single calendar.
   *
   * @param {Object} account parent of calendar.
   * @param {Object} calendar specific calendar to sync.
   * @param {Function} [callback] optional callback.
   */
  calendar: co.wrap(function *(account, calendar, callback) {
    this._incrementPending();
    try {
      yield calendarsService.sync(account, calendar);
      this._resolvePending();
      callback && callback();
    } catch(err) {
      this._resolvePending();
      this.handleError(err, callback);
    }
  }),

  /**
   * Initiates a sync of a single account and all
   * associated calendars (calendars that exist after
   * the full sync of the account itself).
   *
   * The contract is if an callback is given the callback MUST handle the
   * error given. The default behaviour is to bubble up the error up to the
   * error controller.
   *
   * @param {Object} account sync target.
   * @param {Function} [callback] optional callback.
  */
  account: co.wrap(function *(account, callback) {
    this._incrementPending();

    try {
      // need to sync the account first in case the calendar list changed
      yield accountsService.sync(account);

      var calendars = yield accountsService.getCalendars(account._id);
      // wait for all the calendars to be synced
      yield calendars.map(calendar => {
        return this.calendar(account, calendar);
      });

      this._resolvePending();
      callback && callback();
    } catch (err) {
      this._resolvePending();
      this.handleError(err, callback);
    }
  }),

  /**
   * Private helper for choosing how to dispatch errors.
   * When given a callback the callback will be called otherwise the error
   * controller will be invoked.
   */
  handleError: function(err, callback) {
    if (typeof callback === 'function') {
      return callback(err);
    }

    core.errorController.dispatch(err);
  }
};

exports = module.exports = new Sync();

});
