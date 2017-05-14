/*
 * engine.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Engine for the Livre project based on WebGL and three.js
 */

'use strict';

module.exports = function (options) {
  
  const THREE = require('three');

  const theme = options.theme;

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
    scene = new theme.Scene();
    camera = new theme.Camera(window.innerWidth, window.innerHeight);
    lights = new theme.Lights();
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
