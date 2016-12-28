const {render, setAttribute} = require('./io_functions.js');
const {spanMap, inputMap} = require('./dom_element_map_functions.js');
const {createRenderElements, enterRenderElements, doneRenderElements} = require('./render_functions.js');
const processStateChange = require('./fake_redux/processStateChange.js');
const renderStateCurry = require('./fake_redux/renderState.js');
const {onlyClass, onlyThese} = require('./event_filters.js');
const IO = require('monet').IO;
const R = require('ramda');

//get references to root and buttons
var root = document.getElementById('root'),
  createButton = document.getElementById('create-button'),
  enterButton = document.getElementById('enter-button'),
  doneButton = document.getElementById('done-button'),
  highlightButton = document.getElementById('highlight-button'),
  resetButton = document.getElementById('reset-button');

//helpers for events
let getWords = R.map(R.prop('value'));
let onlyBodyCreate = onlyClass((p) => p.nodeName == 'BODY', 'create');
let onlyTheseWords = onlyThese(['Noun', 'Verb', 'Adjective', 'Adverb']);

//events
root.addEventListener('click', (e) => {
  if(e.target.nodeName === "SPAN" &&
  onlyBodyCreate(e.path) &&
  onlyTheseWords(e.target)){
    dispatch({type: 'indexes', value: e.target.dataset.index});
  }
});

root.addEventListener('blur', (e) => {
  if(onlyBodyCreate(e.path))
    dispatch({type: 'text', value: root.innerText});
});

createButton.addEventListener('click', () => dispatch({type: 'stepChange', value: 'create'}));
enterButton.addEventListener('click', () => dispatch({type: 'stepChange', value: 'enter'}));
doneButton.addEventListener('click', () => dispatch({type: 'stepChange', value: 'done'}));
highlightButton.addEventListener('click', () => dispatch({type: 'highlightChange'}));
resetButton.addEventListener('click', () => dispatch({type: 'reset'}));

document.addEventListener('keyup', (e) => {
  if(e.target.nodeName === 'INPUT'){
    dispatch({type: 'words', value: getWords(document.getElementsByTagName('input'))});
  }
});

//curried render to root
let rootRender = render(root);
let createRender = R.compose(rootRender, R.map(spanMap(document)), createRenderElements);
let enterRender = R.compose(rootRender, R.map(inputMap(document)), enterRenderElements);
let doneRender = R.compose(rootRender, R.map(spanMap(document)), doneRenderElements);
window.e = enterRenderElements;

//configure renderState
let renderState = renderStateCurry(setAttribute('className', document.getElementsByTagName('body')[0]),
setAttribute('disabled', doneButton),
createRender,
enterRender,
doneRender);

//application state stuff
let impureStateActions = (state) => {
  return IO(() => {
    console.log(state);
    s = state;
    oldStates = R.insert(oldStates.length, state, oldStates);
  });
}

//function for state update and render
let dispatchCompose = R.compose(
  R.tap(renderState),
  processStateChange
);

//a hack for global state
let dispatch = (action) => R.compose(impureStateActions, dispatchCompose)(s, action).run()
//hack to show/not sure where to put this
window.s = {};
window.oldStates = [];
window.renderState = renderState;
//init
dispatch({type: 'init', value: {text: root.innerText, madIndexes: [], madWords: [], step: 'create', disableDone: true, highlight: ''}});
