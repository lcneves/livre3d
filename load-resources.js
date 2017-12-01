/*
* load-resources.js
* Copyright 2017 Lucas Neves <lcneves@gmail.com>
*
* Utility tool for loading theme resources as promises.
* Part of the w3d project.
*/

'use strict';

// From https://mathiasbynens.be/notes/xhr-responsetype-json
function xhr (url) {
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

function getJSON (url) {
  return new Promise((resolve, reject) => {
    xhr(url).then(rawData => { resolve(JSON.parse(rawData)); });
  });
}

// Loads JSON assets (fonts, 3D objects) with XHR and creates dataPromise
// properties with the asset promise in the returned object.
function loadResources (styleArray) {
  const publicPath = '/public';
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
              getJSON(publicPath + results[category][item].src)
                .then(data => {
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

module.exports = {
  xhr: xhr,
  getJSON: getJSON
};
