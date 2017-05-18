/*
 * ht3d.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility tools for importing HT3D documents into the Livre3D engine.
 * Part of the Livre project.
 */

'use strict';

const Object3D = require('./object3d.js');


function parse(ht3d) {
  // Reading can be: beginning, tag name, property, value, text
  var reading = 'beginning';
  var finished = false;
  var currentObject = null;
  var currentTag = '';
  var currentProp = '';
  var propValue 
  var text = '';

  // Builder
  function openTag() {
    reading = "tag name";
    currentTag = '';
    finished = false;
  }
  function writeTag(thisChar) {
    currentTag += thisChar;
  }
  function endTag() {
    if (currentTag) {
      let object = new Object3D();
      object._tag = currentTag;

      if (currentObject) {
        currentObject.add(object);
      }
      currentObject = object;
    }
    finished = true;
    currentTag = '';
  }
  function closeTag() {
    if (currentObject && currentObject.parent) {
      currentObject = currentObject.parent;
    }
  }
  function startProp(thisChar) {
    reading = 'property';
    finished = false;
    currentProp = thisChar;
  }
  function writeProp(thisChar) {
    currentProp += thisChar;
  }
  function endProp() {
    finished = true;
  }
  function startValue() {
    finished = false'
    reading = 'value';
    propValue = '';
  }
  function writeValue(thisChar) {
    propValue += thisChar;
  }
  function endValue() {
    finished = true;
    currentObject['_' + currentProp] = propValue;
  }
  function startText(thisChar) {
    finished = false;
    reading = 'text';
    text = thisChar;
  }
  function writeText(thisChar) {
    text += thisChar;
  }
  function endText() {
    finished = true;
    if (currentObject) {
      currentObject._text = text;
    }
  }

  // Director
  for (let i = 0; i < ht3d.length; i++) {
    let thisChar = ht3d.charAt(i);

    switch (reading) {
      case 'beginning':
        if (thisChar === '<') {
          openTag();
        }
        break;
      case 'tag name':
        if (!finished) {
          if (!/\s/.test(thisChar)) {
            if (thisChar === '>') {
              endTag();
            }
            else {
              writeTag(thisChar);
            }
          }
          else if (currentTag) {
            closeTag();
          }
        }
        else {
          if (!/\s/.test(thisChar)) {
            if (thisChar === '/') {
              closeTag();
            }
            else {
              startProperty(thisChar);
            }
          }
        }
        break;
      case 'property':
        if (!finished) {
        }
        else {
        }
        break;
      case 'value':
        if (!finished) {
        }
        else {
        }
        break;
      case 'text':
        if (!finished) {
        }
        else {
        }
        break;
    }
  }
}


