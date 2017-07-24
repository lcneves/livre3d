/*
 * index.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Entry point for the w3d engine.
 * Initializes the client with the engine contained in this directory.
 *
 */

'use strict';

module.exports = function (theme) {

  const engine = require('./engine.js')(theme);

  require('livre-client')({
    engine: engine
  });
};
