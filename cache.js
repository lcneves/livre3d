/*
 * cache.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Cache for resources.
 * Part of the w3d project.
 */

'use strict';

const objectHash = require('object-hash');

var cache = {};

function add (object, descriptor) {
  descriptor = descriptor || object;
  var hash = objectHash(descriptor);
  cache[hash] = object;
  return cache[hash];
}

function remove (descriptor) {
  var hash = objectHash(descriptor);
  return delete cache[hash];
}

function removeObject (object) {
  var hash = search(object);
  return delete cache[hash];
}

function retrieve (descriptor) {
  var hash = objectHash(descriptor);
  return cache[hash];
}

function search (object) {
  var index = false;
  for (let key in cache) {
    if (cache[key] === object) {
      index = key;
    }
  }
  return index;
}

module.exports = {
  insert (object, descriptor) {
    descriptor = descriptor || object;
    if (retrieve(descriptor)) {
      return false;
    }
    return add(object, descriptor);
  },

  upsert (object, descriptor) {
    return add(object, descriptor);
  },

  delete (descriptorOrObject) {
    if (retrieve(descriptorOrObject)) {
      return remove(descriptorOrObject);
    }
    else {
      return removeObject(descriptorOrObject);
    }
  },

  fetch (descriptor) {
    return retrieve(descriptor);
  }
};
