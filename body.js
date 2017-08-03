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
