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
const templates = require('./templates.js');

module.exports = class Object3D extends THREE.Object3D {
  constructor (options) {
    super();

    const ht3d = require('./ht3d.js');

    options = (options && typeof options === 'object') ? options : {};

    if (options.hypertext) {
      return ht3d.parse(options.hypertext, parentObject);
    }

    if (options.template) {
      const hypertext = templates[options.template]();
      return ht3d.parse(hypertext, parentObject);
    }

    if (options.mesh) {
      super.add(options.mesh);
    }

    this.parent = parentObject;
    this._isw3dObject = true;
    this._hasBackground = (this.style['background-color'] !== '#00000000');
  }
};

const object3DPrototype = {
  get fontSize () {
    return objectUtils.getFontSize(this);
  },

  get style () {
    return style.getStyle(this);
  },

  resize () {
    this.w3dAllNeedUpdate();
    for (let child of this.children) {
      child.resize();
    }
  },

  updateBackground () {
    objectUtils.updateBackground(this);
  },

  get containerSpace () {
    if (!this._containerSpace) {
      this._containerSpace = objectUtils.getContainerSpace(this);
    }
    return this._containerSpace;
  },

  get stretchedDimensions () {
    if (!this._stretchedDimensions) {
      this._stretchedDimensions = this.parent
        ? objectUtils.getStretchedDimensions(this)
        : this.dimensions;
    }
    return this._stretchedDimensions;
  },

  positionChildren () {
    objectUtils.positionChildren(this);
  },

  alignChildren () {
    objectUtils.alignChildren(this);
  },

  arrange () {
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

  get attributes () {
    var props = [];
    for (let key in this._ht3d) {
      if (key !== 'tag') {
        props.push({
          attribute: key,
          value: props[key]
        });
      }
    }
    return props;
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

    if (options && options.rearrange) {

      var topObject = this;
      while (topObject.parent && topObject.parent._isw3dObject) {
        topObject = topObject.parent;
      }
      messages.setMessage('needsArrange', topObject);
    }
  }
};

objectUtils.importPrototype(module.exports.prototype, objectCommons);
objectUtils.importPrototype(module.exports.prototype, object3DPrototype);
