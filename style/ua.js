'use strict';

module.exports = `
word {
  flex-direction: row
}

body, div, nav, footer, p, h1, h2, h3, h4, h5, h6 {
  display: flex;
}

span, word {
  display: inline-flex;
}

body {
  width: 100vw;
  height: 100vh;
  padding: 8px;
  flex-direction: column;
  font-family: sans-serif;
  font-size: 16px;
  font-weight: normal;
  word-spacing: 0.3em
}

div, nav, footer {
  align-self: stretch
}

p, h1, h2, h3, h4, h5, h6 {
  align-self: stretch;
  flex-direction: row;
  flex-wrap: wrap
}

h1, h2, h3, h4, h5, h6 {
  font-weight: bold;
}

h1 {
  font-size: 32px;
}

h2 {
  font-size: 24px;
}

h3 {
  font-size: 18.7px;
}

h4 {
  font-size: 16px;
}

h5 {
  font-size: 13.3px;
}

h6 {
  font-size: 10.7px;
}
`
