/*
 * camera.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Extends the three.js perspective camera for the Livre3D engine.
 */

'use strict';

const THREE = require('three');

// Based on the code of http://themetalmuncher.github.io/fov-calc/
function getVerticalFOV(hFov, aspectRatio) {
  var hFovRad = hFov * Math.PI / 180;
  var vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspectRatio);
  return vFovRad * 180 / Math.PI;
}

class Camera extends THREE.PerspectiveCamera {
  constructor(aspectRatio, hfov, dimensions) {
    super(
      getVerticalFOV(hfov, aspectRatio),
      aspectRatio,
      dimensions.near,
      dimensions.far
    );

    this.position.x = dimensions.width / 2;
    this.position.y = dimensions.width / 2 / aspectRatio;
    this.position.z = dimensions.far;
    this._dimensions = dimensions;
    this._hfov = hfov;
  }

  set aspectRatio(value) {
    this.aspect = value;
    this.fov = getVerticalFOV(this._hfov, value);
    this.position.y = this._dimensions.width / 2 / value;
    this.updateProjectionMatrix();
  }
}

module.exports = Camera;
