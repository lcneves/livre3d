'use strict';

const THREE = require('three');
const fontCache = require('./font-cache.js');

const CURVE_SEGMENTS = 12;

module.exports = function(fonts) {

  function makeText(text, style) {
    var wordStringArray = text.split(' ');
    var fontPromise = fonts[
      style['font-family'] + '-' + style['font-weight']
    ].dataPromise;

    return new Promise(resolve => {
      fontPromise.then(font => {
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

