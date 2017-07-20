/*
 * object-utils.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Helper functions and classes for the w3d extension of three.js's Object3D.
 */

'use strict';


const THREE = require('three');

const windowUtils = require('./window-utils.js');
const units = require('./units.js');
const messages = require('./messages.js');

const AXES = ['x', 'y', 'z'];


class Background extends THREE.Mesh {
  constructor(object) {
    if (object && object._isw3dObject) 
    {
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

function getDirectionAxis(direction) {
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

function getDimensionsFromBbox(bbox) {
  return {
    x: bbox.max.x - bbox.min.x,
    y: bbox.max.y - bbox.min.y,
    z: bbox.max.z - bbox.min.z
  };
}

function makeBboxFromImage(image) {
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

function isSpriteFromCanvas (object) {
  return (
      object.material &&
      object.material.map &&
      object.material.map.image &&
      object.material.map.image.width &&
      object.material.map.image.height
      );
}

function getBboxFromObject(object) {
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

  else if (isSpriteFromCanvas(object)) {
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
  if (!object.containerDimensions) {
    if (object._parent) {
      object.containerDimensions = object._parent.dimensions;
    }
    else {
      return object.stretchedDimensions = object.dimensions;
    }
  }

  const display = object.getStyle('display');
  const parentDirection = object._parent.getStyle('direction');
  const alignSelf = object.getStyle('align-self');
  const align = alignSelf !== 'initial' ?
    alignSelf : object._parent.getStyle('align-items');

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

  return object.stretchedDimensions = dimensions;
}

/*
// TODO: Fix this logic. The container dimensions should be the stretched
// dimensions of the parent object.
for (let child of object.children) {
if (child._isw3dObject) {
child.containerDimensions = virtualBox;
child.updateStretchedDimensions();
}
}
*/

/*
 * Gives the object's world dimensions in a boundary box.
 * Does not include margins; only paddings.
 */
function getMinimumDimensions (object) {
  var virtualBox = makeInitialVirtualBox();

  for (let child of object.children) {
    if(!child._ignoreSize) {
      let dimensions = child._isw3dObject ?
        addSpacers(child.updateDimensions(), getSpacers(child, 'margin')) :
        getDimensionsFromBbox(getBboxFromObject(child));

      let directionAxis = getDirectionAxis(options.direction);
      for (let axis of AXES) {
        if (axis === directionAxis) {
          virtualBox[axis] += dimensions[axis];
        }
        else {
          virtualBox[axis] = Math.max(virtualBox[axis], dimensions[axis]);
        }
      }
    }
  }

  virtualBox = addSpacers(virtualBox, getSpacers(object, 'padding'));

  return virtualBox;
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


function getSpacer (object, direction) {
  if (object._isw3dObject) {
    return units.convert(object, 'margin-' + direction, 'world') +
      units.convert(object, 'padding-' + direction, 'world');
  }
  else {
    return 0;
  }
}

/*
 * Gives the object's world boundaries relative to its position point.
 * Three.js uses the right-hand coordinate system, so:
 * - the x axis grows to the right;
 * - the y axis grows to the top;
 * - the z axis grows to the near.
 */
function getBoundaries(object) {
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
    var position = new THREE.Vector3();
    position.setFromMatrixPosition(object.matrixWorld);
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
  const containerDimensions = parentObject.dimensions;
  const childBoundaries = childObject._isw3dObject ?
    null : getBoundaries(childObject);

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

function scaleSprite (sprite) {
  var width = sprite.material.map.image.width;
  var aspect = width / sprite.material.map.image.height;
  var scaleFactor = windowUtils.getFontScaleFactor(width);

  sprite.scale.set(scaleFactor, scaleFactor / aspect, 1);
}

function isText3D (object) {
  return(
      object.geometry &&
      object.geometry.type === 'TextGeometry'
  );
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

function resizeChildren (object) {
  for (let child of object.children) {

    if (child._isw3dObject) {
      child.resizeChildren();
    }

    if (isText3D(child)) {
      child._resize(windowUtils.worldToPixels);
    }
    else if (isSpriteFromCanvas(child)) {
      scaleSprite(child);
    }
  }

  updateBackground(object);
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

      let childTotalDimensions = child._isw3dObject ?
        addSpacers(child.dimensions, getSpacers(child, 'margin')) :
        getDimensionsFromBbox(getBboxFromObject(child));

      let directionAxis =
        getDirectionAxis(object.getStyle('direction'));

      offset[directionAxis].distance += childTotalDimensions[directionAxis];
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


Object.assign(module.exports, {
  Background: Background,
  getBoundaries: getBoundaries,
  getDirectionAxis: getDirectionAxis,
  getFontSize: getFontSize,
  getMinimumDimensions: getMinimumDimensions,
  getStretchedDimensions: getStretchedDimensions,
  isText3D: isText3D,
  positionChildren: positionChildren,
  resizeChildren: resizeChildren,
  scaleSprite: scaleSprite,
  updateBackground: updateBackground
};

