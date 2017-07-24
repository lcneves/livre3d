/*
 * object3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Exports an object that extends THREE.Object3D with extra functionality.
 * Part of the w3d project.
 */

'use strict';

const THREE = require('three');
const style = require('./style.js');
const objectUtils = require('./object-utils.js');
const objectCommons = require('./object-commons.js');
const messages = require('./messages.js');
const theme = require('./theme.js');

module.exports = class Object3D extends THREE.Object3D {
  constructor (options) {
    super();

    const ht3d = require('./ht3d.js');

    options = (options && typeof options === 'object') ? options : {};

    // This passes a parameter to the HT3D parser that will be incorporated
    // in the resulting Object3D as the `_parent` property. It is necessary
    // for inheritance of style properties without messing with THREE's
    // `parent` property.
    var parentObject = options.setParent ? options.setParent : null;

    if (options.hypertext) {
      return ht3d.parse(options.hypertext, parentObject);
    }

    if (options.template) {
      const hypertext = theme.templates[options.template]();
      return ht3d.parse(hypertext, parentObject);
    }

    if (options.mesh) {
      super.add(options.mesh);
    }

    this._parent = parentObject;
    this._isw3dObject = true;
  }
}

const object3DPrototype = {
  get fontSize () {
    return objectUtils.getFontSize(this);
  },

  getStyle (property) {
    if (this._style[property] !== undefined) {
      return this._style[property];
    }
    else if (this._parent) {
      return this._parent.getStyle(property);
    }
    else {
      return undefined;
    }
  },

  w3dUpdateChildren () {
    this.w3dAllNeedUpdate();
    for (let child of this.children) {
      if (child._isw3dObject) {
        child.w3dUpdateChildren();
      }
    }
  },

  resize () {
    this.w3dUpdateChildren();

    for (let child of this.children) {
      child.resize();
    }

    this.updateBackground();
  },

  updateBackground () {
    objectUtils.updateBackground(this);
  },

  get stretchedDimensions () {
    if (!this._stretchedDimensions) {
      this._stretchedDimensions = this._parent
        ? objectUtils.getStretchedDimensions(this)
        : this.dimensions;
    }
    return this._stretchedDimensions;
  },

  positionChildren () {
    objectUtils.positionChildren(this);
  },

  arrangeChildren () {
    this.resize();
    this.positionChildren();
  },

  getProperty (property) {
    if (this._ht3d) {
      return this._ht3d[property];
    }
    else {
      return undefined;
    }
  },

  setProperty (property, value) {
    if (property && typeof property === 'string') {
      this._ht3d = this._ht3d ? this._ht3d : {};
      this._ht3d[property] = value;
    }
    else {
      throw new Error('Invalid inputs!');
    }
  },

  makeStyle () {
    this._style = style.make(this);

    if (this._style['background-color']) {
      this.add(new objectUtils.Background(this));
    }
  },

  makeText () {
    const text = require('./text.js');

    if (typeof this.getProperty('text') === 'string') {
      var textPromise = objectUtils.isHeader(this)
        ? text.makeText3D(this) : text.makeText2D(this);
      textPromise.then(textArray => {
        for (let i = 0; i < textArray.length; i++) {
          let rearrange = (i === textArray.length - 1);
          this.add(textArray[i], { rearrange: rearrange });
        }
      });
    }
  },

  // Overrides THREE.Object3D's add function
  add (object, options) {
    THREE.Object3D.prototype.add.call(this, object);

    object._parent = this;

    if (options && options.rearrange) {

      var topObject = this;
      while (topObject._parent && topObject._parent._isw3dObject) {
        topObject = topObject._parent;
      }
      messages.setMessage('needsArrange', topObject);
    }
  }
};

objectUtils.importPrototype(module.exports.prototype, objectCommons);
objectUtils.importPrototype(module.exports.prototype, object3DPrototype);

