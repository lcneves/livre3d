#!/usr/bin/env node
/*
 * css-compiler.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Compiles CSS files into a single file, with modifications.
 * Part of the w3d project.
 */

'use strict';

const fs = require('fs');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  {
    name: 'files',
    alias: 'f',
    type: String,
    multiple: true,
    defaultOption: true
  },
  {
    name: 'output',
    alias: 'o',
    type: String,
    multiple: false
  },
  {
    name: 'quiet',
    alias: 'q',
    type: Boolean
  }

];
const options = commandLineArgs(optionDefinitions);

var buffer = '';

for (let file of options.files) {
  buffer += fs.readFileSync(file, 'utf8') + '\n';
}

buffer = buffer
  .replace(':hover', '.hover')
  .replace(':visited', '.visited');

fs.writeFile(options.output, buffer, (err) => {
  if (err) throw err;
  if (!options.quiet) {
    console.log('File ' + options.output + ' has been saved!');
  }
});
