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
  setWorldPosition: function setWorldPosition (parentObject, offset) {
    parentObject = parentObject || this.parent;
    offset = offset || objectUtils.makeInitialPosition();

    var position = objectUtils.makeWorldPosition(this, parentObject, offset);
    for (let prop in position) {
      if (position.hasOwnProperty(prop)) {
        this.position[prop] = position[prop];
      }
    }
  }
};

Object.defineProperty(module.exports, 'w3dNeedsUpdate', {
  set: function (property) {
    if (typeof property === 'string') {
      objectUtils.forceUpdate(this, property);
    }
    else if (typeof property === 'object' && property.isArray) {
      for (let prop in property) {
        objectUtils.forceUpdate(this, prop);
      }
    }
  }
});

Object.defineProperty(module.exports, 'dimensions', {
  get: function () {
    if (!this._dimensions) {
      this._dimensions = objectUtils.getMinimumDimensions(this);
    }
    return this._dimensions;
  }
});

Object.defineProperty(module.exports, 'boundaries', {
  get: function () {
    if (!this._boundaries) {
      this._boundaries = objectUtils.getBoundaries(this);
    }
    return this._boundaries;
  }
});
