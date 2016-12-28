const R = require('ramda');

//helper for processStateChange
let addOrRemoveIndex = (array, item) => {
  return R.contains(item, array) ? R.remove(array.indexOf(item), 1, array) : R.insert(array.length, item, array);
}

module.exports = (state, action) => {
  switch(action.type){
    case 'init':
      return Object.assign({}, state, action.value);

    case 'text':
      return Object.assign({}, state, {text: action.value});

    case 'indexes':
      //add or remove index, reset all the words
      //todo fix this by index
      let indexes = R.sortBy(R.identity, addOrRemoveIndex(state.madIndexes, parseInt(action.value)));
      let words = R.repeat('', indexes.length)
      let disable = R.any(R.equals(''), words)
      return Object.assign({}, state, {madIndexes: indexes, madWords: words, step: 'create', disableDone: disable});

    case 'words':
      return Object.assign({}, state, {madWords: action.value, step: 'entering',
        disableDone: R.any(R.equals(''), action.value)});

    case 'stepChange':
      return Object.assign({}, state, {step: action.value});

    case 'highlightChange':
      return Object.assign({}, state, {highlight: state.highlight === '' ? 'Highlight' : ''});

    case 'reset':
      return Object.assign({}, state, {madIndexes: [], madWords: [], step: 'create', disableDone: true});

    default:
      return state;
  }
};
