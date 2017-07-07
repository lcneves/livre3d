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

function makeGeometry(word, style) {
  var charArray = word.split('');
  var offset = 0;
  var geometry = fontCache(text, {
    font: font,
    size: style['font-size'],
    height: style['font-height'],
    curveSegments: CURVE_SEGMENTS
  });

}

function getGeometry(character, options) {
  var hash = objectHash({ character: character, options: options });

  console.dir(cache[hash]);

  return cache[hash] ? cache[hash] :
    cache[hash] = new THREE.TextGeometry(character, options);
}

module.exports = ;
