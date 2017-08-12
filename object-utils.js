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

function getSpacer (object, direction, onlyMargin) {
  if (object._isw3dObject) {
    return units.convert(object, 'margin-' + direction, 'world') +
      onlyMargin ? 0 : units.convert(object, 'padding-' + direction, 'world');
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

function addSpacers (originalBox, spacers) {
  var box = JSON.parse(JSON.stringify(originalBox));
  for (let axis of AXES) {
    box[axis] += spacers[axis];
  }
  return box;
}

function removeSpacers (originalBox, spacers) {
  var box = JSON.parse(JSON.stringify(originalBox));
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

function alignChildren (parent) {
  for (let child of parent.children) {
    child.align();
    if (child._isw3dObject) {
      child.alignChildren();
    }
  }
}

function align (object) {
  const parent = object._parent || object.parent;
  const crossAxis = getAxes(parent)['cross'];
  const crossSize = parent.innerSize[crossAxis];
  const freeSpace = Math.max(crossSize - object.outerSize[crossAxis], 0);
  const sizeSign = crossAxis === 'y' ? -1 : 1;
  const alignSelf = object._isw3dObject
    ? object.getStyle('align-self') : 'initial';
  const align = alignSelf !== 'initial'
    ? alignSelf : parent.getStyle('align-items');

  switch (align) {
    case 'start':
      break;
    case 'center':
      object.position[crossAxis] += freeSpace * sizeSign / 2;
      break;
    case 'end':
      object.position[crossAxis] += freeSpace * sizeSign;
      break;
    case 'stretch':
      if (object._isw3dObject) {
        var size = object.outerSize;
        size[crossAxis] += freeSpace * sizeSign;
        object.outerSize = size;
      }
      break;
  }
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

function getMinContentContribution (object, wrap, mainAxis) {
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if (!child._ignoreSize) {
      for (let axis of AXES) {
        if (
          axis === mainAxis && wrap === 'nowrap'
        ) {
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

function getMaxContentContribution (object, wrap, mainAxis) {
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
      JSON.stringify(minMax));
  }

  if (!object._isw3dObject) {
    return object.size;
  }

  const wrap = object.getStyle('wrap');
  const mainAxis = getAxes(object)['main'];

  var virtualBox = minMax === 'min'
    ? getMinContentContribution(object, wrap, mainAxis)
    : getMaxContentContribution(object, wrap, mainAxis);

  virtualBox = addSpacers(virtualBox, getSpacers(object, 'padding'));

  const dimensions = getWorldDimensions(object);
  const minDimensions = getWorldDimensions(object, 'min');
  const maxDimensions = getWorldDimensions(object, 'max');
  for (let axis of AXES) {
    if (dimensions[axis] !== undefined) {
      virtualBox[axis] = dimensions[axis];
    }
    else {
      virtualBox[axis] = Math.min(
        Math.max(virtualBox[axis], minDimensions[axis]),
        maxDimensions[axis]
      );
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

function makeInitialOffset (object, onlyMargin) {
  var offset = {
    x: { reference: 'left', distance: 0 },
    y: { reference: 'top', distance: 0 },
    z: { reference: 'far', distance: 0 }
  };

  if (object && object._isw3dObject) {
    offset.x.distance += getSpacer(object, 'left', onlyMargin);
    offset.y.distance += getSpacer(object, 'top', onlyMargin);
    offset.z.distance += getSpacer(object, 'far', onlyMargin);
  }

  return offset;
}

function makePosition (object, offset) {
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

function assignPosition (object, position) {
  for (let axis of AXES) {
    object.position[axis] = position[axis];
  }
}

function getMaxMinDifference (object, axis) {
  return Math.max(
    object.maxContentContribution[axis] -
    object.minContentContribution[axis],
    0);
}

function getJustifyOffset (
  child,
  firstChild,
  childrenCount,
  availableToJustify,
  justifyRule
) {
  if (!availableToJustify) {
    return 0;
  }
  switch (justifyRule) {
    case 'end':
      return child === firstChild ? availableToJustify : 0;
    case 'center':
      return child === firstChild ? availableToJustify / 2 : 0;
    case 'space-between':
      return child === firstChild
        ? 0
        : availableToJustify / (childrenCount - 1);
    case 'space-around':
      return child === firstChild
        ? availableToJustify / (childrenCount * 2)
        : availableToJustify / childrenCount;
    case 'space-evenly':
      return availableToJustify / (childrenCount + 1);
    case 'start':
    default:
      return 0;
  }
}

function positionLine (
  object,
  receivedOffset,
  objectNewSizes,
  minContributions,
  firstChild,
  lastChild,
  justifyRule
) {
  const axes = getAxes(object);

  const availableSpace = Math.max(
    object.containerSpace[axes['main']] - minContributions, 0);

  var totalGrowthToMax = 0;
  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    totalGrowthToMax += getMaxMinDifference(child, axes['main']);
  }

  const availableToMax = Math.min(totalGrowthToMax, availableSpace);
  const maxGrowthFactor = totalGrowthToMax > 0
    ? availableToMax / totalGrowthToMax : 0;

  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    if (child._isBackground) {
      continue;
    }

    let childAvailableSpace = {};
    childAvailableSpace[axes['main']] =
      child.minContentContribution[axes['main']] +
      getMaxMinDifference(child, axes['main']) * maxGrowthFactor;
    for (let axis of ['cross', 'other']) {
      childAvailableSpace[axes[axis]] = Math.max(
        object.containerSpace[axes[axis]] - objectNewSizes[axis], 0);
    }
    child.availableSpace = childAvailableSpace;

    if (child._isw3dObject) {
      child.arrange();
    }
  }

  var childrenSizeMain = 0;
  var totalCSSGrow = 0;
  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    childrenSizeMain += child.outerSize[axes['main']];
    totalCSSGrow += child._isw3dObject ? child.getStyle('grow') : 0;
  }

  var mainSize = 0;
  var crossSize = 0;
  var otherSize = 0;
  var offset = JSON.parse(JSON.stringify(receivedOffset));
  offset[axes['cross']].distance += objectNewSizes.cross;
  var availableToGrow = Math.max(
    object.containerSpace[axes['main']] - childrenSizeMain, 0);

  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];

    if (child._isw3dObject) {
      let grow = child._isw3dObject
        ? child.getStyle('grow') : 0;
      let growFactorCSS = totalCSSGrow
        ? grow / totalCSSGrow : 0;
      let newOuterDimensions = {};
      newOuterDimensions[axes['main']] = child.outerSize[axes['main']] +
        availableToGrow * growFactorCSS;
      for (let axis of ['cross', 'other']) {
        newOuterDimensions[axes[axis]] = child.outerSize[axes[axis]];
      }
      child.outerSize = newOuterDimensions;
    }
  }

  childrenSizeMain = 0;
  var childrenCount = 0;
  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    if (!child._isBackground) {
      childrenSizeMain += child.outerSize[axes['main']];
      childrenCount++;
    }
  }
  var availableToJustify = Math.max(
    object.containerSpace[axes['main']] - childrenSizeMain, 0);

  for (let i = firstChild; i <= lastChild; i++) {
    let child = object.children[i];
    if (!child._isBackground) {
      offset[axes['main']].distance += getJustifyOffset(
        i,
        firstChild,
        childrenCount,
        availableToJustify,
        justifyRule
      );

      let childPosition = makePosition(child, offset);
      assignPosition(child, childPosition);
      offset[axes['main']].distance += child.outerSize[axes['main']];

      mainSize += child.outerSize[axes['main']];
      crossSize = Math.max(crossSize, child.outerSize[axes['cross']]);
      otherSize = Math.max(otherSize, child.outerSize[axes['other']]);
    }
  }

  return { mainSize: mainSize, crossSize: crossSize, otherSize: otherSize };
}

function getAlignmentRules (object) {
  // text-align supercedes justify-content
  var general;
  var last;
  const textAlign = object.getStyle('text-align');
  const justifyContent = object.getStyle('justify-content');

  if (textAlign !== 'initial') {
    switch (textAlign) {
      case 'end':
      case 'right':
        general = last = 'end';
        break;

      case 'center':
        general = last = 'center';
        break;

      case 'justify-all':
        general = last = 'space-between';
        break;

      case 'justify':
        general = 'space-between';
        last = 'start';
        break;

      case 'start':
      case 'left':
      default:
        general = last = 'start';
        break;
    }
  }
  else {
    general = last = justifyContent;
  }

  return {
    general: general,
    lastLine: last
  };
}

function positionChildren (object) {
  const objectAxes = getAxes(object);
  const wrap = (object.getStyle('wrap') === 'wrap');
  const alignmentRules = getAlignmentRules(object);

  var initialOffset = makeInitialOffset(object);

  // At this time, we can only know for sure the object's main axis
  // dimensions. After positioning the children we will know the rest.
  var objectNewSizes = {
    main: 0,
    cross: 0,
    other: 0
  };

  var minContributions = 0;
  var lastPositionedChild = -1;

  for (let i = 0; i < object.children.length; i++) {
    let child = object.children[i];

    if (child._isBackground) {
      continue;
    }

    if (wrap &&
      minContributions + child.minContentContribution[objectAxes.main] >
        object.containerSpace[objectAxes.main]
    ) {
      let lineDimensions = positionLine(
        object,
        initialOffset,
        objectNewSizes,
        minContributions,
        lastPositionedChild + 1,
        i - 1,
        alignmentRules.general
      );

      objectNewSizes.main = Math.max(
        objectNewSizes.main, lineDimensions.mainSize);
      objectNewSizes.cross += lineDimensions.crossSize;
      objectNewSizes.other += lineDimensions.otherSize;

      lastPositionedChild = i - 1;
      minContributions = child.minContentContribution[objectAxes.main];
    }
    else {
      minContributions += child.minContentContribution[objectAxes.main];
    }
  }
  var finalLineDimensions = positionLine(
    object,
    initialOffset,
    objectNewSizes,
    minContributions,
    lastPositionedChild + 1,
    object.children.length - 1,
    alignmentRules.lastLine
  );
  objectNewSizes.main = Math.max(
    objectNewSizes.main, finalLineDimensions.mainSize);
  objectNewSizes.cross += finalLineDimensions.crossSize;
  objectNewSizes.other += finalLineDimensions.otherSize;

  var newOuterDimensions = {};
  const spacers =
    addSpacers(getSpacers(object, 'margin'), getSpacers(object, 'padding'));
  for (let axis of ['main', 'cross', 'other']) {
    newOuterDimensions[objectAxes[axis]] = objectNewSizes[axis] +
      spacers[objectAxes[axis]];
  }
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

    assignPosition(newBg, makePosition(newBg, makeInitialOffset(object, true)));

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
  align: align,
  alignChildren: alignChildren,
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
  importPrototype: importPrototype,
  isHeader: isHeader,
  positionChildren: positionChildren,
  updateBackground: updateBackground
});
