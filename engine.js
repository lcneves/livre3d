/*
 * engine.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Engine for the Livre project based on WebGL and three.js
 */

'use strict';

module.exports = function (options) {
  
  const ht3d = require('./ht3d.js'),
        style = require('./style.js')(),
        Object3D = require('./object3d.js'),
        Body = require('./body.js'),
        Camera = require('./camera.js');

  const THREE = require('three');

  const theme = options.theme;

  const far =
    theme.worldWidth / (2 * Math.tan(theme.hfov / 2 * Math.PI / 180 ));
  const dimensions = {
    width: theme.worldWidth ? theme.worldWidth : 100,
    far: far,
    near: far * theme.nearFarRatio
  };

  var resources = style.loadResources(theme.stylesheets);

  var scene,
      body,
      lights,
      camera;

  var renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );

  // Resize canvas on window resize
  window.addEventListener('resize', function () {
    var aspectRatio = window.innerWidth / window.innerHeight;

    renderer.setSize(window.innerWidth, window.innerHeight);

    if (camera) {
      camera.aspectRatio = aspectRatio;
    }
    if (body) {
      body.aspectRatio = aspectRatio;
    }
  });

  // Load utility libraries of this project
  require('./utils/click.js')(THREE, renderer, camera, body);

  function render() {
    requestAnimationFrame( render );
    renderer.render( scene, camera );
  }

  function resetScene() {
    scene = new THREE.Scene();
    if (theme.background) {
      scene.background = new THREE.Color(theme.background);
    }

    camera = new Camera(
      window.innerWidth / window.innerHeight,
      theme.hfov,
      dimensions
    );

    for (let light of theme.lights) {
      let newLight;
      switch (light.type) {
        case 'ambient':
          newLight = new THREE.AmbientLight(
            light.color ? light.color : 0xffffff
          );
          break;
        case 'directional':
          newLight = new THREE.DirectionalLight({
            color: light.color ? light.color : 0xffffff,
            intensity: light.intensity ? light.intensity : 0.5,
            position: light.position ? light.position : (1, 1, 1)
          });
          break;
      }
      if (newLight) {
        scene.add(newLight);
      }
    }

    body = new Body(window.innerWidth / window.innerHeight, dimensions);
    scene.add(body);

    render();
  }

  // Functions to be exported.
  // Exported functions get assigned to a variable. Utility functions don't.

  function makeText(object) {
    var fontPromise = resources.fonts[
      object._style['font-family'] + '-' + object._style['font-weight']
    ].dataPromise;

    return new Promise(resolve => {
      fontPromise.then(font => {
        console.dir(font);
        var geometry = new THREE.TextGeometry(object._text, {
          font: font,
          size: object._style['font-size'],
          height: (object._style['font-size'] * 0.1),
          curveSegments: 12
        });
        var material = new THREE.MeshPhongMaterial(
          { color: object._style['color'] }
        );
        var mesh = new THREE.Mesh(geometry, material);
        var newObject = new Object3D(mesh);

        resolve(newObject);
      });
    });
  }

  function makeStylesAndText(object) {
    for (let child of object.children) {
      makeStylesAndText(child);
    }

    style.make(theme.stylesheets, object);

    if (object._text) {
      makeText(object).then(text => object.add(text));
    }
  }

  function importTemplate(template, parent) {
    var hypertext = theme.templates[template]();
    var object = ht3d.parse(hypertext);
    makeStylesAndText(object);
    body.add(object);
  }

  var makeShell = function makeShell() {
    resetScene();
    importTemplate('shell', body);
    setTimeout(() => { console.log(body); }, 1500);
  };

  return {
    makeShell: makeShell
  };
};
