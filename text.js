'use strict';

const THREE = require('three');

module.exports = function(fonts) {

  function makeText(text, style) {
    var fontPromise = fonts[
      style['font-family'] + '-' + style['font-weight']
    ].dataPromise;

    return new Promise(resolve => {
      fontPromise.then(font => {
        var geometry = new THREE.TextGeometry(text, {
          font: font,
          size: style['font-size'],
          height: style['font-height'],
          curveSegments: 12
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

