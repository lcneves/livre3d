/*
 * engine.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Engine for the Livre project based on WebGL and three.js
 */

'use strict';

module.exports = function (options) {
  
  const ht3d = require('./ht3d.js'),
        style = require('./style.js'),
        Object3D = require('./object3d.js'),
        Body = require('./body.js'),
        Camera = require('./camera.js');

  const THREE = require('three');

  const theme = options.theme;

  const far =
    theme.worldWidth / (2 * Math.tan(theme.hfov / 2 * Math.PI / 180 ));
  const dimensions = {
    width: theme.worldWidth,
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
      switch light.type {
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
      scene.add(newLight);
    }

    // Continue here
    body = new theme.Body(window.innerWidth / window.innerHeight);

    scene.add(lights);
    scene.add(body);

    render();
  }

  // Functions to be exported.
  // Exported functions get assigned to a variable. Utility functions don't.
  var makeShell = function makeShell() {
    // TODO: config based on options

    resetScene();

    makeTestCorners();

//    makeHeader();

  };

  function makeHeader() {
    theme.makeMenu()
      .then(menu => body.addRelative(menu)); // TODO: catch

    theme.makeLogo()
      .then(logo => body.addRelative(logo));
  }

  function makeTestCorners() {
    theme.makeCornersArray.forEach(func => {
      func().then(corner => body.addRelative(corner));
    });
  }

  // Test screen with a theme-generated grid.
  // TODO: Development only!
  theme.makeGrid().then(grid => body.addRelative(grid));

  return {
    makeShell: makeShell
  };
};
