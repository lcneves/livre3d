'use strict';

const Object3D = require('./object3d.js');

class Body extends Object3D {
  constructor(aspectRatio, dimensions) {
    super();
    this._aspect = aspectRatio;
    this._dimensions = dimensions;
  }
  
  get boundaries() {
    return {
      left: 0,
      right: this._dimensions.width,
      top: this._dimensions.width / this._aspect,
      bottom: 0,
      far: 0,
      near: this._dimensions.far - this._dimensions.near
    };
  }

  get dimensions() {
    return {
      x: this._dimensions.width,
      y: this._dimensions.width / this._aspect,
      z: this._dimensions.far - this._dimensions.near
    };
  }

  set aspectRatio(value) {
    this._aspect = value;

    this.traverse(object => {
      if (object instanceof Object3D && object !== this) {
        object.setWorldPosition();
      }
    });
  }
}

module.exports = Body;
