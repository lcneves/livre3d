'use strict';

module.exports = `
word {
  direction: row
}

body {
  width: 100vw;
  height: 100vh;
  direction: stack;
  font-family: sans-serif;
  font-size: 16;
  font-height: 1;
  font-weight: regular;
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
  direction: row;
  wrap: wrap
}

h1, h2, h3, h4, h5, h6 {
  font-weight: bold;
}

h1 {
  font-size: 32;
  font-height: 8;
}

h2 {
  font-size: 24;
  font-height: 6;
}

h3 {
  font-size: 18.7;
  font-height: 4.67;
}

h4 {
  font-size: 16;
  font-height: 4;
}

h5 {
  font-size: 13.3;
  font-height: 3.33;

}

h6 {
  font-size: 10.7;
  font-height: 2.67;
}
`
