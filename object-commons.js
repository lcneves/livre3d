/*
 * object-commons.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Common methods for w3d entities.
 * Part of the w3d project.
 */

'use strict';

const objectUtils = require('./object-utils.js');

module.exports = {
  setWorldPosition (parentObject, offset) {
    parentObject = parentObject || this.parent;
    offset = offset || objectUtils.makeInitialPosition();

    var position = objectUtils.makeWorldPosition(this, parentObject, offset);
    for (let prop in position) {
      if (position.hasOwnProperty(prop)) {
        this.position[prop] = position[prop];
      }
    }
  },

  resize () {
    throw new Error(
      'Resize function has not been overridden by implementation!'
    );
  },

  w3dAllNeedUpdate () {
    this.w3dNeedsUpdate = [
      'size',
      'innerSize',
      'boundaries',
      'containerSpace'
    ];
  },

  set w3dNeedsUpdate (property) {
    if (typeof property === 'string') {
      objectUtils.forceUpdate(this, property);
    }
    else if (Array.isArray(property)) {
      for (let prop of property) {
        objectUtils.forceUpdate(this, prop);
      }
    }
  },

  get boundaries () {
    if (!this._boundaries) {
      this._boundaries = objectUtils.getBoundaries(this);
    }
    return this._boundaries;
  },

  get size () {
    if (!this._size) {
      this._size = objectUtils.getSize(this);
    }
    return this._size;
  },

  get innerSize () {
    if (!this._innerSize) {
      this._innerSize = objectUtils.getInnerSize(this);
    }
    return this._innerSize;
  },

  get outerSize () {
    if (!this._outerSize) {
      this._outerSize = objectUtils.getOuterSize(this);
    }
    return this._outerSize;
  },

  set outerSize (newSize) {
    var updatedSize = {};
    var sizesFromStyle = objectUtils.getSizesFromStyle(this);
    for (let axis in newSize) {
      updatedSize[axis] = sizesFromStyle[axis].fixed
        ? sizesFromStyle[axis].fixed
        : Math.max(
          sizesFromStyle[axis].min,
          Math.min(sizesFromStyle[axis].max, newSize[axis])
        );
    }
    this._outerSize = updatedSize;
    this.w3dAllNeedUpdate();
  },

  get availableSpace () {
    return this._availableSpace;
  },

  set availableSpace (value) {
    for (let axis of ['x', 'y', 'z']) {
      if (
        typeof value[axis] !== 'number' ||
        isNaN(value[axis])
      ) {
        throw new Error('New values for availableSpace contain a non-number!' +
          ' Received: ' + JSON.stringify(value));
      }
    }
    this._availableSpace = value;
    this.w3dAllNeedUpdate();
  },

  get minContentContribution () {
    if (!this._minContentContribution) {
      this._minContentContribution =
      objectUtils.getContentContribution(this, 'min');
    }
    return this._minContentContribution;
  },

  get maxContentContribution () {
    if (!this._maxContentContribution) {
      this._maxContentContribution =
        objectUtils.getContentContribution(this, 'max');
    }
    return this._maxContentContribution;
  }
};
