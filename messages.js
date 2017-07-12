/*
 * messages.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Transmits messages between modules.
 * Part of the Livre project.
 */

'use strict';

var _messageBuffer = {};

function checkKey (key) {
  if (typeof key !== 'string') {
    throw new Error('Key must be a string!');
  }
}

module.exports.setMessage = function (key, message) {
  checkKey(key);
  _messageBuffer[key] = message;
};

module.exports.getMessage = function (key) {
  checkKey(key);
  return _messageBuffer[key];
};
