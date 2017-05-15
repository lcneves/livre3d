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
  for (let i = 0; i < ht3d.length; i++) {
    let thisChar = ht3d.charAt(i);

    switch (reading) {
      case 'nothing':
        if (thisChar === '<') {
          reading = 'tag name';
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
              if (currentTag) {
                let object = new Object3D();

                if (currentObject) {
                  currentObject.add(object);
                }
                currentObject = object;
              }
              reading = 'nothing';
              break;

            case '/':
              reading = 'tag close';
              break;
          }
        }
        else {
          currentTag += thisChar;
        }

      case 'tag close':
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


