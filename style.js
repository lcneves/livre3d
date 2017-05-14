/*
 * style.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility tools for styling with the Livre3D engine.
 * Part of the Livre project.
 */

'use strict';

module.exports = function(options) {
  var config = options ? options : {};
  config.publicPath = config.publicPath | '/public';

  // From https://mathiasbynens.be/notes/xhr-responsetype-json
  function getJSON(url) {
    return new Promise((resolve, reject) => {
      var xhr = typeof XMLHttpRequest != 'undefined'
        ? new XMLHttpRequest()
        : new ActiveXObject('Microsoft.XMLHTTP');
      xhr.open('get', url, true);
      xhr.onreadystatechange = function() {
        var status;
        var data;
        // 
        https://xhr.spec.whatwg.org/#dom-xmlhttprequest-readystate
        if (xhr.readyState === 4) { // `DONE`
          status = xhr.status;
          if (status === 200) {
            data = JSON.parse(xhr.responseText);
            resolve(data);
          } else {
            reject(status);
          }
        }
      };
      xhr.send();
    });
  }

  function load(source, destination) {
    for (let category in source) {
      if (source.hasOwnProperty(category)) {
        if (!destination.hasOwnProperty(category)) {
          destination[category] = {};
        }
        for (let item in source[category]) {
          destination[category][item] = source[category][item];
          destination[category][item].dataPromise = new Promise(resolve => {
            getJSON(config.publicPath + destination[category][item].src)
              .then(data => resolve(data));
          });
        }
      }
    }
  }

  function make(object, styleArray) {
    var results = {};

    function copyProps(selector) {
      for (let property in selector) {
        if (selector.hasOwnProperty(property)) {
          results[property] = selector[property];
        }
      }
    }

    function copyDefaults() {
      for (let style of styleArray) {
        if (style.defaults) {
          copyProps(style.defaults);
        }
      }
    }

    function checkEqual(property, selector) {
      return property === selector;
    }

    function checkIndex(property, selector) {
      return property.indexOf(selector) !== -1;
    }

    function copy(origProp, destProp, check) {
      for (let style of styleArray) {
        if (style[origProp]) {
          for (let selector in style[origProp]) {
            if (style[origProp].hasOwnProperty(selector) &&
              check(object[destProp], selector)) {
                copyProps(style[origProp][selector]);
            }
          }
        }
      }
    }

    copyDefaults();
    copy('tags', '_tag', checkEqual);
    copy('classes', '_class', checkIndex);
    copy('ids', '_id', checkEqual);

    return results;
  }

  return {
    load: load,
    make: make
  };
};
