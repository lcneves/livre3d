/*
 * style.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility tools for styling with the w3d engine.
 * Part of the Livre project.
 */

'use strict';

const libcss = require('libcss-w3d');

var styles = {};
var objects = {};
var rootElement = null;

function setRootElement (object) {
  while (object.parent)
    object = object.parent;

  rootElement = object;
}

function getObject (uuid) {
  if (!objects[uuid])
    objects[uuid] = rootElement.getObjectByProperty('uuid', uuid);

  return objects[uuid];
}

function addSheet (sheet) {
  styles = {};
  libcss.addSheet(sheet);
}

function dropSheets () {
  styles = {};
  libcss.dropSheets();
}

function getStyle (object) {
  if (!styles[object.uuid]) {
    setRootElement(object);
    styles[object.uuid] = libcss.getStyle(object.uuid);
  }

  return styles[object.uuid];
}

var config = {
  getTagName: function (uuid) {
    var obj = getObject(uuid);
    return obj.getProperty('tagName');
  },
  getAttributes: function (uuid) {
    var obj = getObject(uuid);
    return obj.attributes;
  },
  getSiblings: function (uuid) {
    var obj = getObject(uuid);
    if (!obj.parent)
      return [ obj ];

    var siblings = [];
    for (let child of obj.parent.children)
      siblings.push(child.uuid);
    return siblings;
  },
  getAncestors: function (uuid) {
    var obj = getObject(uuid);
    var ancestors = [];
    while (obj.parent) {
      ancestors.push(obj.parent);
      obj = obj.parent;
    }
    return ancestors;
  },
  isEmpty: function (uuid) {
    var obj = getObject(uuid);
    if (obj.children[0] !== undefined)
      return false;

    var text = obj.getProperty('text');
    return (typeof text === 'string' && text.trim());
  }
};

libcss.init(config);

module.exports = {
  addSheet: addSheet,
  dropSheets: dropSheets,
  getStyle: getStyle
};

