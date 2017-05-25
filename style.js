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
  config.publicPath = config.publicPath ? config.publicPath : '/public';

  // From https://mathiasbynens.be/notes/xhr-responsetype-json
  function getJSON(url) {
    return new Promise((resolve, reject) => {
      var xhr = new XMLHttpRequest();
      xhr.open('get', url, true);
      xhr.onreadystatechange = function() {
        var status;
        var data;
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

  // Loads JSON assets (fonts, 3D objects) with XHR and creates dataPromise
  // properties with the asset promise in the returned object.
  function loadResources(styleArray) {
    var results = {};
    for (let source of styleArray) {
      if (source.resources) {
        for (let category in source.resources) {
          if (source.resources.hasOwnProperty(category)) {
            if (!results.hasOwnProperty(category)) {
              results[category] = {};
            }
            for (let item in source.resources[category]) {
              results[category][item] = source.resources[category][item];
              results[category][item].dataPromise = new Promise(resolve => {
                getJSON(config.publicPath + results[category][item].src)
                  .then(data => resolve(data));
              });
            }
          }
        }
      }
    }
    return results;
  }

  // Iterates the array of stylesheets and apply relevant styles to the object.
  // Assigns results to object._style.
  function make(styleArray, object) {
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

    object._style = results;
  }

  return {
    loadResources: loadResources,
    make: make
  };
};
