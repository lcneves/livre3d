/*
 * engine.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Engine for the Livre project based on WebGL and three.js
 */

'use strict';

const THREE = require('three');

const theme = require('./theme.js');

const Object3D = require('./object3d.js');
const Body = require('./body.js');
const Camera = require('./camera.js');
const windowUtils = require('./window-utils.js');
const messages = require('./messages.js');

const far =
theme.worldWidth / (2 * Math.tan(theme.hfov / 2 * Math.PI / 180 ));
const dimensions = {
  width: theme.worldWidth ? theme.worldWidth : 100,
  far: far,
  near: far * theme.nearFarRatio
};

windowUtils.init(theme.worldWidth, window.innerWidth, window.innerHeight);

var scene;

var camera = new Camera(
    window.innerWidth / window.innerHeight,
    theme.hfov,
    dimensions
    );

var body = new Body(window.innerWidth / window.innerHeight, dimensions);

var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize canvas on window resize
window.addEventListener('resize', function () {
  var aspectRatio = window.innerWidth / window.innerHeight;
  windowUtils.windowWidth = window.innerWidth;
  windowUtils.windowHeight = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (camera) {
    camera.aspectRatio = aspectRatio;
  }

  if (body) {
    body.aspectRatio = aspectRatio;
    messages.setMessage('needsArrange', body);
  }
});

require('./utils/click.js')(THREE, renderer, camera, body);

function arrangeObjects () {
  var objectToArrange = messages.getMessage('needsArrange');
  if (typeof objectToArrange === 'object' &&
      typeof objectToArrange.arrangeChildren === 'function')
  {
    objectToArrange.arrangeChildren();
    messages.setMessage('needsArrange', false);
  }
}

function render () {
  arrangeObjects();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function resetScene () {
  scene = new THREE.Scene();
  if (theme.background) {
    scene.background = new THREE.Color(theme.background);
  }

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

function importTemplate(template, parentObject) {
  parentObject.add(new Object3D({
    template: template,
    setParent: parentObject
  }), { rearrange: true });
}

function makeShell () {
  resetScene();
  importTemplate('shell', body);
  setTimeout(() => {
    console.dir({
      bodyPosition: body.position,
      childPosition: body.children[0].position,
      grandChild0Pos: body.children[0].children[0].position,
      grandChild1Pos: body.children[0].children[1].position,
      body: body
    });
  }, 1500);
}

module.exports.makeShell = makeShell;
