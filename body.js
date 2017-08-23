/*
 * body.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Root element for a w3d page.
 * Part of the w3d project.
 */

'use strict';

const Object3D = require('./object3d.js');

class Body extends Object3D {
  constructor () {
    super();

    this._ht3d = {
      tag: 'body',
      class: '',
      id: ''
    };
    this.makeStyle();

    this._isBody = true;
  }

  align () {}

  get availableSpace () {
    return this.outerSize;
  }
}

module.exports = Body;
