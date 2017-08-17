/*
 * index.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Entry point for the w3d engine.
 * Initializes the client with the engine contained in this directory.
 *
 */

'use strict';

module.exports = function (app) {

  require('./theme.js').init(app.theme);
  require('./templates.js').init(app.templates);

  const engine = require('./engine.js');
  return engine;
};
