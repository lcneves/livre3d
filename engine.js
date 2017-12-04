/*
 * engine.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Engine for the Livre project based on WebGL and three.js
 */

'use strict';

require('babel-polyfill');

// First things first: let's hide all boring 2D content.
for (let c of document.body.children)
  c.style.display = 'none';
document.body.style.margin = '0';

const THREE = require('three');

const style = require('./style.js');
const theme = require('./theme.js');
const Object3D = require('./object3d.js');
const Body = require('./body.js');
const Camera = require('./camera.js');
const ht3d = require('./ht3d.js');
const windowUtils = require('./window-utils.js');
const messages = require('./messages.js');
const ua = require('./style/ua.js');
const xhr = require('./utils/xhr.js');

const far =
  theme.worldWidth / (2 * Math.tan(theme.hfov / 2 * Math.PI / 180 ));
const dimensions = {
  width: theme.worldWidth ? theme.worldWidth : 100,
  far: far,
  near: far * theme.nearFarRatio
};

windowUtils.init(
  theme.worldWidth,
  dimensions.far - dimensions.near,
  window.innerWidth,
  window.innerHeight
);


var updatables = [];

var scene;

var camera = new Camera(
  window.innerWidth / window.innerHeight,
  theme.hfov,
  dimensions
);

var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.style.display = 'block';
document.body.appendChild(renderer.domElement);

// Resize canvas on window resize
window.addEventListener('resize', function () {
  var aspectRatio = window.innerWidth / window.innerHeight;
  windowUtils.windowWidth = window.innerWidth;
  windowUtils.windowHeight = window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);

  for (let updatable of updatables) {
    updatable._update();
  }

  if (camera) {
    camera.aspectRatio = aspectRatio;
  }

  if (body) {
    messages.setMessage('needsArrange', body);
  }
});

require('./utils/click.js')(THREE, renderer, camera, body);

function arrangeObjects () {
  var objectToArrange = messages.getMessage('needsArrange');
  if (typeof objectToArrange === 'object' &&
      typeof objectToArrange.arrange === 'function')
  {
    objectToArrange.arrange();
    objectToArrange.alignChildren();
    messages.setMessage('needsArrange', false);
  }
}

function render () {
  arrangeObjects();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function setStyles () {
  return new Promise(resolve => {
    style.dropSheets();
    style.addSheet(ua, { origin: 'ua' });

    var processed = 0;
    const styles = document.getElementsByTagName('w3d-style');
    for (let s of styles) {
      if (s && s.attributes && s.attributes.src &&
        typeof s.attributes.src.value === 'string') {
        xhr(s.attributes.src.value)
          .then(data => {
            if (data && typeof data === 'string') {
              style.addSheet(data);
            }
          })
          .catch(status => console.error('Unable to fetch CSS at '
            + s.attributes.src.value + ' ; status: ' + status))
          .finally(() => {
            if (styles.length === ++processed) resolve();
          });
      }
      else {
        if (styles.length === ++processed) resolve();
      }
    }
  }
}

function configDirectionalLight (light) {
  light.position.set(
    dimensions.width / 2,
    - dimensions.width / (2 * windowUtils.aspectRatio),
    dimensions.near
  );
  light.shadow.camera.left = - dimensions.width / 2;
  light.shadow.camera.right = dimensions.width / 2;
  light.shadow.camera.bottom = - dimensions.width /
    (2 * windowUtils.aspectRatio);
  light.shadow.camera.top = dimensions.width /
    (2 * windowUtils.aspectRatio);
  light.shadow.camera.near = 0;
  light.shadow.camera.far = dimensions.far - dimensions.near;
  light.shadow.camera.updateProjectionMatrix();
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;

}

function configLightTarget (target) {
  target.position.set(
    dimensions.width / 2,
    - dimensions.width / (2 * windowUtils.aspectRatio),
    0
  );
}

function addLights () {
  for (let light of theme.lights) {
    let newLight;
    switch (light.type) {
      case 'ambient':
        newLight = new THREE.AmbientLight(
          light.color ? light.color : 0xffffff,
          light.intensity ? light.intensity : 0.6
        );
        break;

      case 'directional': {
        newLight = new THREE.DirectionalLight(
          light.color ? light.color : 0xffffff,
          light.intensity ? light.intensity : 0.4
        );
        newLight.castShadow = true;
        newLight._update = function () { configDirectionalLight(this); };
        updatables.push(newLight);
        newLight._update();
        let targetObject = new THREE.Object3D();
        targetObject._update = function () { configLightTarget(this); };
        updatables.push(targetObject);
        targetObject._update();
        scene.add(targetObject);
        newLight.target = targetObject;
        break;
      }

      case 'point':
        // PointLight( color, intensity, distance, decay )
        newLight = new THREE.PointLight(
          light.color ? light.color : 0xffffff,
          light.intensity ? light.intensity : 0.2,
          light.distance ? light.distance : 0,
          light.decay ? light.decay : 0
        );
        newLight.position.set(-10, 10, 100);
        newLight.castShadow = true;
        break;
    }
    if (newLight) {
      scene.add(newLight);
    }
  }
}

function resetScene () {
  var makeBody = new Promise(resolve => {
    setStyles().then(() => {
      body = new Body(window.innerWidth / window.innerHeight, dimensions);
      ht3d.parse(document.body.innerHTML, body);
      resolve();
    });
  });

 var makeScene = new Promise(resolve => {
    updatables = [];
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    addLights();
    resolve();
  });

  Promise.all([ makeBody, makeScene ]).then(() => {
    scene.add(body);
    render();
  });
}

resetScene();
