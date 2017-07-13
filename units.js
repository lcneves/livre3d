/*
 * units.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility functions for parsing and converting style units.
 * Part of the Livre project.
 */

'use strict';

const windowUtils = require('./window-utils.js');

const REM_SIZE = 16;

function parseString (sizeString, tailLength) {
  var numberString = sizeString.slice(-tailLength);
  var number = parseInt(numberString, 10);

  if (isNaN(number)) {
    throw new Error('Size cannot be converted to number! Received ' +
      numberString);
  }

  return number;
}

function toPixels (size, style) {
  if (typeof size === 'number') {
    return size;
  }
  else if (typeof size === 'string') {

    if (size.endsWith('rem')) {
      return parseString(size, 3) * REM_SIZE;
    }
    else if (size.endsWith('em')) {
      return parseString(size, 2) * REM_SIZE; // TODO: * style('font-size');
    }
    else if (size.endsWith('vw')) {
      return parseString(size, 2) * windowUtils.worldToPixels;
    }
    

