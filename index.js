/*
 * index.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Entry point for the Livre3D engine.
 * Initializes the Livre client with the engine contained in this directory.
 *
 */

'use strict';

module.exports = function (options) {

  // These options were passed by the theme.
  const engine = require('./engine.js')(options);

  require('livre-client')({
    engine: engine
  });
};

