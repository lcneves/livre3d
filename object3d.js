/*
 * object3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Exports an object that extends THREE.Object3D with extra functionality.
 * Part of the Livre project.
 */

'use strict';

const THREE = require('three');

/*
 * Gives the object's world boundaries relative to its position point.
 * Three.js uses the right-hand coordinate system, so:
 * - the x axis grows to the right;
 * - the y axis grows to the top;
 * - the z axis grows to the near.
 */
function getBoundaries(object) {
  if (object._isLivreObject) {
    var dimensions = object.dimensions;
    return {
      left: 0,
      right: dimensions.x,
      top: dimensions.y,
      bottom: 0,
      far: 0,
      near: dimensions.z
    };
  }
  else {
    const bbox = new THREE.Box3().setFromObject(object);
    return {
      left: object.position.x - bbox.min.x,
      right: bbox.max.x - object.position.x,
      top: bbox.max.y - object.position.y,
      bottom: object.position.y - bbox.min.y,
      far: object.position.z - bbox.min.z,
      near: bbox.max.z - object.position.z
    };
  }
}

/*
 * Gives the object's world dimensions in a boundary box.
 */
function getDimensions(object) {
  if (object._isLivreObject) {
    var virtualBox = {
      x: 0,
      y: 0,
      z: 0
    };
    for (let child of object.children) {
      let dimensions = getDimensions(child);
      virtualBox.x = Math.max(virtualBox.x, dimensions.x);
      virtualBox.y += dimensions.y;
      virtualBox.z = Math.max(virtualBox.z, dimensions.z);
    }
    return virtualBox;
  }

  else {
    const bbox = new THREE.Box3().setFromObject(object);
    return {
      x: bbox.max.x - bbox.min.x,
      y: bbox.max.y - bbox.min.y,
      z: bbox.max.z - bbox.min.z
    };
  }
}


function makeInitialPosition() {
  return {
    x: { reference: 'left', distance: 0 },
    y: { reference: 'top', distance: 0 },
    z: { reference: 'far', distance: 0 }
  };
}

/*
 * Returns the world position that the child should have
 * given its relative position to the parent.
 */

function makeWorldPosition(childObject, parentObject, offset) {
  const parentBoundaries = parentObject.boundaries;
  const childBoundaries = childObject._isLivreObject ?
    childObject.boundaries : getBoundaries(childObject);

  var position = {};

  for (let axis of ['x', 'y', 'z']) {
    let factor;
    switch (offset.reference) {
      case 'right':
      case 'top':
      case 'near':
        factor = -1;
        break;
      default:
        factor = 1;
        break;
    }

    position[axis] =
      parentObject.position[axis] + factor * (
        offset[axis].distance +
        childBoundaries[offset[axis].reference] -
        parentBoundaries[offset[axis].reference]
      );
  }

  return position;
}

function positionChildren(parentObject) {
  var offset = makeInitialPosition();
  for (let child of parentObject.children) {
    let position = makeWorldPosition(child, parentObject, offset);
    for (let axis in ['x', 'y', 'z']) {
      child.position[axis] = position[axis];
    }
    if (child._isLivreObject) {
      positionChildren(child);
    }
    offset.y.distance += getDimensions(child).y;
  }
}

class Object3D extends THREE.Object3D {
  constructor(mesh) {
    super();

    this._isLivreObject = true;

    if (mesh) {
      this.add(mesh);
    }
  }

  get dimensions() {
    return getDimensions(this);
  }

  get boundaries() {
    return getBoundaries(this);
  }

  arrangeChildren() {
    positionChildren(this);
  }

  setWorldPosition(parentObject, offset) {
    parentObject = parentObject || this.parent;
    offset = offset || makeInitialPosition();

    var position = makeWorldPosition(this, parentObject, offset);
    for (let prop in position) {
      if (position.hasOwnProperty(prop)) {
        this.position[prop] = position[prop];
      }
    }
  }

  // Overrides THREE.Object3D's add function
  add(object) {
    THREE.Object3D.prototype.add.call(this, object);

    var topObject = this;
    while (topObject.parent && topObject.parent._isLivreObject) {
      topObject = topObject.parent;
    }
    topObject.arrangeChildren();
  }
}

module.exports = Object3D;
