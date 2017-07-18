/*
 * style.js
 * Copyright 2017 Lucas Neves <lcneves@gmail.com>
 *
 * Utility tools for styling with the w3d engine.
 * Part of the Livre project.
 */

'use strict';

const THREE = require('three');

const fontLoader = new THREE.FontLoader();

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
                  .then(data => {
                    if (category === 'fonts') {
                      data = fontLoader.parse(data);
                    }
                    resolve(data);
                  });
              });
            }
          }
        }
      }
    }
    return results;
  }

  function checkSpacers(property, value) {
    return ((property === 'margin' || property === 'padding') &&
        (typeof value === 'number' || typeof value === 'string'));
  }

  function parseSpacers(property, value) {
    var results = {};
    const directions = ['top', 'right', 'bottom', 'left', 'far', 'near'];

    if (typeof value === 'string') {
      var values = value.split(' ');

      switch (values.length) {
        case 1:
          results[property + '-' + 'top'] =
            results[property + '-' + 'right'] =
            results[property + '-' + 'bottom'] =
            results[property + '-' + 'left'] =
            values[0];

          results[property + '-' + 'far'] =
            results[property + '-' + 'near'] = 0;
          break;
        case 2:
          results[property + '-' + 'top'] =
            results[property + '-' + 'bottom'] =
            values[0];

          results[property + '-' + 'left'] =
            results[property + '-' + 'right'] =
            values[1];

          results[property + '-' + 'far'] =
            results[property + '-' + 'near'] = 0;
          break;
        case 3:
          results[property + '-' + 'top'] = values[0];
          results[property + '-' + 'bottom'] = values[1];

          results[property + '-' + 'left'] =
            results[property + '-' + 'right'] = values[2];

          results[property + '-' + 'far'] =
            results[property + '-' + 'near'] = 0;
          break;
        case 4:
        case 5:
        case 6:
          for (let i = 0; i < values.length; i++) {
            results[property + '-' + directions[i]] = values[i];
          }
          for (let i = directions.length - 1; i >= values.length; i--) {
            results[property + '-' + directions[i]] = 0;
          }
          if (values.length === 5) {
            results[property + '-' + 'near'] =
              results[property + '-' + 'far'];
          }
          break;
        default:
          throw new Error('Invalid number of values!');
      }
    }
    else if (typeof value === 'number') {
      results[property + '-' + 'top'] =
        results[property + '-' + 'right'] =
        results[property + '-' + 'bottom'] =
        results[property + '-' + 'left'] =
        value;
      results[property + '-' + 'far'] =
        results[property + '-' + 'near'] = 0;
    }
    else { // Invalid value, let's assume zero
      for (let direction of directions) {
        results[property + '-' + direction] = 0;
      }
    }

    return results;
  }

  // Iterates the array of stylesheets and apply relevant styles to the object.
  function make(styleArray, object) {
    var results = {};

    function copyProps(selector) {
      for (let property in selector) {
        if (selector.hasOwnProperty(property)) {
          if (checkSpacers(property, selector[property])) {
            let spacers = parseSpacers(property, selector[property]);
            for (let key in spacers) {
              if (spacers.hasOwnProperty(key)) {
                results[key] = spacers[key];
              }
            }
          }
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
                check(object._ht3d[destProp], selector)) {
              copyProps(style[origProp][selector]);
            }
          }
        }
      }
    }

    if (object._ht3d) {
      copyDefaults();
      copy('tags', 'tag', checkEqual);
      copy('classes', 'class', checkIndex);
      copy('ids', 'id', checkEqual);
    }
    return results;
  }

  return {
    loadResources: loadResources,
    make: make
  };
};
