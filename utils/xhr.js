/*
* utils.js
* Copyright 2017 Lucas Neves <lcneves@gmail.com>
*
* Utility tools.
* Part of the w3d project.
*/

'use strict';

// From https://mathiasbynens.be/notes/xhr-responsetype-json
function xhr (url, responseType) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();

    if (responseType)
      xhr.responseType = responseType;

    xhr.open('get', url, true);

    xhr.onreadystatechange = function() {
      var status;
      var data;
      if (xhr.readyState === 4) { // `DONE`
        status = xhr.status;
        if (status === 200) {
          resolve(data);
        } else {
          reject(status);
        }
      }
    };
    xhr.send();
  });
}

module.exports = xhr;
