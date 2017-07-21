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
      'dimensions',
      'innerDimensions',
      'totalDimensions',
      'stretchedDimensions',
      'boundaries'
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

  get dimensions () {
    if (!this._dimensions) {
      this._dimensions = objectUtils.getDimensions(this);
    }
    return this._dimensions;
  },

  get innerDimensions () {
    if (!this._innerDimensions) {
      this._innerDimensions = objectUtils.getInnerDimensions(this);
    }
    return this._innerDimensions;
  },

  get totalDimensions () {
    if (!this._totalDimensions) {
      this._totalDimensions = objectUtils.getDimensionsWithMargin(this);
    }
    return this._totalDimensions;
  },

  get containerDimensions () {
    return this._parent
      ? this._parent.innerDimensions
      : this.dimensions;
  },

  get boundaries () {
    if (!this._boundaries) {
      this._boundaries = objectUtils.getBoundaries(this);
    }
    return this._boundaries;
  }
};

