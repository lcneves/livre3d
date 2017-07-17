/*
 * object3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Exports an object that extends THREE.Object3D with extra functionality.
 * Part of the Livre project.
 */

'use strict';

module.exports = function (theme, options) {

  const THREE = require('three');

  const ht3d = require('./ht3d.js');
  const style = require('./style.js')(options);
  theme.resources = style.loadResources(theme.stylesheets);
  const text = require('./text.js')(theme.resources.fonts);
  const windowUtils = require('./window-utils.js');
  const units = require('./units.js');
  const messages = require('./messages.js');

  class Background extends THREE.Mesh {
    constructor(object) {
      if (object && object._isLivreObject) 
      {
        var dimensions = object.dimensions;
        var material = new THREE.MeshPhongMaterial({
          color: object.getStyle('background-color')
        });
        var geometry = new THREE.PlaneGeometry(dimensions.x, dimensions.y);
        super(geometry, material);

        this._isBackground = true;
        this._ignoreSize = true;
      }
      else {
        throw new Error('Invalid object!');
      }
    }
  }

  function getDirectionAxis(direction) {
    var directionAxis;
      switch (direction) {
        case 'row':
          directionAxis = 'x';
          break;
        case 'stack':
          directionAxis = 'z';
          break;
        default:
          directionAxis = 'y';
          break;
      }
    return directionAxis;
  }

  function getDimensionsFromBbox(bbox) {
    return {
      x: bbox.max.x - bbox.min.x,
      y: bbox.max.y - bbox.min.y,
      z: bbox.max.z - bbox.min.z
    };
  }

  function makeBboxFromImage(image) {
    const worldToPixels = windowUtils.worldToPixels;
    return {
      min: {
        x: - image.width / (2 * worldToPixels),
        y: - image.height / (2 * worldToPixels),
        z: 0
      },
      max: {
        x: image.width / (2 * worldToPixels),
        y: image.height / (2 * worldToPixels),
        z: 0
      }
    };
  }

  function isSpriteFromCanvas (object) {
    return (
      object.material &&
      object.material.map &&
      object.material.map.image &&
      object.material.map.image.width &&
      object.material.map.image.height
    );
  }

  function getBboxFromObject(object) {
    if (object.geometry) {
      if (object.geometry.boundingBox === null) {
        object.geometry.computeBoundingBox();
      }
      var bBox = JSON.parse(JSON.stringify(object.geometry.boundingBox));

      // Adjust bounding box to current scale
      for (let parameter in bBox) {
        for (let axis in bBox[parameter]) {
          bBox[parameter][axis] *= object.scale[axis];
        }
      }
      return bBox;
    }

    else if (isSpriteFromCanvas(object)) {
      return makeBboxFromImage(object.material.map.image);
    }

    // Last resort
    else {
      return new THREE.Box3().setFromObject(object);
    }
  }

  /*
   * Gives the object's world dimensions in a boundary box.
   * By default, does not include margins; only paddings.
   */
  function getDimensions(object, options) {
    if (object._isLivreObject) {
      options = typeof options === 'object' && options !== null ? options : {};
      var virtualBox = {
        x: 0,
        y: 0,
        z: 0
      };
      for (let child of object.children) {
        if(!child._ignoreSize) {
          let dimensions = getDimensions(child, { includeMargin: true });
          for (let axis of ['x', 'y', 'z']) {
            let directionAxis = getDirectionAxis(options.direction);
            if (axis === directionAxis) {
              virtualBox[axis] += dimensions[axis];
            }
            else {
              virtualBox[axis] = Math.max(virtualBox[axis], dimensions[axis]);
            }
          }
        }
      }
      
      virtualBox.x += units.convert(object, 'padding-left', 'world') +
        units.convert(object, 'padding-right', 'world');
      virtualBox.y += units.convert(object, 'padding-top', 'world') +
        units.convert(object, 'padding-bottom', 'world');
      virtualBox.z += units.convert(object, 'padding-far', 'world') +
        units.convert(object, 'padding-near', 'world');

      if (options && options.includeMargin) {
        virtualBox.x += units.convert(object, 'margin-left', 'world') +
          units.convert(object, 'margin-right', 'world');
        virtualBox.y += units.convert(object, 'margin-top', 'world') +
          units.convert(object, 'margin-bottom', 'world');
        virtualBox.z += units.convert(object, 'margin-far', 'world') +
          units.convert(object, 'margin-near', 'world');
      }

      return virtualBox;
    }

    else { // Not _isLivreObject
      return getDimensionsFromBbox(getBboxFromObject(object));
    }
  }

  function getSpacer(object, direction) {
    if (object._isLivreObject) {
      return units.convert(object, 'margin-' + direction, 'world') +
        units.convert(object, 'padding-' + direction, 'world');
    }
    else {
      return 0;
    }
  }

  /*
   * Gives the object's world boundaries relative to its position point.
   * Three.js uses the right-hand coordinate system, so:
   * - the x axis grows to the right;
   * - the y axis grows to the top;
   * - the z axis grows to the near.
   */
  function getBoundaries(object) {
    if (object._isLivreObject) {
      var dimensions = object.dimensions;
      return {
        left: 0,
        right: dimensions.x,
        top: dimensions.y,
        bottom: 0,
        far: 0,
        near: dimensions.z
      };
    }
    else {
      var position = new THREE.Vector3();
      position.setFromMatrixPosition(object.matrixWorld);
      const bbox = getBboxFromObject(object);
      return {
        left: - bbox.min.x,
        right: bbox.max.x,
        top: bbox.max.y,
        bottom: - bbox.min.y,
        far: - bbox.min.z,
        near: bbox.max.z
      };
    }
  }

  function makeInitialPosition() {
    return {
      x: { reference: 'left', distance: 0 },
      y: { reference: 'top', distance: 0 },
      z: { reference: 'far', distance: 0 }
    };
  }

  /*
   * Returns the world position that the child should have
   * given its relative position to the parent.
   */
  function makeWorldPosition(childObject, parentObject, offset) {
    const parentBoundaries = parentObject.boundaries;
    const parentDimensions = parentObject.dimensions;
    const childBoundaries = childObject._isLivreObject ?
      null : getBoundaries(childObject);

    var position = {};

    for (let axis of ['x', 'y', 'z']) {
      position[axis] = offset[axis].distance;
      if (!childObject._isLivreObject) {
        position[axis] += childBoundaries[offset[axis].reference];
      }
      switch (offset[axis].reference) {
        case 'right':
        case 'top':
        case 'near':
          position[axis] = - position[axis];
          break;
        default:
          break;
      }
    }
    return position;
  }

  function scaleSprite (sprite) {
    var width = sprite.material.map.image.width;
    var aspect = width / sprite.material.map.image.height;
    var scaleFactor = windowUtils.getFontScaleFactor(width);

    sprite.scale.set(scaleFactor, scaleFactor / aspect, 1);
  }

  function isText3D (object) {
    return(
      object.geometry &&
      object.geometry.type === 'TextGeometry'
    );
  }

  function resizeChildren (parentObject) {
    for (let child of parentObject.children) {
      if (isText3D(child)) {
        child._resize(windowUtils.worldToPixels);
      }
      else if (isSpriteFromCanvas(child)) {
        scaleSprite(child);
      }
    }

    for (let child of parentObject.children) {
      if (child._isBackground) {
        parentObject.remove(child);
        parentObject.add(new Background(parentObject));
        break;
      }
    }
  }


  function positionChildren(parentObject) {
    var offset = makeInitialPosition();
    offset.x.distance += getSpacer(parentObject, 'left');
    offset.y.distance += getSpacer(parentObject, 'top');
    offset.z.distance += getSpacer(parentObject, 'far');

    for (let i = 0; i < parentObject.children.length; i++) {
      let child = parentObject.children[i];
      let position;

      if (child._isBackground) {
        position = makeWorldPosition(
          child,
          parentObject,
          makeInitialPosition()
        );
      }
      else {
        position = makeWorldPosition(child, parentObject, offset);
        let directionAxis =
          getDirectionAxis(parentObject.getStyle('direction'));
        offset[directionAxis].distance +=
          getDimensions(child, { includeMargin: true })[directionAxis];
      }
      for (let axis of ['x', 'y', 'z']) {
        child.position[axis] = position[axis];
      }
      if (child._isLivreObject) {
        child.arrangeChildren();
      }
    }
  }

  function getFontSize (object) {
    const parsed = units.parse(object.getStyle('font-size'));
    if (parsed.unit === 'em') {
      return object._parent.fontSize * parsed.quantum;
    }
    else {
      return units.convert(object, 'font-size');
    }
  }


  class Object3D extends THREE.Object3D {
    constructor(options) {
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

      this._isLivreObject = true;

    }

    get dimensions() {
      return getDimensions(this);
    }

    get boundaries() {
      return getBoundaries(this);
    }

    get fontSize() {
      return getFontSize(this);
    }

    getStyle(property) {
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

    arrangeChildren() {
      resizeChildren(this);
      positionChildren(this);
    }

    setWorldPosition(parentObject, offset) {
      parentObject = parentObject || this.parent;
      offset = offset || makeInitialPosition();

      var position = makeWorldPosition(this, parentObject, offset);
      for (let prop in position) {
        if (position.hasOwnProperty(prop)) {
          this.position[prop] = position[prop];
        }
      }
    }

    getProperty(property) {
      if (this._ht3d) {
        return this._ht3d[property];
      }
      else {
        return undefined;
      }
    }

    setProperty(property, value) {
      if (property && typeof property === 'string' && value) {
        this._ht3d = this._ht3d ? this._ht3d : {};
        this._ht3d[property] = value;
      }
      else {
        throw new Error('Invalid inputs!');
      }
    }

    makeStyle() {
      this._style = style.make(theme.stylesheets, this);

      if (this._style['background-color']) {
        this.add(new Background(this));
      }
    }

    makeText() {
      if (this.getProperty('text') !== undefined) {
        text.make(this).then(newText => this.add(newText, { rearrange: true }));
      }
    }

    // Overrides THREE.Object3D's add function
    add(object, options) {
      THREE.Object3D.prototype.add.call(this, object);

      object._parent = this;

      if (options && options.rearrange) {
        var topObject = this;
        while (topObject.parent && topObject.parent._isLivreObject) {
          topObject = topObject.parent;
        }
        messages.setMessage('needsArrange', topObject);
      }
    }
  }

  return Object3D;
};
