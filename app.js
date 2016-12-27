/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	const {filterFunc, addField, filterMadLib} = __webpack_require__(1);

	//get references to root and buttons
	var root = document.getElementById('root'),
	  createButton = document.getElementById('create-button'),
	  enterButton = document.getElementById('enter-button'),
	  doneButton = document.getElementById('done-button'),
	  highlightButton = document.getElementById('highlight-button'),
	  resetButton = document.getElementById('reset-button');

	//basic functions
	/*let filterFunc = (type, term) => term.pos[type] !== undefined;
	let addField = (field, term, value) => {
	  return Object.assign({}, term, {[field]: value})
	};
	let filterMadLib = (term) => term.MadLib;
	*/

	//higher-order functions
	let splitArray = R.curry((func, a) => {
	  return [R.filter(func, a), R.filter(R.complement(func), a) ];
	});
	let applyCombine = R.curry((func, a) => {
	  return [func(a[0]), a[1]];
	});

	//curried ready for compose
	//these are used in the functional steps
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

	//DOM mapping functions
	let spanMap = (term) => {
	  var span = document.createElement('span');
	  span.className = Object.keys(term.pos).join(" ");
	  if (term.MadLib)
	    span.className = span.className += " MadLib";
	  span.dataset.index = term.Index;
	  span.title = Object.keys(term.pos).join(" ");
	  span.innerHTML = term.whitespace.preceding + term.text + term.whitespace.trailing;
	  return span;
	};

	let inputMap = t => {
	  let input = document.createElement('input');
	  input.type = 'text';
	  input.placeholder = t;
	  return input;
	};

	//Actual functional steps
	let getTerms = R.compose(
	  R.flatten,
	  R.curry(R.map)(R.prop('terms')),
	  R.prop('sentences'),
	  nlp_compromise.text
	);

	let processText = R.curry((madIndexes, terms) => {
	  var process = R.compose(
	    R.curry(R.sortBy)(R.prop('Index')),
	    R.flatten,
	    applyCombine(R.map(addMadLib)),
	    splitArray(matchMadLib(madIndexes)),
	    addIndex
	  );
	  return process(terms);
	});

	let replaceText = R.curry((madIndexes, madWords, terms) => {
	  //prep before running replace
	  //needs to be computed each run
	  let fixedWords = R.compose(
	    R.map(R.last),
	    R.sortBy(R.nth(0))
	  )(R.zip(madIndexes, madWords));

	  let updateText = findMadLibWord(fixedWords, R.curry(addField)('text'));
	  let updateMadLibs = R.compose(
	    R.curry(R.sortBy)(R.prop('Index')),
	    R.flatten,
	    applyCombine(mapIndexed(updateText)),
	    splitArray(filterMadLib)
	  );

	  return updateMadLibs(terms);
	});

	//IO monad stuff
	let addChildren = (elements, root) => {
	  R.forEach((el) => {
	    root.appendChild(el);
	  }, elements);
	};

	let render = R.curry((root, elements) => {
	  return IO(() => {
	    while (root.firstChild) {
	        root.removeChild(root.firstChild);
	    }

	  addChildren(elements, root);
	  });
	});

	let setAttribute = R.curry((attribute, value, element) => {
	  return IO(() => {
	    element[attribute] = value;
	  });
	});

	let setClass = setAttribute('className');
	let setDisabled = setAttribute('disabled');

	//curried render to root
	let rootRender = render(root);
	//render functions
	let createRender = (indexes, text) => {
	  return R.compose(
	    rootRender,
	    R.map(spanMap),
	    processText(indexes),
	    getTerms
	  )(text);
	};

	let enterRender = (indexes, words, text) => {
	  return R.compose(
	    rootRender,
	    wordsToInput(words),
	    processText(indexes),
	    getTerms
	  )(text);
	};

	let doneRender = (indexes, words, text) => {
	  return R.compose(
	    rootRender,
	    R.map(spanMap),
	    replaceText(indexes, words),
	    processText(indexes),
	    getTerms
	  )(text);
	};

	let updateValue = (wordAndInput) => {
	  wordAndInput[1].value = wordAndInput[0];
	  return wordAndInput;
	}

	//change the indexes into input boxes
	let wordsToInput = (words) => {
	  return R.compose(
	    R.map(R.nth(1)),
	    R.map(updateValue),
	    R.zip(words),
	    R.map(inputMap),
	    R.map((p) => Object.keys(p).join(' ')),
	    R.map(R.prop('pos')),
	    R.filter(filterMadLib)
	  );
	};

	//helper
	let getWords = R.map(R.prop('value'));

	//event filter functions
	let onlyCreate = R.compose(
	  R.any(R.equals('create')),
	  R.flatten,
	  R.map(R.prop('classList')),
	  R.filter((p) => p.nodeName == 'BODY')
	);

	let onlyThese = R.compose(
	  R.intersection(['Noun', 'Verb', 'Adjective', 'Adverb']),
	  R.prop('classList'),
	  R.prop('target')
	);

	//events
	document.addEventListener('click', (e) => {
	  if(e.target.nodeName === "SPAN" &&
	  onlyCreate(e.path) &&
	  onlyThese(e).length > 0){
	    dispatch({type: 'indexes', value: e.target.dataset.index});
	  }
	});

	root.addEventListener('blur', (e) => {
	  if(onlyCreate(e.path))
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

	//application state stuff
	let oldStates = [];

	let saveState = (state) => {
	  s = state;
	  oldStates = R.insert(oldStates.length, state, oldStates);
	}

	let renderState = (state) => {
	  setClass(`${state.step} ${state.highlight}`, document.getElementsByTagName('body')[0]).run();
	  setDisabled(state.disableDone, doneButton).run();

	  switch(state.step){
	    case 'create':
	      createRender(state.madIndexes, state.text).run();
	      break;
	    case 'enter':
	      enterRender(state.madIndexes, state.madWords, state.text).run();
	      break;
	    case 'done':
	      doneRender(state.madIndexes, state.madWords, state.text).run();
	      break;
	  }
	};

	//helper for processStateChange
	let addOrRemoveIndex = (array, item) => {
	  return R.contains(item, array) ? R.remove(array.indexOf(item), 1, array) : R.insert(array.length, item, array);
	}

	let processStateChange = (state, action) => {
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
	}

	//function for state update and render
	let dispatchCompose = R.compose(
	  R.tap(renderState),
	  R.tap(saveState),
	  R.tap(console.log),
	  processStateChange
	);

	//let's kick it off
	let s = {};
	//a hack for global state
	let dispatch = (action) => dispatchCompose(s, action)
	dispatch({type: 'init', value: {text: root.innerText, madIndexes: [], madWords: [], step: 'create', disableDone: true, highlight: ''}});
	console.log('doing this');


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports.filterFunc = (type, term) => term.pos[type] !== undefined;
	module.exports.addField = (field, term, value) => {
	  return Object.assign({}, term, {[field]: value})
	};
	module.exports.filterMadLib = (term) => term.MadLib;


/***/ }
/******/ ]);