/*
 * theme.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Imports and preprocesses the theme as a module.
 * Part of the w3d project.
 */

'use strict';

const THREE = require('three');
const fontLoader = new THREE.FontLoader();

module.exports.init = function (theme) {
  Object.assign(module.exports, theme);

  // Parses 3D font JSON into three.js Font objects
  if (module.exports.resources && module.exports.resources.fonts) {
    for (let key in module.exports.resources.fonts) {
      module.exports.resources.fonts[key].fontPromise =
        new Promise(resolve => {
          module.exports.resources.fonts[key].dataPromise.then(json => {
            let font = fontLoader.parse(json);
            resolve(font);
          });
        });
    }
  }
};

