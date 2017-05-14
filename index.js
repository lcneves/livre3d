/*
 * index.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Entry point for the Livre3D engine.
 * Initializes the Livre client with the engine contained in this directory.
 *
 */

'use strict';

module.exports.ObjectLivre = require('./object-livre.js');

module.exports.init = function (theme) {

  const engine = require('./engine.js')(theme);

  require('livre-client')({
    engine: engine
  });
};

