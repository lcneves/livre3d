/*
 * window-utils.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility functions for the window 3D geometry.
 * Part of the Livre project.
 */

'use strict';

var _worldWidth = undefined;
var _windowWidth = undefined;
var _windowHeight = undefined;

module.exports = {
  init: function (worldWidth, windowWidth, windowHeight) {
    _worldWidth = worldWidth;
    _windowWidth = windowWidth;
    _windowHeight = windowHeight;
  },

  get windowWidth () {
    return _windowWidth;
  },

  set windowWidth (value) {
    _windowWidth = value;
  },

  get windowHeight () {
    return _windowHeight;
  },

  set windowHeight (value) {
    _windowHeight = value;
  },

  get aspectRatio () {
    return _windowWidth / _windowHeight;
  },

  // Returns the number of pixels that is equivalent of one world unit
  // at z === 0 (far)
  get worldToPixels () {
    if (_windowWidth !== undefined && _worldWidth !== undefined) {
      return _windowWidth / _worldWidth;
    }
    else {
      throw new Error('Screen geometry has not been defined!');
    }
  },

  // A text sprite multiplied by this value result in the proper size
  // when text is placed at z === 0 (far)
  getFontScaleFactor: function getFontScaleFactor (canvasWidth) {
    return canvasWidth / this.worldToPixels;
  }
};

