/*
* xhr.js
* Copyright 2017 Lucas Neves <lcneves@gmail.com>
*
* XmlHttpRequest utility tool.
* Part of the w3d project.
*/

'use strict';

// From https://mathiasbynens.be/notes/xhr-responsetype-json
function xhr (url, responseType) {
  return new Promise((resolve, reject) => {
    var x = new XMLHttpRequest();

    if (responseType)
      x.responseType = responseType;

    x.open('get', url, true);

    x.onreadystatechange = function() {
      if (x.readyState === 4) { // `DONE`
        if (x.status === 200) {
          resolve(x.responseText);
        } else {
          reject(x.status);
        }
      }
    };
    x.send();
  });
}

module.exports = xhr;
