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
      var size = object.stretchedSize;
      var material = new THREE.MeshLambertMaterial({
        color: object.getStyle('background-color')
      });
      var geometry = new THREE.PlaneGeometry(size.x, size.y);
      super(geometry, material);

      this._isBackground = true;
      this._ignoreSize = true;
      this.receiveShadow = true;
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
  get size () {
    return makeInitialVirtualBox();
  },
  get innerSize () {
    return this.size;
  },
  get totalSize () {
    return this.size;
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

function getAxis (object, type) {
  var direction = object.getStyle('direction');
  var directionAxis;

  switch (direction) {
    case 'row':
      directionAxis = type === 'cross' ? 'y' : 'x';
      break;
    case 'stack':
      directionAxis = type === 'cross' ? 'x' : 'z';
      break;
    default:
      directionAxis = type === 'cross' ? 'x' : 'y';
      break;
  }
  return directionAxis;
}

function getWorldDimensions (object, prefix) {
  prefix = prefix ? prefix + '-' : '';
  const radical = ['width', 'height', 'depth'];
  var dimensions = {};

  for (let i = 0; i < radical.length; i++) {
    dimensions[AXES[i]] =
      units.convert(object.getStyle(prefix + radical[i]), 'world');
  }

  return dimensions;
}

function getSizeFromBbox (bbox) {
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

  else if (object._isSpriteFromCanvas) {
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

function getStretchedSize (object) {
  const display = object.getStyle('display');
  const parentDirection = object._parent.getStyle('direction');
  const alignSelf = object.getStyle('align-self');
  const align = alignSelf !== 'initial'
    ? alignSelf : object._parent.getStyle('align-items');

  var size = object.size;

  switch (display) {
    case 'plane':
      size.x = object.containerSize.x;
      size.y = object.containerSize.y;
      break;

    case 'block':
      if (align === 'stretch') {
        if (parentDirection === 'column') {
          size.x = object.containerSize.x;
        }
        else if (parentDirection === 'row') {
          size.y = object.containerSize.y;
        }
      }
      break;
  }

  return size;
}

function getSize (object) {
  if (!object._isw3dObject) {
    return getSizeFromBbox(getBboxFromObject(object));
  }
}

function getInnerSize (object) {
  if (object._isw3dObject) {
    return removeSpacers(object.size, getSpacers(object, 'padding'));
  }
  else {
    return object.size;
  }
}

function getOuterSize (object) {
  if (object._isw3dObject) {
    return addSpacers(object.size, getSpacers(object, 'margin'));
  }
  else {
    return object.size;
  }
}

function getMinContentContribution (object) {
  const minDimensions = getWorldDimensions(this, 'min');
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if (!child._ignoreSize) {
      for (let axis of AXES) {
        virtualBox[axis] = Math.max(
          virtualBox[axis],
          minDimensions[axis],
          child.totalSize[axis]
        );
      }
    }
  }

  return virtualBox;
}

function getMaxContentContribution (object) {
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if (!child._ignoreSize) {
      for (let axis of AXES) {
        virtualBox[axis] += child.totalSize[axis];
      }
    }
  }

  const maxDimensions = getWorldDimensions(this, 'max');
  for (let axis of AXES) {
    virtualBox[axis] = Math.min(virtualBox[axis], maxDimensions[axis]);
  }

  return virtualBox;
}

function getContentContribution (object, minMax) {
  if (minMax !== 'min' && minMax !== 'max') {
    throw new Error('Expected parameter to be \'min\' or \'max\', got: ' +
      JSON.Stringify(minMax));
  }

  if (!object._isw3dObject) {
    return object.size;
  }

  var virtualBox = minMax === 'min'
    ? getMinContentContribution(object)
    : getMaxContentContribution(object);

  virtualBox = addSpacers(virtualBox, getSpacers(object, 'padding'));
  virtualBox = addSpacers(virtualBox, getSpacers(object, 'margin'));

  return virtualBox;
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
    var size = object.size;
    return {
      left: 0,
      right: size.x,
      top: size.y,
      bottom: 0,
      far: 0,
      near: size.z
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
    }
  }
  return position;
}

function positionChildren (object) {
  var offset = makeInitialPosition();
  offset.x.distance += getSpacer(object, 'left');
  offset.y.distance += getSpacer(object, 'top');
  offset.z.distance += getSpacer(object, 'far');

  let directionAxis = getAxis(object);
  let crossAxis = getAxis(object, 'cross');

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

      offset[directionAxis].distance += child.totalSize[directionAxis];
    }

    for (let axis of AXES) {
      child.position[axis] = position[axis];
    }

    if (child._isw3dObject) {
      child.positionChildren();
    }
  }
}

function positionChildren (object) {
  var mainAxis = getAxis(object);
  var crossAxis = getAxis(object, 'cross');
  var minContributions = 0;
  var maxContributions = 0;
  const innerSize = this.innerSize;

  for (let child of this.children) {
    minContributions += child.minContentContribution[mainAxis];
    maxContributions += child.maxContentContribution[mainAxis];
  }

  if (maxContributions <= innerSize[mainAxis]) {
    //TODO: Continue here.
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

function isHeader (object) {
  switch (object.getProperty('tag')) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return true;
    default:
      return false;
  }
}

Object.assign(module.exports, {
  Background: Background,
  forceUpdate: forceUpdate,
  getBoundaries: getBoundaries,
  getContentContribution: getContentContribution,
  getSize: getSize,
  getOuterSize: getOuterSize,
  getAxis: getAxis,
  getFontSize: getFontSize,
  getInnerSize: getInnerSize,
  getStretchedSize: getStretchedSize,
  importPrototype: importPrototype,
  isHeader: isHeader,
  positionChildren: positionChildren,
  updateBackground: updateBackground
});
