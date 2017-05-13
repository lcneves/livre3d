/*
 * utils.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utilities for the Livre3D engine.
 * Part of the Livre project.
 */

'use strict';

const THREE = require('three');

function getDimensions(object) {
  var bbox = new THREE.Box3().setFromObject(object);
  return {
    x: bbox.Max.x - bbox.Min.x,
    y: bbox.Max.y - bbox.Min.y,
    z: bbox.Max.z - bbox.Min.z
  };
}

function makeInitialPosition() {
  return {
    reference: undefined,
    distance: undefined
  };
}

class ObjectLivre extends THREE.Object3D {
  constructor() {
    super();

    this.userData = {
      position: {
        x: makeInitialPosition(),
        y: makeInitialPosition(),
        z: makeInitialPosition()
      },
      get dimensions() {
        return getDimensions(this);
      }
    };
  }
}

module.exports = {
  ObjectLivre: ObjectLivre
};
