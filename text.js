'use strict';

const THREE = require('three');
const fontCache = require('./font-cache.js');

const CURVE_SEGMENTS = 12;

function getColorString(num) {
  const filling = '000000';
  var hexString = num.toString(16);
  hexString = filling + hexString;
  hexString = '#' + hexString.slice(-6);
  return hexString;
}

module.exports = function(fonts) {

  function makeText3D(text, style) {
//    var wordStringArray = text.split(' ');
    var fontPromise = fonts[
      style['font-family'] + '-' + style['font-weight']
    ].dataPromise;

    return new Promise(resolve => {
      fontPromise.then(font => {
//        var geometry = fontCache.makeWordGeometry(text, {
        var geometry = new THREE.TextGeometry(text, {
          font: font,
          size: style['font-size'],
          height: style['font-height'],
          curveSegments: CURVE_SEGMENTS,
          bevelEnabled: false
        });
        var material = new THREE.MeshPhongMaterial(
          { color: style['color'] }
        );
        var mesh = new THREE.Mesh(geometry, material);

        resolve(mesh);
      });
    });
  }

  // Adapted from https://jsfiddle.net/h9sub275/4/
  function makeTextSprite (text, style) {
    return new Promise(resolve => {
      const fontSize = style['font-size'] * 30;

      var ctx, texture, sprite, spriteMaterial, 
        canvas = document.createElement('canvas');

      ctx = canvas.getContext('2d');
      ctx.font = fontSize + 'px ' + style['font-family'];

      // setting canvas width/height before ctx draw, else canvas is empty
      canvas.width = ctx.measureText(text).width;
      canvas.height = fontSize * 2; // fontsize * 1.5
      var canvasRatio = canvas.width / canvas.height;

      // after setting the canvas width/height we have to re-set font to apply!?
      // looks like ctx reset
      ctx.font = fontSize + 'px ' + style['font-family'];
      ctx.fillStyle = getColorString(style['color']);

      ctx.fillText(text, 0, fontSize, canvas.width);

      document.body.appendChild(canvas);

      texture = new THREE.Texture(canvas);
//      texture.minFilter = THREE.LinearFilter; // NearestFilter;
      texture.needsUpdate = true;

      spriteMaterial = new THREE.SpriteMaterial({map : texture});
      sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(3 * canvasRatio, 3, 1);

      resolve(sprite);
    });
  }

  return {
    make: function (text, style, options) {
      return (options && options.text3D) ?
        makeText3D(text, style) :
        makeTextSprite(text, style);
    }
  };
};

