/*
 * ht3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Exports a function that parses an HT3D string and returns a Livre3D object.
 * Part of the Livre project.
 */

'use strict';

function parse(html, Object3D) {

  var array = html.split('>');
  for (let index = 0; index < array.length; index++) {
    while (array[index].indexOf('<') > 0) {
      var text = array[index].substring(0, array[index].indexOf('<')).trim();
      var newTag = array[index].substring(array[index].indexOf('<')).trim();
      array[index] = newTag;
      if (text) { array.splice(index, 0, text); }
    }

    array[index] = array[index].trim();
  }

  function getTagName(line) {
    var re = /^<(\w+)/gi;
    var results = re.exec(line);
    return results[1];
  }

  function getProps(line) {
    var re = /([\w-]+)="([\w\s-]+)"/gi;
    var results = [];
    var prop;
    while ((prop = re.exec(line)) !== null) {
      let value = prop[1] === 'class' ? prop[2].split(' ') : prop[2];
      results.push({ name: prop[1], value: value });
    }
    return results;
  }

  function checkSelfClose(line) {
    return (line.charAt(line.length - 1) === '/');
  }

  function closeTag() {
    if (currentObject) {
      currentObject.makeStyle();

      if (currentObject.parent) {
        currentObject = currentObject.parent;
      }
    }
  }

  function parseTagLine(line) {
    var tagName = getTagName(line);
    var props = getProps(line);

    if (tagName) {
      var object = new Object3D();
      object.setProperty('tag', tagName);

      for (let prop of props) {
        object.setProperty(prop.name, prop.value);
      }

      if (currentObject) {
        currentObject.add(object);
      }
      currentObject = object;
    }

    if (checkSelfClose(line)) {
      closeTag();
    }
  }

  var currentObject = null;
  for (let line of array) {
    if (line.charAt(0) === '<') {
      if (line.charAt(1) === '/') {
        closeTag();
      }
      else {
        parseTagLine(line);
      }
    }
    else if (currentObject && line) {
      currentObject.setProperty('text', line);
    }
  }

  return currentObject;
}

module.exports.parse = parse;

