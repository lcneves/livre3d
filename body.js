'use strict';

module.exports = function(Object3D) {
  class Body extends Object3D {
    constructor(aspectRatio, dimensions) {
      super();
      this._aspect = aspectRatio;
      this._dimensions = dimensions;

      this._ht3d = { tag: 'body' };
      this.makeStyle();
    }

    get boundaries() {
      return {
        left: 0,
        right: this._dimensions.width,
        top: 0,
        bottom: this._dimensions.width / this._aspect,
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
      this.arrangeChildren();
    }
  }

  return Body;
};

