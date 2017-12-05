/*
 * text.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Makes 2D and 3D text for the w3d engine.
 * Methods return a promise that resolves to an array of objects to be added.
 */

'use strict';

const THREE = require('three');
const fontLoader = new THREE.FontLoader();
const windowUtils = require('./window-utils.js');
const objectUtils = require('./object-utils.js');
const objectCommons = require('./object-commons.js');
const units = require('./units.js');
const theme = require('./theme.js');
const Word2D = require('./word2d.js');

const CURVE_SEGMENTS = 12;
const FONT_SIZE_HEIGHT_RATIO = 4;

class TextMesh extends THREE.Mesh {
  constructor (geometry, material) {
    super(geometry, material);

    this.castShadow = true;
    this._worldToPixelsRatio = windowUtils.worldToPixels;
    this._isText3D = true;
  }
}

const textMeshPrototype = {
  resize () {
    var scaleFactor = this._worldToPixelsRatio / windowUtils.worldToPixels;
    this.scale.set(scaleFactor, scaleFactor, scaleFactor);

    this.w3dAllNeedUpdate();
  }
};

objectUtils.importPrototype(TextMesh.prototype, objectCommons);
objectUtils.importPrototype(TextMesh.prototype, textMeshPrototype);


function makeText3D (object) {
  const text = object.getProperty('text');

  var fontPromise = theme.resources.fonts[object.style['font-family']][
    object.style['font-weight']];

  return new Promise(resolve => {
    fontPromise.then(font => {
      if (!font.isFont) {
        fontLoader.parse(font);
      }

      var size = units.convert(object, 'font-size', 'world');
      var geometry = new THREE.TextGeometry(text, {
        font: font,
        size: size,
        /* TODO: implement font-height as CSS property. */
        height: size / FONT_SIZE_HEIGHT_RATIO,
        curveSegments: CURVE_SEGMENTS,
        bevelEnabled: false
      });
      var material = new THREE.MeshPhongMaterial(
        { color: objectUtils.parseColor(object.style['color']) }
      );
      var mesh = new TextMesh(geometry, material);

      resolve([mesh]);
    });
  });
}

// Adapted from https://jsfiddle.net/h9sub275/4/
function makeText2D (object) {
  return new Promise(resolve => {
    var wordArray = object.getProperty('text').split(' ');
    const style = {
      fontSize: units.convert(object, 'font-size'),
      fontFamily: object.style['font-family'],
      color: objectUtils.parseColor(object.style['color'])
    };

    for (let i = 0; i < wordArray.length; i++) {
      wordArray[i] = new Word2D(wordArray[i], style, object);
    }

    resolve(wordArray);
  });
}

module.exports.makeText3D = makeText3D;
module.exports.makeText2D = makeText2D;
