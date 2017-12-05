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
const xhr = require('./utils/xhr.js');

const lights = document.getElementsByTagName('w3d-light');
const camera = document.getElementsByTagName('w3d-camera')[0];
const fonts = document.getElementsByTagName('w3d-font');

const fontSansRegular = require(
  './fonts/droid/droid_sans_regular.typeface.json');
const fontSansBold = require(
  './fonts/droid/droid_sans_bold.typeface.json');
const fontSerifRegular = require(
  './fonts/droid/droid_serif_regular.typeface.json');
const fontSerifBold = require(
  './fonts/droid/droid_serif_bold.typeface.json');
const fssr = fontLoader.parse(fontSansRegular);
const fssb = fontLoader.parse(fontSansBold);
const fser = fontLoader.parse(fontSerifRegular);
const fseb = fontLoader.parse(fontSerifBold);

var theme = {
  resources: {
    fonts: {
      'sans-serif': {
        'normal': new Promise(resolve => resolve(fssr)),
        'bold': new Promise(resolve => resolve(fssb))
      },
      'serif': {
        'normal': new Promise(resolve => resolve(fser)),
        'bold': new Promise(resolve => resolve(fseb))
      }
    }
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

// Load (or override) fonts
for (let f of fonts) {
  if (!f.attributes['family'] ||
      typeof f.attributes['family']['value'] !== 'string')
    throw new Error('w3d-font tag needs a "family" attribute!');
  if (!f.attributes['src'] ||
      typeof f.attributes['src']['value'] !== 'string')
    throw new Error('w3d-font tag needs a "src" attribute!');

  if (!theme.resources.fonts[f.attributes['family']['value']])
    theme.resources.fonts[f.attributes['family']['value']] = {};

  let weight = f.attributes['weight']
    ? f.attributes['weight']['value'] : 'normal';
  theme.resources.fonts[f.attributes['family']['value']][weight] =
      new Promise(resolve => {
      xhr(f.attributes['src']['value'], 'json').then(data => {
        var font = fontLoader.parse(data);
        resolve(font);
      });
    });
}

module.exports = theme;
