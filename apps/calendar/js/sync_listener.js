// used by the pendingManager to notify the views about the sync status (since
// the sync actually happens inside the worker)
define(function(require, exports, module) {
'use strict';

var core = require('core');
var Responder = require('common/responder');

exports = module.exports = new Responder();

exports.startEvent = 'syncStart';
exports.completeEvent = 'syncComplete';

exports.observe = function() {
  [
    'syncStart',
    'syncComplete',
    'syncOffline'
  ].forEach(type => core.bridge.on(type, () => exports.emit(type)));
};

});
