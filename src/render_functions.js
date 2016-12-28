const R = require('ramda');
const {getTerms, processText, replaceText} = require('./text_functions.js');
const filterMadLib = require('./basic_functions.js').filterMadLib;

//render functions
module.exports.createRenderElements = (indexes, text) => {
  return R.compose(
    processText(indexes),
    getTerms
  )(text);
};

module.exports.enterRenderElements = (indexes, words, text) => {
  return R.compose(
    R.zip(words),
    R.map((p) => Object.keys(p).join(' ')),
    R.map(R.prop('pos')),
    R.filter(filterMadLib),
    processText(indexes),
    getTerms
  )(text);
};

module.exports.doneRenderElements = (indexes, words, text) => {
  return R.compose(
    replaceText(indexes, words),
    processText(indexes),
    getTerms
  )(text);
};
