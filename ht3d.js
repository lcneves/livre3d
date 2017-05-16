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
  var reading = 'nothing';
  var currentObject = null;
  var currentTag = '';
  var currentProp = '';
  var propValue 
  var text = '';

  function openTag() {
    reading = "tag name";
  }
  function startTag(thisChar) {
    reading = 'tag name';
    currentTag = thisChar;
  }
  function writeTag(thisChar) {
    currentTag += thisChar;
  }
  function endTag() {
    reading = 'nothing';
    if (currentTag) {
      let object = new Object3D();
      object._tag = currentTag;

      if (currentObject) {
        currentObject.add(object);
      }
      currentObject = object;
    }
  }
  function startProp(thisChar) {
    reading = 'property';
    currentProp = thisChar;
  }
  function writeProp(thisChar) {
    currentProp += thisChar;
  }
  function startValue() {
    reading = 'value';
    propValue = '';
  }
  function writeValue(thisChar) {
    propValue += thisChar;
  }
  function endProp() {
    reading = 'nothing';
    currentObject['_' + currentProp] = propValue;
  }
  function startText(thisChar) {
    reading = 'text';
    text = thisChar;
  }
  function writeText(thisChar) {
    text += thisChar;
  }
  function endText() {
    if (currentObject) {
      currentObject._text = text;
    }

  for (let i = 0; i < ht3d.length; i++) {
    let thisChar = ht3d.charAt(i);

    switch (reading) {
      case 'nothing':
        if (thisChar === '<') {
        }
        else if (!/\s/.test(thisChar)) { // Is not whitespace
          reading = 'text';
          text = thisChar;
        }
        break;

      case 'tag name':
        if (!/\s/.test(thisChar)) {
          switch (thisChar) {
            case '>':
              reading = 'nothing';
              break;

            case '/':
              reading = 'tag close';
              break;
          }
        }
        else {
        }

      case 'tag close':
        if (thisChar === '>') {
          if (currentObject) {
            currentObject = currentObject.parent;
          }
        }
        break;

      case 'property':
        break;

      case 'value':
        break;

      case 'text':
        break;
    }
  }
}


