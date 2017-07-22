/*
 * object-utils.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Helper functions and classes for the w3d extension of three.js's Object3D.
 */

'use strict';

const THREE = require('three');

const windowUtils = require('./window-utils.js');
const objectCommons = require('./object-commons.js');
const units = require('./units.js');

const AXES = ['x', 'y', 'z'];

class Background extends THREE.Mesh {
  constructor (object) {
    if (object && object._isw3dObject) {
      var dimensions = object.stretchedDimensions;
      var material = new THREE.MeshPhongMaterial({
        color: object.getStyle('background-color')
      });
      var geometry = new THREE.PlaneGeometry(dimensions.x, dimensions.y);
      super(geometry, material);

      this._isBackground = true;
      this._ignoreSize = true;
    }
    else {
      throw new Error('Invalid object!');
    }
  }
}

const backgroundPrototype = {
  resize () {},
  w3dAllNeedUpdate () {},
  set w3dNeedsUpdate (property) {},
  get dimensions () {
    return makeInitialVirtualBox();
  },
  get innerDimensions () {
    return this.dimensions;
  },
  get totalDimensions () {
    return this.dimensions;
  },
  get boundaries () {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      far: 0,
      near: 0
    };
  }
};

importPrototype(Background.prototype, objectCommons);
importPrototype(Background.prototype, backgroundPrototype);

function getDirectionAxis (direction) {
  var directionAxis;
  switch (direction) {
    case 'row':
      directionAxis = 'x';
      break;
    case 'stack':
      directionAxis = 'z';
      break;
    default:
      directionAxis = 'y';
      break;
  }
  return directionAxis;
}

function getDimensionsFromBbox (bbox) {
  return {
    x: bbox.max.x - bbox.min.x,
    y: bbox.max.y - bbox.min.y,
    z: bbox.max.z - bbox.min.z
  };
}

function makeBboxFromImage (image) {
  const worldToPixels = windowUtils.worldToPixels;
  return {
    min: {
      x: - image.width / (2 * worldToPixels),
      y: - image.height / (2 * worldToPixels),
      z: 0
    },
    max: {
      x: image.width / (2 * worldToPixels),
      y: image.height / (2 * worldToPixels),
      z: 0
    }
  };
}

function getBboxFromObject (object) {
  if (object.geometry) {
    if (object.geometry.boundingBox === null) {
      object.geometry.computeBoundingBox();
    }
    var bBox = JSON.parse(JSON.stringify(object.geometry.boundingBox));

    // Adjust bounding box to current scale
    for (let parameter in bBox) {
      for (let axis in bBox[parameter]) {
        bBox[parameter][axis] *= object.scale[axis];
      }
    }
    return bBox;
  }

  else if (object._isText2D) {
    return makeBboxFromImage(object.material.map.image);
  }

  // Last resort
  else {
    return new THREE.Box3().setFromObject(object);
  }
}

function makeInitialVirtualBox () {
  return {
    x: 0,
    y: 0,
    z: 0
  };
}

function getStretchedDimensions (object) {
  const display = object.getStyle('display');
  const parentDirection = object._parent.getStyle('direction');
  const alignSelf = object.getStyle('align-self');
  const align = alignSelf !== 'initial'
    ? alignSelf : object._parent.getStyle('align-items');

  var dimensions = object.dimensions;

  switch (display) {
    case 'plane':
      dimensions.x = object.containerDimensions.x;
      dimensions.y = object.containerDimensions.y;
      break;

    case 'block':
      if (align === 'stretch') {
        if (parentDirection === 'column') {
          dimensions.x = object.containerDimensions.x;
        }
        else if (parentDirection === 'row') {
          dimensions.y = object.containerDimensions.y;
        }
      }
      break;
  }

  return dimensions;
}

function getDimensionsWithMargin (object) {
  if (object._isw3dObject) {
    return addSpacers(object.dimensions, getSpacers(object, 'margin'));
  }
  else {
    return object.dimensions;
  }
}

/*
 * Gives the object's world dimensions in a boundary box.
 * Does not include margins; only paddings.
 */
function getDimensions (object) {
  if (!object._isw3dObject) {
    return getDimensionsFromBbox(getBboxFromObject(object));
  }

  var direction = object.getStyle('direction');
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if (!child._ignoreSize) {

      let directionAxis = getDirectionAxis(direction);
      for (let axis of AXES) {
        if (axis === directionAxis) {
          virtualBox[axis] += child.totalDimensions[axis];
        }
        else {
          virtualBox[axis] =
            Math.max(virtualBox[axis], child.totalDimensions[axis]);
        }
      }
    }
  }

  virtualBox = addSpacers(virtualBox, getSpacers(object, 'padding'));

  return virtualBox;
}

function getInnerDimensions (object) {
  return removeSpacers(
    object.stretchedDimensions, getSpacers(object, 'padding'));
}


function getSpacer (object, direction) {
  if (object._isw3dObject) {
    return units.convert(object, 'margin-' + direction, 'world') +
      units.convert(object, 'padding-' + direction, 'world');
  }
  else {
    return 0;
  }
}

function getSpacers (object, type) {
  if (object._isw3dObject) {
    return {
      x: units.convert(object, type + '-left', 'world') +
        units.convert(object, type + '-right', 'world'),
      y: units.convert(object, type + '-top', 'world') +
        units.convert(object, type + '-bottom', 'world'),
      z: units.convert(object, type + '-far', 'world') +
        units.convert(object, type + '-near', 'world')
    };
  }
  else {
    return makeInitialVirtualBox();
  }
}

function addSpacers (box, spacers) {
  for (let axis of AXES) {
    box[axis] += spacers[axis];
  }
  return box;
}

function removeSpacers (box, spacers) {
  for (let axis of AXES) {
    box[axis] -= spacers[axis];
  }
  return box;
}

/*
 * Gives the object's world boundaries relative to its position point.
 * Three.js uses the right-hand coordinate system, so:
 * - the x axis grows to the right;
 * - the y axis grows to the top;
 * - the z axis grows to the near.
 */
function getBoundaries (object) {
  if (object._isw3dObject) {
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
    const bbox = getBboxFromObject(object);
    return {
      left: - bbox.min.x,
      right: bbox.max.x,
      top: bbox.max.y,
      bottom: - bbox.min.y,
      far: - bbox.min.z,
      near: bbox.max.z
    };
  }
}

function makeInitialPosition () {
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
function makeWorldPosition (childObject, parentObject, offset) {
  const childBoundaries = childObject._isw3dObject
    ? null : getBoundaries(childObject);

  var position = {};

  for (let axis of AXES) {
    position[axis] = offset[axis].distance;
    if (!childObject._isw3dObject) {
      position[axis] += childBoundaries[offset[axis].reference];
    }
    switch (offset[axis].reference) {
      case 'right':
      case 'top':
      case 'near':
        position[axis] = - position[axis];
        break;
      default:
        break;
    }
  }
  return position;
}

function updateBackground (object) {
  for (let index = 0; index < object.children.length; index++) {
    let child = object.children[index];

    if (child._isBackground) {
      child = new Background(object);
      child.parent = object;
      object.children.splice(index, 1, child);
      break;
    }
  }
}

function positionChildren (object) {
  var offset = makeInitialPosition();
  offset.x.distance += getSpacer(object, 'left');
  offset.y.distance += getSpacer(object, 'top');
  offset.z.distance += getSpacer(object, 'far');

  for (let child of object.children) {
    let position;

    if (child._isBackground) {
      position = makeWorldPosition(
        child,
        object,
        makeInitialPosition()
      );
    }
    else {
      position = makeWorldPosition(child, object, offset);

      let directionAxis =
        getDirectionAxis(object.getStyle('direction'));

      offset[directionAxis].distance += child.totalDimensions[directionAxis];
    }

    for (let axis of AXES) {
      child.position[axis] = position[axis];
    }

    if (child._isw3dObject) {
      child.positionChildren();
    }
  }
}

function getFontSize (object) {
  const parsed = units.parse(object.getStyle('font-size'));
  if (parsed.unit === 'em') {
    return object._parent.fontSize * parsed.quantum;
  }
  else {
    return units.convert(object, 'font-size');
  }
}

function forceUpdate (object, property) {
  property = '_' + property;
  if (object.hasOwnProperty(property)) {
    delete object[property];
  }
}

function importPrototype (object, prototype) {
  for (let key in prototype) {
    let descriptor = Object.getOwnPropertyDescriptor(prototype, key);
    if (descriptor !== undefined) {
      Object.defineProperty(object, key, descriptor);
    }
  }
}

Object.assign(module.exports, {
  Background: Background,
  forceUpdate: forceUpdate,
  getBoundaries: getBoundaries,
  getDimensions: getDimensions,
  getDimensionsWithMargin: getDimensionsWithMargin,
  getDirectionAxis: getDirectionAxis,
  getFontSize: getFontSize,
  getInnerDimensions: getInnerDimensions,
  getStretchedDimensions: getStretchedDimensions,
  importPrototype: importPrototype,
  positionChildren: positionChildren,
  updateBackground: updateBackground
});
