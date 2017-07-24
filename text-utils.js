/*
 * font-cache.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Lazy-loads font character geometries to a cache.
 */

'use strict';

const THREE = require('three');
const windowUtils = require('./window-utils.js');
const objectCommons = require('./object-commons.js');
const objectUtils = require('./object-utils.js');
const Object3D = require('./object3d');
const cache = require('./cache.js');

function makeTexture (character, style) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  ctx.font = style.fontSize + 'px ' + style.fontFamily;
  canvas.width = ctx.measureText(character).width;
  canvas.height = style.fontSize * 1.2; // fontsize * 1.5

  // after setting the canvas width/height we have to re-set font to apply!?
  // looks like ctx reset
  ctx.font = style.fontSize + 'px ' + style.fontFamily;
  ctx.fillStyle = 'white';
  ctx.fillText(character, 0, style.fontSize, canvas.width);

  var texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter; // NearestFilter;

  return texture;
}

function getTextureFromCache (character, style) {
  delete style.color; // Not important for texture

  var descriptor = {
    character: character,
    style: style,
    type: 'text2d'
  };

  var texture = cache.fetch(descriptor);

  if (!texture) {
    texture = makeTexture(character, style);
    cache.insert(descriptor, texture);
  }

  return texture;
}


class CharSprite extends THREE.Sprite {
  constructor (spriteMaterial) {
    super(spriteMaterial);

    this._isSpriteFromCanvas = true;
  }
}

const textSpritePrototype = {
  resize () {
    var width = this.material.map.image.width;
    var aspect = width / this.material.map.image.height;
    var scaleFactor = windowUtils.getFontScaleFactor(width);

    this.scale.set(scaleFactor, scaleFactor / aspect, 1);

    this.w3dAllNeedUpdate();
  }
};

objectUtils.importPrototype(CharSprite.prototype, objectCommons);
objectUtils.importPrototype(CharSprite.prototype, textSpritePrototype);

class Word2D extends THREE.Object3D {
  constructor (word, style) {
    if (!word) {
      throw new Error('Invalid word!');
    }

    super();

    this._isWord2D = true;
    this._originalWorldToPixels = windowUtils.worldToPixels;

    var charArray = word.split('');

    for (let character of charArray) {
      let material = new THREE.SpriteMaterial({
        map: getTextureFromCache(character, style),
        color: style.color
      });

      let sprite = new CharSprite(material);
      sprite.resize();

      this.add(sprite);
    }
  }
}

const word2DPrototype = {
  resize () {
    var scaleFactor = windowUtils.worldToPixels / this._originalWorldToPixels;
    this.scale.set(scaleFactor, scaleFactor, 1);

    this.w3dAllNeedUpdate();
  },

  add (object) {
    THREE.Object3D.prototype.add.call(this, object);
    object._parent = this;

  }
};

objectUtils.importPrototype(Word2D.prototype, objectCommons);
objectUtils.importPrototype(Word2D.prototype, word2DPrototype);
