/*
 * ht3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Exports a function that parses an HT3D string, creates a tree of w3d objects
 * and adds them to the provided parent object.
 * Part of the Livre project.
 */

'use strict';

const Object3D = require('./object3d.js');
const htmlparser = require('htmlparser2');

const knownTags = [ 'div', 'nav', 'footer', 'span', 'p', 'h1', 'h2', 'h3', 'h4',
  'h5', 'h6', 'a', 'img', 'w3d-object' ];

var currentObject;
var ignoredTag = false;

var parser = new htmlparser.Parser({
  onopentag: function(tagName, attribs) {
    if (knownTags.indexOf(tagName) === -1) {
      ignoredTag = true;
      return;
    }

    var object = new Object3D();
    object.setProperty('tag', tagName);

    for (let a in attribs) {
      if (attribs.hasOwnProperty(a)) {
        object.setProperty(a, attribs[a]);
      }
    }

    currentObject.add(object);
    currentObject = object;
  },
  ontext: function (text) {
    if (!ignoredTag) {
      currentObject.setProperty('text', text.trim());
      currentObject.makeText();
    }
  },
  onclosetag: function (tagNameIgnored) {
    if (ignoredTag)
      ignoredTag = false;
    else
      currentObject = currentObject.parent;
  }
}, {
  decodeEntities: true,
  lowerCaseTags: true,
  lowerCaseAttributeNames: true,
  recognizeSelfClosing: true
});

function parse (html, parentObject) {
  currentObject = parentObject;
  parser.parseComplete(html);
}

module.exports.parse = parse;
