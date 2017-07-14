'use strict';

const THREE = require('three');
const fontCache = require('./font-cache.js');
const windowUtils = require('./window-utils.js');
const units = require('./units.js');

const CURVE_SEGMENTS = 12;

function getColorString(num) {
  const filling = '000000';
  var hexString = num.toString(16);
  hexString = filling + hexString;
  hexString = '#' + hexString.slice(-6);
  return hexString;
}

function resizeMesh (newWorldToPixelsRatio) {
  var scaleFactor = this._worldToPixelsRatio / newWorldToPixelsRatio;
  this.scale.set(scaleFactor, scaleFactor, scaleFactor);
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
        var mesh = new THREE.Mesh(geometry, material);

        // Needed to scale when screen width changes
        mesh._worldToPixelsRatio = windowUtils.worldToPixels;
        mesh._resize = resizeMesh;
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
      canvas.height = fontSize * 2; // fontsize * 1.5

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
      sprite = new THREE.Sprite(spriteMaterial);

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
    switch (this._ht3d.tag) {
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

