/*
 * window-utils.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility functions for the window 3D geometry.
 * Part of the Livre project.
 */

'use strict';

var _worldWidth = undefined;
var _worldDepth = undefined;
var _windowWidth = undefined;
var _windowHeight = undefined;

module.exports = {
  init (worldWidth, worldDepth, windowWidth, windowHeight) {
    _worldWidth = worldWidth;
    _worldDepth = worldDepth;
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

  get windowDepth () {
    return _worldDepth * _windowWidth / _worldWidth;
  },

  get aspectRatio () {
    return _windowWidth / _windowHeight;
  },

  get worldWidth () {
    return _worldWidth;
  },

  get worldHeight () {
    return _worldWidth / _windowWidth * _windowHeight;
  },

  get worldDepth () {
    return _worldDepth;
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

  // A text sprite multiplied by this value results in the proper size
  // when text is placed at z === 0 (far)
  getFontScaleFactor (canvasWidth) {
    return canvasWidth / this.worldToPixels;
  }
};
