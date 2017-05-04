/*
 * engine.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Engine for the Livre project based on WebGL and three.js
 */

'use strict';

module.exports = function (options) {
  
  var width, height;
  function setViewportParameters () {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  setViewportParameters();

  const THREE = require('three');

  const theme = options.theme;

  var scene,
      body,
      lights,
      camera;

  var renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize( width, height );
  document.body.appendChild( renderer.domElement );

  // Resize canvas on window resize
  window.addEventListener('resize', function () {
    setViewportParameters();
    renderer.setSize(width, height);
    if (camera) {
      camera.update(width, height);
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
    camera = new theme.Camera(width, height);
    lights = new theme.Lights();
    body = new theme.Body();

    scene.add(lights);
    scene.add(body);

    render();
  }

  // Functions to be exported.
  // Exported functions get assigned to a variable. Utility functions don't.
  var makeShell = function makeShell() {
    // TODO: config based on options

    resetScene();

    makeHeader();

  };

  function makeHeader() {
    theme.makeLogo.then(logo => body.add(logo));
    theme.makeMenu.then(menu => body.add(menu));
  }

  return {
    makeShell: makeShell
  };
};
