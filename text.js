'use strict';

const THREE = require('three');
const Object3D = require('./object3d.js');

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
          height: (style['font-size'] * 0.2),
          curveSegments: 12
        });
        var material = new THREE.MeshPhongMaterial(
          { color: style['color'] }
        );
        var mesh = new THREE.Mesh(geometry, material);
        var newObject = new Object3D({ mesh: mesh });

        resolve(newObject);
      });
    });
  }

  return {
    make: makeText
  };
};

