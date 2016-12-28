const R = require('ramda');

//DOM mapping functions
module.exports.spanMap = R.curry((document, term) => {
  var span = document.createElement('span');
  span.className = Object.keys(term.pos).join(" ");
  if (term.MadLib)
    span.className = span.className += " MadLib";
  span.dataset.index = term.Index;
  span.title = Object.keys(term.pos).join(" ");
  span.innerHTML = term.whitespace.preceding + term.text + term.whitespace.trailing;
  return span;
});

module.exports.inputMap = R.curry((document, valueAndPlace) => {
  let input = document.createElement('input');
  input.type = 'text';
  input.placeholder = valueAndPlace[1];
  input.value = valueAndPlace[0];
  return input;
});
