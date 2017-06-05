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

function getGeometry(character, options) {
  var hash = objectHash({ character: character, options: options });

  console.dir(cache[hash]);

  return cache[hash] ? cache[hash] :
    cache[hash] = new THREE.TextGeometry(character, options);
};

module.exports = getGeometry;
