'use strict';

module.exports = `
word {
  flex-direction: row
}

body {
  width: 100vw;
  height: 100vh;
  flex-direction: stack;
  font-family: sans-serif;
  font-size: 16;
  font-weight: normal;
  color: ff000000;
  background-color: ffffffff;
  word-spacing: 0.3em
}

div {
  align-self: stretch
}

p, h1, h2, h3, h4, h5, h6 {
  align-self: stretch;
  margin: 0 1em 0;
  flex-direction: row;
  flex-wrap: wrap
}

h1, h2, h3, h4, h5, h6 {
  font-weight: bold;
}

h1 {
  font-size: 32;
}

h2 {
  font-size: 24;
}

h3 {
  font-size: 18.7;
}

h4 {
  font-size: 16;
}

h5 {
  font-size: 13.3;
}

h6 {
  font-size: 10.7;
}
`
