'use strict';

const THREE = require('three');
const fontCache = require('./font-cache.js');

const CURVE_SEGMENTS = 12;

module.exports = function(fonts) {

  function makeText(text, style) {
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

  return {
    make: makeText
  };
};

