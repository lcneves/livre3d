/*
 * object3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Exports an object that extends THREE.Object3D with extra functionality.
 * Part of the w3d project.
 */

'use strict';

module.exports = function (theme, options) {
  const THREE = require('three');
  const ht3d = require('./ht3d.js');
  const style = require('./style.js')(options);
  theme.resources = style.loadResources(theme.stylesheets);
  const text = require('./text.js')(theme.resources.fonts);
  const objectUtils = require('./object-utils.js');
  const objectCommons = require('object-commons.js');
  const messages = require('./messages.js');

  class Object3D extends THREE.Object3D {
    constructor (options) {
      super();

      options = (options && typeof options === 'object') ? options : {};

      // This passes a parameter to the HT3D parser that will be incorporated
      // in the resulting Object3D as the `_parent` property. It is necessary
      // for inheritance of style properties without messing with THREE's
      // `parent` property.
      var parentObject = options.setParent ? options.setParent : null;

      if (options.hypertext) {
        return ht3d.parse(options.hypertext, parentObject, Object3D);
      }

      if (options.template) {
        const hypertext = theme.templates[options.template]();
        return ht3d.parse(hypertext, parentObject, Object3D);
      }

      if (options.mesh) {
        super.add(options.mesh);
      }

      this._isw3dObject = true;

      Object.assign(this.prototype, objectCommons);
    }

    get fontSize () {
      return objectUtils.getFontSize(this);
    }

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
    }

    resizeChildren () {
      objectUtils.resizeChildren(this);
      this.w3dNeedsUpdate = [
        'dimensions', 'stretchedDimensions', 'boundaries'
      ];
    }

    get containerDimensions () {
      return this._parent
        ? this._parent.stretchedDimensions
        : this.dimensions;
    }

    get stretchedDimensions () {
      if (!this._stretchedDimensions) {
        this._stretchedDimensions = this._parent
          ? objectUtils.getStretchedDimensions(this)
          : this.dimensions;
      }
      return this._stretchedDimensions;
    }

    positionChildren () {
      objectUtils.positionChildren(this);
    }

    arrangeChildren () {
      this.resizeChildren();
      this.positionChildren();
    }

    getProperty (property) {
      if (this._ht3d) {
        return this._ht3d[property];
      }
      else {
        return undefined;
      }
    }

    setProperty (property, value) {
      if (property && typeof property === 'string' && value) {
        this._ht3d = this._ht3d ? this._ht3d : {};
        this._ht3d[property] = value;
      }
      else {
        throw new Error('Invalid inputs!');
      }
    }

    makeStyle () {
      this._style = style.make(theme.stylesheets, this);

      if (this._style['background-color']) {
        this.add(new objectUtils.Background(this));
      }
    }

    makeText () {
      if (this.getProperty('text') !== undefined) {
        text.make(this).then(newText => this.add(newText, { rearrange: true }));
      }
    }

    // Overrides THREE.Object3D's add function
    add (object, options) {
      THREE.Object3D.prototype.add.call(this, object);

      object._parent = this;

      if (options && options.rearrange) {
        this.w3dNeedsUpdate = [
          'dimensions', 'stretchedDimensions', 'boundaries'
        ];

        var topObject = this;
        while (topObject.parent && topObject.parent._isw3dObject) {
          topObject = topObject.parent;
        }
        messages.setMessage('needsArrange', topObject);
      }
    }
  }

  return Object3D;
};
