/*
 * text.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Makes 2D and 3D text for the w3d engine.
 */

'use strict';

const THREE = require('three');
// const fontCache = require('./font-cache.js');
const windowUtils = require('./window-utils.js');
const objectUtils = require('./object-utils.js');
const objectCommons = require('./object-commons.js');
const units = require('./units.js');

const CURVE_SEGMENTS = 12;

class TextMesh extends THREE.Mesh {
  constructor (geometry, material) {
    super(geometry, material);

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

class TextSprite extends THREE.Sprite {
  constructor (spriteMaterial) {
    super(spriteMaterial);

    this._isText2D = true;
  }
}

const textSpritePrototype = {
  resize () {
    var width = this.material.map.image.width;
    var aspect = width / this.material.map.image.height;
    var scaleFactor = windowUtils.getFontScaleFactor(width);

    this.scale.set(scaleFactor, scaleFactor / aspect, 1);

    this.w3dAllNeedUpdate();
  }
};

objectUtils.importPrototype(TextSprite.prototype, objectCommons);
objectUtils.importPrototype(TextSprite.prototype, textSpritePrototype);

function getColorString(num) {
  const filling = '000000';
  var hexString = num.toString(16);
  hexString = filling + hexString;
  hexString = '#' + hexString.slice(-6);
  return hexString;
}

module.exports = function(fonts) {

  function makeText3D(object) {
    const text = object._ht3d.text;

    //    var wordStringArray = text.split(' ');
    var fontPromise = fonts[
      object.getStyle('font-family') + '-' + object.getStyle('font-weight')
    ].dataPromise;

    return new Promise(resolve => {
      fontPromise.then(font => {
        //        var geometry = fontCache.makeWordGeometry(text, {

        var geometry = new THREE.TextGeometry(text, {
          font: font,
          size: units.convert(object, 'font-size', 'world'),
          height: units.convert(object, 'font-height', 'world'),
          curveSegments: CURVE_SEGMENTS,
          bevelEnabled: false
        });
        var material = new THREE.MeshPhongMaterial(
          { color: object.getStyle('color') }
        );
        var mesh = new TextMesh(geometry, material);

        resolve(mesh);
      });
    });
  }

  // Adapted from https://jsfiddle.net/h9sub275/4/
  function makeTextSprite (object) {
    const text = object._ht3d.text;

    return new Promise(resolve => {
      const fontSize = units.convert(object, 'font-size');

      var ctx, texture, sprite, spriteMaterial,
          canvas = document.createElement('canvas');

      ctx = canvas.getContext('2d');
      ctx.font = fontSize + 'px ' + object.getStyle('font-family');

      // setting canvas width/height before ctx draw, else canvas is empty
      canvas.width = ctx.measureText(text).width;
      canvas.height = fontSize * 1.2; // fontsize * 1.5

      // after setting the canvas width/height we have to re-set font to apply!?
      // looks like ctx reset
      ctx.font = fontSize + 'px ' + object.getStyle('font-family');
      ctx.fillStyle = getColorString(object.getStyle('color'));
      ctx.fillText(text, 0, fontSize, canvas.width);

      /*
       * Mesh-based solution. Creates a transparent mesh.
       *
      // Canvas will be black with white text. It will be used as an
      // alpha map.
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';

      var material = new THREE.MeshBasicMaterial({
        color: style['color'],
        alphaMap: texture,
        transparent: true
      });

      var geometry = new THREE.PlaneGeometry(
        fontScaleFactor, fontScaleFactor / canvasRatio
      );

      var mesh = new THREE.Mesh(geometry, material);

      resolve(mesh);

      */

      texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter; // NearestFilter;

      spriteMaterial = new THREE.SpriteMaterial({ map : texture });
      sprite = new TextSprite(spriteMaterial);

      resolve(sprite);

    });
  }

  function make (object) {
    if (!object ||
        !object._ht3d ||
        !object._ht3d.text ||
        typeof object._ht3d.text !== 'string')
    {
      throw new Error('Text string not found in object!');
    }
    switch (object._ht3d.tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return makeText3D(object);

      default:
        return makeTextSprite(object);
    }
  }

  return {
    make: make
  };
};
