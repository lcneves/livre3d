'use strict';

const THREE = require('three');
const fontCache = require('./font-cache.js');

module.exports = function(fonts) {

  function makeGeometry(word, style) {
    var charArray = word.split('');
    var offset = 0;
    var geometry = fontCache(text, {
      font: font,
      size: style['font-size'],
      height: style['font-height'],
      curveSegments: 12
    });

  }

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

