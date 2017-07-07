/*
 * font-cache.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Lazy-loads font character geometries to a cache.
 */

'use strict';

const THREE = require('three');
const objectHash = require('object-hash');

var cache = {};

function makeCharGeometry(character, style) {
  var hash = objectHash({ character: character, style: style });

  console.dir(cache[hash]);

  return cache[hash] ? cache[hash] :
    cache[hash] = new THREE.TextGeometry(character, style);
}

function makeWordGeometry(word, style) {
  var charArray = word.split('');
  var offset = 0;
  var geometry = new THREE.Geometry();

  for (let character of charArray) {
    var charGeometry = makeCharGeometry(character, style);
    charGeometry.translate(offset, 0, 0);
    geometry.merge(charGeometry);
    charGeometry.computeBoundingBox();
    offset += charGeometry.boundingBox.max.x - charGeometry.boundingBox.min.x;
  }

  return geometry;
}

module.exports.makeWordGeometry = makeWordGeometry;
