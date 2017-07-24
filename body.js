'use strict';

const Object3D = require('./object3d.js');

class Body extends Object3D {
  constructor (aspectRatio, dimensions) {
    super();
    this._aspect = aspectRatio;
    this._bodyDimensions = dimensions;

    this._ht3d = {
      tag: 'body',
      class: '',
      id: ''
    };
    this.makeStyle();
  }

  get boundaries () {
    return {
      left: 0,
        right: this._bodyDimensions.width,
        top: 0,
        bottom: this._bodyDimensions.width / this._aspect,
        far: 0,
        near: this._bodyDimensions.far - this._bodyDimensions.near
    };
  }

  get dimensions () {
    var bodyDimensions = {
      x: this._bodyDimensions.width,
      y: this._bodyDimensions.width / this._aspect,
      z: this._bodyDimensions.far - this._bodyDimensions.near
    };

    return bodyDimensions;
  }

  set aspectRatio (value) {
    this._aspect = value;
  }
}

module.exports = Body;
