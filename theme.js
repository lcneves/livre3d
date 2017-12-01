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
const load = require('./load-resources.js');
const style = require('./style.js');

const styles = document.getElementsByTagName('w3d-style');
const lights = document.getElementsByTagName('w3d-light');
const camera = document.getElementsByTagName('w3d-camera')[0];
const objects = document.getElementsByTagName('w3d-objects');
const fonts = document.getElementsByTagName('w3d-fonts');

for (let s of styles) {
  if (s && s.attributes && s.attributes.href &&
      typeof s.attributes.href.value === 'string') {
    load.xhr(s.attributes.href.value).then(data => {
      if (data && typeof data === 'string') {
        style.addSheet(data);
      }
    });
  }
}

var theme = {
  resources: {
    fonts: {},
    objects: {},
  },
  lights: [
    { type: 'ambient' },
    { type: 'directional' }
  ],
  worldWidth: 100,
  hfov: 30,
  nearFarRatio: 0.25
};

// Override lights if w3d-light tags exist
if (lights[0]) {
  theme.lights = [];
  for (let l of lights) {
    let config = {};
    for (let a of l.attributes) {
      // TODO: Make work with numbers and colors (i.e. 0xffffff).
      config[a.name] = a.value;
    }
    theme.lights.push(config);
  }
}

// Override camera if w3d-camera tag exists
if (camera) {
  if (camera.attributes['width'])
    theme.worldWidth = camera.attributes['width'];
  if (camera.attributes['hfov'])
    theme.hfov = camera.attributes['hfov'];
  if (camera.attributes['nf-ratio'])
    theme.nearFarRatio = camera.attributes['nf-ratio'];
}

/*
 * TODO: Load fonts and objects following the model below.
 *       Maybe import serif and sans-serif JSON fonts to engine?

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

*/

module.exports = theme;
