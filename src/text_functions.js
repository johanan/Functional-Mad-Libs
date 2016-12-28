const R = require('ramda');
const nlp_compromise = require('nlp_compromise');
const {splitArray, applyCombine} = require('./higher_order_functions.js');
const {filterFunc, addField, filterMadLib} = require('./basic_functions.js');

//these are all needed for text functions
let addIndexField = R.partial(addField)(['Index']);
let mapIndexed = R.curry(R.addIndex(R.map));
let filterIndexed = R.curry(R.addIndex(R.filter));
let addIndex = mapIndexed(addIndexField);
let addMadLib = R.flip(R.curry(addField)('MadLib'))(true);
let matchMadLib = R.curry((field, madLibArray, term) => {
  return madLibArray.indexOf(term[field]) !== -1;
})('Index');
let findMadLibWord = R.curry((wordArray, mapFunc, term, idx) => {
  let w = wordArray[idx];
  return mapFunc(term, w);
});

//Actual functional steps
module.exports.getTerms = R.compose(
  R.flatten,
  R.curry(R.map)(R.prop('terms')),
  R.prop('sentences'),
  nlp_compromise.text
);

module.exports.processText = R.curry((madIndexes, terms) => {
  return R.compose(
    R.curry(R.sortBy)(R.prop('Index')),
    R.flatten,
    applyCombine(R.map(addMadLib)),
    splitArray(matchMadLib(madIndexes)),
    addIndex
  )(terms);
});

module.exports.replaceText = R.curry((madIndexes, madWords, terms) => {
  //prep before running replace
  //needs to be computed each run
  let fixedWords = R.compose(
    R.map(R.last),
    R.sortBy(R.nth(0))
  )(R.zip(madIndexes, madWords));

  let updateText = findMadLibWord(fixedWords, R.curry(addField)('text'));
  return R.compose(
    R.curry(R.sortBy)(R.prop('Index')),
    R.flatten,
    applyCombine(mapIndexed(updateText)),
    splitArray(filterMadLib)
  )(terms);
});
