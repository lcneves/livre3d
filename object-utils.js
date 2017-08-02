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
const CSS_AXES = ['width', 'height', 'depth'];

class Background extends THREE.Mesh {
  constructor (object) {
    if (object && object._isw3dObject) {
      var size = object.size;
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
  get outerSize () {
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

function getAxes (object) {
  var direction = object.getStyle('direction');
  var axes;

  switch (direction) {
    case 'row':
      axes = { main: 'x', cross: 'y', other: 'z' };
      break;
    case 'stack':
      axes = { main: 'z', cross: 'x', other: 'y' };
      break;
    default:
      axes = { main: 'y', cross: 'x', other: 'z' };
      break;
  }

  return axes;
}

function getWorldDimensions (object, prefix) {
  prefix = prefix ? prefix + '-' : '';
  var dimensions = {};

  for (let i = 0; i < CSS_AXES.length; i++) {
    dimensions[AXES[i]] =
      units.convert(object, prefix + CSS_AXES[i], 'world');
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

function getSizesFromStyle (object) {
  if (object._isw3dObject) {
    var sizes = { x: {}, y: {}, z: {} };
    for (let prefix of [ '', 'min-', 'max-' ]) {
      let propName = prefix ? prefix.substring(0, 3) : 'fixed';
      for (let i = 0; i < AXES.length; i++) {
        sizes[AXES[i]][propName] = units.convert(
          object,
          prefix + CSS_AXES[i],
          'world'
        );
      }
    }
    return sizes;
  }
  else {
    throw new Error('Object is not a w3d object!');
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

function getMargins (object, axis) {
  switch (axis) {
    case 'width':
    case 'x':
      return units.convert(object, 'margin-left', 'world') +
        units.convert(object, 'margin-right', 'world');
    case 'height':
    case 'y':
      return units.convert(object, 'margin-top', 'world') +
        units.convert(object, 'margin-bottom', 'world');
    case 'depth':
    case 'z':
      return units.convert(object, 'margin-far', 'world') +
        units.convert(object, 'margin-near', 'world');
    default:
      throw new Error('Invalid axis! Received: ' + JSON.stringify(axis));
  }
}

function getContainerSpace (object) {
  return removeSpacers(
    removeSpacers(object.availableSpace, getSpacers(object, 'margin')),
    getSpacers(object, 'padding')
  );
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
  if (object._isw3dObject) {
    return removeSpacers(object.outerSize, getSpacers(object, 'margin'));
  }
  else {
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

function getMainAxisInnerSize (object) {
  var axes = getAxes(object);

  return Math.max(
    object.minContentContribution[axes['main']],
    Math.min(
      object.maxContentContribution[axes['main']],
      object.availableSpace[axes['main']]
    )
  );
}

function getOuterSize (object) {
  if (object._isw3dObject) {
    const axes = getAxes(object);
    var dimensions = {};
    for (let i = 0; i < AXES.length; i++) {
      let size = units.convert(object, CSS_AXES[i], 'world');
      if (size !== undefined) {
        dimensions[AXES[i]] = size + getMargins(object, CSS_AXES[i]);
      }
      else {
        if (AXES[i] === axes['main']) {
          dimensions[AXES[i]] = Math.max(
            object.minContentContribution[AXES[i]],
            Math.min(
              object.maxContentContribution[AXES[i]],
              object.availableSpace[AXES[i]]
            )
          );
        }
        else {
          dimensions[AXES[i]] = undefined;
        }
      }
    }
    return dimensions;
  }
  else {
    return object.size;
  }
}

function getMinContentContribution (object, minDimensions, wrap, mainAxis) {
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if (!child._ignoreSize) {
      for (let axis of AXES) {
        if (axis === mainAxis && wrap === 'nowrap') {
          virtualBox[axis] += child.minContentContribution[axis];
        }
        else {
          virtualBox[axis] = Math.max(
            virtualBox[axis],
            child.minContentContribution[axis]
          );
        }
      }
    }
  }

  return virtualBox;
}

function getMaxContentContribution (object, minDimensions, wrap, mainAxis) {
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if (!child._ignoreSize) {
      for (let axis of AXES) {
        if (axis === mainAxis || wrap === 'wrap') {
          virtualBox[axis] += child.maxContentContribution[axis];
        }
        else {
          virtualBox[axis] = Math.max(
            virtualBox[axis],
            minDimensions[axis],
            child.maxContentContribution[axis]
          );
        }
      }
    }
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

  const wrap = object.getStyle('wrap');
  const mainAxis = getAxes(object)['main'];
  const minDimensions = getWorldDimensions(object, 'min');
  const maxDimensions = getWorldDimensions(object, 'max');

  var virtualBox = minMax === 'min'
    ? getMinContentContribution(object, minDimensions, wrap, mainAxis)
    : getMaxContentContribution(object, minDimensions, wrap, mainAxis);

  virtualBox = addSpacers(virtualBox, getSpacers(object, 'padding'));

  const dimensions = getWorldDimensions(object);
  for (let axis of AXES) {
    if (dimensions[axis] !== undefined) {
      virtualBox[axis] = dimensions[axis];
    }
    else {
      virtualBox[axis] = Math.max(virtualBox[axis], minDimensions[axis]);
      virtualBox[axis] = Math.min(virtualBox[axis], maxDimensions[axis]);
    }
  }

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
function makeWorldPosition (object, offset) {
  var position = {};

  for (let axis of AXES) {
    position[axis] = offset[axis].distance;
    if (!object._isw3dObject) {
      position[axis] += object.boundaries[offset[axis].reference];
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

function positionLine (
  object,
  offset,
  minContributions,
  firstChild,
  lastChild
) {
  const axes = getAxes(object);
  const availableSpace = Math.max(
    object.containerSpace[axes['main']] - minContributions, 0);
  var totalGrowth = 0;
  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    let grow = child._isw3dObject ? child.getStyle('grow') : 0;
    totalGrowth += grow;
  }

  var crossSize = 0;
  var otherSize = 0;

  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    if (child._isBackground) {
      continue;
    }

    let grow = availableSpace > 0 && child._isw3dObject
      ? child.getStyle('grow') : 0;
    let growthFactor = totalGrowth
      ? grow / totalGrowth : 0;

    let childAvailableSpace = {};
    childAvailableSpace[axes['main']] =
      child.minContentContribution[axes['main']] +
        availableSpace * growthFactor;
    for (let axis of ['cross', 'other']) {
      childAvailableSpace[axes[axis]] = Math.max(
        object.containerSpace[axes[axis]] - offset[axes[axis]].distance, 0);
    }
    child.availableSpace = childAvailableSpace;

    if (child._isw3dObject) {
      child.arrangeChildren();
    }

    let childPosition = makeWorldPosition(child, offset);
    for (let axis of AXES) {
      child.position[axis] = childPosition[axis];
    }

    offset[axes['main']].distance += child.outerSize[axes['main']];
    crossSize = Math.max(crossSize, child.outerSize[axes['cross']]);
    otherSize = Math.max(otherSize, child.outerSize[axes['other']]);

  }

  return { crossSize: crossSize, otherSize: otherSize };
}

function positionChildren (object) {
  const objectAxes = getAxes(object);
  const wrap = (object.getStyle('wrap') === 'wrap');

  var offset = makeInitialPosition();
  offset.x.distance += getSpacer(object, 'left');
  offset.y.distance += getSpacer(object, 'top');
  offset.z.distance += getSpacer(object, 'far');

  // At this time, we can only know for sure the object's main axis
  // dimensions. After positioning the children we will know the rest.
  var objectCrossSize = 0;
  var objectOtherSize = 0;

  var minContributions = 0;
  var lastPositionedChild = -1;

  for (let i = 0; i < object.children.length; i++) {
    let child = object.children[i];

    if (child._isBackground) {
      continue;
    }

    if (wrap &&
      minContributions + child.minContentContribution[objectAxes.main] >
        object.innerSize[objectAxes.main]
    ) {
      let lineDimensions = positionLine(
        object, offset, minContributions,
        lastPositionedChild + 1, i - 1);

      offset[objectAxes['cross']]['distance'] += lineDimensions.crossSize;
      objectCrossSize += lineDimensions.crossSize;
      objectOtherSize += lineDimensions.otherSize;

      lastPositionedChild = i - 1;
      minContributions = child.minContentContribution[objectAxes.main];
    }
    else {
      minContributions += child.minContentContribution[objectAxes.main];
    }
  }
  var finalLineDimensions = positionLine(object, offset, minContributions,
    lastPositionedChild + 1, object.children.length - 1);
  objectCrossSize += finalLineDimensions.crossSize;
  objectOtherSize += finalLineDimensions.otherSize;

  var newOuterDimensions = {};
  newOuterDimensions[objectAxes['main']] = Math.min(
    object.maxContentContribution[objectAxes['main']],
    object.availableSpace[objectAxes['main']]);
  newOuterDimensions[objectAxes['cross']] = objectCrossSize;
  newOuterDimensions[objectAxes['other']] = objectOtherSize;
  object.outerSize = newOuterDimensions;
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
  if (object._hasBackground) {
    var newBg = new Background(object);
    var bgIndex;

    for (let index = 0; index < object.children.length; index++) {
      if (object.children[index]._isBackground) {
        bgIndex = index;
        break;
      }
    }

    if (bgIndex !== undefined) {
      newBg.parent = object;
      object.children.splice(bgIndex, 1, newBg);
    }
    else {
      object.add(newBg);
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
  getContainerSpace: getContainerSpace,
  getSize: getSize,
  getSizesFromStyle: getSizesFromStyle,
  getOuterSize: getOuterSize,
  getAxes: getAxes,
  getFontSize: getFontSize,
  getInnerSize: getInnerSize,
  getStretchedSize: getStretchedSize,
  importPrototype: importPrototype,
  isHeader: isHeader,
  positionChildren: positionChildren,
  updateBackground: updateBackground
});
