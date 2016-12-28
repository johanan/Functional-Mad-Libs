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

	const {render, setAttribute} = __webpack_require__(1);
	const {spanMap, inputMap} = __webpack_require__(4);
	const {createRenderElements, enterRenderElements, doneRenderElements} = __webpack_require__(5);
	const processStateChange = __webpack_require__(10);
	const renderStateCurry = __webpack_require__(11);
	const {onlyClass, onlyThese} = __webpack_require__(12);
	const IO = __webpack_require__(3).IO;
	const R = __webpack_require__(2);

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


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);
	const IO = __webpack_require__(3).IO;

	//IO monad stuff
	let addChildren = (elements, root) => {
	  R.forEach((el) => {
	    root.appendChild(el);
	  }, elements);
	};

	module.exports.render = R.curry((root, elements) => {
	  return IO(() => {
	    while (root.firstChild) {
	        root.removeChild(root.firstChild);
	    }

	  addChildren(elements, root);
	  });
	});

	module.exports.setAttribute = R.curry((attribute, element, value) => {
	  return IO(() => {
	    element[attribute] = value;
	  });
	});


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	//  Ramda v0.22.1
	//  https://github.com/ramda/ramda
	//  (c) 2013-2016 Scott Sauyet, Michael Hurley, and David Chambers
	//  Ramda may be freely distributed under the MIT license.

	;(function() {

	  'use strict';

	  /**
	     * A special placeholder value used to specify "gaps" within curried functions,
	     * allowing partial application of any combination of arguments, regardless of
	     * their positions.
	     *
	     * If `g` is a curried ternary function and `_` is `R.__`, the following are
	     * equivalent:
	     *
	     *   - `g(1, 2, 3)`
	     *   - `g(_, 2, 3)(1)`
	     *   - `g(_, _, 3)(1)(2)`
	     *   - `g(_, _, 3)(1, 2)`
	     *   - `g(_, 2, _)(1, 3)`
	     *   - `g(_, 2)(1)(3)`
	     *   - `g(_, 2)(1, 3)`
	     *   - `g(_, 2)(_, 3)(1)`
	     *
	     * @constant
	     * @memberOf R
	     * @since v0.6.0
	     * @category Function
	     * @example
	     *
	     *      var greet = R.replace('{name}', R.__, 'Hello, {name}!');
	     *      greet('Alice'); //=> 'Hello, Alice!'
	     */
	    var __ = { '@@functional/placeholder': true };

	    /* eslint-disable no-unused-vars */
	    var _arity = function _arity(n, fn) {
	        /* eslint-disable no-unused-vars */
	        switch (n) {
	        case 0:
	            return function () {
	                return fn.apply(this, arguments);
	            };
	        case 1:
	            return function (a0) {
	                return fn.apply(this, arguments);
	            };
	        case 2:
	            return function (a0, a1) {
	                return fn.apply(this, arguments);
	            };
	        case 3:
	            return function (a0, a1, a2) {
	                return fn.apply(this, arguments);
	            };
	        case 4:
	            return function (a0, a1, a2, a3) {
	                return fn.apply(this, arguments);
	            };
	        case 5:
	            return function (a0, a1, a2, a3, a4) {
	                return fn.apply(this, arguments);
	            };
	        case 6:
	            return function (a0, a1, a2, a3, a4, a5) {
	                return fn.apply(this, arguments);
	            };
	        case 7:
	            return function (a0, a1, a2, a3, a4, a5, a6) {
	                return fn.apply(this, arguments);
	            };
	        case 8:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7) {
	                return fn.apply(this, arguments);
	            };
	        case 9:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
	                return fn.apply(this, arguments);
	            };
	        case 10:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
	                return fn.apply(this, arguments);
	            };
	        default:
	            throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
	        }
	    };

	    var _arrayFromIterator = function _arrayFromIterator(iter) {
	        var list = [];
	        var next;
	        while (!(next = iter.next()).done) {
	            list.push(next.value);
	        }
	        return list;
	    };

	    var _arrayOf = function _arrayOf() {
	        return Array.prototype.slice.call(arguments);
	    };

	    var _cloneRegExp = function _cloneRegExp(pattern) {
	        return new RegExp(pattern.source, (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '') + (pattern.sticky ? 'y' : '') + (pattern.unicode ? 'u' : ''));
	    };

	    var _complement = function _complement(f) {
	        return function () {
	            return !f.apply(this, arguments);
	        };
	    };

	    /**
	     * Private `concat` function to merge two array-like objects.
	     *
	     * @private
	     * @param {Array|Arguments} [set1=[]] An array-like object.
	     * @param {Array|Arguments} [set2=[]] An array-like object.
	     * @return {Array} A new, merged array.
	     * @example
	     *
	     *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	     */
	    var _concat = function _concat(set1, set2) {
	        set1 = set1 || [];
	        set2 = set2 || [];
	        var idx;
	        var len1 = set1.length;
	        var len2 = set2.length;
	        var result = [];
	        idx = 0;
	        while (idx < len1) {
	            result[result.length] = set1[idx];
	            idx += 1;
	        }
	        idx = 0;
	        while (idx < len2) {
	            result[result.length] = set2[idx];
	            idx += 1;
	        }
	        return result;
	    };

	    var _containsWith = function _containsWith(pred, x, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            if (pred(x, list[idx])) {
	                return true;
	            }
	            idx += 1;
	        }
	        return false;
	    };

	    var _filter = function _filter(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [];
	        while (idx < len) {
	            if (fn(list[idx])) {
	                result[result.length] = list[idx];
	            }
	            idx += 1;
	        }
	        return result;
	    };

	    var _forceReduced = function _forceReduced(x) {
	        return {
	            '@@transducer/value': x,
	            '@@transducer/reduced': true
	        };
	    };

	    // String(x => x) evaluates to "x => x", so the pattern may not match.
	    var _functionName = function _functionName(f) {
	        // String(x => x) evaluates to "x => x", so the pattern may not match.
	        var match = String(f).match(/^function (\w*)/);
	        return match == null ? '' : match[1];
	    };

	    var _has = function _has(prop, obj) {
	        return Object.prototype.hasOwnProperty.call(obj, prop);
	    };

	    var _identity = function _identity(x) {
	        return x;
	    };

	    var _isArguments = function () {
	        var toString = Object.prototype.toString;
	        return toString.call(arguments) === '[object Arguments]' ? function _isArguments(x) {
	            return toString.call(x) === '[object Arguments]';
	        } : function _isArguments(x) {
	            return _has('callee', x);
	        };
	    }();

	    /**
	     * Tests whether or not an object is an array.
	     *
	     * @private
	     * @param {*} val The object to test.
	     * @return {Boolean} `true` if `val` is an array, `false` otherwise.
	     * @example
	     *
	     *      _isArray([]); //=> true
	     *      _isArray(null); //=> false
	     *      _isArray({}); //=> false
	     */
	    var _isArray = Array.isArray || function _isArray(val) {
	        return val != null && val.length >= 0 && Object.prototype.toString.call(val) === '[object Array]';
	    };

	    var _isFunction = function _isFunction(x) {
	        return Object.prototype.toString.call(x) === '[object Function]';
	    };

	    /**
	     * Determine if the passed argument is an integer.
	     *
	     * @private
	     * @param {*} n
	     * @category Type
	     * @return {Boolean}
	     */
	    var _isInteger = Number.isInteger || function _isInteger(n) {
	        return n << 0 === n;
	    };

	    var _isNumber = function _isNumber(x) {
	        return Object.prototype.toString.call(x) === '[object Number]';
	    };

	    var _isObject = function _isObject(x) {
	        return Object.prototype.toString.call(x) === '[object Object]';
	    };

	    var _isPlaceholder = function _isPlaceholder(a) {
	        return a != null && typeof a === 'object' && a['@@functional/placeholder'] === true;
	    };

	    var _isRegExp = function _isRegExp(x) {
	        return Object.prototype.toString.call(x) === '[object RegExp]';
	    };

	    var _isString = function _isString(x) {
	        return Object.prototype.toString.call(x) === '[object String]';
	    };

	    var _isTransformer = function _isTransformer(obj) {
	        return typeof obj['@@transducer/step'] === 'function';
	    };

	    var _map = function _map(fn, functor) {
	        var idx = 0;
	        var len = functor.length;
	        var result = Array(len);
	        while (idx < len) {
	            result[idx] = fn(functor[idx]);
	            idx += 1;
	        }
	        return result;
	    };

	    // Based on https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	    var _objectAssign = function _objectAssign(target) {
	        if (target == null) {
	            throw new TypeError('Cannot convert undefined or null to object');
	        }
	        var output = Object(target);
	        var idx = 1;
	        var length = arguments.length;
	        while (idx < length) {
	            var source = arguments[idx];
	            if (source != null) {
	                for (var nextKey in source) {
	                    if (_has(nextKey, source)) {
	                        output[nextKey] = source[nextKey];
	                    }
	                }
	            }
	            idx += 1;
	        }
	        return output;
	    };

	    var _of = function _of(x) {
	        return [x];
	    };

	    var _pipe = function _pipe(f, g) {
	        return function () {
	            return g.call(this, f.apply(this, arguments));
	        };
	    };

	    var _pipeP = function _pipeP(f, g) {
	        return function () {
	            var ctx = this;
	            return f.apply(ctx, arguments).then(function (x) {
	                return g.call(ctx, x);
	            });
	        };
	    };

	    // \b matches word boundary; [\b] matches backspace
	    var _quote = function _quote(s) {
	        var escaped = s.replace(/\\/g, '\\\\').replace(/[\b]/g, '\\b')    // \b matches word boundary; [\b] matches backspace
	    .replace(/\f/g, '\\f').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/\v/g, '\\v').replace(/\0/g, '\\0');
	        return '"' + escaped.replace(/"/g, '\\"') + '"';
	    };

	    var _reduced = function _reduced(x) {
	        return x && x['@@transducer/reduced'] ? x : {
	            '@@transducer/value': x,
	            '@@transducer/reduced': true
	        };
	    };

	    /**
	     * An optimized, private array `slice` implementation.
	     *
	     * @private
	     * @param {Arguments|Array} args The array or arguments object to consider.
	     * @param {Number} [from=0] The array index to slice from, inclusive.
	     * @param {Number} [to=args.length] The array index to slice to, exclusive.
	     * @return {Array} A new, sliced array.
	     * @example
	     *
	     *      _slice([1, 2, 3, 4, 5], 1, 3); //=> [2, 3]
	     *
	     *      var firstThreeArgs = function(a, b, c, d) {
	     *        return _slice(arguments, 0, 3);
	     *      };
	     *      firstThreeArgs(1, 2, 3, 4); //=> [1, 2, 3]
	     */
	    var _slice = function _slice(args, from, to) {
	        switch (arguments.length) {
	        case 1:
	            return _slice(args, 0, args.length);
	        case 2:
	            return _slice(args, from, args.length);
	        default:
	            var list = [];
	            var idx = 0;
	            var len = Math.max(0, Math.min(args.length, to) - from);
	            while (idx < len) {
	                list[idx] = args[from + idx];
	                idx += 1;
	            }
	            return list;
	        }
	    };

	    /**
	     * Polyfill from <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString>.
	     */
	    var _toISOString = function () {
	        var pad = function pad(n) {
	            return (n < 10 ? '0' : '') + n;
	        };
	        return typeof Date.prototype.toISOString === 'function' ? function _toISOString(d) {
	            return d.toISOString();
	        } : function _toISOString(d) {
	            return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + '.' + (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
	        };
	    }();

	    var _xfBase = {
	        init: function () {
	            return this.xf['@@transducer/init']();
	        },
	        result: function (result) {
	            return this.xf['@@transducer/result'](result);
	        }
	    };

	    var _xwrap = function () {
	        function XWrap(fn) {
	            this.f = fn;
	        }
	        XWrap.prototype['@@transducer/init'] = function () {
	            throw new Error('init not implemented on XWrap');
	        };
	        XWrap.prototype['@@transducer/result'] = function (acc) {
	            return acc;
	        };
	        XWrap.prototype['@@transducer/step'] = function (acc, x) {
	            return this.f(acc, x);
	        };
	        return function _xwrap(fn) {
	            return new XWrap(fn);
	        };
	    }();

	    var _aperture = function _aperture(n, list) {
	        var idx = 0;
	        var limit = list.length - (n - 1);
	        var acc = new Array(limit >= 0 ? limit : 0);
	        while (idx < limit) {
	            acc[idx] = _slice(list, idx, idx + n);
	            idx += 1;
	        }
	        return acc;
	    };

	    var _assign = typeof Object.assign === 'function' ? Object.assign : _objectAssign;

	    /**
	     * Similar to hasMethod, this checks whether a function has a [methodname]
	     * function. If it isn't an array it will execute that function otherwise it
	     * will default to the ramda implementation.
	     *
	     * @private
	     * @param {Function} fn ramda implemtation
	     * @param {String} methodname property to check for a custom implementation
	     * @return {Object} Whatever the return value of the method is.
	     */
	    var _checkForMethod = function _checkForMethod(methodname, fn) {
	        return function () {
	            var length = arguments.length;
	            if (length === 0) {
	                return fn();
	            }
	            var obj = arguments[length - 1];
	            return _isArray(obj) || typeof obj[methodname] !== 'function' ? fn.apply(this, arguments) : obj[methodname].apply(obj, _slice(arguments, 0, length - 1));
	        };
	    };

	    /**
	     * Optimized internal one-arity curry function.
	     *
	     * @private
	     * @category Function
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curry1 = function _curry1(fn) {
	        return function f1(a) {
	            if (arguments.length === 0 || _isPlaceholder(a)) {
	                return f1;
	            } else {
	                return fn.apply(this, arguments);
	            }
	        };
	    };

	    /**
	     * Optimized internal two-arity curry function.
	     *
	     * @private
	     * @category Function
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curry2 = function _curry2(fn) {
	        return function f2(a, b) {
	            switch (arguments.length) {
	            case 0:
	                return f2;
	            case 1:
	                return _isPlaceholder(a) ? f2 : _curry1(function (_b) {
	                    return fn(a, _b);
	                });
	            default:
	                return _isPlaceholder(a) && _isPlaceholder(b) ? f2 : _isPlaceholder(a) ? _curry1(function (_a) {
	                    return fn(_a, b);
	                }) : _isPlaceholder(b) ? _curry1(function (_b) {
	                    return fn(a, _b);
	                }) : fn(a, b);
	            }
	        };
	    };

	    /**
	     * Optimized internal three-arity curry function.
	     *
	     * @private
	     * @category Function
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curry3 = function _curry3(fn) {
	        return function f3(a, b, c) {
	            switch (arguments.length) {
	            case 0:
	                return f3;
	            case 1:
	                return _isPlaceholder(a) ? f3 : _curry2(function (_b, _c) {
	                    return fn(a, _b, _c);
	                });
	            case 2:
	                return _isPlaceholder(a) && _isPlaceholder(b) ? f3 : _isPlaceholder(a) ? _curry2(function (_a, _c) {
	                    return fn(_a, b, _c);
	                }) : _isPlaceholder(b) ? _curry2(function (_b, _c) {
	                    return fn(a, _b, _c);
	                }) : _curry1(function (_c) {
	                    return fn(a, b, _c);
	                });
	            default:
	                return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3 : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function (_a, _b) {
	                    return fn(_a, _b, c);
	                }) : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function (_a, _c) {
	                    return fn(_a, b, _c);
	                }) : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function (_b, _c) {
	                    return fn(a, _b, _c);
	                }) : _isPlaceholder(a) ? _curry1(function (_a) {
	                    return fn(_a, b, c);
	                }) : _isPlaceholder(b) ? _curry1(function (_b) {
	                    return fn(a, _b, c);
	                }) : _isPlaceholder(c) ? _curry1(function (_c) {
	                    return fn(a, b, _c);
	                }) : fn(a, b, c);
	            }
	        };
	    };

	    /**
	     * Internal curryN function.
	     *
	     * @private
	     * @category Function
	     * @param {Number} length The arity of the curried function.
	     * @param {Array} received An array of arguments received thus far.
	     * @param {Function} fn The function to curry.
	     * @return {Function} The curried function.
	     */
	    var _curryN = function _curryN(length, received, fn) {
	        return function () {
	            var combined = [];
	            var argsIdx = 0;
	            var left = length;
	            var combinedIdx = 0;
	            while (combinedIdx < received.length || argsIdx < arguments.length) {
	                var result;
	                if (combinedIdx < received.length && (!_isPlaceholder(received[combinedIdx]) || argsIdx >= arguments.length)) {
	                    result = received[combinedIdx];
	                } else {
	                    result = arguments[argsIdx];
	                    argsIdx += 1;
	                }
	                combined[combinedIdx] = result;
	                if (!_isPlaceholder(result)) {
	                    left -= 1;
	                }
	                combinedIdx += 1;
	            }
	            return left <= 0 ? fn.apply(this, combined) : _arity(left, _curryN(length, combined, fn));
	        };
	    };

	    /**
	     * Returns a function that dispatches with different strategies based on the
	     * object in list position (last argument). If it is an array, executes [fn].
	     * Otherwise, if it has a function with [methodname], it will execute that
	     * function (functor case). Otherwise, if it is a transformer, uses transducer
	     * [xf] to return a new transformer (transducer case). Otherwise, it will
	     * default to executing [fn].
	     *
	     * @private
	     * @param {String} methodname property to check for a custom implementation
	     * @param {Function} xf transducer to initialize if object is transformer
	     * @param {Function} fn default ramda implementation
	     * @return {Function} A function that dispatches on object in list position
	     */
	    var _dispatchable = function _dispatchable(methodname, xf, fn) {
	        return function () {
	            var length = arguments.length;
	            if (length === 0) {
	                return fn();
	            }
	            var obj = arguments[length - 1];
	            if (!_isArray(obj)) {
	                var args = _slice(arguments, 0, length - 1);
	                if (typeof obj[methodname] === 'function') {
	                    return obj[methodname].apply(obj, args);
	                }
	                if (_isTransformer(obj)) {
	                    var transducer = xf.apply(null, args);
	                    return transducer(obj);
	                }
	            }
	            return fn.apply(this, arguments);
	        };
	    };

	    var _dropLastWhile = function dropLastWhile(pred, list) {
	        var idx = list.length - 1;
	        while (idx >= 0 && pred(list[idx])) {
	            idx -= 1;
	        }
	        return _slice(list, 0, idx + 1);
	    };

	    var _xall = function () {
	        function XAll(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.all = true;
	        }
	        XAll.prototype['@@transducer/init'] = _xfBase.init;
	        XAll.prototype['@@transducer/result'] = function (result) {
	            if (this.all) {
	                result = this.xf['@@transducer/step'](result, true);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XAll.prototype['@@transducer/step'] = function (result, input) {
	            if (!this.f(input)) {
	                this.all = false;
	                result = _reduced(this.xf['@@transducer/step'](result, false));
	            }
	            return result;
	        };
	        return _curry2(function _xall(f, xf) {
	            return new XAll(f, xf);
	        });
	    }();

	    var _xany = function () {
	        function XAny(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.any = false;
	        }
	        XAny.prototype['@@transducer/init'] = _xfBase.init;
	        XAny.prototype['@@transducer/result'] = function (result) {
	            if (!this.any) {
	                result = this.xf['@@transducer/step'](result, false);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XAny.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f(input)) {
	                this.any = true;
	                result = _reduced(this.xf['@@transducer/step'](result, true));
	            }
	            return result;
	        };
	        return _curry2(function _xany(f, xf) {
	            return new XAny(f, xf);
	        });
	    }();

	    var _xaperture = function () {
	        function XAperture(n, xf) {
	            this.xf = xf;
	            this.pos = 0;
	            this.full = false;
	            this.acc = new Array(n);
	        }
	        XAperture.prototype['@@transducer/init'] = _xfBase.init;
	        XAperture.prototype['@@transducer/result'] = function (result) {
	            this.acc = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XAperture.prototype['@@transducer/step'] = function (result, input) {
	            this.store(input);
	            return this.full ? this.xf['@@transducer/step'](result, this.getCopy()) : result;
	        };
	        XAperture.prototype.store = function (input) {
	            this.acc[this.pos] = input;
	            this.pos += 1;
	            if (this.pos === this.acc.length) {
	                this.pos = 0;
	                this.full = true;
	            }
	        };
	        XAperture.prototype.getCopy = function () {
	            return _concat(_slice(this.acc, this.pos), _slice(this.acc, 0, this.pos));
	        };
	        return _curry2(function _xaperture(n, xf) {
	            return new XAperture(n, xf);
	        });
	    }();

	    var _xdrop = function () {
	        function XDrop(n, xf) {
	            this.xf = xf;
	            this.n = n;
	        }
	        XDrop.prototype['@@transducer/init'] = _xfBase.init;
	        XDrop.prototype['@@transducer/result'] = _xfBase.result;
	        XDrop.prototype['@@transducer/step'] = function (result, input) {
	            if (this.n > 0) {
	                this.n -= 1;
	                return result;
	            }
	            return this.xf['@@transducer/step'](result, input);
	        };
	        return _curry2(function _xdrop(n, xf) {
	            return new XDrop(n, xf);
	        });
	    }();

	    var _xdropLast = function () {
	        function XDropLast(n, xf) {
	            this.xf = xf;
	            this.pos = 0;
	            this.full = false;
	            this.acc = new Array(n);
	        }
	        XDropLast.prototype['@@transducer/init'] = _xfBase.init;
	        XDropLast.prototype['@@transducer/result'] = function (result) {
	            this.acc = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XDropLast.prototype['@@transducer/step'] = function (result, input) {
	            if (this.full) {
	                result = this.xf['@@transducer/step'](result, this.acc[this.pos]);
	            }
	            this.store(input);
	            return result;
	        };
	        XDropLast.prototype.store = function (input) {
	            this.acc[this.pos] = input;
	            this.pos += 1;
	            if (this.pos === this.acc.length) {
	                this.pos = 0;
	                this.full = true;
	            }
	        };
	        return _curry2(function _xdropLast(n, xf) {
	            return new XDropLast(n, xf);
	        });
	    }();

	    var _xdropRepeatsWith = function () {
	        function XDropRepeatsWith(pred, xf) {
	            this.xf = xf;
	            this.pred = pred;
	            this.lastValue = undefined;
	            this.seenFirstValue = false;
	        }
	        XDropRepeatsWith.prototype['@@transducer/init'] = function () {
	            return this.xf['@@transducer/init']();
	        };
	        XDropRepeatsWith.prototype['@@transducer/result'] = function (result) {
	            return this.xf['@@transducer/result'](result);
	        };
	        XDropRepeatsWith.prototype['@@transducer/step'] = function (result, input) {
	            var sameAsLast = false;
	            if (!this.seenFirstValue) {
	                this.seenFirstValue = true;
	            } else if (this.pred(this.lastValue, input)) {
	                sameAsLast = true;
	            }
	            this.lastValue = input;
	            return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
	        };
	        return _curry2(function _xdropRepeatsWith(pred, xf) {
	            return new XDropRepeatsWith(pred, xf);
	        });
	    }();

	    var _xdropWhile = function () {
	        function XDropWhile(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
	        XDropWhile.prototype['@@transducer/result'] = _xfBase.result;
	        XDropWhile.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f) {
	                if (this.f(input)) {
	                    return result;
	                }
	                this.f = null;
	            }
	            return this.xf['@@transducer/step'](result, input);
	        };
	        return _curry2(function _xdropWhile(f, xf) {
	            return new XDropWhile(f, xf);
	        });
	    }();

	    var _xfilter = function () {
	        function XFilter(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XFilter.prototype['@@transducer/init'] = _xfBase.init;
	        XFilter.prototype['@@transducer/result'] = _xfBase.result;
	        XFilter.prototype['@@transducer/step'] = function (result, input) {
	            return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
	        };
	        return _curry2(function _xfilter(f, xf) {
	            return new XFilter(f, xf);
	        });
	    }();

	    var _xfind = function () {
	        function XFind(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.found = false;
	        }
	        XFind.prototype['@@transducer/init'] = _xfBase.init;
	        XFind.prototype['@@transducer/result'] = function (result) {
	            if (!this.found) {
	                result = this.xf['@@transducer/step'](result, void 0);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XFind.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f(input)) {
	                this.found = true;
	                result = _reduced(this.xf['@@transducer/step'](result, input));
	            }
	            return result;
	        };
	        return _curry2(function _xfind(f, xf) {
	            return new XFind(f, xf);
	        });
	    }();

	    var _xfindIndex = function () {
	        function XFindIndex(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.idx = -1;
	            this.found = false;
	        }
	        XFindIndex.prototype['@@transducer/init'] = _xfBase.init;
	        XFindIndex.prototype['@@transducer/result'] = function (result) {
	            if (!this.found) {
	                result = this.xf['@@transducer/step'](result, -1);
	            }
	            return this.xf['@@transducer/result'](result);
	        };
	        XFindIndex.prototype['@@transducer/step'] = function (result, input) {
	            this.idx += 1;
	            if (this.f(input)) {
	                this.found = true;
	                result = _reduced(this.xf['@@transducer/step'](result, this.idx));
	            }
	            return result;
	        };
	        return _curry2(function _xfindIndex(f, xf) {
	            return new XFindIndex(f, xf);
	        });
	    }();

	    var _xfindLast = function () {
	        function XFindLast(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XFindLast.prototype['@@transducer/init'] = _xfBase.init;
	        XFindLast.prototype['@@transducer/result'] = function (result) {
	            return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
	        };
	        XFindLast.prototype['@@transducer/step'] = function (result, input) {
	            if (this.f(input)) {
	                this.last = input;
	            }
	            return result;
	        };
	        return _curry2(function _xfindLast(f, xf) {
	            return new XFindLast(f, xf);
	        });
	    }();

	    var _xfindLastIndex = function () {
	        function XFindLastIndex(f, xf) {
	            this.xf = xf;
	            this.f = f;
	            this.idx = -1;
	            this.lastIdx = -1;
	        }
	        XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;
	        XFindLastIndex.prototype['@@transducer/result'] = function (result) {
	            return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
	        };
	        XFindLastIndex.prototype['@@transducer/step'] = function (result, input) {
	            this.idx += 1;
	            if (this.f(input)) {
	                this.lastIdx = this.idx;
	            }
	            return result;
	        };
	        return _curry2(function _xfindLastIndex(f, xf) {
	            return new XFindLastIndex(f, xf);
	        });
	    }();

	    var _xmap = function () {
	        function XMap(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XMap.prototype['@@transducer/init'] = _xfBase.init;
	        XMap.prototype['@@transducer/result'] = _xfBase.result;
	        XMap.prototype['@@transducer/step'] = function (result, input) {
	            return this.xf['@@transducer/step'](result, this.f(input));
	        };
	        return _curry2(function _xmap(f, xf) {
	            return new XMap(f, xf);
	        });
	    }();

	    var _xreduceBy = function () {
	        function XReduceBy(valueFn, valueAcc, keyFn, xf) {
	            this.valueFn = valueFn;
	            this.valueAcc = valueAcc;
	            this.keyFn = keyFn;
	            this.xf = xf;
	            this.inputs = {};
	        }
	        XReduceBy.prototype['@@transducer/init'] = _xfBase.init;
	        XReduceBy.prototype['@@transducer/result'] = function (result) {
	            var key;
	            for (key in this.inputs) {
	                if (_has(key, this.inputs)) {
	                    result = this.xf['@@transducer/step'](result, this.inputs[key]);
	                    if (result['@@transducer/reduced']) {
	                        result = result['@@transducer/value'];
	                        break;
	                    }
	                }
	            }
	            this.inputs = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XReduceBy.prototype['@@transducer/step'] = function (result, input) {
	            var key = this.keyFn(input);
	            this.inputs[key] = this.inputs[key] || [
	                key,
	                this.valueAcc
	            ];
	            this.inputs[key][1] = this.valueFn(this.inputs[key][1], input);
	            return result;
	        };
	        return _curryN(4, [], function _xreduceBy(valueFn, valueAcc, keyFn, xf) {
	            return new XReduceBy(valueFn, valueAcc, keyFn, xf);
	        });
	    }();

	    var _xtake = function () {
	        function XTake(n, xf) {
	            this.xf = xf;
	            this.n = n;
	            this.i = 0;
	        }
	        XTake.prototype['@@transducer/init'] = _xfBase.init;
	        XTake.prototype['@@transducer/result'] = _xfBase.result;
	        XTake.prototype['@@transducer/step'] = function (result, input) {
	            this.i += 1;
	            var ret = this.n === 0 ? result : this.xf['@@transducer/step'](result, input);
	            return this.i >= this.n ? _reduced(ret) : ret;
	        };
	        return _curry2(function _xtake(n, xf) {
	            return new XTake(n, xf);
	        });
	    }();

	    var _xtakeWhile = function () {
	        function XTakeWhile(f, xf) {
	            this.xf = xf;
	            this.f = f;
	        }
	        XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
	        XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;
	        XTakeWhile.prototype['@@transducer/step'] = function (result, input) {
	            return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
	        };
	        return _curry2(function _xtakeWhile(f, xf) {
	            return new XTakeWhile(f, xf);
	        });
	    }();

	    /**
	     * Adds two values.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a
	     * @param {Number} b
	     * @return {Number}
	     * @see R.subtract
	     * @example
	     *
	     *      R.add(2, 3);       //=>  5
	     *      R.add(7)(10);      //=> 17
	     */
	    var add = _curry2(function add(a, b) {
	        return Number(a) + Number(b);
	    });

	    /**
	     * Applies a function to the value at the given index of an array, returning a
	     * new copy of the array with the element at the given index replaced with the
	     * result of the function application.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig (a -> a) -> Number -> [a] -> [a]
	     * @param {Function} fn The function to apply.
	     * @param {Number} idx The index.
	     * @param {Array|Arguments} list An array-like object whose value
	     *        at the supplied index will be replaced.
	     * @return {Array} A copy of the supplied array-like object with
	     *         the element at index `idx` replaced with the value
	     *         returned by applying `fn` to the existing element.
	     * @see R.update
	     * @example
	     *
	     *      R.adjust(R.add(10), 1, [0, 1, 2]);     //=> [0, 11, 2]
	     *      R.adjust(R.add(10))(1)([0, 1, 2]);     //=> [0, 11, 2]
	     */
	    var adjust = _curry3(function adjust(fn, idx, list) {
	        if (idx >= list.length || idx < -list.length) {
	            return list;
	        }
	        var start = idx < 0 ? list.length : 0;
	        var _idx = start + idx;
	        var _list = _concat(list);
	        _list[_idx] = fn(list[_idx]);
	        return _list;
	    });

	    /**
	     * Returns `true` if all elements of the list match the predicate, `false` if
	     * there are any that don't.
	     *
	     * Dispatches to the `all` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Boolean
	     * @param {Function} fn The predicate function.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the predicate is satisfied by every element, `false`
	     *         otherwise.
	     * @see R.any, R.none, R.transduce
	     * @example
	     *
	     *      var lessThan2 = R.flip(R.lt)(2);
	     *      var lessThan3 = R.flip(R.lt)(3);
	     *      R.all(lessThan2)([1, 2]); //=> false
	     *      R.all(lessThan3)([1, 2]); //=> true
	     */
	    var all = _curry2(_dispatchable('all', _xall, function all(fn, list) {
	        var idx = 0;
	        while (idx < list.length) {
	            if (!fn(list[idx])) {
	                return false;
	            }
	            idx += 1;
	        }
	        return true;
	    }));

	    /**
	     * Returns a function that always returns the given value. Note that for
	     * non-primitives the value returned is a reference to the original value.
	     *
	     * This function is known as `const`, `constant`, or `K` (for K combinator) in
	     * other languages and libraries.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig a -> (* -> a)
	     * @param {*} val The value to wrap in a function
	     * @return {Function} A Function :: * -> val.
	     * @example
	     *
	     *      var t = R.always('Tee');
	     *      t(); //=> 'Tee'
	     */
	    var always = _curry1(function always(val) {
	        return function () {
	            return val;
	        };
	    });

	    /**
	     * Returns `true` if both arguments are `true`; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig * -> * -> *
	     * @param {Boolean} a A boolean value
	     * @param {Boolean} b A boolean value
	     * @return {Boolean} `true` if both arguments are `true`, `false` otherwise
	     * @see R.both
	     * @example
	     *
	     *      R.and(true, true); //=> true
	     *      R.and(true, false); //=> false
	     *      R.and(false, true); //=> false
	     *      R.and(false, false); //=> false
	     */
	    var and = _curry2(function and(a, b) {
	        return a && b;
	    });

	    /**
	     * Returns `true` if at least one of elements of the list match the predicate,
	     * `false` otherwise.
	     *
	     * Dispatches to the `any` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Boolean
	     * @param {Function} fn The predicate function.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the predicate is satisfied by at least one element, `false`
	     *         otherwise.
	     * @see R.all, R.none, R.transduce
	     * @example
	     *
	     *      var lessThan0 = R.flip(R.lt)(0);
	     *      var lessThan2 = R.flip(R.lt)(2);
	     *      R.any(lessThan0)([1, 2]); //=> false
	     *      R.any(lessThan2)([1, 2]); //=> true
	     */
	    var any = _curry2(_dispatchable('any', _xany, function any(fn, list) {
	        var idx = 0;
	        while (idx < list.length) {
	            if (fn(list[idx])) {
	                return true;
	            }
	            idx += 1;
	        }
	        return false;
	    }));

	    /**
	     * Returns a new list, composed of n-tuples of consecutive elements If `n` is
	     * greater than the length of the list, an empty list is returned.
	     *
	     * Dispatches to the `aperture` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig Number -> [a] -> [[a]]
	     * @param {Number} n The size of the tuples to create
	     * @param {Array} list The list to split into `n`-tuples
	     * @return {Array} The new list.
	     * @see R.transduce
	     * @example
	     *
	     *      R.aperture(2, [1, 2, 3, 4, 5]); //=> [[1, 2], [2, 3], [3, 4], [4, 5]]
	     *      R.aperture(3, [1, 2, 3, 4, 5]); //=> [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
	     *      R.aperture(7, [1, 2, 3, 4, 5]); //=> []
	     */
	    var aperture = _curry2(_dispatchable('aperture', _xaperture, _aperture));

	    /**
	     * Returns a new list containing the contents of the given list, followed by
	     * the given element.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> [a]
	     * @param {*} el The element to add to the end of the new list.
	     * @param {Array} list The list whose contents will be added to the beginning of the output
	     *        list.
	     * @return {Array} A new list containing the contents of the old list followed by `el`.
	     * @see R.prepend
	     * @example
	     *
	     *      R.append('tests', ['write', 'more']); //=> ['write', 'more', 'tests']
	     *      R.append('tests', []); //=> ['tests']
	     *      R.append(['tests'], ['write', 'more']); //=> ['write', 'more', ['tests']]
	     */
	    var append = _curry2(function append(el, list) {
	        return _concat(list, [el]);
	    });

	    /**
	     * Applies function `fn` to the argument list `args`. This is useful for
	     * creating a fixed-arity function from a variadic function. `fn` should be a
	     * bound function if context is significant.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Function
	     * @sig (*... -> a) -> [*] -> a
	     * @param {Function} fn
	     * @param {Array} args
	     * @return {*}
	     * @see R.call, R.unapply
	     * @example
	     *
	     *      var nums = [1, 2, 3, -99, 42, 6, 7];
	     *      R.apply(Math.max, nums); //=> 42
	     */
	    var apply = _curry2(function apply(fn, args) {
	        return fn.apply(this, args);
	    });

	    /**
	     * Makes a shallow clone of an object, setting or overriding the specified
	     * property with the given value. Note that this copies and flattens prototype
	     * properties onto the new object as well. All non-primitive properties are
	     * copied by reference.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @sig String -> a -> {k: v} -> {k: v}
	     * @param {String} prop the property name to set
	     * @param {*} val the new value
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object similar to the original except for the specified property.
	     * @see R.dissoc
	     * @example
	     *
	     *      R.assoc('c', 3, {a: 1, b: 2}); //=> {a: 1, b: 2, c: 3}
	     */
	    var assoc = _curry3(function assoc(prop, val, obj) {
	        var result = {};
	        for (var p in obj) {
	            result[p] = obj[p];
	        }
	        result[prop] = val;
	        return result;
	    });

	    /**
	     * Makes a shallow clone of an object, setting or overriding the nodes required
	     * to create the given path, and placing the specific value at the tail end of
	     * that path. Note that this copies and flattens prototype properties onto the
	     * new object as well. All non-primitive properties are copied by reference.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @sig [String] -> a -> {k: v} -> {k: v}
	     * @param {Array} path the path to set
	     * @param {*} val the new value
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object similar to the original except along the specified path.
	     * @see R.dissocPath
	     * @example
	     *
	     *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
	     */
	    var assocPath = _curry3(function assocPath(path, val, obj) {
	        switch (path.length) {
	        case 0:
	            return val;
	        case 1:
	            return assoc(path[0], val, obj);
	        default:
	            return assoc(path[0], assocPath(_slice(path, 1), val, Object(obj[path[0]])), obj);
	        }
	    });

	    /**
	     * Creates a function that is bound to a context.
	     * Note: `R.bind` does not provide the additional argument-binding capabilities of
	     * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category Function
	     * @category Object
	     * @sig (* -> *) -> {*} -> (* -> *)
	     * @param {Function} fn The function to bind to context
	     * @param {Object} thisObj The context to bind `fn` to
	     * @return {Function} A function that will execute in the context of `thisObj`.
	     * @see R.partial
	     * @example
	     *
	     *      var log = R.bind(console.log, console);
	     *      R.pipe(R.assoc('a', 2), R.tap(log), R.assoc('a', 3))({a: 1}); //=> {a: 3}
	     *      // logs {a: 2}
	     */
	    var bind = _curry2(function bind(fn, thisObj) {
	        return _arity(fn.length, function () {
	            return fn.apply(thisObj, arguments);
	        });
	    });

	    /**
	     * Restricts a number to be within a range.
	     *
	     * Also works for other ordered types such as Strings and Dates.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Relation
	     * @sig Ord a => a -> a -> a -> a
	     * @param {Number} minimum number
	     * @param {Number} maximum number
	     * @param {Number} value to be clamped
	     * @return {Number} Returns the clamped value
	     * @example
	     *
	     *      R.clamp(1, 10, -1) // => 1
	     *      R.clamp(1, 10, 11) // => 10
	     *      R.clamp(1, 10, 4)  // => 4
	     */
	    var clamp = _curry3(function clamp(min, max, value) {
	        if (min > max) {
	            throw new Error('min must not be greater than max in clamp(min, max, value)');
	        }
	        return value < min ? min : value > max ? max : value;
	    });

	    /**
	     * Makes a comparator function out of a function that reports whether the first
	     * element is less than the second.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a, b -> Boolean) -> (a, b -> Number)
	     * @param {Function} pred A predicate function of arity two.
	     * @return {Function} A Function :: a -> b -> Int that returns `-1` if a < b, `1` if b < a, otherwise `0`.
	     * @example
	     *
	     *      var cmp = R.comparator((a, b) => a.age < b.age);
	     *      var people = [
	     *        // ...
	     *      ];
	     *      R.sort(cmp, people);
	     */
	    var comparator = _curry1(function comparator(pred) {
	        return function (a, b) {
	            return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
	        };
	    });

	    /**
	     * Returns a curried equivalent of the provided function, with the specified
	     * arity. The curried function has two unusual capabilities. First, its
	     * arguments needn't be provided one at a time. If `g` is `R.curryN(3, f)`, the
	     * following are equivalent:
	     *
	     *   - `g(1)(2)(3)`
	     *   - `g(1)(2, 3)`
	     *   - `g(1, 2)(3)`
	     *   - `g(1, 2, 3)`
	     *
	     * Secondly, the special placeholder value `R.__` may be used to specify
	     * "gaps", allowing partial application of any combination of arguments,
	     * regardless of their positions. If `g` is as above and `_` is `R.__`, the
	     * following are equivalent:
	     *
	     *   - `g(1, 2, 3)`
	     *   - `g(_, 2, 3)(1)`
	     *   - `g(_, _, 3)(1)(2)`
	     *   - `g(_, _, 3)(1, 2)`
	     *   - `g(_, 2)(1)(3)`
	     *   - `g(_, 2)(1, 3)`
	     *   - `g(_, 2)(_, 3)(1)`
	     *
	     * @func
	     * @memberOf R
	     * @since v0.5.0
	     * @category Function
	     * @sig Number -> (* -> a) -> (* -> a)
	     * @param {Number} length The arity for the returned function.
	     * @param {Function} fn The function to curry.
	     * @return {Function} A new, curried function.
	     * @see R.curry
	     * @example
	     *
	     *      var sumArgs = (...args) => R.sum(args);
	     *
	     *      var curriedAddFourNumbers = R.curryN(4, sumArgs);
	     *      var f = curriedAddFourNumbers(1, 2);
	     *      var g = f(3);
	     *      g(4); //=> 10
	     */
	    var curryN = _curry2(function curryN(length, fn) {
	        if (length === 1) {
	            return _curry1(fn);
	        }
	        return _arity(length, _curryN(length, [], fn));
	    });

	    /**
	     * Decrements its argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Math
	     * @sig Number -> Number
	     * @param {Number} n
	     * @return {Number}
	     * @see R.inc
	     * @example
	     *
	     *      R.dec(42); //=> 41
	     */
	    var dec = add(-1);

	    /**
	     * Returns the second argument if it is not `null`, `undefined` or `NaN`
	     * otherwise the first argument is returned.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Logic
	     * @sig a -> b -> a | b
	     * @param {a} val The default value.
	     * @param {b} val The value to return if it is not null or undefined
	     * @return {*} The the second value or the default value
	     * @example
	     *
	     *      var defaultTo42 = R.defaultTo(42);
	     *
	     *      defaultTo42(null);  //=> 42
	     *      defaultTo42(undefined);  //=> 42
	     *      defaultTo42('Ramda');  //=> 'Ramda'
	     *      defaultTo42(parseInt('string')); //=> 42
	     */
	    var defaultTo = _curry2(function defaultTo(d, v) {
	        return v == null || v !== v ? d : v;
	    });

	    /**
	     * Finds the set (i.e. no duplicates) of all elements in the first list not
	     * contained in the second list. Duplication is determined according to the
	     * value returned by applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` that are not in `list2`.
	     * @see R.difference, R.symmetricDifference, R.symmetricDifferenceWith
	     * @example
	     *
	     *      var cmp = (x, y) => x.a === y.a;
	     *      var l1 = [{a: 1}, {a: 2}, {a: 3}];
	     *      var l2 = [{a: 3}, {a: 4}];
	     *      R.differenceWith(cmp, l1, l2); //=> [{a: 1}, {a: 2}]
	     */
	    var differenceWith = _curry3(function differenceWith(pred, first, second) {
	        var out = [];
	        var idx = 0;
	        var firstLen = first.length;
	        while (idx < firstLen) {
	            if (!_containsWith(pred, first[idx], second) && !_containsWith(pred, first[idx], out)) {
	                out.push(first[idx]);
	            }
	            idx += 1;
	        }
	        return out;
	    });

	    /**
	     * Returns a new object that does not contain a `prop` property.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Object
	     * @sig String -> {k: v} -> {k: v}
	     * @param {String} prop the name of the property to dissociate
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object similar to the original but without the specified property
	     * @see R.assoc
	     * @example
	     *
	     *      R.dissoc('b', {a: 1, b: 2, c: 3}); //=> {a: 1, c: 3}
	     */
	    var dissoc = _curry2(function dissoc(prop, obj) {
	        var result = {};
	        for (var p in obj) {
	            if (p !== prop) {
	                result[p] = obj[p];
	            }
	        }
	        return result;
	    });

	    /**
	     * Makes a shallow clone of an object, omitting the property at the given path.
	     * Note that this copies and flattens prototype properties onto the new object
	     * as well. All non-primitive properties are copied by reference.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.11.0
	     * @category Object
	     * @sig [String] -> {k: v} -> {k: v}
	     * @param {Array} path the path to set
	     * @param {Object} obj the object to clone
	     * @return {Object} a new object without the property at path
	     * @see R.assocPath
	     * @example
	     *
	     *      R.dissocPath(['a', 'b', 'c'], {a: {b: {c: 42}}}); //=> {a: {b: {}}}
	     */
	    var dissocPath = _curry2(function dissocPath(path, obj) {
	        switch (path.length) {
	        case 0:
	            return obj;
	        case 1:
	            return dissoc(path[0], obj);
	        default:
	            var head = path[0];
	            var tail = _slice(path, 1);
	            return obj[head] == null ? obj : assoc(head, dissocPath(tail, obj[head]), obj);
	        }
	    });

	    /**
	     * Divides two numbers. Equivalent to `a / b`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The first value.
	     * @param {Number} b The second value.
	     * @return {Number} The result of `a / b`.
	     * @see R.multiply
	     * @example
	     *
	     *      R.divide(71, 100); //=> 0.71
	     *
	     *      var half = R.divide(R.__, 2);
	     *      half(42); //=> 21
	     *
	     *      var reciprocal = R.divide(1);
	     *      reciprocal(4);   //=> 0.25
	     */
	    var divide = _curry2(function divide(a, b) {
	        return a / b;
	    });

	    /**
	     * Returns a new list excluding the leading elements of a given list which
	     * satisfy the supplied predicate function. It passes each value to the supplied
	     * predicate function, skipping elements while the predicate function returns
	     * `true`. The predicate function is applied to one argument: *(value)*.
	     *
	     * Dispatches to the `dropWhile` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.takeWhile, R.transduce, R.addIndex
	     * @example
	     *
	     *      var lteTwo = x => x <= 2;
	     *
	     *      R.dropWhile(lteTwo, [1, 2, 3, 4, 3, 2, 1]); //=> [3, 4, 3, 2, 1]
	     */
	    var dropWhile = _curry2(_dispatchable('dropWhile', _xdropWhile, function dropWhile(pred, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len && pred(list[idx])) {
	            idx += 1;
	        }
	        return _slice(list, idx);
	    }));

	    /**
	     * Returns the empty value of its argument's type. Ramda defines the empty
	     * value of Array (`[]`), Object (`{}`), String (`''`), and Arguments. Other
	     * types are supported if they define `<Type>.empty` and/or
	     * `<Type>.prototype.empty`.
	     *
	     * Dispatches to the `empty` method of the first argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Function
	     * @sig a -> a
	     * @param {*} x
	     * @return {*}
	     * @example
	     *
	     *      R.empty(Just(42));      //=> Nothing()
	     *      R.empty([1, 2, 3]);     //=> []
	     *      R.empty('unicorns');    //=> ''
	     *      R.empty({x: 1, y: 2});  //=> {}
	     */
	    // else
	    var empty = _curry1(function empty(x) {
	        return x != null && typeof x.empty === 'function' ? x.empty() : x != null && x.constructor != null && typeof x.constructor.empty === 'function' ? x.constructor.empty() : _isArray(x) ? [] : _isString(x) ? '' : _isObject(x) ? {} : _isArguments(x) ? function () {
	            return arguments;
	        }() : // else
	        void 0;
	    });

	    /**
	     * Creates a new object by recursively evolving a shallow copy of `object`,
	     * according to the `transformation` functions. All non-primitive properties
	     * are copied by reference.
	     *
	     * A `transformation` function will not be invoked if its corresponding key
	     * does not exist in the evolved object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig {k: (v -> v)} -> {k: v} -> {k: v}
	     * @param {Object} transformations The object specifying transformation functions to apply
	     *        to the object.
	     * @param {Object} object The object to be transformed.
	     * @return {Object} The transformed object.
	     * @example
	     *
	     *      var tomato  = {firstName: '  Tomato ', data: {elapsed: 100, remaining: 1400}, id:123};
	     *      var transformations = {
	     *        firstName: R.trim,
	     *        lastName: R.trim, // Will not get invoked.
	     *        data: {elapsed: R.add(1), remaining: R.add(-1)}
	     *      };
	     *      R.evolve(transformations, tomato); //=> {firstName: 'Tomato', data: {elapsed: 101, remaining: 1399}, id:123}
	     */
	    var evolve = _curry2(function evolve(transformations, object) {
	        var result = {};
	        var transformation, key, type;
	        for (key in object) {
	            transformation = transformations[key];
	            type = typeof transformation;
	            result[key] = type === 'function' ? transformation(object[key]) : type === 'object' ? evolve(transformations[key], object[key]) : object[key];
	        }
	        return result;
	    });

	    /**
	     * Returns the first element of the list which matches the predicate, or
	     * `undefined` if no element matches.
	     *
	     * Dispatches to the `find` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> a | undefined
	     * @param {Function} fn The predicate function used to determine if the element is the
	     *        desired one.
	     * @param {Array} list The array to consider.
	     * @return {Object} The element found, or `undefined`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1}, {a: 2}, {a: 3}];
	     *      R.find(R.propEq('a', 2))(xs); //=> {a: 2}
	     *      R.find(R.propEq('a', 4))(xs); //=> undefined
	     */
	    var find = _curry2(_dispatchable('find', _xfind, function find(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            if (fn(list[idx])) {
	                return list[idx];
	            }
	            idx += 1;
	        }
	    }));

	    /**
	     * Returns the index of the first element of the list which matches the
	     * predicate, or `-1` if no element matches.
	     *
	     * Dispatches to the `findIndex` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Number
	     * @param {Function} fn The predicate function used to determine if the element is the
	     * desired one.
	     * @param {Array} list The array to consider.
	     * @return {Number} The index of the element found, or `-1`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1}, {a: 2}, {a: 3}];
	     *      R.findIndex(R.propEq('a', 2))(xs); //=> 1
	     *      R.findIndex(R.propEq('a', 4))(xs); //=> -1
	     */
	    var findIndex = _curry2(_dispatchable('findIndex', _xfindIndex, function findIndex(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            if (fn(list[idx])) {
	                return idx;
	            }
	            idx += 1;
	        }
	        return -1;
	    }));

	    /**
	     * Returns the last element of the list which matches the predicate, or
	     * `undefined` if no element matches.
	     *
	     * Dispatches to the `findLast` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> a | undefined
	     * @param {Function} fn The predicate function used to determine if the element is the
	     * desired one.
	     * @param {Array} list The array to consider.
	     * @return {Object} The element found, or `undefined`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
	     *      R.findLast(R.propEq('a', 1))(xs); //=> {a: 1, b: 1}
	     *      R.findLast(R.propEq('a', 4))(xs); //=> undefined
	     */
	    var findLast = _curry2(_dispatchable('findLast', _xfindLast, function findLast(fn, list) {
	        var idx = list.length - 1;
	        while (idx >= 0) {
	            if (fn(list[idx])) {
	                return list[idx];
	            }
	            idx -= 1;
	        }
	    }));

	    /**
	     * Returns the index of the last element of the list which matches the
	     * predicate, or `-1` if no element matches.
	     *
	     * Dispatches to the `findLastIndex` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Number
	     * @param {Function} fn The predicate function used to determine if the element is the
	     * desired one.
	     * @param {Array} list The array to consider.
	     * @return {Number} The index of the element found, or `-1`.
	     * @see R.transduce
	     * @example
	     *
	     *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
	     *      R.findLastIndex(R.propEq('a', 1))(xs); //=> 1
	     *      R.findLastIndex(R.propEq('a', 4))(xs); //=> -1
	     */
	    var findLastIndex = _curry2(_dispatchable('findLastIndex', _xfindLastIndex, function findLastIndex(fn, list) {
	        var idx = list.length - 1;
	        while (idx >= 0) {
	            if (fn(list[idx])) {
	                return idx;
	            }
	            idx -= 1;
	        }
	        return -1;
	    }));

	    /**
	     * Iterate over an input `list`, calling a provided function `fn` for each
	     * element in the list.
	     *
	     * `fn` receives one argument: *(value)*.
	     *
	     * Note: `R.forEach` does not skip deleted or unassigned indices (sparse
	     * arrays), unlike the native `Array.prototype.forEach` method. For more
	     * details on this behavior, see:
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Description
	     *
	     * Also note that, unlike `Array.prototype.forEach`, Ramda's `forEach` returns
	     * the original array. In some libraries this function is named `each`.
	     *
	     * Dispatches to the `forEach` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig (a -> *) -> [a] -> [a]
	     * @param {Function} fn The function to invoke. Receives one argument, `value`.
	     * @param {Array} list The list to iterate over.
	     * @return {Array} The original list.
	     * @see R.addIndex
	     * @example
	     *
	     *      var printXPlusFive = x => console.log(x + 5);
	     *      R.forEach(printXPlusFive, [1, 2, 3]); //=> [1, 2, 3]
	     *      // logs 6
	     *      // logs 7
	     *      // logs 8
	     */
	    var forEach = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
	        var len = list.length;
	        var idx = 0;
	        while (idx < len) {
	            fn(list[idx]);
	            idx += 1;
	        }
	        return list;
	    }));

	    /**
	     * Creates a new object from a list key-value pairs. If a key appears in
	     * multiple pairs, the rightmost pair is included in the object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig [[k,v]] -> {k: v}
	     * @param {Array} pairs An array of two-element arrays that will be the keys and values of the output object.
	     * @return {Object} The object made by pairing up `keys` and `values`.
	     * @see R.toPairs, R.pair
	     * @example
	     *
	     *      R.fromPairs([['a', 1], ['b', 2], ['c', 3]]); //=> {a: 1, b: 2, c: 3}
	     */
	    var fromPairs = _curry1(function fromPairs(pairs) {
	        var result = {};
	        var idx = 0;
	        while (idx < pairs.length) {
	            result[pairs[idx][0]] = pairs[idx][1];
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Takes a list and returns a list of lists where each sublist's elements are
	     * all "equal" according to the provided equality function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.21.0
	     * @category List
	     * @sig ((a, a) → Boolean) → [a] → [[a]]
	     * @param {Function} fn Function for determining whether two given (adjacent)
	     *        elements should be in the same group
	     * @param {Array} list The array to group. Also accepts a string, which will be
	     *        treated as a list of characters.
	     * @return {List} A list that contains sublists of equal elements,
	     *         whose concatenations are equal to the original list.
	     * @example
	     *
	     * R.groupWith(R.equals, [0, 1, 1, 2, 3, 5, 8, 13, 21])
	     * //=> [[0], [1, 1], [2], [3], [5], [8], [13], [21]]
	     *
	     * R.groupWith((a, b) => a % 2 === b % 2, [0, 1, 1, 2, 3, 5, 8, 13, 21])
	     * //=> [[0], [1, 1], [2], [3, 5], [8], [13, 21]]
	     *
	     * R.groupWith(R.eqBy(isVowel), 'aestiou')
	     * //=> ['ae', 'st', 'iou']
	     */
	    var groupWith = _curry2(function (fn, list) {
	        var res = [];
	        var idx = 0;
	        var len = list.length;
	        while (idx < len) {
	            var nextidx = idx + 1;
	            while (nextidx < len && fn(list[idx], list[nextidx])) {
	                nextidx += 1;
	            }
	            res.push(list.slice(idx, nextidx));
	            idx = nextidx;
	        }
	        return res;
	    });

	    /**
	     * Returns `true` if the first argument is greater than the second; `false`
	     * otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @see R.lt
	     * @example
	     *
	     *      R.gt(2, 1); //=> true
	     *      R.gt(2, 2); //=> false
	     *      R.gt(2, 3); //=> false
	     *      R.gt('a', 'z'); //=> false
	     *      R.gt('z', 'a'); //=> true
	     */
	    var gt = _curry2(function gt(a, b) {
	        return a > b;
	    });

	    /**
	     * Returns `true` if the first argument is greater than or equal to the second;
	     * `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {Number} a
	     * @param {Number} b
	     * @return {Boolean}
	     * @see R.lte
	     * @example
	     *
	     *      R.gte(2, 1); //=> true
	     *      R.gte(2, 2); //=> true
	     *      R.gte(2, 3); //=> false
	     *      R.gte('a', 'z'); //=> false
	     *      R.gte('z', 'a'); //=> true
	     */
	    var gte = _curry2(function gte(a, b) {
	        return a >= b;
	    });

	    /**
	     * Returns whether or not an object has an own property with the specified name
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Object
	     * @sig s -> {s: x} -> Boolean
	     * @param {String} prop The name of the property to check for.
	     * @param {Object} obj The object to query.
	     * @return {Boolean} Whether the property exists.
	     * @example
	     *
	     *      var hasName = R.has('name');
	     *      hasName({name: 'alice'});   //=> true
	     *      hasName({name: 'bob'});     //=> true
	     *      hasName({});                //=> false
	     *
	     *      var point = {x: 0, y: 0};
	     *      var pointHas = R.has(R.__, point);
	     *      pointHas('x');  //=> true
	     *      pointHas('y');  //=> true
	     *      pointHas('z');  //=> false
	     */
	    var has = _curry2(_has);

	    /**
	     * Returns whether or not an object or its prototype chain has a property with
	     * the specified name
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Object
	     * @sig s -> {s: x} -> Boolean
	     * @param {String} prop The name of the property to check for.
	     * @param {Object} obj The object to query.
	     * @return {Boolean} Whether the property exists.
	     * @example
	     *
	     *      function Rectangle(width, height) {
	     *        this.width = width;
	     *        this.height = height;
	     *      }
	     *      Rectangle.prototype.area = function() {
	     *        return this.width * this.height;
	     *      };
	     *
	     *      var square = new Rectangle(2, 2);
	     *      R.hasIn('width', square);  //=> true
	     *      R.hasIn('area', square);  //=> true
	     */
	    var hasIn = _curry2(function hasIn(prop, obj) {
	        return prop in obj;
	    });

	    /**
	     * Returns true if its arguments are identical, false otherwise. Values are
	     * identical if they reference the same memory. `NaN` is identical to `NaN`;
	     * `0` and `-0` are not identical.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category Relation
	     * @sig a -> a -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @example
	     *
	     *      var o = {};
	     *      R.identical(o, o); //=> true
	     *      R.identical(1, 1); //=> true
	     *      R.identical(1, '1'); //=> false
	     *      R.identical([], []); //=> false
	     *      R.identical(0, -0); //=> false
	     *      R.identical(NaN, NaN); //=> true
	     */
	    // SameValue algorithm
	    // Steps 1-5, 7-10
	    // Steps 6.b-6.e: +0 != -0
	    // Step 6.a: NaN == NaN
	    var identical = _curry2(function identical(a, b) {
	        // SameValue algorithm
	        if (a === b) {
	            // Steps 1-5, 7-10
	            // Steps 6.b-6.e: +0 != -0
	            return a !== 0 || 1 / a === 1 / b;
	        } else {
	            // Step 6.a: NaN == NaN
	            return a !== a && b !== b;
	        }
	    });

	    /**
	     * A function that does nothing but return the parameter supplied to it. Good
	     * as a default or placeholder function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig a -> a
	     * @param {*} x The value to return.
	     * @return {*} The input value, `x`.
	     * @example
	     *
	     *      R.identity(1); //=> 1
	     *
	     *      var obj = {};
	     *      R.identity(obj) === obj; //=> true
	     */
	    var identity = _curry1(_identity);

	    /**
	     * Creates a function that will process either the `onTrue` or the `onFalse`
	     * function depending upon the result of the `condition` predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Logic
	     * @sig (*... -> Boolean) -> (*... -> *) -> (*... -> *) -> (*... -> *)
	     * @param {Function} condition A predicate function
	     * @param {Function} onTrue A function to invoke when the `condition` evaluates to a truthy value.
	     * @param {Function} onFalse A function to invoke when the `condition` evaluates to a falsy value.
	     * @return {Function} A new unary function that will process either the `onTrue` or the `onFalse`
	     *                    function depending upon the result of the `condition` predicate.
	     * @see R.unless, R.when
	     * @example
	     *
	     *      var incCount = R.ifElse(
	     *        R.has('count'),
	     *        R.over(R.lensProp('count'), R.inc),
	     *        R.assoc('count', 1)
	     *      );
	     *      incCount({});           //=> { count: 1 }
	     *      incCount({ count: 1 }); //=> { count: 2 }
	     */
	    var ifElse = _curry3(function ifElse(condition, onTrue, onFalse) {
	        return curryN(Math.max(condition.length, onTrue.length, onFalse.length), function _ifElse() {
	            return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
	        });
	    });

	    /**
	     * Increments its argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Math
	     * @sig Number -> Number
	     * @param {Number} n
	     * @return {Number}
	     * @see R.dec
	     * @example
	     *
	     *      R.inc(42); //=> 43
	     */
	    var inc = add(1);

	    /**
	     * Inserts the supplied element into the list, at index `index`. _Note that
	     * this is not destructive_: it returns a copy of the list with the changes.
	     * <small>No lists have been harmed in the application of this function.</small>
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.2
	     * @category List
	     * @sig Number -> a -> [a] -> [a]
	     * @param {Number} index The position to insert the element
	     * @param {*} elt The element to insert into the Array
	     * @param {Array} list The list to insert into
	     * @return {Array} A new Array with `elt` inserted at `index`.
	     * @example
	     *
	     *      R.insert(2, 'x', [1,2,3,4]); //=> [1,2,'x',3,4]
	     */
	    var insert = _curry3(function insert(idx, elt, list) {
	        idx = idx < list.length && idx >= 0 ? idx : list.length;
	        var result = _slice(list);
	        result.splice(idx, 0, elt);
	        return result;
	    });

	    /**
	     * Inserts the sub-list into the list, at index `index`. _Note that this is not
	     * destructive_: it returns a copy of the list with the changes.
	     * <small>No lists have been harmed in the application of this function.</small>
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category List
	     * @sig Number -> [a] -> [a] -> [a]
	     * @param {Number} index The position to insert the sub-list
	     * @param {Array} elts The sub-list to insert into the Array
	     * @param {Array} list The list to insert the sub-list into
	     * @return {Array} A new Array with `elts` inserted starting at `index`.
	     * @example
	     *
	     *      R.insertAll(2, ['x','y','z'], [1,2,3,4]); //=> [1,2,'x','y','z',3,4]
	     */
	    var insertAll = _curry3(function insertAll(idx, elts, list) {
	        idx = idx < list.length && idx >= 0 ? idx : list.length;
	        return _concat(_concat(_slice(list, 0, idx), elts), _slice(list, idx));
	    });

	    /**
	     * Creates a new list with the separator interposed between elements.
	     *
	     * Dispatches to the `intersperse` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig a -> [a] -> [a]
	     * @param {*} separator The element to add to the list.
	     * @param {Array} list The list to be interposed.
	     * @return {Array} The new list.
	     * @example
	     *
	     *      R.intersperse('n', ['ba', 'a', 'a']); //=> ['ba', 'n', 'a', 'n', 'a']
	     */
	    var intersperse = _curry2(_checkForMethod('intersperse', function intersperse(separator, list) {
	        var out = [];
	        var idx = 0;
	        var length = list.length;
	        while (idx < length) {
	            if (idx === length - 1) {
	                out.push(list[idx]);
	            } else {
	                out.push(list[idx], separator);
	            }
	            idx += 1;
	        }
	        return out;
	    }));

	    /**
	     * See if an object (`val`) is an instance of the supplied constructor. This
	     * function will check up the inheritance chain, if any.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Type
	     * @sig (* -> {*}) -> a -> Boolean
	     * @param {Object} ctor A constructor
	     * @param {*} val The value to test
	     * @return {Boolean}
	     * @example
	     *
	     *      R.is(Object, {}); //=> true
	     *      R.is(Number, 1); //=> true
	     *      R.is(Object, 1); //=> false
	     *      R.is(String, 's'); //=> true
	     *      R.is(String, new String('')); //=> true
	     *      R.is(Object, new String('')); //=> true
	     *      R.is(Object, 's'); //=> false
	     *      R.is(Number, {}); //=> false
	     */
	    var is = _curry2(function is(Ctor, val) {
	        return val != null && val.constructor === Ctor || val instanceof Ctor;
	    });

	    /**
	     * Tests whether or not an object is similar to an array.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.5.0
	     * @category Type
	     * @category List
	     * @sig * -> Boolean
	     * @param {*} x The object to test.
	     * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
	     * @example
	     *
	     *      R.isArrayLike([]); //=> true
	     *      R.isArrayLike(true); //=> false
	     *      R.isArrayLike({}); //=> false
	     *      R.isArrayLike({length: 10}); //=> false
	     *      R.isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
	     */
	    var isArrayLike = _curry1(function isArrayLike(x) {
	        if (_isArray(x)) {
	            return true;
	        }
	        if (!x) {
	            return false;
	        }
	        if (typeof x !== 'object') {
	            return false;
	        }
	        if (_isString(x)) {
	            return false;
	        }
	        if (x.nodeType === 1) {
	            return !!x.length;
	        }
	        if (x.length === 0) {
	            return true;
	        }
	        if (x.length > 0) {
	            return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
	        }
	        return false;
	    });

	    /**
	     * Checks if the input value is `null` or `undefined`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Type
	     * @sig * -> Boolean
	     * @param {*} x The value to test.
	     * @return {Boolean} `true` if `x` is `undefined` or `null`, otherwise `false`.
	     * @example
	     *
	     *      R.isNil(null); //=> true
	     *      R.isNil(undefined); //=> true
	     *      R.isNil(0); //=> false
	     *      R.isNil([]); //=> false
	     */
	    var isNil = _curry1(function isNil(x) {
	        return x == null;
	    });

	    /**
	     * Returns a list containing the names of all the enumerable own properties of
	     * the supplied object.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {k: v} -> [k]
	     * @param {Object} obj The object to extract properties from
	     * @return {Array} An array of the object's own properties.
	     * @example
	     *
	     *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
	     */
	    // cover IE < 9 keys issues
	    // Safari bug
	    var keys = function () {
	        // cover IE < 9 keys issues
	        var hasEnumBug = !{ toString: null }.propertyIsEnumerable('toString');
	        var nonEnumerableProps = [
	            'constructor',
	            'valueOf',
	            'isPrototypeOf',
	            'toString',
	            'propertyIsEnumerable',
	            'hasOwnProperty',
	            'toLocaleString'
	        ];
	        // Safari bug
	        var hasArgsEnumBug = function () {
	            'use strict';
	            return arguments.propertyIsEnumerable('length');
	        }();
	        var contains = function contains(list, item) {
	            var idx = 0;
	            while (idx < list.length) {
	                if (list[idx] === item) {
	                    return true;
	                }
	                idx += 1;
	            }
	            return false;
	        };
	        return typeof Object.keys === 'function' && !hasArgsEnumBug ? _curry1(function keys(obj) {
	            return Object(obj) !== obj ? [] : Object.keys(obj);
	        }) : _curry1(function keys(obj) {
	            if (Object(obj) !== obj) {
	                return [];
	            }
	            var prop, nIdx;
	            var ks = [];
	            var checkArgsLength = hasArgsEnumBug && _isArguments(obj);
	            for (prop in obj) {
	                if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
	                    ks[ks.length] = prop;
	                }
	            }
	            if (hasEnumBug) {
	                nIdx = nonEnumerableProps.length - 1;
	                while (nIdx >= 0) {
	                    prop = nonEnumerableProps[nIdx];
	                    if (_has(prop, obj) && !contains(ks, prop)) {
	                        ks[ks.length] = prop;
	                    }
	                    nIdx -= 1;
	                }
	            }
	            return ks;
	        });
	    }();

	    /**
	     * Returns a list containing the names of all the properties of the supplied
	     * object, including prototype properties.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Object
	     * @sig {k: v} -> [k]
	     * @param {Object} obj The object to extract properties from
	     * @return {Array} An array of the object's own and prototype properties.
	     * @example
	     *
	     *      var F = function() { this.x = 'X'; };
	     *      F.prototype.y = 'Y';
	     *      var f = new F();
	     *      R.keysIn(f); //=> ['x', 'y']
	     */
	    var keysIn = _curry1(function keysIn(obj) {
	        var prop;
	        var ks = [];
	        for (prop in obj) {
	            ks[ks.length] = prop;
	        }
	        return ks;
	    });

	    /**
	     * Returns the number of elements in the array by returning `list.length`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig [a] -> Number
	     * @param {Array} list The array to inspect.
	     * @return {Number} The length of the array.
	     * @example
	     *
	     *      R.length([]); //=> 0
	     *      R.length([1, 2, 3]); //=> 3
	     */
	    var length = _curry1(function length(list) {
	        return list != null && _isNumber(list.length) ? list.length : NaN;
	    });

	    /**
	     * Returns `true` if the first argument is less than the second; `false`
	     * otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @see R.gt
	     * @example
	     *
	     *      R.lt(2, 1); //=> false
	     *      R.lt(2, 2); //=> false
	     *      R.lt(2, 3); //=> true
	     *      R.lt('a', 'z'); //=> true
	     *      R.lt('z', 'a'); //=> false
	     */
	    var lt = _curry2(function lt(a, b) {
	        return a < b;
	    });

	    /**
	     * Returns `true` if the first argument is less than or equal to the second;
	     * `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> Boolean
	     * @param {Number} a
	     * @param {Number} b
	     * @return {Boolean}
	     * @see R.gte
	     * @example
	     *
	     *      R.lte(2, 1); //=> false
	     *      R.lte(2, 2); //=> true
	     *      R.lte(2, 3); //=> true
	     *      R.lte('a', 'z'); //=> true
	     *      R.lte('z', 'a'); //=> false
	     */
	    var lte = _curry2(function lte(a, b) {
	        return a <= b;
	    });

	    /**
	     * The mapAccum function behaves like a combination of map and reduce; it
	     * applies a function to each element of a list, passing an accumulating
	     * parameter from left to right, and returning a final value of this
	     * accumulator together with the new list.
	     *
	     * The iterator function receives two arguments, *acc* and *value*, and should
	     * return a tuple *[acc, value]*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
	     * @param {Function} fn The function to be called on every element of the input `list`.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.addIndex
	     * @example
	     *
	     *      var digits = ['1', '2', '3', '4'];
	     *      var appender = (a, b) => [a + b, a + b];
	     *
	     *      R.mapAccum(appender, 0, digits); //=> ['01234', ['01', '012', '0123', '01234']]
	     */
	    var mapAccum = _curry3(function mapAccum(fn, acc, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [];
	        var tuple = [acc];
	        while (idx < len) {
	            tuple = fn(tuple[0], list[idx]);
	            result[idx] = tuple[1];
	            idx += 1;
	        }
	        return [
	            tuple[0],
	            result
	        ];
	    });

	    /**
	     * The mapAccumRight function behaves like a combination of map and reduce; it
	     * applies a function to each element of a list, passing an accumulating
	     * parameter from right to left, and returning a final value of this
	     * accumulator together with the new list.
	     *
	     * Similar to `mapAccum`, except moves through the input list from the right to
	     * the left.
	     *
	     * The iterator function receives two arguments, *acc* and *value*, and should
	     * return a tuple *[acc, value]*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
	     * @param {Function} fn The function to be called on every element of the input `list`.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.addIndex
	     * @example
	     *
	     *      var digits = ['1', '2', '3', '4'];
	     *      var append = (a, b) => [a + b, a + b];
	     *
	     *      R.mapAccumRight(append, 0, digits); //=> ['04321', ['04321', '0432', '043', '04']]
	     */
	    var mapAccumRight = _curry3(function mapAccumRight(fn, acc, list) {
	        var idx = list.length - 1;
	        var result = [];
	        var tuple = [acc];
	        while (idx >= 0) {
	            tuple = fn(tuple[0], list[idx]);
	            result[idx] = tuple[1];
	            idx -= 1;
	        }
	        return [
	            tuple[0],
	            result
	        ];
	    });

	    /**
	     * Tests a regular expression against a String. Note that this function will
	     * return an empty array when there are no matches. This differs from
	     * [`String.prototype.match`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
	     * which returns `null` when there are no matches.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category String
	     * @sig RegExp -> String -> [String | Undefined]
	     * @param {RegExp} rx A regular expression.
	     * @param {String} str The string to match against
	     * @return {Array} The list of matches or empty array.
	     * @see R.test
	     * @example
	     *
	     *      R.match(/([a-z]a)/g, 'bananas'); //=> ['ba', 'na', 'na']
	     *      R.match(/a/, 'b'); //=> []
	     *      R.match(/a/, null); //=> TypeError: null does not have a method named "match"
	     */
	    var match = _curry2(function match(rx, str) {
	        return str.match(rx) || [];
	    });

	    /**
	     * mathMod behaves like the modulo operator should mathematically, unlike the
	     * `%` operator (and by extension, R.modulo). So while "-17 % 5" is -2,
	     * mathMod(-17, 5) is 3. mathMod requires Integer arguments, and returns NaN
	     * when the modulus is zero or negative.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} m The dividend.
	     * @param {Number} p the modulus.
	     * @return {Number} The result of `b mod a`.
	     * @example
	     *
	     *      R.mathMod(-17, 5);  //=> 3
	     *      R.mathMod(17, 5);   //=> 2
	     *      R.mathMod(17, -5);  //=> NaN
	     *      R.mathMod(17, 0);   //=> NaN
	     *      R.mathMod(17.2, 5); //=> NaN
	     *      R.mathMod(17, 5.3); //=> NaN
	     *
	     *      var clock = R.mathMod(R.__, 12);
	     *      clock(15); //=> 3
	     *      clock(24); //=> 0
	     *
	     *      var seventeenMod = R.mathMod(17);
	     *      seventeenMod(3);  //=> 2
	     *      seventeenMod(4);  //=> 1
	     *      seventeenMod(10); //=> 7
	     */
	    var mathMod = _curry2(function mathMod(m, p) {
	        if (!_isInteger(m)) {
	            return NaN;
	        }
	        if (!_isInteger(p) || p < 1) {
	            return NaN;
	        }
	        return (m % p + p) % p;
	    });

	    /**
	     * Returns the larger of its two arguments.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> a
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.maxBy, R.min
	     * @example
	     *
	     *      R.max(789, 123); //=> 789
	     *      R.max('a', 'b'); //=> 'b'
	     */
	    var max = _curry2(function max(a, b) {
	        return b > a ? b : a;
	    });

	    /**
	     * Takes a function and two values, and returns whichever value produces the
	     * larger result when passed to the provided function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Relation
	     * @sig Ord b => (a -> b) -> a -> a -> a
	     * @param {Function} f
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.max, R.minBy
	     * @example
	     *
	     *      //  square :: Number -> Number
	     *      var square = n => n * n;
	     *
	     *      R.maxBy(square, -3, 2); //=> -3
	     *
	     *      R.reduce(R.maxBy(square), 0, [3, -5, 4, 1, -2]); //=> -5
	     *      R.reduce(R.maxBy(square), 0, []); //=> 0
	     */
	    var maxBy = _curry3(function maxBy(f, a, b) {
	        return f(b) > f(a) ? b : a;
	    });

	    /**
	     * Create a new object with the own properties of the first object merged with
	     * the own properties of the second object. If a key exists in both objects,
	     * the value from the second object will be used.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {k: v} -> {k: v} -> {k: v}
	     * @param {Object} l
	     * @param {Object} r
	     * @return {Object}
	     * @see R.mergeWith, R.mergeWithKey
	     * @example
	     *
	     *      R.merge({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
	     *      //=> { 'name': 'fred', 'age': 40 }
	     *
	     *      var resetToDefault = R.merge(R.__, {x: 0});
	     *      resetToDefault({x: 5, y: 2}); //=> {x: 0, y: 2}
	     */
	    var merge = _curry2(function merge(l, r) {
	        return _assign({}, l, r);
	    });

	    /**
	     * Merges a list of objects together into one object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig [{k: v}] -> {k: v}
	     * @param {Array} list An array of objects
	     * @return {Object} A merged object.
	     * @see R.reduce
	     * @example
	     *
	     *      R.mergeAll([{foo:1},{bar:2},{baz:3}]); //=> {foo:1,bar:2,baz:3}
	     *      R.mergeAll([{foo:1},{foo:2},{bar:2}]); //=> {foo:2,bar:2}
	     */
	    var mergeAll = _curry1(function mergeAll(list) {
	        return _assign.apply(null, [{}].concat(list));
	    });

	    /**
	     * Creates a new object with the own properties of the two provided objects. If
	     * a key exists in both objects, the provided function is applied to the key
	     * and the values associated with the key in each object, with the result being
	     * used as the value associated with the key in the returned object. The key
	     * will be excluded from the returned object if the resulting value is
	     * `undefined`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Object
	     * @sig (String -> a -> a -> a) -> {a} -> {a} -> {a}
	     * @param {Function} fn
	     * @param {Object} l
	     * @param {Object} r
	     * @return {Object}
	     * @see R.merge, R.mergeWith
	     * @example
	     *
	     *      let concatValues = (k, l, r) => k == 'values' ? R.concat(l, r) : r
	     *      R.mergeWithKey(concatValues,
	     *                     { a: true, thing: 'foo', values: [10, 20] },
	     *                     { b: true, thing: 'bar', values: [15, 35] });
	     *      //=> { a: true, b: true, thing: 'bar', values: [10, 20, 15, 35] }
	     */
	    var mergeWithKey = _curry3(function mergeWithKey(fn, l, r) {
	        var result = {};
	        var k;
	        for (k in l) {
	            if (_has(k, l)) {
	                result[k] = _has(k, r) ? fn(k, l[k], r[k]) : l[k];
	            }
	        }
	        for (k in r) {
	            if (_has(k, r) && !_has(k, result)) {
	                result[k] = r[k];
	            }
	        }
	        return result;
	    });

	    /**
	     * Returns the smaller of its two arguments.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord a => a -> a -> a
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.minBy, R.max
	     * @example
	     *
	     *      R.min(789, 123); //=> 123
	     *      R.min('a', 'b'); //=> 'a'
	     */
	    var min = _curry2(function min(a, b) {
	        return b < a ? b : a;
	    });

	    /**
	     * Takes a function and two values, and returns whichever value produces the
	     * smaller result when passed to the provided function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Relation
	     * @sig Ord b => (a -> b) -> a -> a -> a
	     * @param {Function} f
	     * @param {*} a
	     * @param {*} b
	     * @return {*}
	     * @see R.min, R.maxBy
	     * @example
	     *
	     *      //  square :: Number -> Number
	     *      var square = n => n * n;
	     *
	     *      R.minBy(square, -3, 2); //=> 2
	     *
	     *      R.reduce(R.minBy(square), Infinity, [3, -5, 4, 1, -2]); //=> 1
	     *      R.reduce(R.minBy(square), Infinity, []); //=> Infinity
	     */
	    var minBy = _curry3(function minBy(f, a, b) {
	        return f(b) < f(a) ? b : a;
	    });

	    /**
	     * Divides the first parameter by the second and returns the remainder. Note
	     * that this function preserves the JavaScript-style behavior for modulo. For
	     * mathematical modulo see `mathMod`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The value to the divide.
	     * @param {Number} b The pseudo-modulus
	     * @return {Number} The result of `b % a`.
	     * @see R.mathMod
	     * @example
	     *
	     *      R.modulo(17, 3); //=> 2
	     *      // JS behavior:
	     *      R.modulo(-17, 3); //=> -2
	     *      R.modulo(17, -3); //=> 2
	     *
	     *      var isOdd = R.modulo(R.__, 2);
	     *      isOdd(42); //=> 0
	     *      isOdd(21); //=> 1
	     */
	    var modulo = _curry2(function modulo(a, b) {
	        return a % b;
	    });

	    /**
	     * Multiplies two numbers. Equivalent to `a * b` but curried.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The first value.
	     * @param {Number} b The second value.
	     * @return {Number} The result of `a * b`.
	     * @see R.divide
	     * @example
	     *
	     *      var double = R.multiply(2);
	     *      var triple = R.multiply(3);
	     *      double(3);       //=>  6
	     *      triple(4);       //=> 12
	     *      R.multiply(2, 5);  //=> 10
	     */
	    var multiply = _curry2(function multiply(a, b) {
	        return a * b;
	    });

	    /**
	     * Wraps a function of any arity (including nullary) in a function that accepts
	     * exactly `n` parameters. Any extraneous parameters will not be passed to the
	     * supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig Number -> (* -> a) -> (* -> a)
	     * @param {Number} n The desired arity of the new function.
	     * @param {Function} fn The function to wrap.
	     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	     *         arity `n`.
	     * @example
	     *
	     *      var takesTwoArgs = (a, b) => [a, b];
	     *
	     *      takesTwoArgs.length; //=> 2
	     *      takesTwoArgs(1, 2); //=> [1, 2]
	     *
	     *      var takesOneArg = R.nAry(1, takesTwoArgs);
	     *      takesOneArg.length; //=> 1
	     *      // Only `n` arguments are passed to the wrapped function
	     *      takesOneArg(1, 2); //=> [1, undefined]
	     */
	    var nAry = _curry2(function nAry(n, fn) {
	        switch (n) {
	        case 0:
	            return function () {
	                return fn.call(this);
	            };
	        case 1:
	            return function (a0) {
	                return fn.call(this, a0);
	            };
	        case 2:
	            return function (a0, a1) {
	                return fn.call(this, a0, a1);
	            };
	        case 3:
	            return function (a0, a1, a2) {
	                return fn.call(this, a0, a1, a2);
	            };
	        case 4:
	            return function (a0, a1, a2, a3) {
	                return fn.call(this, a0, a1, a2, a3);
	            };
	        case 5:
	            return function (a0, a1, a2, a3, a4) {
	                return fn.call(this, a0, a1, a2, a3, a4);
	            };
	        case 6:
	            return function (a0, a1, a2, a3, a4, a5) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5);
	            };
	        case 7:
	            return function (a0, a1, a2, a3, a4, a5, a6) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6);
	            };
	        case 8:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);
	            };
	        case 9:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);
	            };
	        case 10:
	            return function (a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
	                return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
	            };
	        default:
	            throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
	        }
	    });

	    /**
	     * Negates its argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Math
	     * @sig Number -> Number
	     * @param {Number} n
	     * @return {Number}
	     * @example
	     *
	     *      R.negate(42); //=> -42
	     */
	    var negate = _curry1(function negate(n) {
	        return -n;
	    });

	    /**
	     * Returns `true` if no elements of the list match the predicate, `false`
	     * otherwise.
	     *
	     * Dispatches to the `any` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> Boolean
	     * @param {Function} fn The predicate function.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the predicate is not satisfied by every element, `false` otherwise.
	     * @see R.all, R.any
	     * @example
	     *
	     *      var isEven = n => n % 2 === 0;
	     *
	     *      R.none(isEven, [1, 3, 5, 7, 9, 11]); //=> true
	     *      R.none(isEven, [1, 3, 5, 7, 8, 11]); //=> false
	     */
	    var none = _curry2(_complement(_dispatchable('any', _xany, any)));

	    /**
	     * A function that returns the `!` of its argument. It will return `true` when
	     * passed false-y value, and `false` when passed a truth-y one.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig * -> Boolean
	     * @param {*} a any value
	     * @return {Boolean} the logical inverse of passed argument.
	     * @see R.complement
	     * @example
	     *
	     *      R.not(true); //=> false
	     *      R.not(false); //=> true
	     *      R.not(0); //=> true
	     *      R.not(1); //=> false
	     */
	    var not = _curry1(function not(a) {
	        return !a;
	    });

	    /**
	     * Returns the nth element of the given list or string. If n is negative the
	     * element at index length + n is returned.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> [a] -> a | Undefined
	     * @sig Number -> String -> String
	     * @param {Number} offset
	     * @param {*} list
	     * @return {*}
	     * @example
	     *
	     *      var list = ['foo', 'bar', 'baz', 'quux'];
	     *      R.nth(1, list); //=> 'bar'
	     *      R.nth(-1, list); //=> 'quux'
	     *      R.nth(-99, list); //=> undefined
	     *
	     *      R.nth(2, 'abc'); //=> 'c'
	     *      R.nth(3, 'abc'); //=> ''
	     */
	    var nth = _curry2(function nth(offset, list) {
	        var idx = offset < 0 ? list.length + offset : offset;
	        return _isString(list) ? list.charAt(idx) : list[idx];
	    });

	    /**
	     * Returns a function which returns its nth argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig Number -> *... -> *
	     * @param {Number} n
	     * @return {Function}
	     * @example
	     *
	     *      R.nthArg(1)('a', 'b', 'c'); //=> 'b'
	     *      R.nthArg(-1)('a', 'b', 'c'); //=> 'c'
	     */
	    var nthArg = _curry1(function nthArg(n) {
	        var arity = n < 0 ? 1 : n + 1;
	        return curryN(arity, function () {
	            return nth(n, arguments);
	        });
	    });

	    /**
	     * Creates an object containing a single key:value pair.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Object
	     * @sig String -> a -> {String:a}
	     * @param {String} key
	     * @param {*} val
	     * @return {Object}
	     * @see R.pair
	     * @example
	     *
	     *      var matchPhrases = R.compose(
	     *        R.objOf('must'),
	     *        R.map(R.objOf('match_phrase'))
	     *      );
	     *      matchPhrases(['foo', 'bar', 'baz']); //=> {must: [{match_phrase: 'foo'}, {match_phrase: 'bar'}, {match_phrase: 'baz'}]}
	     */
	    var objOf = _curry2(function objOf(key, val) {
	        var obj = {};
	        obj[key] = val;
	        return obj;
	    });

	    /**
	     * Returns a singleton array containing the value provided.
	     *
	     * Note this `of` is different from the ES6 `of`; See
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Function
	     * @sig a -> [a]
	     * @param {*} x any value
	     * @return {Array} An array wrapping `x`.
	     * @example
	     *
	     *      R.of(null); //=> [null]
	     *      R.of([42]); //=> [[42]]
	     */
	    var of = _curry1(_of);

	    /**
	     * Accepts a function `fn` and returns a function that guards invocation of
	     * `fn` such that `fn` can only ever be called once, no matter how many times
	     * the returned function is invoked. The first value calculated is returned in
	     * subsequent invocations.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a... -> b) -> (a... -> b)
	     * @param {Function} fn The function to wrap in a call-only-once wrapper.
	     * @return {Function} The wrapped function.
	     * @example
	     *
	     *      var addOneOnce = R.once(x => x + 1);
	     *      addOneOnce(10); //=> 11
	     *      addOneOnce(addOneOnce(50)); //=> 11
	     */
	    var once = _curry1(function once(fn) {
	        var called = false;
	        var result;
	        return _arity(fn.length, function () {
	            if (called) {
	                return result;
	            }
	            called = true;
	            result = fn.apply(this, arguments);
	            return result;
	        });
	    });

	    /**
	     * Returns `true` if one or both of its arguments are `true`. Returns `false`
	     * if both arguments are `false`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig * -> * -> *
	     * @param {Boolean} a A boolean value
	     * @param {Boolean} b A boolean value
	     * @return {Boolean} `true` if one or both arguments are `true`, `false` otherwise
	     * @see R.either
	     * @example
	     *
	     *      R.or(true, true); //=> true
	     *      R.or(true, false); //=> true
	     *      R.or(false, true); //=> true
	     *      R.or(false, false); //=> false
	     */
	    var or = _curry2(function or(a, b) {
	        return a || b;
	    });

	    /**
	     * Returns the result of "setting" the portion of the given data structure
	     * focused by the given lens to the result of applying the given function to
	     * the focused value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Lens s a -> (a -> a) -> s -> s
	     * @param {Lens} lens
	     * @param {*} v
	     * @param {*} x
	     * @return {*}
	     * @see R.prop, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var headLens = R.lensIndex(0);
	     *
	     *      R.over(headLens, R.toUpper, ['foo', 'bar', 'baz']); //=> ['FOO', 'bar', 'baz']
	     */
	    // `Identity` is a functor that holds a single value, where `map` simply
	    // transforms the held value with the provided function.
	    // The value returned by the getter function is first transformed with `f`,
	    // then set as the value of an `Identity`. This is then mapped over with the
	    // setter function of the lens.
	    var over = function () {
	        // `Identity` is a functor that holds a single value, where `map` simply
	        // transforms the held value with the provided function.
	        var Identity = function (x) {
	            return {
	                value: x,
	                map: function (f) {
	                    return Identity(f(x));
	                }
	            };
	        };
	        return _curry3(function over(lens, f, x) {
	            // The value returned by the getter function is first transformed with `f`,
	            // then set as the value of an `Identity`. This is then mapped over with the
	            // setter function of the lens.
	            return lens(function (y) {
	                return Identity(f(y));
	            })(x).value;
	        });
	    }();

	    /**
	     * Takes two arguments, `fst` and `snd`, and returns `[fst, snd]`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category List
	     * @sig a -> b -> (a,b)
	     * @param {*} fst
	     * @param {*} snd
	     * @return {Array}
	     * @see R.objOf, R.of
	     * @example
	     *
	     *      R.pair('foo', 'bar'); //=> ['foo', 'bar']
	     */
	    var pair = _curry2(function pair(fst, snd) {
	        return [
	            fst,
	            snd
	        ];
	    });

	    /**
	     * Retrieve the value at a given path.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Object
	     * @sig [String] -> {k: v} -> v | Undefined
	     * @param {Array} path The path to use.
	     * @param {Object} obj The object to retrieve the nested property from.
	     * @return {*} The data at `path`.
	     * @see R.prop
	     * @example
	     *
	     *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
	     *      R.path(['a', 'b'], {c: {b: 2}}); //=> undefined
	     */
	    var path = _curry2(function path(paths, obj) {
	        var val = obj;
	        var idx = 0;
	        while (idx < paths.length) {
	            if (val == null) {
	                return;
	            }
	            val = val[paths[idx]];
	            idx += 1;
	        }
	        return val;
	    });

	    /**
	     * If the given, non-null object has a value at the given path, returns the
	     * value at that path. Otherwise returns the provided default value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Object
	     * @sig a -> [String] -> Object -> a
	     * @param {*} d The default value.
	     * @param {Array} p The path to use.
	     * @param {Object} obj The object to retrieve the nested property from.
	     * @return {*} The data at `path` of the supplied object or the default value.
	     * @example
	     *
	     *      R.pathOr('N/A', ['a', 'b'], {a: {b: 2}}); //=> 2
	     *      R.pathOr('N/A', ['a', 'b'], {c: {b: 2}}); //=> "N/A"
	     */
	    var pathOr = _curry3(function pathOr(d, p, obj) {
	        return defaultTo(d, path(p, obj));
	    });

	    /**
	     * Returns `true` if the specified object property at given path satisfies the
	     * given predicate; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Logic
	     * @sig (a -> Boolean) -> [String] -> Object -> Boolean
	     * @param {Function} pred
	     * @param {Array} propPath
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.propSatisfies, R.path
	     * @example
	     *
	     *      R.pathSatisfies(y => y > 0, ['x', 'y'], {x: {y: 2}}); //=> true
	     */
	    var pathSatisfies = _curry3(function pathSatisfies(pred, propPath, obj) {
	        return propPath.length > 0 && pred(path(propPath, obj));
	    });

	    /**
	     * Returns a partial copy of an object containing only the keys specified. If
	     * the key does not exist, the property is ignored.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [k] -> {k: v} -> {k: v}
	     * @param {Array} names an array of String property names to copy onto a new object
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with only properties from `names` on it.
	     * @see R.omit, R.props
	     * @example
	     *
	     *      R.pick(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
	     *      R.pick(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1}
	     */
	    var pick = _curry2(function pick(names, obj) {
	        var result = {};
	        var idx = 0;
	        while (idx < names.length) {
	            if (names[idx] in obj) {
	                result[names[idx]] = obj[names[idx]];
	            }
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Similar to `pick` except that this one includes a `key: undefined` pair for
	     * properties that don't exist.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [k] -> {k: v} -> {k: v}
	     * @param {Array} names an array of String property names to copy onto a new object
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with only properties from `names` on it.
	     * @see R.pick
	     * @example
	     *
	     *      R.pickAll(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
	     *      R.pickAll(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, e: undefined, f: undefined}
	     */
	    var pickAll = _curry2(function pickAll(names, obj) {
	        var result = {};
	        var idx = 0;
	        var len = names.length;
	        while (idx < len) {
	            var name = names[idx];
	            result[name] = obj[name];
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Returns a partial copy of an object containing only the keys that satisfy
	     * the supplied predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @sig (v, k -> Boolean) -> {k: v} -> {k: v}
	     * @param {Function} pred A predicate to determine whether or not a key
	     *        should be included on the output object.
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with only properties that satisfy `pred`
	     *         on it.
	     * @see R.pick, R.filter
	     * @example
	     *
	     *      var isUpperCase = (val, key) => key.toUpperCase() === key;
	     *      R.pickBy(isUpperCase, {a: 1, b: 2, A: 3, B: 4}); //=> {A: 3, B: 4}
	     */
	    var pickBy = _curry2(function pickBy(test, obj) {
	        var result = {};
	        for (var prop in obj) {
	            if (test(obj[prop], prop, obj)) {
	                result[prop] = obj[prop];
	            }
	        }
	        return result;
	    });

	    /**
	     * Returns a new list with the given element at the front, followed by the
	     * contents of the list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> [a]
	     * @param {*} el The item to add to the head of the output list.
	     * @param {Array} list The array to add to the tail of the output list.
	     * @return {Array} A new array.
	     * @see R.append
	     * @example
	     *
	     *      R.prepend('fee', ['fi', 'fo', 'fum']); //=> ['fee', 'fi', 'fo', 'fum']
	     */
	    var prepend = _curry2(function prepend(el, list) {
	        return _concat([el], list);
	    });

	    /**
	     * Returns a function that when supplied an object returns the indicated
	     * property of that object, if it exists.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig s -> {s: a} -> a | Undefined
	     * @param {String} p The property name
	     * @param {Object} obj The object to query
	     * @return {*} The value at `obj.p`.
	     * @see R.path
	     * @example
	     *
	     *      R.prop('x', {x: 100}); //=> 100
	     *      R.prop('x', {}); //=> undefined
	     */
	    var prop = _curry2(function prop(p, obj) {
	        return obj[p];
	    });

	    /**
	     * Returns `true` if the specified object property is of the given type;
	     * `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Type
	     * @sig Type -> String -> Object -> Boolean
	     * @param {Function} type
	     * @param {String} name
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.is, R.propSatisfies
	     * @example
	     *
	     *      R.propIs(Number, 'x', {x: 1, y: 2});  //=> true
	     *      R.propIs(Number, 'x', {x: 'foo'});    //=> false
	     *      R.propIs(Number, 'x', {});            //=> false
	     */
	    var propIs = _curry3(function propIs(type, name, obj) {
	        return is(type, obj[name]);
	    });

	    /**
	     * If the given, non-null object has an own property with the specified name,
	     * returns the value of that property. Otherwise returns the provided default
	     * value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category Object
	     * @sig a -> String -> Object -> a
	     * @param {*} val The default value.
	     * @param {String} p The name of the property to return.
	     * @param {Object} obj The object to query.
	     * @return {*} The value of given property of the supplied object or the default value.
	     * @example
	     *
	     *      var alice = {
	     *        name: 'ALICE',
	     *        age: 101
	     *      };
	     *      var favorite = R.prop('favoriteLibrary');
	     *      var favoriteWithDefault = R.propOr('Ramda', 'favoriteLibrary');
	     *
	     *      favorite(alice);  //=> undefined
	     *      favoriteWithDefault(alice);  //=> 'Ramda'
	     */
	    var propOr = _curry3(function propOr(val, p, obj) {
	        return obj != null && _has(p, obj) ? obj[p] : val;
	    });

	    /**
	     * Returns `true` if the specified object property satisfies the given
	     * predicate; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Logic
	     * @sig (a -> Boolean) -> String -> {String: a} -> Boolean
	     * @param {Function} pred
	     * @param {String} name
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.propEq, R.propIs
	     * @example
	     *
	     *      R.propSatisfies(x => x > 0, 'x', {x: 1, y: 2}); //=> true
	     */
	    var propSatisfies = _curry3(function propSatisfies(pred, name, obj) {
	        return pred(obj[name]);
	    });

	    /**
	     * Acts as multiple `prop`: array of keys in, array of values out. Preserves
	     * order.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [k] -> {k: v} -> [v]
	     * @param {Array} ps The property names to fetch
	     * @param {Object} obj The object to query
	     * @return {Array} The corresponding values or partially applied function.
	     * @example
	     *
	     *      R.props(['x', 'y'], {x: 1, y: 2}); //=> [1, 2]
	     *      R.props(['c', 'a', 'b'], {b: 2, a: 1}); //=> [undefined, 1, 2]
	     *
	     *      var fullName = R.compose(R.join(' '), R.props(['first', 'last']));
	     *      fullName({last: 'Bullet-Tooth', age: 33, first: 'Tony'}); //=> 'Tony Bullet-Tooth'
	     */
	    var props = _curry2(function props(ps, obj) {
	        var len = ps.length;
	        var out = [];
	        var idx = 0;
	        while (idx < len) {
	            out[idx] = obj[ps[idx]];
	            idx += 1;
	        }
	        return out;
	    });

	    /**
	     * Returns a list of numbers from `from` (inclusive) to `to` (exclusive).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> Number -> [Number]
	     * @param {Number} from The first number in the list.
	     * @param {Number} to One more than the last number in the list.
	     * @return {Array} The list of numbers in tthe set `[a, b)`.
	     * @example
	     *
	     *      R.range(1, 5);    //=> [1, 2, 3, 4]
	     *      R.range(50, 53);  //=> [50, 51, 52]
	     */
	    var range = _curry2(function range(from, to) {
	        if (!(_isNumber(from) && _isNumber(to))) {
	            throw new TypeError('Both arguments to range must be numbers');
	        }
	        var result = [];
	        var n = from;
	        while (n < to) {
	            result.push(n);
	            n += 1;
	        }
	        return result;
	    });

	    /**
	     * Returns a single item by iterating through the list, successively calling
	     * the iterator function and passing it an accumulator value and the current
	     * value from the array, and then passing the result to the next call.
	     *
	     * Similar to `reduce`, except moves through the input list from the right to
	     * the left.
	     *
	     * The iterator function receives two values: *(acc, value)*
	     *
	     * Note: `R.reduceRight` does not skip deleted or unassigned indices (sparse
	     * arrays), unlike the native `Array.prototype.reduce` method. For more details
	     * on this behavior, see:
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight#Description
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a,b -> a) -> a -> [b] -> a
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.addIndex
	     * @example
	     *
	     *      var pairs = [ ['a', 1], ['b', 2], ['c', 3] ];
	     *      var flattenPairs = (acc, pair) => acc.concat(pair);
	     *
	     *      R.reduceRight(flattenPairs, [], pairs); //=> [ 'c', 3, 'b', 2, 'a', 1 ]
	     */
	    var reduceRight = _curry3(function reduceRight(fn, acc, list) {
	        var idx = list.length - 1;
	        while (idx >= 0) {
	            acc = fn(acc, list[idx]);
	            idx -= 1;
	        }
	        return acc;
	    });

	    /**
	     * Returns a value wrapped to indicate that it is the final value of the reduce
	     * and transduce functions. The returned value should be considered a black
	     * box: the internal structure is not guaranteed to be stable.
	     *
	     * Note: this optimization is unavailable to functions not explicitly listed
	     * above. For instance, it is not currently supported by reduceRight.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category List
	     * @sig a -> *
	     * @param {*} x The final value of the reduce.
	     * @return {*} The wrapped value.
	     * @see R.reduce, R.transduce
	     * @example
	     *
	     *      R.reduce(
	     *        R.pipe(R.add, R.when(R.gte(R.__, 10), R.reduced)),
	     *        0,
	     *        [1, 2, 3, 4, 5]) // 10
	     */
	    var reduced = _curry1(_reduced);

	    /**
	     * Removes the sub-list of `list` starting at index `start` and containing
	     * `count` elements. _Note that this is not destructive_: it returns a copy of
	     * the list with the changes.
	     * <small>No lists have been harmed in the application of this function.</small>
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.2
	     * @category List
	     * @sig Number -> Number -> [a] -> [a]
	     * @param {Number} start The position to start removing elements
	     * @param {Number} count The number of elements to remove
	     * @param {Array} list The list to remove from
	     * @return {Array} A new Array with `count` elements from `start` removed.
	     * @example
	     *
	     *      R.remove(2, 3, [1,2,3,4,5,6,7,8]); //=> [1,2,6,7,8]
	     */
	    var remove = _curry3(function remove(start, count, list) {
	        return _concat(_slice(list, 0, Math.min(start, list.length)), _slice(list, Math.min(list.length, start + count)));
	    });

	    /**
	     * Replace a substring or regex match in a string with a replacement.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category String
	     * @sig RegExp|String -> String -> String -> String
	     * @param {RegExp|String} pattern A regular expression or a substring to match.
	     * @param {String} replacement The string to replace the matches with.
	     * @param {String} str The String to do the search and replacement in.
	     * @return {String} The result.
	     * @example
	     *
	     *      R.replace('foo', 'bar', 'foo foo foo'); //=> 'bar foo foo'
	     *      R.replace(/foo/, 'bar', 'foo foo foo'); //=> 'bar foo foo'
	     *
	     *      // Use the "g" (global) flag to replace all occurrences:
	     *      R.replace(/foo/g, 'bar', 'foo foo foo'); //=> 'bar bar bar'
	     */
	    var replace = _curry3(function replace(regex, replacement, str) {
	        return str.replace(regex, replacement);
	    });

	    /**
	     * Returns a new list or string with the elements or characters in reverse
	     * order.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a]
	     * @sig String -> String
	     * @param {Array|String} list
	     * @return {Array|String}
	     * @example
	     *
	     *      R.reverse([1, 2, 3]);  //=> [3, 2, 1]
	     *      R.reverse([1, 2]);     //=> [2, 1]
	     *      R.reverse([1]);        //=> [1]
	     *      R.reverse([]);         //=> []
	     *
	     *      R.reverse('abc');      //=> 'cba'
	     *      R.reverse('ab');       //=> 'ba'
	     *      R.reverse('a');        //=> 'a'
	     *      R.reverse('');         //=> ''
	     */
	    var reverse = _curry1(function reverse(list) {
	        return _isString(list) ? list.split('').reverse().join('') : _slice(list).reverse();
	    });

	    /**
	     * Scan is similar to reduce, but returns a list of successively reduced values
	     * from the left
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (a,b -> a) -> a -> [b] -> [a]
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {Array} A list of all intermediately reduced values.
	     * @example
	     *
	     *      var numbers = [1, 2, 3, 4];
	     *      var factorials = R.scan(R.multiply, 1, numbers); //=> [1, 1, 2, 6, 24]
	     */
	    var scan = _curry3(function scan(fn, acc, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [acc];
	        while (idx < len) {
	            acc = fn(acc, list[idx]);
	            result[idx + 1] = acc;
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Returns the result of "setting" the portion of the given data structure
	     * focused by the given lens to the given value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Lens s a -> a -> s -> s
	     * @param {Lens} lens
	     * @param {*} v
	     * @param {*} x
	     * @return {*}
	     * @see R.prop, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var xLens = R.lensProp('x');
	     *
	     *      R.set(xLens, 4, {x: 1, y: 2});  //=> {x: 4, y: 2}
	     *      R.set(xLens, 8, {x: 1, y: 2});  //=> {x: 8, y: 2}
	     */
	    var set = _curry3(function set(lens, v, x) {
	        return over(lens, always(v), x);
	    });

	    /**
	     * Returns the elements of the given list or string (or object with a `slice`
	     * method) from `fromIndex` (inclusive) to `toIndex` (exclusive).
	     *
	     * Dispatches to the `slice` method of the third argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.4
	     * @category List
	     * @sig Number -> Number -> [a] -> [a]
	     * @sig Number -> Number -> String -> String
	     * @param {Number} fromIndex The start index (inclusive).
	     * @param {Number} toIndex The end index (exclusive).
	     * @param {*} list
	     * @return {*}
	     * @example
	     *
	     *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
	     *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
	     *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
	     *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
	     *      R.slice(0, 3, 'ramda');                     //=> 'ram'
	     */
	    var slice = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
	        return Array.prototype.slice.call(list, fromIndex, toIndex);
	    }));

	    /**
	     * Returns a copy of the list, sorted according to the comparator function,
	     * which should accept two values at a time and return a negative number if the
	     * first value is smaller, a positive number if it's larger, and zero if they
	     * are equal. Please note that this is a **copy** of the list. It does not
	     * modify the original.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a,a -> Number) -> [a] -> [a]
	     * @param {Function} comparator A sorting function :: a -> b -> Int
	     * @param {Array} list The list to sort
	     * @return {Array} a new array with its elements sorted by the comparator function.
	     * @example
	     *
	     *      var diff = function(a, b) { return a - b; };
	     *      R.sort(diff, [4,2,7,5]); //=> [2, 4, 5, 7]
	     */
	    var sort = _curry2(function sort(comparator, list) {
	        return _slice(list).sort(comparator);
	    });

	    /**
	     * Sorts the list according to the supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig Ord b => (a -> b) -> [a] -> [a]
	     * @param {Function} fn
	     * @param {Array} list The list to sort.
	     * @return {Array} A new list sorted by the keys generated by `fn`.
	     * @example
	     *
	     *      var sortByFirstItem = R.sortBy(R.prop(0));
	     *      var sortByNameCaseInsensitive = R.sortBy(R.compose(R.toLower, R.prop('name')));
	     *      var pairs = [[-1, 1], [-2, 2], [-3, 3]];
	     *      sortByFirstItem(pairs); //=> [[-3, 3], [-2, 2], [-1, 1]]
	     *      var alice = {
	     *        name: 'ALICE',
	     *        age: 101
	     *      };
	     *      var bob = {
	     *        name: 'Bob',
	     *        age: -10
	     *      };
	     *      var clara = {
	     *        name: 'clara',
	     *        age: 314.159
	     *      };
	     *      var people = [clara, bob, alice];
	     *      sortByNameCaseInsensitive(people); //=> [alice, bob, clara]
	     */
	    var sortBy = _curry2(function sortBy(fn, list) {
	        return _slice(list).sort(function (a, b) {
	            var aa = fn(a);
	            var bb = fn(b);
	            return aa < bb ? -1 : aa > bb ? 1 : 0;
	        });
	    });

	    /**
	     * Splits a given list or string at a given index.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig Number -> [a] -> [[a], [a]]
	     * @sig Number -> String -> [String, String]
	     * @param {Number} index The index where the array/string is split.
	     * @param {Array|String} array The array/string to be split.
	     * @return {Array}
	     * @example
	     *
	     *      R.splitAt(1, [1, 2, 3]);          //=> [[1], [2, 3]]
	     *      R.splitAt(5, 'hello world');      //=> ['hello', ' world']
	     *      R.splitAt(-1, 'foobar');          //=> ['fooba', 'r']
	     */
	    var splitAt = _curry2(function splitAt(index, array) {
	        return [
	            slice(0, index, array),
	            slice(index, length(array), array)
	        ];
	    });

	    /**
	     * Splits a collection into slices of the specified length.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig Number -> [a] -> [[a]]
	     * @sig Number -> String -> [String]
	     * @param {Number} n
	     * @param {Array} list
	     * @return {Array}
	     * @example
	     *
	     *      R.splitEvery(3, [1, 2, 3, 4, 5, 6, 7]); //=> [[1, 2, 3], [4, 5, 6], [7]]
	     *      R.splitEvery(3, 'foobarbaz'); //=> ['foo', 'bar', 'baz']
	     */
	    var splitEvery = _curry2(function splitEvery(n, list) {
	        if (n <= 0) {
	            throw new Error('First argument to splitEvery must be a positive integer');
	        }
	        var result = [];
	        var idx = 0;
	        while (idx < list.length) {
	            result.push(slice(idx, idx += n, list));
	        }
	        return result;
	    });

	    /**
	     * Takes a list and a predicate and returns a pair of lists with the following properties:
	     *
	     *  - the result of concatenating the two output lists is equivalent to the input list;
	     *  - none of the elements of the first output list satisfies the predicate; and
	     *  - if the second output list is non-empty, its first element satisfies the predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [[a], [a]]
	     * @param {Function} pred The predicate that determines where the array is split.
	     * @param {Array} list The array to be split.
	     * @return {Array}
	     * @example
	     *
	     *      R.splitWhen(R.equals(2), [1, 2, 3, 1, 2, 3]);   //=> [[1], [2, 3, 1, 2, 3]]
	     */
	    var splitWhen = _curry2(function splitWhen(pred, list) {
	        var idx = 0;
	        var len = list.length;
	        var prefix = [];
	        while (idx < len && !pred(list[idx])) {
	            prefix.push(list[idx]);
	            idx += 1;
	        }
	        return [
	            prefix,
	            _slice(list, idx)
	        ];
	    });

	    /**
	     * Subtracts its second argument from its first argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig Number -> Number -> Number
	     * @param {Number} a The first value.
	     * @param {Number} b The second value.
	     * @return {Number} The result of `a - b`.
	     * @see R.add
	     * @example
	     *
	     *      R.subtract(10, 8); //=> 2
	     *
	     *      var minus5 = R.subtract(R.__, 5);
	     *      minus5(17); //=> 12
	     *
	     *      var complementaryAngle = R.subtract(90);
	     *      complementaryAngle(30); //=> 60
	     *      complementaryAngle(72); //=> 18
	     */
	    var subtract = _curry2(function subtract(a, b) {
	        return Number(a) - Number(b);
	    });

	    /**
	     * Returns all but the first element of the given list or string (or object
	     * with a `tail` method).
	     *
	     * Dispatches to the `slice` method of the first argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a]
	     * @sig String -> String
	     * @param {*} list
	     * @return {*}
	     * @see R.head, R.init, R.last
	     * @example
	     *
	     *      R.tail([1, 2, 3]);  //=> [2, 3]
	     *      R.tail([1, 2]);     //=> [2]
	     *      R.tail([1]);        //=> []
	     *      R.tail([]);         //=> []
	     *
	     *      R.tail('abc');  //=> 'bc'
	     *      R.tail('ab');   //=> 'b'
	     *      R.tail('a');    //=> ''
	     *      R.tail('');     //=> ''
	     */
	    var tail = _checkForMethod('tail', slice(1, Infinity));

	    /**
	     * Returns the first `n` elements of the given list, string, or
	     * transducer/transformer (or object with a `take` method).
	     *
	     * Dispatches to the `take` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n
	     * @param {*} list
	     * @return {*}
	     * @see R.drop
	     * @example
	     *
	     *      R.take(1, ['foo', 'bar', 'baz']); //=> ['foo']
	     *      R.take(2, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
	     *      R.take(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.take(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.take(3, 'ramda');               //=> 'ram'
	     *
	     *      var personnel = [
	     *        'Dave Brubeck',
	     *        'Paul Desmond',
	     *        'Eugene Wright',
	     *        'Joe Morello',
	     *        'Gerry Mulligan',
	     *        'Bob Bates',
	     *        'Joe Dodge',
	     *        'Ron Crotty'
	     *      ];
	     *
	     *      var takeFive = R.take(5);
	     *      takeFive(personnel);
	     *      //=> ['Dave Brubeck', 'Paul Desmond', 'Eugene Wright', 'Joe Morello', 'Gerry Mulligan']
	     */
	    var take = _curry2(_dispatchable('take', _xtake, function take(n, xs) {
	        return slice(0, n < 0 ? Infinity : n, xs);
	    }));

	    /**
	     * Returns a new list containing the last `n` elements of a given list, passing
	     * each value to the supplied predicate function, and terminating when the
	     * predicate function returns `false`. Excludes the element that caused the
	     * predicate function to fail. The predicate function is passed one argument:
	     * *(value)*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.dropLastWhile, R.addIndex
	     * @example
	     *
	     *      var isNotOne = x => x !== 1;
	     *
	     *      R.takeLastWhile(isNotOne, [1, 2, 3, 4]); //=> [2, 3, 4]
	     */
	    var takeLastWhile = _curry2(function takeLastWhile(fn, list) {
	        var idx = list.length - 1;
	        while (idx >= 0 && fn(list[idx])) {
	            idx -= 1;
	        }
	        return _slice(list, idx + 1, Infinity);
	    });

	    /**
	     * Returns a new list containing the first `n` elements of a given list,
	     * passing each value to the supplied predicate function, and terminating when
	     * the predicate function returns `false`. Excludes the element that caused the
	     * predicate function to fail. The predicate function is passed one argument:
	     * *(value)*.
	     *
	     * Dispatches to the `takeWhile` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.dropWhile, R.transduce, R.addIndex
	     * @example
	     *
	     *      var isNotFour = x => x !== 4;
	     *
	     *      R.takeWhile(isNotFour, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3]
	     */
	    var takeWhile = _curry2(_dispatchable('takeWhile', _xtakeWhile, function takeWhile(fn, list) {
	        var idx = 0;
	        var len = list.length;
	        while (idx < len && fn(list[idx])) {
	            idx += 1;
	        }
	        return _slice(list, 0, idx);
	    }));

	    /**
	     * Runs the given function with the supplied object, then returns the object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a -> *) -> a -> a
	     * @param {Function} fn The function to call with `x`. The return value of `fn` will be thrown away.
	     * @param {*} x
	     * @return {*} `x`.
	     * @example
	     *
	     *      var sayX = x => console.log('x is ' + x);
	     *      R.tap(sayX, 100); //=> 100
	     *      // logs 'x is 100'
	     */
	    var tap = _curry2(function tap(fn, x) {
	        fn(x);
	        return x;
	    });

	    /**
	     * Calls an input function `n` times, returning an array containing the results
	     * of those function calls.
	     *
	     * `fn` is passed one argument: The current value of `n`, which begins at `0`
	     * and is gradually incremented to `n - 1`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.3
	     * @category List
	     * @sig (Number -> a) -> Number -> [a]
	     * @param {Function} fn The function to invoke. Passed one argument, the current value of `n`.
	     * @param {Number} n A value between `0` and `n - 1`. Increments after each function call.
	     * @return {Array} An array containing the return values of all calls to `fn`.
	     * @example
	     *
	     *      R.times(R.identity, 5); //=> [0, 1, 2, 3, 4]
	     */
	    var times = _curry2(function times(fn, n) {
	        var len = Number(n);
	        var idx = 0;
	        var list;
	        if (len < 0 || isNaN(len)) {
	            throw new RangeError('n must be a non-negative number');
	        }
	        list = new Array(len);
	        while (idx < len) {
	            list[idx] = fn(idx);
	            idx += 1;
	        }
	        return list;
	    });

	    /**
	     * Converts an object into an array of key, value arrays. Only the object's
	     * own properties are used.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.0
	     * @category Object
	     * @sig {String: *} -> [[String,*]]
	     * @param {Object} obj The object to extract from
	     * @return {Array} An array of key, value arrays from the object's own properties.
	     * @see R.fromPairs
	     * @example
	     *
	     *      R.toPairs({a: 1, b: 2, c: 3}); //=> [['a', 1], ['b', 2], ['c', 3]]
	     */
	    var toPairs = _curry1(function toPairs(obj) {
	        var pairs = [];
	        for (var prop in obj) {
	            if (_has(prop, obj)) {
	                pairs[pairs.length] = [
	                    prop,
	                    obj[prop]
	                ];
	            }
	        }
	        return pairs;
	    });

	    /**
	     * Converts an object into an array of key, value arrays. The object's own
	     * properties and prototype properties are used. Note that the order of the
	     * output array is not guaranteed to be consistent across different JS
	     * platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.0
	     * @category Object
	     * @sig {String: *} -> [[String,*]]
	     * @param {Object} obj The object to extract from
	     * @return {Array} An array of key, value arrays from the object's own
	     *         and prototype properties.
	     * @example
	     *
	     *      var F = function() { this.x = 'X'; };
	     *      F.prototype.y = 'Y';
	     *      var f = new F();
	     *      R.toPairsIn(f); //=> [['x','X'], ['y','Y']]
	     */
	    var toPairsIn = _curry1(function toPairsIn(obj) {
	        var pairs = [];
	        for (var prop in obj) {
	            pairs[pairs.length] = [
	                prop,
	                obj[prop]
	            ];
	        }
	        return pairs;
	    });

	    /**
	     * Transposes the rows and columns of a 2D list.
	     * When passed a list of `n` lists of length `x`,
	     * returns a list of `x` lists of length `n`.
	     *
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig [[a]] -> [[a]]
	     * @param {Array} list A 2D list
	     * @return {Array} A 2D list
	     * @example
	     *
	     *      R.transpose([[1, 'a'], [2, 'b'], [3, 'c']]) //=> [[1, 2, 3], ['a', 'b', 'c']]
	     *      R.transpose([[1, 2, 3], ['a', 'b', 'c']]) //=> [[1, 'a'], [2, 'b'], [3, 'c']]
	     *
	     * If some of the rows are shorter than the following rows, their elements are skipped:
	     *
	     *      R.transpose([[10, 11], [20], [], [30, 31, 32]]) //=> [[10, 20, 30], [11, 31], [32]]
	     */
	    var transpose = _curry1(function transpose(outerlist) {
	        var i = 0;
	        var result = [];
	        while (i < outerlist.length) {
	            var innerlist = outerlist[i];
	            var j = 0;
	            while (j < innerlist.length) {
	                if (typeof result[j] === 'undefined') {
	                    result[j] = [];
	                }
	                result[j].push(innerlist[j]);
	                j += 1;
	            }
	            i += 1;
	        }
	        return result;
	    });

	    /**
	     * Removes (strips) whitespace from both ends of the string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category String
	     * @sig String -> String
	     * @param {String} str The string to trim.
	     * @return {String} Trimmed version of `str`.
	     * @example
	     *
	     *      R.trim('   xyz  '); //=> 'xyz'
	     *      R.map(R.trim, R.split(',', 'x, y, z')); //=> ['x', 'y', 'z']
	     */
	    var trim = function () {
	        var ws = '\t\n\x0B\f\r \xA0\u1680\u180E\u2000\u2001\u2002\u2003' + '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' + '\u2029\uFEFF';
	        var zeroWidth = '\u200B';
	        var hasProtoTrim = typeof String.prototype.trim === 'function';
	        if (!hasProtoTrim || (ws.trim() || !zeroWidth.trim())) {
	            return _curry1(function trim(str) {
	                var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
	                var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
	                return str.replace(beginRx, '').replace(endRx, '');
	            });
	        } else {
	            return _curry1(function trim(str) {
	                return str.trim();
	            });
	        }
	    }();

	    /**
	     * `tryCatch` takes two functions, a `tryer` and a `catcher`. The returned
	     * function evaluates the `tryer`; if it does not throw, it simply returns the
	     * result. If the `tryer` *does* throw, the returned function evaluates the
	     * `catcher` function and returns its result. Note that for effective
	     * composition with this function, both the `tryer` and `catcher` functions
	     * must return the same type of results.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Function
	     * @sig (...x -> a) -> ((e, ...x) -> a) -> (...x -> a)
	     * @param {Function} tryer The function that may throw.
	     * @param {Function} catcher The function that will be evaluated if `tryer` throws.
	     * @return {Function} A new function that will catch exceptions and send then to the catcher.
	     * @example
	     *
	     *      R.tryCatch(R.prop('x'), R.F)({x: true}); //=> true
	     *      R.tryCatch(R.prop('x'), R.F)(null);      //=> false
	     */
	    var tryCatch = _curry2(function _tryCatch(tryer, catcher) {
	        return _arity(tryer.length, function () {
	            try {
	                return tryer.apply(this, arguments);
	            } catch (e) {
	                return catcher.apply(this, _concat([e], arguments));
	            }
	        });
	    });

	    /**
	     * Gives a single-word string description of the (native) type of a value,
	     * returning such answers as 'Object', 'Number', 'Array', or 'Null'. Does not
	     * attempt to distinguish user Object types any further, reporting them all as
	     * 'Object'.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Type
	     * @sig (* -> {*}) -> String
	     * @param {*} val The value to test
	     * @return {String}
	     * @example
	     *
	     *      R.type({}); //=> "Object"
	     *      R.type(1); //=> "Number"
	     *      R.type(false); //=> "Boolean"
	     *      R.type('s'); //=> "String"
	     *      R.type(null); //=> "Null"
	     *      R.type([]); //=> "Array"
	     *      R.type(/[A-z]/); //=> "RegExp"
	     */
	    var type = _curry1(function type(val) {
	        return val === null ? 'Null' : val === undefined ? 'Undefined' : Object.prototype.toString.call(val).slice(8, -1);
	    });

	    /**
	     * Takes a function `fn`, which takes a single array argument, and returns a
	     * function which:
	     *
	     *   - takes any number of positional arguments;
	     *   - passes these arguments to `fn` as an array; and
	     *   - returns the result.
	     *
	     * In other words, R.unapply derives a variadic function from a function which
	     * takes an array. R.unapply is the inverse of R.apply.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Function
	     * @sig ([*...] -> a) -> (*... -> a)
	     * @param {Function} fn
	     * @return {Function}
	     * @see R.apply
	     * @example
	     *
	     *      R.unapply(JSON.stringify)(1, 2, 3); //=> '[1,2,3]'
	     */
	    var unapply = _curry1(function unapply(fn) {
	        return function () {
	            return fn(_slice(arguments));
	        };
	    });

	    /**
	     * Wraps a function of any arity (including nullary) in a function that accepts
	     * exactly 1 parameter. Any extraneous parameters will not be passed to the
	     * supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Function
	     * @sig (* -> b) -> (a -> b)
	     * @param {Function} fn The function to wrap.
	     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	     *         arity 1.
	     * @example
	     *
	     *      var takesTwoArgs = function(a, b) {
	     *        return [a, b];
	     *      };
	     *      takesTwoArgs.length; //=> 2
	     *      takesTwoArgs(1, 2); //=> [1, 2]
	     *
	     *      var takesOneArg = R.unary(takesTwoArgs);
	     *      takesOneArg.length; //=> 1
	     *      // Only 1 argument is passed to the wrapped function
	     *      takesOneArg(1, 2); //=> [1, undefined]
	     */
	    var unary = _curry1(function unary(fn) {
	        return nAry(1, fn);
	    });

	    /**
	     * Returns a function of arity `n` from a (manually) curried function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Function
	     * @sig Number -> (a -> b) -> (a -> c)
	     * @param {Number} length The arity for the returned function.
	     * @param {Function} fn The function to uncurry.
	     * @return {Function} A new function.
	     * @see R.curry
	     * @example
	     *
	     *      var addFour = a => b => c => d => a + b + c + d;
	     *
	     *      var uncurriedAddFour = R.uncurryN(4, addFour);
	     *      uncurriedAddFour(1, 2, 3, 4); //=> 10
	     */
	    var uncurryN = _curry2(function uncurryN(depth, fn) {
	        return curryN(depth, function () {
	            var currentDepth = 1;
	            var value = fn;
	            var idx = 0;
	            var endIdx;
	            while (currentDepth <= depth && typeof value === 'function') {
	                endIdx = currentDepth === depth ? arguments.length : idx + value.length;
	                value = value.apply(this, _slice(arguments, idx, endIdx));
	                currentDepth += 1;
	                idx = endIdx;
	            }
	            return value;
	        });
	    });

	    /**
	     * Builds a list from a seed value. Accepts an iterator function, which returns
	     * either false to stop iteration or an array of length 2 containing the value
	     * to add to the resulting list and the seed to be used in the next call to the
	     * iterator function.
	     *
	     * The iterator function receives one argument: *(seed)*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category List
	     * @sig (a -> [b]) -> * -> [b]
	     * @param {Function} fn The iterator function. receives one argument, `seed`, and returns
	     *        either false to quit iteration or an array of length two to proceed. The element
	     *        at index 0 of this array will be added to the resulting array, and the element
	     *        at index 1 will be passed to the next call to `fn`.
	     * @param {*} seed The seed value.
	     * @return {Array} The final list.
	     * @example
	     *
	     *      var f = n => n > 50 ? false : [-n, n + 10];
	     *      R.unfold(f, 10); //=> [-10, -20, -30, -40, -50]
	     */
	    var unfold = _curry2(function unfold(fn, seed) {
	        var pair = fn(seed);
	        var result = [];
	        while (pair && pair.length) {
	            result[result.length] = pair[0];
	            pair = fn(pair[1]);
	        }
	        return result;
	    });

	    /**
	     * Returns a new list containing only one copy of each element in the original
	     * list, based upon the value returned by applying the supplied predicate to
	     * two list elements. Prefers the first item if two items compare equal based
	     * on the predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category List
	     * @sig (a, a -> Boolean) -> [a] -> [a]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of unique items.
	     * @example
	     *
	     *      var strEq = R.eqBy(String);
	     *      R.uniqWith(strEq)([1, '1', 2, 1]); //=> [1, 2]
	     *      R.uniqWith(strEq)([{}, {}]);       //=> [{}]
	     *      R.uniqWith(strEq)([1, '1', 1]);    //=> [1]
	     *      R.uniqWith(strEq)(['1', 1, 1]);    //=> ['1']
	     */
	    var uniqWith = _curry2(function uniqWith(pred, list) {
	        var idx = 0;
	        var len = list.length;
	        var result = [];
	        var item;
	        while (idx < len) {
	            item = list[idx];
	            if (!_containsWith(pred, item, result)) {
	                result[result.length] = item;
	            }
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Tests the final argument by passing it to the given predicate function. If
	     * the predicate is not satisfied, the function will return the result of
	     * calling the `whenFalseFn` function with the same argument. If the predicate
	     * is satisfied, the argument is returned as is.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Logic
	     * @sig (a -> Boolean) -> (a -> a) -> a -> a
	     * @param {Function} pred        A predicate function
	     * @param {Function} whenFalseFn A function to invoke when the `pred` evaluates
	     *                               to a falsy value.
	     * @param {*}        x           An object to test with the `pred` function and
	     *                               pass to `whenFalseFn` if necessary.
	     * @return {*} Either `x` or the result of applying `x` to `whenFalseFn`.
	     * @see R.ifElse, R.when
	     * @example
	     *
	     *      // coerceArray :: (a|[a]) -> [a]
	     *      var coerceArray = R.unless(R.isArrayLike, R.of);
	     *      coerceArray([1, 2, 3]); //=> [1, 2, 3]
	     *      coerceArray(1);         //=> [1]
	     */
	    var unless = _curry3(function unless(pred, whenFalseFn, x) {
	        return pred(x) ? x : whenFalseFn(x);
	    });

	    /**
	     * Takes a predicate, a transformation function, and an initial value,
	     * and returns a value of the same type as the initial value.
	     * It does so by applying the transformation until the predicate is satisfied,
	     * at which point it returns the satisfactory value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Logic
	     * @sig (a -> Boolean) -> (a -> a) -> a -> a
	     * @param {Function} pred A predicate function
	     * @param {Function} fn The iterator function
	     * @param {*} init Initial value
	     * @return {*} Final value that satisfies predicate
	     * @example
	     *
	     *      R.until(R.gt(R.__, 100), R.multiply(2))(1) // => 128
	     */
	    var until = _curry3(function until(pred, fn, init) {
	        var val = init;
	        while (!pred(val)) {
	            val = fn(val);
	        }
	        return val;
	    });

	    /**
	     * Returns a new copy of the array with the element at the provided index
	     * replaced with the given value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig Number -> a -> [a] -> [a]
	     * @param {Number} idx The index to update.
	     * @param {*} x The value to exist at the given index of the returned array.
	     * @param {Array|Arguments} list The source array-like object to be updated.
	     * @return {Array} A copy of `list` with the value at index `idx` replaced with `x`.
	     * @see R.adjust
	     * @example
	     *
	     *      R.update(1, 11, [0, 1, 2]);     //=> [0, 11, 2]
	     *      R.update(1)(11)([0, 1, 2]);     //=> [0, 11, 2]
	     */
	    var update = _curry3(function update(idx, x, list) {
	        return adjust(always(x), idx, list);
	    });

	    /**
	     * Accepts a function `fn` and a list of transformer functions and returns a
	     * new curried function. When the new function is invoked, it calls the
	     * function `fn` with parameters consisting of the result of calling each
	     * supplied handler on successive arguments to the new function.
	     *
	     * If more arguments are passed to the returned function than transformer
	     * functions, those arguments are passed directly to `fn` as additional
	     * parameters. If you expect additional arguments that don't need to be
	     * transformed, although you can ignore them, it's best to pass an identity
	     * function so that the new function reports the correct arity.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (x1 -> x2 -> ... -> z) -> [(a -> x1), (b -> x2), ...] -> (a -> b -> ... -> z)
	     * @param {Function} fn The function to wrap.
	     * @param {Array} transformers A list of transformer functions
	     * @return {Function} The wrapped function.
	     * @example
	     *
	     *      R.useWith(Math.pow, [R.identity, R.identity])(3, 4); //=> 81
	     *      R.useWith(Math.pow, [R.identity, R.identity])(3)(4); //=> 81
	     *      R.useWith(Math.pow, [R.dec, R.inc])(3, 4); //=> 32
	     *      R.useWith(Math.pow, [R.dec, R.inc])(3)(4); //=> 32
	     */
	    var useWith = _curry2(function useWith(fn, transformers) {
	        return curryN(transformers.length, function () {
	            var args = [];
	            var idx = 0;
	            while (idx < transformers.length) {
	                args.push(transformers[idx].call(this, arguments[idx]));
	                idx += 1;
	            }
	            return fn.apply(this, args.concat(_slice(arguments, transformers.length)));
	        });
	    });

	    /**
	     * Returns a list of all the enumerable own properties of the supplied object.
	     * Note that the order of the output array is not guaranteed across different
	     * JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {k: v} -> [v]
	     * @param {Object} obj The object to extract values from
	     * @return {Array} An array of the values of the object's own properties.
	     * @example
	     *
	     *      R.values({a: 1, b: 2, c: 3}); //=> [1, 2, 3]
	     */
	    var values = _curry1(function values(obj) {
	        var props = keys(obj);
	        var len = props.length;
	        var vals = [];
	        var idx = 0;
	        while (idx < len) {
	            vals[idx] = obj[props[idx]];
	            idx += 1;
	        }
	        return vals;
	    });

	    /**
	     * Returns a list of all the properties, including prototype properties, of the
	     * supplied object.
	     * Note that the order of the output array is not guaranteed to be consistent
	     * across different JS platforms.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Object
	     * @sig {k: v} -> [v]
	     * @param {Object} obj The object to extract values from
	     * @return {Array} An array of the values of the object's own and prototype properties.
	     * @example
	     *
	     *      var F = function() { this.x = 'X'; };
	     *      F.prototype.y = 'Y';
	     *      var f = new F();
	     *      R.valuesIn(f); //=> ['X', 'Y']
	     */
	    var valuesIn = _curry1(function valuesIn(obj) {
	        var prop;
	        var vs = [];
	        for (prop in obj) {
	            vs[vs.length] = obj[prop];
	        }
	        return vs;
	    });

	    /**
	     * Returns a "view" of the given data structure, determined by the given lens.
	     * The lens's focus determines which portion of the data structure is visible.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Lens s a -> s -> a
	     * @param {Lens} lens
	     * @param {*} x
	     * @return {*}
	     * @see R.prop, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var xLens = R.lensProp('x');
	     *
	     *      R.view(xLens, {x: 1, y: 2});  //=> 1
	     *      R.view(xLens, {x: 4, y: 2});  //=> 4
	     */
	    // `Const` is a functor that effectively ignores the function given to `map`.
	    // Using `Const` effectively ignores the setter function of the `lens`,
	    // leaving the value returned by the getter function unmodified.
	    var view = function () {
	        // `Const` is a functor that effectively ignores the function given to `map`.
	        var Const = function (x) {
	            return {
	                value: x,
	                map: function () {
	                    return this;
	                }
	            };
	        };
	        return _curry2(function view(lens, x) {
	            // Using `Const` effectively ignores the setter function of the `lens`,
	            // leaving the value returned by the getter function unmodified.
	            return lens(Const)(x).value;
	        });
	    }();

	    /**
	     * Tests the final argument by passing it to the given predicate function. If
	     * the predicate is satisfied, the function will return the result of calling
	     * the `whenTrueFn` function with the same argument. If the predicate is not
	     * satisfied, the argument is returned as is.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Logic
	     * @sig (a -> Boolean) -> (a -> a) -> a -> a
	     * @param {Function} pred       A predicate function
	     * @param {Function} whenTrueFn A function to invoke when the `condition`
	     *                              evaluates to a truthy value.
	     * @param {*}        x          An object to test with the `pred` function and
	     *                              pass to `whenTrueFn` if necessary.
	     * @return {*} Either `x` or the result of applying `x` to `whenTrueFn`.
	     * @see R.ifElse, R.unless
	     * @example
	     *
	     *      // truncate :: String -> String
	     *      var truncate = R.when(
	     *        R.propSatisfies(R.gt(R.__, 10), 'length'),
	     *        R.pipe(R.take(10), R.append('…'), R.join(''))
	     *      );
	     *      truncate('12345');         //=> '12345'
	     *      truncate('0123456789ABC'); //=> '0123456789…'
	     */
	    var when = _curry3(function when(pred, whenTrueFn, x) {
	        return pred(x) ? whenTrueFn(x) : x;
	    });

	    /**
	     * Takes a spec object and a test object; returns true if the test satisfies
	     * the spec. Each of the spec's own properties must be a predicate function.
	     * Each predicate is applied to the value of the corresponding property of the
	     * test object. `where` returns true if all the predicates return true, false
	     * otherwise.
	     *
	     * `where` is well suited to declaratively expressing constraints for other
	     * functions such as `filter` and `find`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category Object
	     * @sig {String: (* -> Boolean)} -> {String: *} -> Boolean
	     * @param {Object} spec
	     * @param {Object} testObj
	     * @return {Boolean}
	     * @example
	     *
	     *      // pred :: Object -> Boolean
	     *      var pred = where({
	     *        a: equals('foo'),
	     *        b: complement(equals('bar')),
	     *        x: gt(__, 10),
	     *        y: lt(__, 20)
	     *      });
	     *
	     *      pred({a: 'foo', b: 'xxx', x: 11, y: 19}); //=> true
	     *      pred({a: 'xxx', b: 'xxx', x: 11, y: 19}); //=> false
	     *      pred({a: 'foo', b: 'bar', x: 11, y: 19}); //=> false
	     *      pred({a: 'foo', b: 'xxx', x: 10, y: 19}); //=> false
	     *      pred({a: 'foo', b: 'xxx', x: 11, y: 20}); //=> false
	     */
	    var where = _curry2(function where(spec, testObj) {
	        for (var prop in spec) {
	            if (_has(prop, spec) && !spec[prop](testObj[prop])) {
	                return false;
	            }
	        }
	        return true;
	    });

	    /**
	     * Wrap a function inside another to allow you to make adjustments to the
	     * parameters, or do other processing either before the internal function is
	     * called or with its results.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a... -> b) -> ((a... -> b) -> a... -> c) -> (a... -> c)
	     * @param {Function} fn The function to wrap.
	     * @param {Function} wrapper The wrapper function.
	     * @return {Function} The wrapped function.
	     * @deprecated since v0.22.0
	     * @example
	     *
	     *      var greet = name => 'Hello ' + name;
	     *
	     *      var shoutedGreet = R.wrap(greet, (gr, name) => gr(name).toUpperCase());
	     *
	     *      shoutedGreet("Kathy"); //=> "HELLO KATHY"
	     *
	     *      var shortenedGreet = R.wrap(greet, function(gr, name) {
	     *        return gr(name.substring(0, 3));
	     *      });
	     *      shortenedGreet("Robert"); //=> "Hello Rob"
	     */
	    var wrap = _curry2(function wrap(fn, wrapper) {
	        return curryN(fn.length, function () {
	            return wrapper.apply(this, _concat([fn], arguments));
	        });
	    });

	    /**
	     * Creates a new list out of the two supplied by creating each possible pair
	     * from the lists.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [b] -> [[a,b]]
	     * @param {Array} as The first list.
	     * @param {Array} bs The second list.
	     * @return {Array} The list made by combining each possible pair from
	     *         `as` and `bs` into pairs (`[a, b]`).
	     * @example
	     *
	     *      R.xprod([1, 2], ['a', 'b']); //=> [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
	     */
	    // = xprodWith(prepend); (takes about 3 times as long...)
	    var xprod = _curry2(function xprod(a, b) {
	        // = xprodWith(prepend); (takes about 3 times as long...)
	        var idx = 0;
	        var ilen = a.length;
	        var j;
	        var jlen = b.length;
	        var result = [];
	        while (idx < ilen) {
	            j = 0;
	            while (j < jlen) {
	                result[result.length] = [
	                    a[idx],
	                    b[j]
	                ];
	                j += 1;
	            }
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Creates a new list out of the two supplied by pairing up equally-positioned
	     * items from both lists. The returned list is truncated to the length of the
	     * shorter of the two input lists.
	     * Note: `zip` is equivalent to `zipWith(function(a, b) { return [a, b] })`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [b] -> [[a,b]]
	     * @param {Array} list1 The first array to consider.
	     * @param {Array} list2 The second array to consider.
	     * @return {Array} The list made by pairing up same-indexed elements of `list1` and `list2`.
	     * @example
	     *
	     *      R.zip([1, 2, 3], ['a', 'b', 'c']); //=> [[1, 'a'], [2, 'b'], [3, 'c']]
	     */
	    var zip = _curry2(function zip(a, b) {
	        var rv = [];
	        var idx = 0;
	        var len = Math.min(a.length, b.length);
	        while (idx < len) {
	            rv[idx] = [
	                a[idx],
	                b[idx]
	            ];
	            idx += 1;
	        }
	        return rv;
	    });

	    /**
	     * Creates a new object out of a list of keys and a list of values.
	     * Key/value pairing is truncated to the length of the shorter of the two lists.
	     * Note: `zipObj` is equivalent to `pipe(zipWith(pair), fromPairs)`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig [String] -> [*] -> {String: *}
	     * @param {Array} keys The array that will be properties on the output object.
	     * @param {Array} values The list of values on the output object.
	     * @return {Object} The object made by pairing up same-indexed elements of `keys` and `values`.
	     * @example
	     *
	     *      R.zipObj(['a', 'b', 'c'], [1, 2, 3]); //=> {a: 1, b: 2, c: 3}
	     */
	    var zipObj = _curry2(function zipObj(keys, values) {
	        var idx = 0;
	        var len = Math.min(keys.length, values.length);
	        var out = {};
	        while (idx < len) {
	            out[keys[idx]] = values[idx];
	            idx += 1;
	        }
	        return out;
	    });

	    /**
	     * Creates a new list out of the two supplied by applying the function to each
	     * equally-positioned pair in the lists. The returned list is truncated to the
	     * length of the shorter of the two input lists.
	     *
	     * @function
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a,b -> c) -> [a] -> [b] -> [c]
	     * @param {Function} fn The function used to combine the two elements into one value.
	     * @param {Array} list1 The first array to consider.
	     * @param {Array} list2 The second array to consider.
	     * @return {Array} The list made by combining same-indexed elements of `list1` and `list2`
	     *         using `fn`.
	     * @example
	     *
	     *      var f = (x, y) => {
	     *        // ...
	     *      };
	     *      R.zipWith(f, [1, 2, 3], ['a', 'b', 'c']);
	     *      //=> [f(1, 'a'), f(2, 'b'), f(3, 'c')]
	     */
	    var zipWith = _curry3(function zipWith(fn, a, b) {
	        var rv = [];
	        var idx = 0;
	        var len = Math.min(a.length, b.length);
	        while (idx < len) {
	            rv[idx] = fn(a[idx], b[idx]);
	            idx += 1;
	        }
	        return rv;
	    });

	    /**
	     * A function that always returns `false`. Any passed in parameters are ignored.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig * -> Boolean
	     * @param {*}
	     * @return {Boolean}
	     * @see R.always, R.T
	     * @example
	     *
	     *      R.F(); //=> false
	     */
	    var F = always(false);

	    /**
	     * A function that always returns `true`. Any passed in parameters are ignored.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig * -> Boolean
	     * @param {*}
	     * @return {Boolean}
	     * @see R.always, R.F
	     * @example
	     *
	     *      R.T(); //=> true
	     */
	    var T = always(true);

	    /**
	     * Copies an object.
	     *
	     * @private
	     * @param {*} value The value to be copied
	     * @param {Array} refFrom Array containing the source references
	     * @param {Array} refTo Array containing the copied source references
	     * @param {Boolean} deep Whether or not to perform deep cloning.
	     * @return {*} The copied value.
	     */
	    var _clone = function _clone(value, refFrom, refTo, deep) {
	        var copy = function copy(copiedValue) {
	            var len = refFrom.length;
	            var idx = 0;
	            while (idx < len) {
	                if (value === refFrom[idx]) {
	                    return refTo[idx];
	                }
	                idx += 1;
	            }
	            refFrom[idx + 1] = value;
	            refTo[idx + 1] = copiedValue;
	            for (var key in value) {
	                copiedValue[key] = deep ? _clone(value[key], refFrom, refTo, true) : value[key];
	            }
	            return copiedValue;
	        };
	        switch (type(value)) {
	        case 'Object':
	            return copy({});
	        case 'Array':
	            return copy([]);
	        case 'Date':
	            return new Date(value.valueOf());
	        case 'RegExp':
	            return _cloneRegExp(value);
	        default:
	            return value;
	        }
	    };

	    var _createPartialApplicator = function _createPartialApplicator(concat) {
	        return _curry2(function (fn, args) {
	            return _arity(Math.max(0, fn.length - args.length), function () {
	                return fn.apply(this, concat(args, arguments));
	            });
	        });
	    };

	    var _dropLast = function dropLast(n, xs) {
	        return take(n < xs.length ? xs.length - n : 0, xs);
	    };

	    // Values of other types are only equal if identical.
	    var _equals = function _equals(a, b, stackA, stackB) {
	        if (identical(a, b)) {
	            return true;
	        }
	        if (type(a) !== type(b)) {
	            return false;
	        }
	        if (a == null || b == null) {
	            return false;
	        }
	        if (typeof a.equals === 'function' || typeof b.equals === 'function') {
	            return typeof a.equals === 'function' && a.equals(b) && typeof b.equals === 'function' && b.equals(a);
	        }
	        switch (type(a)) {
	        case 'Arguments':
	        case 'Array':
	        case 'Object':
	            if (typeof a.constructor === 'function' && _functionName(a.constructor) === 'Promise') {
	                return a === b;
	            }
	            break;
	        case 'Boolean':
	        case 'Number':
	        case 'String':
	            if (!(typeof a === typeof b && identical(a.valueOf(), b.valueOf()))) {
	                return false;
	            }
	            break;
	        case 'Date':
	            if (!identical(a.valueOf(), b.valueOf())) {
	                return false;
	            }
	            break;
	        case 'Error':
	            return a.name === b.name && a.message === b.message;
	        case 'RegExp':
	            if (!(a.source === b.source && a.global === b.global && a.ignoreCase === b.ignoreCase && a.multiline === b.multiline && a.sticky === b.sticky && a.unicode === b.unicode)) {
	                return false;
	            }
	            break;
	        case 'Map':
	        case 'Set':
	            if (!_equals(_arrayFromIterator(a.entries()), _arrayFromIterator(b.entries()), stackA, stackB)) {
	                return false;
	            }
	            break;
	        case 'Int8Array':
	        case 'Uint8Array':
	        case 'Uint8ClampedArray':
	        case 'Int16Array':
	        case 'Uint16Array':
	        case 'Int32Array':
	        case 'Uint32Array':
	        case 'Float32Array':
	        case 'Float64Array':
	            break;
	        case 'ArrayBuffer':
	            break;
	        default:
	            // Values of other types are only equal if identical.
	            return false;
	        }
	        var keysA = keys(a);
	        if (keysA.length !== keys(b).length) {
	            return false;
	        }
	        var idx = stackA.length - 1;
	        while (idx >= 0) {
	            if (stackA[idx] === a) {
	                return stackB[idx] === b;
	            }
	            idx -= 1;
	        }
	        stackA.push(a);
	        stackB.push(b);
	        idx = keysA.length - 1;
	        while (idx >= 0) {
	            var key = keysA[idx];
	            if (!(_has(key, b) && _equals(b[key], a[key], stackA, stackB))) {
	                return false;
	            }
	            idx -= 1;
	        }
	        stackA.pop();
	        stackB.pop();
	        return true;
	    };

	    /**
	     * `_makeFlat` is a helper function that returns a one-level or fully recursive
	     * function based on the flag passed in.
	     *
	     * @private
	     */
	    var _makeFlat = function _makeFlat(recursive) {
	        return function flatt(list) {
	            var value, jlen, j;
	            var result = [];
	            var idx = 0;
	            var ilen = list.length;
	            while (idx < ilen) {
	                if (isArrayLike(list[idx])) {
	                    value = recursive ? flatt(list[idx]) : list[idx];
	                    j = 0;
	                    jlen = value.length;
	                    while (j < jlen) {
	                        result[result.length] = value[j];
	                        j += 1;
	                    }
	                } else {
	                    result[result.length] = list[idx];
	                }
	                idx += 1;
	            }
	            return result;
	        };
	    };

	    var _reduce = function () {
	        function _arrayReduce(xf, acc, list) {
	            var idx = 0;
	            var len = list.length;
	            while (idx < len) {
	                acc = xf['@@transducer/step'](acc, list[idx]);
	                if (acc && acc['@@transducer/reduced']) {
	                    acc = acc['@@transducer/value'];
	                    break;
	                }
	                idx += 1;
	            }
	            return xf['@@transducer/result'](acc);
	        }
	        function _iterableReduce(xf, acc, iter) {
	            var step = iter.next();
	            while (!step.done) {
	                acc = xf['@@transducer/step'](acc, step.value);
	                if (acc && acc['@@transducer/reduced']) {
	                    acc = acc['@@transducer/value'];
	                    break;
	                }
	                step = iter.next();
	            }
	            return xf['@@transducer/result'](acc);
	        }
	        function _methodReduce(xf, acc, obj) {
	            return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
	        }
	        var symIterator = typeof Symbol !== 'undefined' ? Symbol.iterator : '@@iterator';
	        return function _reduce(fn, acc, list) {
	            if (typeof fn === 'function') {
	                fn = _xwrap(fn);
	            }
	            if (isArrayLike(list)) {
	                return _arrayReduce(fn, acc, list);
	            }
	            if (typeof list.reduce === 'function') {
	                return _methodReduce(fn, acc, list);
	            }
	            if (list[symIterator] != null) {
	                return _iterableReduce(fn, acc, list[symIterator]());
	            }
	            if (typeof list.next === 'function') {
	                return _iterableReduce(fn, acc, list);
	            }
	            throw new TypeError('reduce: list must be array or iterable');
	        };
	    }();

	    var _stepCat = function () {
	        var _stepCatArray = {
	            '@@transducer/init': Array,
	            '@@transducer/step': function (xs, x) {
	                xs.push(x);
	                return xs;
	            },
	            '@@transducer/result': _identity
	        };
	        var _stepCatString = {
	            '@@transducer/init': String,
	            '@@transducer/step': function (a, b) {
	                return a + b;
	            },
	            '@@transducer/result': _identity
	        };
	        var _stepCatObject = {
	            '@@transducer/init': Object,
	            '@@transducer/step': function (result, input) {
	                return _assign(result, isArrayLike(input) ? objOf(input[0], input[1]) : input);
	            },
	            '@@transducer/result': _identity
	        };
	        return function _stepCat(obj) {
	            if (_isTransformer(obj)) {
	                return obj;
	            }
	            if (isArrayLike(obj)) {
	                return _stepCatArray;
	            }
	            if (typeof obj === 'string') {
	                return _stepCatString;
	            }
	            if (typeof obj === 'object') {
	                return _stepCatObject;
	            }
	            throw new Error('Cannot create transformer for ' + obj);
	        };
	    }();

	    var _xdropLastWhile = function () {
	        function XDropLastWhile(fn, xf) {
	            this.f = fn;
	            this.retained = [];
	            this.xf = xf;
	        }
	        XDropLastWhile.prototype['@@transducer/init'] = _xfBase.init;
	        XDropLastWhile.prototype['@@transducer/result'] = function (result) {
	            this.retained = null;
	            return this.xf['@@transducer/result'](result);
	        };
	        XDropLastWhile.prototype['@@transducer/step'] = function (result, input) {
	            return this.f(input) ? this.retain(result, input) : this.flush(result, input);
	        };
	        XDropLastWhile.prototype.flush = function (result, input) {
	            result = _reduce(this.xf['@@transducer/step'], result, this.retained);
	            this.retained = [];
	            return this.xf['@@transducer/step'](result, input);
	        };
	        XDropLastWhile.prototype.retain = function (result, input) {
	            this.retained.push(input);
	            return result;
	        };
	        return _curry2(function _xdropLastWhile(fn, xf) {
	            return new XDropLastWhile(fn, xf);
	        });
	    }();

	    /**
	     * Creates a new list iteration function from an existing one by adding two new
	     * parameters to its callback function: the current index, and the entire list.
	     *
	     * This would turn, for instance, Ramda's simple `map` function into one that
	     * more closely resembles `Array.prototype.map`. Note that this will only work
	     * for functions in which the iteration callback function is the first
	     * parameter, and where the list is the last parameter. (This latter might be
	     * unimportant if the list parameter is not used.)
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category Function
	     * @category List
	     * @sig ((a ... -> b) ... -> [a] -> *) -> (a ..., Int, [a] -> b) ... -> [a] -> *)
	     * @param {Function} fn A list iteration function that does not pass index or list to its callback
	     * @return {Function} An altered list iteration function that passes (item, index, list) to its callback
	     * @example
	     *
	     *      var mapIndexed = R.addIndex(R.map);
	     *      mapIndexed((val, idx) => idx + '-' + val, ['f', 'o', 'o', 'b', 'a', 'r']);
	     *      //=> ['0-f', '1-o', '2-o', '3-b', '4-a', '5-r']
	     */
	    var addIndex = _curry1(function addIndex(fn) {
	        return curryN(fn.length, function () {
	            var idx = 0;
	            var origFn = arguments[0];
	            var list = arguments[arguments.length - 1];
	            var args = _slice(arguments);
	            args[0] = function () {
	                var result = origFn.apply(this, _concat(arguments, [
	                    idx,
	                    list
	                ]));
	                idx += 1;
	                return result;
	            };
	            return fn.apply(this, args);
	        });
	    });

	    /**
	     * Wraps a function of any arity (including nullary) in a function that accepts
	     * exactly 2 parameters. Any extraneous parameters will not be passed to the
	     * supplied function.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.2.0
	     * @category Function
	     * @sig (* -> c) -> (a, b -> c)
	     * @param {Function} fn The function to wrap.
	     * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	     *         arity 2.
	     * @example
	     *
	     *      var takesThreeArgs = function(a, b, c) {
	     *        return [a, b, c];
	     *      };
	     *      takesThreeArgs.length; //=> 3
	     *      takesThreeArgs(1, 2, 3); //=> [1, 2, 3]
	     *
	     *      var takesTwoArgs = R.binary(takesThreeArgs);
	     *      takesTwoArgs.length; //=> 2
	     *      // Only 2 arguments are passed to the wrapped function
	     *      takesTwoArgs(1, 2, 3); //=> [1, 2, undefined]
	     */
	    var binary = _curry1(function binary(fn) {
	        return nAry(2, fn);
	    });

	    /**
	     * Creates a deep copy of the value which may contain (nested) `Array`s and
	     * `Object`s, `Number`s, `String`s, `Boolean`s and `Date`s. `Function`s are not
	     * copied, but assigned by their reference.
	     *
	     * Dispatches to a `clone` method if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig {*} -> {*}
	     * @param {*} value The object or array to clone
	     * @return {*} A new object or array.
	     * @example
	     *
	     *      var objects = [{}, {}, {}];
	     *      var objectsClone = R.clone(objects);
	     *      objects[0] === objectsClone[0]; //=> false
	     */
	    var clone = _curry1(function clone(value) {
	        return value != null && typeof value.clone === 'function' ? value.clone() : _clone(value, [], [], true);
	    });

	    /**
	     * Returns a curried equivalent of the provided function. The curried function
	     * has two unusual capabilities. First, its arguments needn't be provided one
	     * at a time. If `f` is a ternary function and `g` is `R.curry(f)`, the
	     * following are equivalent:
	     *
	     *   - `g(1)(2)(3)`
	     *   - `g(1)(2, 3)`
	     *   - `g(1, 2)(3)`
	     *   - `g(1, 2, 3)`
	     *
	     * Secondly, the special placeholder value `R.__` may be used to specify
	     * "gaps", allowing partial application of any combination of arguments,
	     * regardless of their positions. If `g` is as above and `_` is `R.__`, the
	     * following are equivalent:
	     *
	     *   - `g(1, 2, 3)`
	     *   - `g(_, 2, 3)(1)`
	     *   - `g(_, _, 3)(1)(2)`
	     *   - `g(_, _, 3)(1, 2)`
	     *   - `g(_, 2)(1)(3)`
	     *   - `g(_, 2)(1, 3)`
	     *   - `g(_, 2)(_, 3)(1)`
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (* -> a) -> (* -> a)
	     * @param {Function} fn The function to curry.
	     * @return {Function} A new, curried function.
	     * @see R.curryN
	     * @example
	     *
	     *      var addFourNumbers = (a, b, c, d) => a + b + c + d;
	     *
	     *      var curriedAddFourNumbers = R.curry(addFourNumbers);
	     *      var f = curriedAddFourNumbers(1, 2);
	     *      var g = f(3);
	     *      g(4); //=> 10
	     */
	    var curry = _curry1(function curry(fn) {
	        return curryN(fn.length, fn);
	    });

	    /**
	     * Returns all but the first `n` elements of the given list, string, or
	     * transducer/transformer (or object with a `drop` method).
	     *
	     * Dispatches to the `drop` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n
	     * @param {*} list
	     * @return {*}
	     * @see R.take, R.transduce
	     * @example
	     *
	     *      R.drop(1, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
	     *      R.drop(2, ['foo', 'bar', 'baz']); //=> ['baz']
	     *      R.drop(3, ['foo', 'bar', 'baz']); //=> []
	     *      R.drop(4, ['foo', 'bar', 'baz']); //=> []
	     *      R.drop(3, 'ramda');               //=> 'da'
	     */
	    var drop = _curry2(_dispatchable('drop', _xdrop, function drop(n, xs) {
	        return slice(Math.max(0, n), Infinity, xs);
	    }));

	    /**
	     * Returns a list containing all but the last `n` elements of the given `list`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n The number of elements of `xs` to skip.
	     * @param {Array} xs The collection to consider.
	     * @return {Array}
	     * @see R.takeLast
	     * @example
	     *
	     *      R.dropLast(1, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
	     *      R.dropLast(2, ['foo', 'bar', 'baz']); //=> ['foo']
	     *      R.dropLast(3, ['foo', 'bar', 'baz']); //=> []
	     *      R.dropLast(4, ['foo', 'bar', 'baz']); //=> []
	     *      R.dropLast(3, 'ramda');               //=> 'ra'
	     */
	    var dropLast = _curry2(_dispatchable('dropLast', _xdropLast, _dropLast));

	    /**
	     * Returns a new list excluding all the tailing elements of a given list which
	     * satisfy the supplied predicate function. It passes each value from the right
	     * to the supplied predicate function, skipping elements while the predicate
	     * function returns `true`. The predicate function is applied to one argument:
	     * *(value)*.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig (a -> Boolean) -> [a] -> [a]
	     * @param {Function} fn The function called per iteration.
	     * @param {Array} list The collection to iterate over.
	     * @return {Array} A new array.
	     * @see R.takeLastWhile, R.addIndex
	     * @example
	     *
	     *      var lteThree = x => x <= 3;
	     *
	     *      R.dropLastWhile(lteThree, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3, 4]
	     */
	    var dropLastWhile = _curry2(_dispatchable('dropLastWhile', _xdropLastWhile, _dropLastWhile));

	    /**
	     * Returns `true` if its arguments are equivalent, `false` otherwise. Handles
	     * cyclical data structures.
	     *
	     * Dispatches symmetrically to the `equals` methods of both arguments, if
	     * present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.15.0
	     * @category Relation
	     * @sig a -> b -> Boolean
	     * @param {*} a
	     * @param {*} b
	     * @return {Boolean}
	     * @example
	     *
	     *      R.equals(1, 1); //=> true
	     *      R.equals(1, '1'); //=> false
	     *      R.equals([1, 2, 3], [1, 2, 3]); //=> true
	     *
	     *      var a = {}; a.v = a;
	     *      var b = {}; b.v = b;
	     *      R.equals(a, b); //=> true
	     */
	    var equals = _curry2(function equals(a, b) {
	        return _equals(a, b, [], []);
	    });

	    /**
	     * Takes a predicate and a "filterable", and returns a new filterable of the
	     * same type containing the members of the given filterable which satisfy the
	     * given predicate.
	     *
	     * Dispatches to the `filter` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Filterable f => (a -> Boolean) -> f a -> f a
	     * @param {Function} pred
	     * @param {Array} filterable
	     * @return {Array}
	     * @see R.reject, R.transduce, R.addIndex
	     * @example
	     *
	     *      var isEven = n => n % 2 === 0;
	     *
	     *      R.filter(isEven, [1, 2, 3, 4]); //=> [2, 4]
	     *
	     *      R.filter(isEven, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
	     */
	    // else
	    var filter = _curry2(_dispatchable('filter', _xfilter, function (pred, filterable) {
	        return _isObject(filterable) ? _reduce(function (acc, key) {
	            if (pred(filterable[key])) {
	                acc[key] = filterable[key];
	            }
	            return acc;
	        }, {}, keys(filterable)) : // else
	        _filter(pred, filterable);
	    }));

	    /**
	     * Returns a new list by pulling every item out of it (and all its sub-arrays)
	     * and putting them in a new array, depth-first.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [b]
	     * @param {Array} list The array to consider.
	     * @return {Array} The flattened list.
	     * @see R.unnest
	     * @example
	     *
	     *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
	     *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	     */
	    var flatten = _curry1(_makeFlat(true));

	    /**
	     * Returns a new function much like the supplied one, except that the first two
	     * arguments' order is reversed.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (a -> b -> c -> ... -> z) -> (b -> a -> c -> ... -> z)
	     * @param {Function} fn The function to invoke with its first two parameters reversed.
	     * @return {*} The result of invoking `fn` with its first two parameters' order reversed.
	     * @example
	     *
	     *      var mergeThree = (a, b, c) => [].concat(a, b, c);
	     *
	     *      mergeThree(1, 2, 3); //=> [1, 2, 3]
	     *
	     *      R.flip(mergeThree)(1, 2, 3); //=> [2, 1, 3]
	     */
	    var flip = _curry1(function flip(fn) {
	        return curry(function (a, b) {
	            var args = _slice(arguments);
	            args[0] = b;
	            args[1] = a;
	            return fn.apply(this, args);
	        });
	    });

	    /**
	     * Returns the first element of the given list or string. In some libraries
	     * this function is named `first`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> a | Undefined
	     * @sig String -> String
	     * @param {Array|String} list
	     * @return {*}
	     * @see R.tail, R.init, R.last
	     * @example
	     *
	     *      R.head(['fi', 'fo', 'fum']); //=> 'fi'
	     *      R.head([]); //=> undefined
	     *
	     *      R.head('abc'); //=> 'a'
	     *      R.head(''); //=> ''
	     */
	    var head = nth(0);

	    /**
	     * Returns all but the last element of the given list or string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category List
	     * @sig [a] -> [a]
	     * @sig String -> String
	     * @param {*} list
	     * @return {*}
	     * @see R.last, R.head, R.tail
	     * @example
	     *
	     *      R.init([1, 2, 3]);  //=> [1, 2]
	     *      R.init([1, 2]);     //=> [1]
	     *      R.init([1]);        //=> []
	     *      R.init([]);         //=> []
	     *
	     *      R.init('abc');  //=> 'ab'
	     *      R.init('ab');   //=> 'a'
	     *      R.init('a');    //=> ''
	     *      R.init('');     //=> ''
	     */
	    var init = slice(0, -1);

	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of those
	     * elements common to both lists. Duplication is determined according to the
	     * value returned by applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	     * @param {Function} pred A predicate function that determines whether
	     *        the two supplied elements are equal.
	     * @param {Array} list1 One list of items to compare
	     * @param {Array} list2 A second list of items to compare
	     * @return {Array} A new list containing those elements common to both lists.
	     * @see R.intersection
	     * @example
	     *
	     *      var buffaloSpringfield = [
	     *        {id: 824, name: 'Richie Furay'},
	     *        {id: 956, name: 'Dewey Martin'},
	     *        {id: 313, name: 'Bruce Palmer'},
	     *        {id: 456, name: 'Stephen Stills'},
	     *        {id: 177, name: 'Neil Young'}
	     *      ];
	     *      var csny = [
	     *        {id: 204, name: 'David Crosby'},
	     *        {id: 456, name: 'Stephen Stills'},
	     *        {id: 539, name: 'Graham Nash'},
	     *        {id: 177, name: 'Neil Young'}
	     *      ];
	     *
	     *      R.intersectionWith(R.eqBy(R.prop('id')), buffaloSpringfield, csny);
	     *      //=> [{id: 456, name: 'Stephen Stills'}, {id: 177, name: 'Neil Young'}]
	     */
	    var intersectionWith = _curry3(function intersectionWith(pred, list1, list2) {
	        var lookupList, filteredList;
	        if (list1.length > list2.length) {
	            lookupList = list1;
	            filteredList = list2;
	        } else {
	            lookupList = list2;
	            filteredList = list1;
	        }
	        var results = [];
	        var idx = 0;
	        while (idx < filteredList.length) {
	            if (_containsWith(pred, filteredList[idx], lookupList)) {
	                results[results.length] = filteredList[idx];
	            }
	            idx += 1;
	        }
	        return uniqWith(pred, results);
	    });

	    /**
	     * Transforms the items of the list with the transducer and appends the
	     * transformed items to the accumulator using an appropriate iterator function
	     * based on the accumulator type.
	     *
	     * The accumulator can be an array, string, object or a transformer. Iterated
	     * items will be appended to arrays and concatenated to strings. Objects will
	     * be merged directly or 2-item arrays will be merged as key, value pairs.
	     *
	     * The accumulator can also be a transformer object that provides a 2-arity
	     * reducing iterator function, step, 0-arity initial value function, init, and
	     * 1-arity result extraction function result. The step function is used as the
	     * iterator function in reduce. The result function is used to convert the
	     * final accumulator into the return type and in most cases is R.identity. The
	     * init function is used to provide the initial accumulator.
	     *
	     * The iteration is performed with R.reduce after initializing the transducer.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig a -> (b -> b) -> [c] -> a
	     * @param {*} acc The initial accumulator value.
	     * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @example
	     *
	     *      var numbers = [1, 2, 3, 4];
	     *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
	     *
	     *      R.into([], transducer, numbers); //=> [2, 3]
	     *
	     *      var intoArray = R.into([]);
	     *      intoArray(transducer, numbers); //=> [2, 3]
	     */
	    var into = _curry3(function into(acc, xf, list) {
	        return _isTransformer(acc) ? _reduce(xf(acc), acc['@@transducer/init'](), list) : _reduce(xf(_stepCat(acc)), _clone(acc, [], [], false), list);
	    });

	    /**
	     * Same as R.invertObj, however this accounts for objects with duplicate values
	     * by putting the values into an array.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig {s: x} -> {x: [ s, ... ]}
	     * @param {Object} obj The object or array to invert
	     * @return {Object} out A new object with keys
	     * in an array.
	     * @example
	     *
	     *      var raceResultsByFirstName = {
	     *        first: 'alice',
	     *        second: 'jake',
	     *        third: 'alice',
	     *      };
	     *      R.invert(raceResultsByFirstName);
	     *      //=> { 'alice': ['first', 'third'], 'jake':['second'] }
	     */
	    var invert = _curry1(function invert(obj) {
	        var props = keys(obj);
	        var len = props.length;
	        var idx = 0;
	        var out = {};
	        while (idx < len) {
	            var key = props[idx];
	            var val = obj[key];
	            var list = _has(val, out) ? out[val] : out[val] = [];
	            list[list.length] = key;
	            idx += 1;
	        }
	        return out;
	    });

	    /**
	     * Returns a new object with the keys of the given object as values, and the
	     * values of the given object, which are coerced to strings, as keys. Note
	     * that the last key found is preferred when handling the same value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig {s: x} -> {x: s}
	     * @param {Object} obj The object or array to invert
	     * @return {Object} out A new object
	     * @example
	     *
	     *      var raceResults = {
	     *        first: 'alice',
	     *        second: 'jake'
	     *      };
	     *      R.invertObj(raceResults);
	     *      //=> { 'alice': 'first', 'jake':'second' }
	     *
	     *      // Alternatively:
	     *      var raceResults = ['alice', 'jake'];
	     *      R.invertObj(raceResults);
	     *      //=> { 'alice': '0', 'jake':'1' }
	     */
	    var invertObj = _curry1(function invertObj(obj) {
	        var props = keys(obj);
	        var len = props.length;
	        var idx = 0;
	        var out = {};
	        while (idx < len) {
	            var key = props[idx];
	            out[obj[key]] = key;
	            idx += 1;
	        }
	        return out;
	    });

	    /**
	     * Returns `true` if the given value is its type's empty value; `false`
	     * otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Logic
	     * @sig a -> Boolean
	     * @param {*} x
	     * @return {Boolean}
	     * @see R.empty
	     * @example
	     *
	     *      R.isEmpty([1, 2, 3]);   //=> false
	     *      R.isEmpty([]);          //=> true
	     *      R.isEmpty('');          //=> true
	     *      R.isEmpty(null);        //=> false
	     *      R.isEmpty({});          //=> true
	     *      R.isEmpty({length: 0}); //=> false
	     */
	    var isEmpty = _curry1(function isEmpty(x) {
	        return x != null && equals(x, empty(x));
	    });

	    /**
	     * Returns the last element of the given list or string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.4
	     * @category List
	     * @sig [a] -> a | Undefined
	     * @sig String -> String
	     * @param {*} list
	     * @return {*}
	     * @see R.init, R.head, R.tail
	     * @example
	     *
	     *      R.last(['fi', 'fo', 'fum']); //=> 'fum'
	     *      R.last([]); //=> undefined
	     *
	     *      R.last('abc'); //=> 'c'
	     *      R.last(''); //=> ''
	     */
	    var last = nth(-1);

	    /**
	     * Returns the position of the last occurrence of an item in an array, or -1 if
	     * the item is not included in the array. `R.equals` is used to determine
	     * equality.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> Number
	     * @param {*} target The item to find.
	     * @param {Array} xs The array to search in.
	     * @return {Number} the index of the target, or -1 if the target is not found.
	     * @see R.indexOf
	     * @example
	     *
	     *      R.lastIndexOf(3, [-1,3,3,0,1,2,3,4]); //=> 6
	     *      R.lastIndexOf(10, [1,2,3,4]); //=> -1
	     */
	    var lastIndexOf = _curry2(function lastIndexOf(target, xs) {
	        if (typeof xs.lastIndexOf === 'function' && !_isArray(xs)) {
	            return xs.lastIndexOf(target);
	        } else {
	            var idx = xs.length - 1;
	            while (idx >= 0) {
	                if (equals(xs[idx], target)) {
	                    return idx;
	                }
	                idx -= 1;
	            }
	            return -1;
	        }
	    });

	    /**
	     * Takes a function and
	     * a [functor](https://github.com/fantasyland/fantasy-land#functor),
	     * applies the function to each of the functor's values, and returns
	     * a functor of the same shape.
	     *
	     * Ramda provides suitable `map` implementations for `Array` and `Object`,
	     * so this function may be applied to `[1, 2, 3]` or `{x: 1, y: 2, z: 3}`.
	     *
	     * Dispatches to the `map` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * Also treats functions as functors and will compose them together.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Functor f => (a -> b) -> f a -> f b
	     * @param {Function} fn The function to be called on every element of the input `list`.
	     * @param {Array} list The list to be iterated over.
	     * @return {Array} The new list.
	     * @see R.transduce, R.addIndex
	     * @example
	     *
	     *      var double = x => x * 2;
	     *
	     *      R.map(double, [1, 2, 3]); //=> [2, 4, 6]
	     *
	     *      R.map(double, {x: 1, y: 2, z: 3}); //=> {x: 2, y: 4, z: 6}
	     */
	    var map = _curry2(_dispatchable('map', _xmap, function map(fn, functor) {
	        switch (Object.prototype.toString.call(functor)) {
	        case '[object Function]':
	            return curryN(functor.length, function () {
	                return fn.call(this, functor.apply(this, arguments));
	            });
	        case '[object Object]':
	            return _reduce(function (acc, key) {
	                acc[key] = fn(functor[key]);
	                return acc;
	            }, {}, keys(functor));
	        default:
	            return _map(fn, functor);
	        }
	    }));

	    /**
	     * An Object-specific version of `map`. The function is applied to three
	     * arguments: *(value, key, obj)*. If only the value is significant, use
	     * `map` instead.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Object
	     * @sig ((*, String, Object) -> *) -> Object -> Object
	     * @param {Function} fn
	     * @param {Object} obj
	     * @return {Object}
	     * @see R.map
	     * @example
	     *
	     *      var values = { x: 1, y: 2, z: 3 };
	     *      var prependKeyAndDouble = (num, key, obj) => key + (num * 2);
	     *
	     *      R.mapObjIndexed(prependKeyAndDouble, values); //=> { x: 'x2', y: 'y4', z: 'z6' }
	     */
	    var mapObjIndexed = _curry2(function mapObjIndexed(fn, obj) {
	        return _reduce(function (acc, key) {
	            acc[key] = fn(obj[key], key, obj);
	            return acc;
	        }, {}, keys(obj));
	    });

	    /**
	     * Creates a new object with the own properties of the two provided objects. If
	     * a key exists in both objects, the provided function is applied to the values
	     * associated with the key in each object, with the result being used as the
	     * value associated with the key in the returned object. The key will be
	     * excluded from the returned object if the resulting value is `undefined`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Object
	     * @sig (a -> a -> a) -> {a} -> {a} -> {a}
	     * @param {Function} fn
	     * @param {Object} l
	     * @param {Object} r
	     * @return {Object}
	     * @see R.merge, R.mergeWithKey
	     * @example
	     *
	     *      R.mergeWith(R.concat,
	     *                  { a: true, values: [10, 20] },
	     *                  { b: true, values: [15, 35] });
	     *      //=> { a: true, b: true, values: [10, 20, 15, 35] }
	     */
	    var mergeWith = _curry3(function mergeWith(fn, l, r) {
	        return mergeWithKey(function (_, _l, _r) {
	            return fn(_l, _r);
	        }, l, r);
	    });

	    /**
	     * Takes a function `f` and a list of arguments, and returns a function `g`.
	     * When applied, `g` returns the result of applying `f` to the arguments
	     * provided initially followed by the arguments provided to `g`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((a, b, c, ..., n) -> x) -> [a, b, c, ...] -> ((d, e, f, ..., n) -> x)
	     * @param {Function} f
	     * @param {Array} args
	     * @return {Function}
	     * @see R.partialRight
	     * @example
	     *
	     *      var multiply = (a, b) => a * b;
	     *      var double = R.partial(multiply, [2]);
	     *      double(2); //=> 4
	     *
	     *      var greet = (salutation, title, firstName, lastName) =>
	     *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	     *
	     *      var sayHello = R.partial(greet, ['Hello']);
	     *      var sayHelloToMs = R.partial(sayHello, ['Ms.']);
	     *      sayHelloToMs('Jane', 'Jones'); //=> 'Hello, Ms. Jane Jones!'
	     */
	    var partial = _createPartialApplicator(_concat);

	    /**
	     * Takes a function `f` and a list of arguments, and returns a function `g`.
	     * When applied, `g` returns the result of applying `f` to the arguments
	     * provided to `g` followed by the arguments provided initially.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((a, b, c, ..., n) -> x) -> [d, e, f, ..., n] -> ((a, b, c, ...) -> x)
	     * @param {Function} f
	     * @param {Array} args
	     * @return {Function}
	     * @see R.partial
	     * @example
	     *
	     *      var greet = (salutation, title, firstName, lastName) =>
	     *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	     *
	     *      var greetMsJaneJones = R.partialRight(greet, ['Ms.', 'Jane', 'Jones']);
	     *
	     *      greetMsJaneJones('Hello'); //=> 'Hello, Ms. Jane Jones!'
	     */
	    var partialRight = _createPartialApplicator(flip(_concat));

	    /**
	     * Determines whether a nested path on an object has a specific value, in
	     * `R.equals` terms. Most likely used to filter a list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Relation
	     * @sig [String] -> * -> {String: *} -> Boolean
	     * @param {Array} path The path of the nested property to use
	     * @param {*} val The value to compare the nested property with
	     * @param {Object} obj The object to check the nested property in
	     * @return {Boolean} `true` if the value equals the nested object property,
	     *         `false` otherwise.
	     * @example
	     *
	     *      var user1 = { address: { zipCode: 90210 } };
	     *      var user2 = { address: { zipCode: 55555 } };
	     *      var user3 = { name: 'Bob' };
	     *      var users = [ user1, user2, user3 ];
	     *      var isFamous = R.pathEq(['address', 'zipCode'], 90210);
	     *      R.filter(isFamous, users); //=> [ user1 ]
	     */
	    var pathEq = _curry3(function pathEq(_path, val, obj) {
	        return equals(path(_path, obj), val);
	    });

	    /**
	     * Returns a new list by plucking the same named property off all objects in
	     * the list supplied.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig k -> [{k: v}] -> [v]
	     * @param {Number|String} key The key name to pluck off of each object.
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of values for the given key.
	     * @see R.props
	     * @example
	     *
	     *      R.pluck('a')([{a: 1}, {a: 2}]); //=> [1, 2]
	     *      R.pluck(0)([[1, 2], [3, 4]]);   //=> [1, 3]
	     */
	    var pluck = _curry2(function pluck(p, list) {
	        return map(prop(p), list);
	    });

	    /**
	     * Reasonable analog to SQL `select` statement.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @category Relation
	     * @sig [k] -> [{k: v}] -> [{k: v}]
	     * @param {Array} props The property names to project
	     * @param {Array} objs The objects to query
	     * @return {Array} An array of objects with just the `props` properties.
	     * @example
	     *
	     *      var abby = {name: 'Abby', age: 7, hair: 'blond', grade: 2};
	     *      var fred = {name: 'Fred', age: 12, hair: 'brown', grade: 7};
	     *      var kids = [abby, fred];
	     *      R.project(['name', 'grade'], kids); //=> [{name: 'Abby', grade: 2}, {name: 'Fred', grade: 7}]
	     */
	    // passing `identity` gives correct arity
	    var project = useWith(_map, [
	        pickAll,
	        identity
	    ]);

	    /**
	     * Returns `true` if the specified object property is equal, in `R.equals`
	     * terms, to the given value; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig String -> a -> Object -> Boolean
	     * @param {String} name
	     * @param {*} val
	     * @param {*} obj
	     * @return {Boolean}
	     * @see R.equals, R.propSatisfies
	     * @example
	     *
	     *      var abby = {name: 'Abby', age: 7, hair: 'blond'};
	     *      var fred = {name: 'Fred', age: 12, hair: 'brown'};
	     *      var rusty = {name: 'Rusty', age: 10, hair: 'brown'};
	     *      var alois = {name: 'Alois', age: 15, disposition: 'surly'};
	     *      var kids = [abby, fred, rusty, alois];
	     *      var hasBrownHair = R.propEq('hair', 'brown');
	     *      R.filter(hasBrownHair, kids); //=> [fred, rusty]
	     */
	    var propEq = _curry3(function propEq(name, val, obj) {
	        return equals(val, obj[name]);
	    });

	    /**
	     * Returns a single item by iterating through the list, successively calling
	     * the iterator function and passing it an accumulator value and the current
	     * value from the array, and then passing the result to the next call.
	     *
	     * The iterator function receives two values: *(acc, value)*. It may use
	     * `R.reduced` to shortcut the iteration.
	     *
	     * Note: `R.reduce` does not skip deleted or unassigned indices (sparse
	     * arrays), unlike the native `Array.prototype.reduce` method. For more details
	     * on this behavior, see:
	     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Description
	     *
	     * Dispatches to the `reduce` method of the third argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig ((a, b) -> a) -> a -> [b] -> a
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array.
	     * @param {*} acc The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.reduced, R.addIndex
	     * @example
	     *
	     *      var numbers = [1, 2, 3];
	     *      var plus = (a, b) => a + b;
	     *
	     *      R.reduce(plus, 10, numbers); //=> 16
	     */
	    var reduce = _curry3(_reduce);

	    /**
	     * Groups the elements of the list according to the result of calling
	     * the String-returning function `keyFn` on each element and reduces the elements
	     * of each group to a single value via the reducer function `valueFn`.
	     *
	     * This function is basically a more general `groupBy` function.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category List
	     * @sig ((a, b) -> a) -> a -> (b -> String) -> [b] -> {String: a}
	     * @param {Function} valueFn The function that reduces the elements of each group to a single
	     *        value. Receives two values, accumulator for a particular group and the current element.
	     * @param {*} acc The (initial) accumulator value for each group.
	     * @param {Function} keyFn The function that maps the list's element into a key.
	     * @param {Array} list The array to group.
	     * @return {Object} An object with the output of `keyFn` for keys, mapped to the output of
	     *         `valueFn` for elements which produced that key when passed to `keyFn`.
	     * @see R.groupBy, R.reduce
	     * @example
	     *
	     *      var reduceToNamesBy = R.reduceBy((acc, student) => acc.concat(student.name), []);
	     *      var namesByGrade = reduceToNamesBy(function(student) {
	     *        var score = student.score;
	     *        return score < 65 ? 'F' :
	     *               score < 70 ? 'D' :
	     *               score < 80 ? 'C' :
	     *               score < 90 ? 'B' : 'A';
	     *      });
	     *      var students = [{name: 'Lucy', score: 92},
	     *                      {name: 'Drew', score: 85},
	     *                      // ...
	     *                      {name: 'Bart', score: 62}];
	     *      namesByGrade(students);
	     *      // {
	     *      //   'A': ['Lucy'],
	     *      //   'B': ['Drew']
	     *      //   // ...,
	     *      //   'F': ['Bart']
	     *      // }
	     */
	    var reduceBy = _curryN(4, [], _dispatchable('reduceBy', _xreduceBy, function reduceBy(valueFn, valueAcc, keyFn, list) {
	        return _reduce(function (acc, elt) {
	            var key = keyFn(elt);
	            acc[key] = valueFn(_has(key, acc) ? acc[key] : valueAcc, elt);
	            return acc;
	        }, {}, list);
	    }));

	    /**
	     * Like `reduce`, `reduceWhile` returns a single item by iterating through
	     * the list, successively calling the iterator function. `reduceWhile` also
	     * takes a predicate that is evaluated before each step. If the predicate returns
	     * `false`, it "short-circuits" the iteration and returns the current value
	     * of the accumulator.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.22.0
	     * @category List
	     * @sig ((a, b) -> Boolean) -> ((a, b) -> a) -> a -> [b] -> a
	     * @param {Function} pred The predicate. It is passed the accumulator and the
	     *        current element.
	     * @param {Function} fn The iterator function. Receives two values, the
	     *        accumulator and the current element.
	     * @param {*} a The accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.reduce, R.reduced
	     * @example
	     *
	     *      var isOdd = (acc, x) => x % 2 === 1;
	     *      var xs = [1, 3, 5, 60, 777, 800];
	     *      R.reduceWhile(isOdd, R.add, 0, xs); //=> 9
	     *
	     *      var ys = [2, 4, 6]
	     *      R.reduceWhile(isOdd, R.add, 111, ys); //=> 111
	     */
	    var reduceWhile = _curryN(4, [], function _reduceWhile(pred, fn, a, list) {
	        return _reduce(function (acc, x) {
	            return pred(acc, x) ? fn(acc, x) : _reduced(acc);
	        }, a, list);
	    });

	    /**
	     * The complement of `filter`.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig Filterable f => (a -> Boolean) -> f a -> f a
	     * @param {Function} pred
	     * @param {Array} filterable
	     * @return {Array}
	     * @see R.filter, R.transduce, R.addIndex
	     * @example
	     *
	     *      var isOdd = (n) => n % 2 === 1;
	     *
	     *      R.reject(isOdd, [1, 2, 3, 4]); //=> [2, 4]
	     *
	     *      R.reject(isOdd, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
	     */
	    var reject = _curry2(function reject(pred, filterable) {
	        return filter(_complement(pred), filterable);
	    });

	    /**
	     * Returns a fixed list of size `n` containing a specified identical value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.1
	     * @category List
	     * @sig a -> n -> [a]
	     * @param {*} value The value to repeat.
	     * @param {Number} n The desired size of the output list.
	     * @return {Array} A new array containing `n` `value`s.
	     * @example
	     *
	     *      R.repeat('hi', 5); //=> ['hi', 'hi', 'hi', 'hi', 'hi']
	     *
	     *      var obj = {};
	     *      var repeatedObjs = R.repeat(obj, 5); //=> [{}, {}, {}, {}, {}]
	     *      repeatedObjs[0] === repeatedObjs[1]; //=> true
	     */
	    var repeat = _curry2(function repeat(value, n) {
	        return times(always(value), n);
	    });

	    /**
	     * Adds together all the elements of a list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list An array of numbers
	     * @return {Number} The sum of all the numbers in the list.
	     * @see R.reduce
	     * @example
	     *
	     *      R.sum([2,4,6,8,100,1]); //=> 121
	     */
	    var sum = reduce(add, 0);

	    /**
	     * Returns a new list containing the last `n` elements of the given list.
	     * If `n > list.length`, returns a list of `list.length` elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig Number -> [a] -> [a]
	     * @sig Number -> String -> String
	     * @param {Number} n The number of elements to return.
	     * @param {Array} xs The collection to consider.
	     * @return {Array}
	     * @see R.dropLast
	     * @example
	     *
	     *      R.takeLast(1, ['foo', 'bar', 'baz']); //=> ['baz']
	     *      R.takeLast(2, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
	     *      R.takeLast(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.takeLast(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	     *      R.takeLast(3, 'ramda');               //=> 'mda'
	     */
	    var takeLast = _curry2(function takeLast(n, xs) {
	        return drop(n >= 0 ? xs.length - n : 0, xs);
	    });

	    /**
	     * Initializes a transducer using supplied iterator function. Returns a single
	     * item by iterating through the list, successively calling the transformed
	     * iterator function and passing it an accumulator value and the current value
	     * from the array, and then passing the result to the next call.
	     *
	     * The iterator function receives two values: *(acc, value)*. It will be
	     * wrapped as a transformer to initialize the transducer. A transformer can be
	     * passed directly in place of an iterator function. In both cases, iteration
	     * may be stopped early with the `R.reduced` function.
	     *
	     * A transducer is a function that accepts a transformer and returns a
	     * transformer and can be composed directly.
	     *
	     * A transformer is an an object that provides a 2-arity reducing iterator
	     * function, step, 0-arity initial value function, init, and 1-arity result
	     * extraction function, result. The step function is used as the iterator
	     * function in reduce. The result function is used to convert the final
	     * accumulator into the return type and in most cases is R.identity. The init
	     * function can be used to provide an initial accumulator, but is ignored by
	     * transduce.
	     *
	     * The iteration is performed with R.reduce after initializing the transducer.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category List
	     * @sig (c -> c) -> (a,b -> a) -> a -> [b] -> a
	     * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
	     * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	     *        current element from the array. Wrapped as transformer, if necessary, and used to
	     *        initialize the transducer
	     * @param {*} acc The initial accumulator value.
	     * @param {Array} list The list to iterate over.
	     * @return {*} The final, accumulated value.
	     * @see R.reduce, R.reduced, R.into
	     * @example
	     *
	     *      var numbers = [1, 2, 3, 4];
	     *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
	     *
	     *      R.transduce(transducer, R.flip(R.append), [], numbers); //=> [2, 3]
	     */
	    var transduce = curryN(4, function transduce(xf, fn, acc, list) {
	        return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
	    });

	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of the elements
	     * of each list. Duplication is determined according to the value returned by
	     * applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The first and second lists concatenated, with
	     *         duplicates removed.
	     * @see R.union
	     * @example
	     *
	     *      var l1 = [{a: 1}, {a: 2}];
	     *      var l2 = [{a: 1}, {a: 4}];
	     *      R.unionWith(R.eqBy(R.prop('a')), l1, l2); //=> [{a: 1}, {a: 2}, {a: 4}]
	     */
	    var unionWith = _curry3(function unionWith(pred, list1, list2) {
	        return uniqWith(pred, _concat(list1, list2));
	    });

	    /**
	     * Takes a spec object and a test object; returns true if the test satisfies
	     * the spec, false otherwise. An object satisfies the spec if, for each of the
	     * spec's own properties, accessing that property of the object gives the same
	     * value (in `R.equals` terms) as accessing that property of the spec.
	     *
	     * `whereEq` is a specialization of [`where`](#where).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Object
	     * @sig {String: *} -> {String: *} -> Boolean
	     * @param {Object} spec
	     * @param {Object} testObj
	     * @return {Boolean}
	     * @see R.where
	     * @example
	     *
	     *      // pred :: Object -> Boolean
	     *      var pred = R.whereEq({a: 1, b: 2});
	     *
	     *      pred({a: 1});              //=> false
	     *      pred({a: 1, b: 2});        //=> true
	     *      pred({a: 1, b: 2, c: 3});  //=> true
	     *      pred({a: 1, b: 1});        //=> false
	     */
	    var whereEq = _curry2(function whereEq(spec, testObj) {
	        return where(map(equals, spec), testObj);
	    });

	    var _flatCat = function () {
	        var preservingReduced = function (xf) {
	            return {
	                '@@transducer/init': _xfBase.init,
	                '@@transducer/result': function (result) {
	                    return xf['@@transducer/result'](result);
	                },
	                '@@transducer/step': function (result, input) {
	                    var ret = xf['@@transducer/step'](result, input);
	                    return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
	                }
	            };
	        };
	        return function _xcat(xf) {
	            var rxf = preservingReduced(xf);
	            return {
	                '@@transducer/init': _xfBase.init,
	                '@@transducer/result': function (result) {
	                    return rxf['@@transducer/result'](result);
	                },
	                '@@transducer/step': function (result, input) {
	                    return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
	                }
	            };
	        };
	    }();

	    // Array.prototype.indexOf doesn't exist below IE9
	    // manually crawl the list to distinguish between +0 and -0
	    // NaN
	    // non-zero numbers can utilise Set
	    // all these types can utilise Set
	    // null can utilise Set
	    // anything else not covered above, defer to R.equals
	    var _indexOf = function _indexOf(list, a, idx) {
	        var inf, item;
	        // Array.prototype.indexOf doesn't exist below IE9
	        if (typeof list.indexOf === 'function') {
	            switch (typeof a) {
	            case 'number':
	                if (a === 0) {
	                    // manually crawl the list to distinguish between +0 and -0
	                    inf = 1 / a;
	                    while (idx < list.length) {
	                        item = list[idx];
	                        if (item === 0 && 1 / item === inf) {
	                            return idx;
	                        }
	                        idx += 1;
	                    }
	                    return -1;
	                } else if (a !== a) {
	                    // NaN
	                    while (idx < list.length) {
	                        item = list[idx];
	                        if (typeof item === 'number' && item !== item) {
	                            return idx;
	                        }
	                        idx += 1;
	                    }
	                    return -1;
	                }
	                // non-zero numbers can utilise Set
	                return list.indexOf(a, idx);
	            // all these types can utilise Set
	            case 'string':
	            case 'boolean':
	            case 'function':
	            case 'undefined':
	                return list.indexOf(a, idx);
	            case 'object':
	                if (a === null) {
	                    // null can utilise Set
	                    return list.indexOf(a, idx);
	                }
	            }
	        }
	        // anything else not covered above, defer to R.equals
	        while (idx < list.length) {
	            if (equals(list[idx], a)) {
	                return idx;
	            }
	            idx += 1;
	        }
	        return -1;
	    };

	    var _xchain = _curry2(function _xchain(f, xf) {
	        return map(f, _flatCat(xf));
	    });

	    /**
	     * Takes a list of predicates and returns a predicate that returns true for a
	     * given list of arguments if every one of the provided predicates is satisfied
	     * by those arguments.
	     *
	     * The function returned is a curried function whose arity matches that of the
	     * highest-arity predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Logic
	     * @sig [(*... -> Boolean)] -> (*... -> Boolean)
	     * @param {Array} preds
	     * @return {Function}
	     * @see R.anyPass
	     * @example
	     *
	     *      var isQueen = R.propEq('rank', 'Q');
	     *      var isSpade = R.propEq('suit', '♠︎');
	     *      var isQueenOfSpades = R.allPass([isQueen, isSpade]);
	     *
	     *      isQueenOfSpades({rank: 'Q', suit: '♣︎'}); //=> false
	     *      isQueenOfSpades({rank: 'Q', suit: '♠︎'}); //=> true
	     */
	    var allPass = _curry1(function allPass(preds) {
	        return curryN(reduce(max, 0, pluck('length', preds)), function () {
	            var idx = 0;
	            var len = preds.length;
	            while (idx < len) {
	                if (!preds[idx].apply(this, arguments)) {
	                    return false;
	                }
	                idx += 1;
	            }
	            return true;
	        });
	    });

	    /**
	     * Takes a list of predicates and returns a predicate that returns true for a
	     * given list of arguments if at least one of the provided predicates is
	     * satisfied by those arguments.
	     *
	     * The function returned is a curried function whose arity matches that of the
	     * highest-arity predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Logic
	     * @sig [(*... -> Boolean)] -> (*... -> Boolean)
	     * @param {Array} preds
	     * @return {Function}
	     * @see R.allPass
	     * @example
	     *
	     *      var gte = R.anyPass([R.gt, R.equals]);
	     *
	     *      gte(3, 2); //=> true
	     *      gte(2, 2); //=> true
	     *      gte(2, 3); //=> false
	     */
	    var anyPass = _curry1(function anyPass(preds) {
	        return curryN(reduce(max, 0, pluck('length', preds)), function () {
	            var idx = 0;
	            var len = preds.length;
	            while (idx < len) {
	                if (preds[idx].apply(this, arguments)) {
	                    return true;
	                }
	                idx += 1;
	            }
	            return false;
	        });
	    });

	    /**
	     * ap applies a list of functions to a list of values.
	     *
	     * Dispatches to the `ap` method of the second argument, if present. Also
	     * treats curried functions as applicatives.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category Function
	     * @sig [a -> b] -> [a] -> [b]
	     * @sig Apply f => f (a -> b) -> f a -> f b
	     * @param {Array} fns An array of functions
	     * @param {Array} vs An array of values
	     * @return {Array} An array of results of applying each of `fns` to all of `vs` in turn.
	     * @example
	     *
	     *      R.ap([R.multiply(2), R.add(3)], [1,2,3]); //=> [2, 4, 6, 4, 5, 6]
	     */
	    // else
	    var ap = _curry2(function ap(applicative, fn) {
	        return typeof applicative.ap === 'function' ? applicative.ap(fn) : typeof applicative === 'function' ? function (x) {
	            return applicative(x)(fn(x));
	        } : // else
	        _reduce(function (acc, f) {
	            return _concat(acc, map(f, fn));
	        }, [], applicative);
	    });

	    /**
	     * Given a spec object recursively mapping properties to functions, creates a
	     * function producing an object of the same structure, by mapping each property
	     * to the result of calling its associated function with the supplied arguments.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.20.0
	     * @category Function
	     * @sig {k: ((a, b, ..., m) -> v)} -> ((a, b, ..., m) -> {k: v})
	     * @param {Object} spec an object recursively mapping properties to functions for
	     *        producing the values for these properties.
	     * @return {Function} A function that returns an object of the same structure
	     * as `spec', with each property set to the value returned by calling its
	     * associated function with the supplied arguments.
	     * @see R.converge, R.juxt
	     * @example
	     *
	     *      var getMetrics = R.applySpec({
	     *                                      sum: R.add,
	     *                                      nested: { mul: R.multiply }
	     *                                   });
	     *      getMetrics(2, 4); // => { sum: 6, nested: { mul: 8 } }
	     */
	    var applySpec = _curry1(function applySpec(spec) {
	        spec = map(function (v) {
	            return typeof v == 'function' ? v : applySpec(v);
	        }, spec);
	        return curryN(reduce(max, 0, pluck('length', values(spec))), function () {
	            var args = arguments;
	            return map(function (f) {
	                return apply(f, args);
	            }, spec);
	        });
	    });

	    /**
	     * Returns the result of calling its first argument with the remaining
	     * arguments. This is occasionally useful as a converging function for
	     * `R.converge`: the left branch can produce a function while the right branch
	     * produces a value to be passed to that function as an argument.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category Function
	     * @sig (*... -> a),*... -> a
	     * @param {Function} fn The function to apply to the remaining arguments.
	     * @param {...*} args Any number of positional arguments.
	     * @return {*}
	     * @see R.apply
	     * @example
	     *
	     *      var indentN = R.pipe(R.times(R.always(' ')),
	     *                           R.join(''),
	     *                           R.replace(/^(?!$)/gm));
	     *
	     *      var format = R.converge(R.call, [
	     *                                  R.pipe(R.prop('indent'), indentN),
	     *                                  R.prop('value')
	     *                              ]);
	     *
	     *      format({indent: 2, value: 'foo\nbar\nbaz\n'}); //=> '  foo\n  bar\n  baz\n'
	     */
	    var call = curry(function call(fn) {
	        return fn.apply(this, _slice(arguments, 1));
	    });

	    /**
	     * `chain` maps a function over a list and concatenates the results. `chain`
	     * is also known as `flatMap` in some libraries
	     *
	     * Dispatches to the `chain` method of the second argument, if present,
	     * according to the [FantasyLand Chain spec](https://github.com/fantasyland/fantasy-land#chain).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig Chain m => (a -> m b) -> m a -> m b
	     * @param {Function} fn
	     * @param {Array} list
	     * @return {Array}
	     * @example
	     *
	     *      var duplicate = n => [n, n];
	     *      R.chain(duplicate, [1, 2, 3]); //=> [1, 1, 2, 2, 3, 3]
	     */
	    var chain = _curry2(_dispatchable('chain', _xchain, function chain(fn, monad) {
	        if (typeof monad === 'function') {
	            return function () {
	                return monad.call(this, fn.apply(this, arguments)).apply(this, arguments);
	            };
	        }
	        return _makeFlat(false)(map(fn, monad));
	    }));

	    /**
	     * Returns a function, `fn`, which encapsulates if/else-if/else logic.
	     * `R.cond` takes a list of [predicate, transform] pairs. All of the arguments
	     * to `fn` are applied to each of the predicates in turn until one returns a
	     * "truthy" value, at which point `fn` returns the result of applying its
	     * arguments to the corresponding transformer. If none of the predicates
	     * matches, `fn` returns undefined.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.6.0
	     * @category Logic
	     * @sig [[(*... -> Boolean),(*... -> *)]] -> (*... -> *)
	     * @param {Array} pairs
	     * @return {Function}
	     * @example
	     *
	     *      var fn = R.cond([
	     *        [R.equals(0),   R.always('water freezes at 0°C')],
	     *        [R.equals(100), R.always('water boils at 100°C')],
	     *        [R.T,           temp => 'nothing special happens at ' + temp + '°C']
	     *      ]);
	     *      fn(0); //=> 'water freezes at 0°C'
	     *      fn(50); //=> 'nothing special happens at 50°C'
	     *      fn(100); //=> 'water boils at 100°C'
	     */
	    var cond = _curry1(function cond(pairs) {
	        var arity = reduce(max, 0, map(function (pair) {
	            return pair[0].length;
	        }, pairs));
	        return _arity(arity, function () {
	            var idx = 0;
	            while (idx < pairs.length) {
	                if (pairs[idx][0].apply(this, arguments)) {
	                    return pairs[idx][1].apply(this, arguments);
	                }
	                idx += 1;
	            }
	        });
	    });

	    /**
	     * Wraps a constructor function inside a curried function that can be called
	     * with the same arguments and returns the same type. The arity of the function
	     * returned is specified to allow using variadic constructor functions.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.0
	     * @category Function
	     * @sig Number -> (* -> {*}) -> (* -> {*})
	     * @param {Number} n The arity of the constructor function.
	     * @param {Function} Fn The constructor function to wrap.
	     * @return {Function} A wrapped, curried constructor function.
	     * @example
	     *
	     *      // Variadic constructor function
	     *      var Widget = () => {
	     *        this.children = Array.prototype.slice.call(arguments);
	     *        // ...
	     *      };
	     *      Widget.prototype = {
	     *        // ...
	     *      };
	     *      var allConfigs = [
	     *        // ...
	     *      ];
	     *      R.map(R.constructN(1, Widget), allConfigs); // a list of Widgets
	     */
	    var constructN = _curry2(function constructN(n, Fn) {
	        if (n > 10) {
	            throw new Error('Constructor with greater than ten arguments');
	        }
	        if (n === 0) {
	            return function () {
	                return new Fn();
	            };
	        }
	        return curry(nAry(n, function ($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
	            switch (arguments.length) {
	            case 1:
	                return new Fn($0);
	            case 2:
	                return new Fn($0, $1);
	            case 3:
	                return new Fn($0, $1, $2);
	            case 4:
	                return new Fn($0, $1, $2, $3);
	            case 5:
	                return new Fn($0, $1, $2, $3, $4);
	            case 6:
	                return new Fn($0, $1, $2, $3, $4, $5);
	            case 7:
	                return new Fn($0, $1, $2, $3, $4, $5, $6);
	            case 8:
	                return new Fn($0, $1, $2, $3, $4, $5, $6, $7);
	            case 9:
	                return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);
	            case 10:
	                return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
	            }
	        }));
	    });

	    /**
	     * Accepts a converging function and a list of branching functions and returns
	     * a new function. When invoked, this new function is applied to some
	     * arguments, each branching function is applied to those same arguments. The
	     * results of each branching function are passed as arguments to the converging
	     * function to produce the return value.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.4.2
	     * @category Function
	     * @sig (x1 -> x2 -> ... -> z) -> [(a -> b -> ... -> x1), (a -> b -> ... -> x2), ...] -> (a -> b -> ... -> z)
	     * @param {Function} after A function. `after` will be invoked with the return values of
	     *        `fn1` and `fn2` as its arguments.
	     * @param {Array} functions A list of functions.
	     * @return {Function} A new function.
	     * @example
	     *
	     *      var add = (a, b) => a + b;
	     *      var multiply = (a, b) => a * b;
	     *      var subtract = (a, b) => a - b;
	     *
	     *      //≅ multiply( add(1, 2), subtract(1, 2) );
	     *      R.converge(multiply, [add, subtract])(1, 2); //=> -3
	     *
	     *      var add3 = (a, b, c) => a + b + c;
	     *      R.converge(add3, [multiply, add, subtract])(1, 2); //=> 4
	     */
	    var converge = _curry2(function converge(after, fns) {
	        return curryN(reduce(max, 0, pluck('length', fns)), function () {
	            var args = arguments;
	            var context = this;
	            return after.apply(context, _map(function (fn) {
	                return fn.apply(context, args);
	            }, fns));
	        });
	    });

	    /**
	     * Counts the elements of a list according to how many match each value of a
	     * key generated by the supplied function. Returns an object mapping the keys
	     * produced by `fn` to the number of occurrences in the list. Note that all
	     * keys are coerced to strings because of how JavaScript objects work.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig (a -> String) -> [a] -> {*}
	     * @param {Function} fn The function used to map values to keys.
	     * @param {Array} list The list to count elements from.
	     * @return {Object} An object mapping keys to number of occurrences in the list.
	     * @example
	     *
	     *      var numbers = [1.0, 1.1, 1.2, 2.0, 3.0, 2.2];
	     *      var letters = R.split('', 'abcABCaaaBBc');
	     *      R.countBy(Math.floor)(numbers);    //=> {'1': 3, '2': 2, '3': 1}
	     *      R.countBy(R.toLower)(letters);   //=> {'a': 5, 'b': 4, 'c': 3}
	     */
	    var countBy = reduceBy(function (acc, elem) {
	        return acc + 1;
	    }, 0);

	    /**
	     * Returns a new list without any consecutively repeating elements. Equality is
	     * determined by applying the supplied predicate two consecutive elements. The
	     * first element in a series of equal element is the one being preserved.
	     *
	     * Dispatches to the `dropRepeatsWith` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig (a, a -> Boolean) -> [a] -> [a]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list The array to consider.
	     * @return {Array} `list` without repeating elements.
	     * @see R.transduce
	     * @example
	     *
	     *      var l = [1, -1, 1, 3, 4, -4, -4, -5, 5, 3, 3];
	     *      R.dropRepeatsWith(R.eqBy(Math.abs), l); //=> [1, 3, 4, -5, 3]
	     */
	    var dropRepeatsWith = _curry2(_dispatchable('dropRepeatsWith', _xdropRepeatsWith, function dropRepeatsWith(pred, list) {
	        var result = [];
	        var idx = 1;
	        var len = list.length;
	        if (len !== 0) {
	            result[0] = list[0];
	            while (idx < len) {
	                if (!pred(last(result), list[idx])) {
	                    result[result.length] = list[idx];
	                }
	                idx += 1;
	            }
	        }
	        return result;
	    }));

	    /**
	     * Takes a function and two values in its domain and returns `true` if the
	     * values map to the same value in the codomain; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.18.0
	     * @category Relation
	     * @sig (a -> b) -> a -> a -> Boolean
	     * @param {Function} f
	     * @param {*} x
	     * @param {*} y
	     * @return {Boolean}
	     * @example
	     *
	     *      R.eqBy(Math.abs, 5, -5); //=> true
	     */
	    var eqBy = _curry3(function eqBy(f, x, y) {
	        return equals(f(x), f(y));
	    });

	    /**
	     * Reports whether two objects have the same value, in `R.equals` terms, for
	     * the specified property. Useful as a curried predicate.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig k -> {k: v} -> {k: v} -> Boolean
	     * @param {String} prop The name of the property to compare
	     * @param {Object} obj1
	     * @param {Object} obj2
	     * @return {Boolean}
	     *
	     * @example
	     *
	     *      var o1 = { a: 1, b: 2, c: 3, d: 4 };
	     *      var o2 = { a: 10, b: 20, c: 3, d: 40 };
	     *      R.eqProps('a', o1, o2); //=> false
	     *      R.eqProps('c', o1, o2); //=> true
	     */
	    var eqProps = _curry3(function eqProps(prop, obj1, obj2) {
	        return equals(obj1[prop], obj2[prop]);
	    });

	    /**
	     * Splits a list into sub-lists stored in an object, based on the result of
	     * calling a String-returning function on each element, and grouping the
	     * results according to values returned.
	     *
	     * Dispatches to the `groupBy` method of the second argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig (a -> String) -> [a] -> {String: [a]}
	     * @param {Function} fn Function :: a -> String
	     * @param {Array} list The array to group
	     * @return {Object} An object with the output of `fn` for keys, mapped to arrays of elements
	     *         that produced that key when passed to `fn`.
	     * @see R.transduce
	     * @example
	     *
	     *      var byGrade = R.groupBy(function(student) {
	     *        var score = student.score;
	     *        return score < 65 ? 'F' :
	     *               score < 70 ? 'D' :
	     *               score < 80 ? 'C' :
	     *               score < 90 ? 'B' : 'A';
	     *      });
	     *      var students = [{name: 'Abby', score: 84},
	     *                      {name: 'Eddy', score: 58},
	     *                      // ...
	     *                      {name: 'Jack', score: 69}];
	     *      byGrade(students);
	     *      // {
	     *      //   'A': [{name: 'Dianne', score: 99}],
	     *      //   'B': [{name: 'Abby', score: 84}]
	     *      //   // ...,
	     *      //   'F': [{name: 'Eddy', score: 58}]
	     *      // }
	     */
	    var groupBy = _curry2(_checkForMethod('groupBy', reduceBy(function (acc, item) {
	        if (acc == null) {
	            acc = [];
	        }
	        acc.push(item);
	        return acc;
	    }, null)));

	    /**
	     * Given a function that generates a key, turns a list of objects into an
	     * object indexing the objects by the given key. Note that if multiple
	     * objects generate the same value for the indexing key only the last value
	     * will be included in the generated object.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (a -> String) -> [{k: v}] -> {k: {k: v}}
	     * @param {Function} fn Function :: a -> String
	     * @param {Array} array The array of objects to index
	     * @return {Object} An object indexing each array element by the given property.
	     * @example
	     *
	     *      var list = [{id: 'xyz', title: 'A'}, {id: 'abc', title: 'B'}];
	     *      R.indexBy(R.prop('id'), list);
	     *      //=> {abc: {id: 'abc', title: 'B'}, xyz: {id: 'xyz', title: 'A'}}
	     */
	    var indexBy = reduceBy(function (acc, elem) {
	        return elem;
	    }, null);

	    /**
	     * Returns the position of the first occurrence of an item in an array, or -1
	     * if the item is not included in the array. `R.equals` is used to determine
	     * equality.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> Number
	     * @param {*} target The item to find.
	     * @param {Array} xs The array to search in.
	     * @return {Number} the index of the target, or -1 if the target is not found.
	     * @see R.lastIndexOf
	     * @example
	     *
	     *      R.indexOf(3, [1,2,3,4]); //=> 2
	     *      R.indexOf(10, [1,2,3,4]); //=> -1
	     */
	    var indexOf = _curry2(function indexOf(target, xs) {
	        return typeof xs.indexOf === 'function' && !_isArray(xs) ? xs.indexOf(target) : _indexOf(xs, target, 0);
	    });

	    /**
	     * juxt applies a list of functions to a list of values.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Function
	     * @sig [(a, b, ..., m) -> n] -> ((a, b, ..., m) -> [n])
	     * @param {Array} fns An array of functions
	     * @return {Function} A function that returns a list of values after applying each of the original `fns` to its parameters.
	     * @see R.applySpec
	     * @example
	     *
	     *      var getRange = R.juxt([Math.min, Math.max]);
	     *      getRange(3, 4, 9, -3); //=> [-3, 9]
	     */
	    var juxt = _curry1(function juxt(fns) {
	        return converge(_arrayOf, fns);
	    });

	    /**
	     * Returns a lens for the given getter and setter functions. The getter "gets"
	     * the value of the focus; the setter "sets" the value of the focus. The setter
	     * should not mutate the data structure.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.8.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig (s -> a) -> ((a, s) -> s) -> Lens s a
	     * @param {Function} getter
	     * @param {Function} setter
	     * @return {Lens}
	     * @see R.view, R.set, R.over, R.lensIndex, R.lensProp
	     * @example
	     *
	     *      var xLens = R.lens(R.prop('x'), R.assoc('x'));
	     *
	     *      R.view(xLens, {x: 1, y: 2});            //=> 1
	     *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
	     *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
	     */
	    var lens = _curry2(function lens(getter, setter) {
	        return function (toFunctorFn) {
	            return function (target) {
	                return map(function (focus) {
	                    return setter(focus, target);
	                }, toFunctorFn(getter(target)));
	            };
	        };
	    });

	    /**
	     * Returns a lens whose focus is the specified index.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig Number -> Lens s a
	     * @param {Number} n
	     * @return {Lens}
	     * @see R.view, R.set, R.over
	     * @example
	     *
	     *      var headLens = R.lensIndex(0);
	     *
	     *      R.view(headLens, ['a', 'b', 'c']);            //=> 'a'
	     *      R.set(headLens, 'x', ['a', 'b', 'c']);        //=> ['x', 'b', 'c']
	     *      R.over(headLens, R.toUpper, ['a', 'b', 'c']); //=> ['A', 'b', 'c']
	     */
	    var lensIndex = _curry1(function lensIndex(n) {
	        return lens(nth(n), update(n));
	    });

	    /**
	     * Returns a lens whose focus is the specified path.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig [String] -> Lens s a
	     * @param {Array} path The path to use.
	     * @return {Lens}
	     * @see R.view, R.set, R.over
	     * @example
	     *
	     *      var xyLens = R.lensPath(['x', 'y']);
	     *
	     *      R.view(xyLens, {x: {y: 2, z: 3}});            //=> 2
	     *      R.set(xyLens, 4, {x: {y: 2, z: 3}});          //=> {x: {y: 4, z: 3}}
	     *      R.over(xyLens, R.negate, {x: {y: 2, z: 3}});  //=> {x: {y: -2, z: 3}}
	     */
	    var lensPath = _curry1(function lensPath(p) {
	        return lens(path(p), assocPath(p));
	    });

	    /**
	     * Returns a lens whose focus is the specified property.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Object
	     * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	     * @sig String -> Lens s a
	     * @param {String} k
	     * @return {Lens}
	     * @see R.view, R.set, R.over
	     * @example
	     *
	     *      var xLens = R.lensProp('x');
	     *
	     *      R.view(xLens, {x: 1, y: 2});            //=> 1
	     *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
	     *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
	     */
	    var lensProp = _curry1(function lensProp(k) {
	        return lens(prop(k), assoc(k));
	    });

	    /**
	     * "lifts" a function to be the specified arity, so that it may "map over" that
	     * many lists, Functions or other objects that satisfy the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Function
	     * @sig Number -> (*... -> *) -> ([*]... -> [*])
	     * @param {Function} fn The function to lift into higher context
	     * @return {Function} The lifted function.
	     * @see R.lift, R.ap
	     * @example
	     *
	     *      var madd3 = R.liftN(3, R.curryN(3, (...args) => R.sum(args)));
	     *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
	     */
	    var liftN = _curry2(function liftN(arity, fn) {
	        var lifted = curryN(arity, fn);
	        return curryN(arity, function () {
	            return _reduce(ap, map(lifted, arguments[0]), _slice(arguments, 1));
	        });
	    });

	    /**
	     * Returns the mean of the given list of numbers.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list
	     * @return {Number}
	     * @example
	     *
	     *      R.mean([2, 7, 9]); //=> 6
	     *      R.mean([]); //=> NaN
	     */
	    var mean = _curry1(function mean(list) {
	        return sum(list) / list.length;
	    });

	    /**
	     * Returns the median of the given list of numbers.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list
	     * @return {Number}
	     * @example
	     *
	     *      R.median([2, 9, 7]); //=> 7
	     *      R.median([7, 2, 10, 9]); //=> 8
	     *      R.median([]); //=> NaN
	     */
	    var median = _curry1(function median(list) {
	        var len = list.length;
	        if (len === 0) {
	            return NaN;
	        }
	        var width = 2 - len % 2;
	        var idx = (len - width) / 2;
	        return mean(_slice(list).sort(function (a, b) {
	            return a < b ? -1 : a > b ? 1 : 0;
	        }).slice(idx, idx + width));
	    });

	    /**
	     * Takes a predicate and a list or other "filterable" object and returns the
	     * pair of filterable objects of the same type of elements which do and do not
	     * satisfy, the predicate, respectively.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.4
	     * @category List
	     * @sig Filterable f => (a -> Boolean) -> f a -> [f a, f a]
	     * @param {Function} pred A predicate to determine which side the element belongs to.
	     * @param {Array} filterable the list (or other filterable) to partition.
	     * @return {Array} An array, containing first the subset of elements that satisfy the
	     *         predicate, and second the subset of elements that do not satisfy.
	     * @see R.filter, R.reject
	     * @example
	     *
	     *      R.partition(R.contains('s'), ['sss', 'ttt', 'foo', 'bars']);
	     *      // => [ [ 'sss', 'bars' ],  [ 'ttt', 'foo' ] ]
	     *
	     *      R.partition(R.contains('s'), { a: 'sss', b: 'ttt', foo: 'bars' });
	     *      // => [ { a: 'sss', foo: 'bars' }, { b: 'ttt' }  ]
	     */
	    var partition = juxt([
	        filter,
	        reject
	    ]);

	    /**
	     * Performs left-to-right function composition. The leftmost function may have
	     * any arity; the remaining functions must be unary.
	     *
	     * In some libraries this function is named `sequence`.
	     *
	     * **Note:** The result of pipe is not automatically curried.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)) -> ((a, b, ..., n) -> z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.compose
	     * @example
	     *
	     *      var f = R.pipe(Math.pow, R.negate, R.inc);
	     *
	     *      f(3, 4); // -(3^4) + 1
	     */
	    var pipe = function pipe() {
	        if (arguments.length === 0) {
	            throw new Error('pipe requires at least one argument');
	        }
	        return _arity(arguments[0].length, reduce(_pipe, arguments[0], tail(arguments)));
	    };

	    /**
	     * Performs left-to-right composition of one or more Promise-returning
	     * functions. The leftmost function may have any arity; the remaining functions
	     * must be unary.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((a -> Promise b), (b -> Promise c), ..., (y -> Promise z)) -> (a -> Promise z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.composeP
	     * @example
	     *
	     *      //  followersForUser :: String -> Promise [User]
	     *      var followersForUser = R.pipeP(db.getUserById, db.getFollowers);
	     */
	    var pipeP = function pipeP() {
	        if (arguments.length === 0) {
	            throw new Error('pipeP requires at least one argument');
	        }
	        return _arity(arguments[0].length, reduce(_pipeP, arguments[0], tail(arguments)));
	    };

	    /**
	     * Multiplies together all the elements of a list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Math
	     * @sig [Number] -> Number
	     * @param {Array} list An array of numbers
	     * @return {Number} The product of all the numbers in the list.
	     * @see R.reduce
	     * @example
	     *
	     *      R.product([2,4,6,8,100,1]); //=> 38400
	     */
	    var product = reduce(multiply, 1);

	    /**
	     * Transforms a [Traversable](https://github.com/fantasyland/fantasy-land#traversable)
	     * of [Applicative](https://github.com/fantasyland/fantasy-land#applicative) into an
	     * Applicative of Traversable.
	     *
	     * Dispatches to the `sequence` method of the second argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (Applicative f, Traversable t) => (a -> f a) -> t (f a) -> f (t a)
	     * @param {Function} of
	     * @param {*} traversable
	     * @return {*}
	     * @see R.traverse
	     * @example
	     *
	     *      R.sequence(Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([1, 2, 3])
	     *      R.sequence(Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
	     *
	     *      R.sequence(R.of, Just([1, 2, 3])); //=> [Just(1), Just(2), Just(3)]
	     *      R.sequence(R.of, Nothing());       //=> [Nothing()]
	     */
	    var sequence = _curry2(function sequence(of, traversable) {
	        return typeof traversable.sequence === 'function' ? traversable.sequence(of) : reduceRight(function (acc, x) {
	            return ap(map(prepend, x), acc);
	        }, of([]), traversable);
	    });

	    /**
	     * Maps an [Applicative](https://github.com/fantasyland/fantasy-land#applicative)-returning
	     * function over a [Traversable](https://github.com/fantasyland/fantasy-land#traversable),
	     * then uses [`sequence`](#sequence) to transform the resulting Traversable of Applicative
	     * into an Applicative of Traversable.
	     *
	     * Dispatches to the `sequence` method of the third argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig (Applicative f, Traversable t) => (a -> f a) -> (a -> f b) -> t a -> f (t b)
	     * @param {Function} of
	     * @param {Function} f
	     * @param {*} traversable
	     * @return {*}
	     * @see R.sequence
	     * @example
	     *
	     *      // Returns `Nothing` if the given divisor is `0`
	     *      safeDiv = n => d => d === 0 ? Nothing() : Just(n / d)
	     *
	     *      R.traverse(Maybe.of, safeDiv(10), [2, 4, 5]); //=> Just([5, 2.5, 2])
	     *      R.traverse(Maybe.of, safeDiv(10), [2, 0, 5]); //=> Nothing
	     */
	    var traverse = _curry3(function traverse(of, f, traversable) {
	        return sequence(of, map(f, traversable));
	    });

	    /**
	     * Shorthand for `R.chain(R.identity)`, which removes one level of nesting from
	     * any [Chain](https://github.com/fantasyland/fantasy-land#chain).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.3.0
	     * @category List
	     * @sig Chain c => c (c a) -> c a
	     * @param {*} list
	     * @return {*}
	     * @see R.flatten, R.chain
	     * @example
	     *
	     *      R.unnest([1, [2], [[3]]]); //=> [1, 2, [3]]
	     *      R.unnest([[1, 2], [3, 4], [5, 6]]); //=> [1, 2, 3, 4, 5, 6]
	     */
	    var unnest = chain(_identity);

	    var _contains = function _contains(a, list) {
	        return _indexOf(list, a, 0) >= 0;
	    };

	    //  mapPairs :: (Object, [String]) -> [String]
	    var _toString = function _toString(x, seen) {
	        var recur = function recur(y) {
	            var xs = seen.concat([x]);
	            return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
	        };
	        //  mapPairs :: (Object, [String]) -> [String]
	        var mapPairs = function (obj, keys) {
	            return _map(function (k) {
	                return _quote(k) + ': ' + recur(obj[k]);
	            }, keys.slice().sort());
	        };
	        switch (Object.prototype.toString.call(x)) {
	        case '[object Arguments]':
	            return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
	        case '[object Array]':
	            return '[' + _map(recur, x).concat(mapPairs(x, reject(function (k) {
	                return /^\d+$/.test(k);
	            }, keys(x)))).join(', ') + ']';
	        case '[object Boolean]':
	            return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
	        case '[object Date]':
	            return 'new Date(' + (isNaN(x.valueOf()) ? recur(NaN) : _quote(_toISOString(x))) + ')';
	        case '[object Null]':
	            return 'null';
	        case '[object Number]':
	            return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
	        case '[object String]':
	            return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
	        case '[object Undefined]':
	            return 'undefined';
	        default:
	            if (typeof x.toString === 'function') {
	                var repr = x.toString();
	                if (repr !== '[object Object]') {
	                    return repr;
	                }
	            }
	            return '{' + mapPairs(x, keys(x)).join(', ') + '}';
	        }
	    };

	    /**
	     * Performs right-to-left function composition. The rightmost function may have
	     * any arity; the remaining functions must be unary.
	     *
	     * **Note:** The result of compose is not automatically curried.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig ((y -> z), (x -> y), ..., (o -> p), ((a, b, ..., n) -> o)) -> ((a, b, ..., n) -> z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.pipe
	     * @example
	     *
	     *      var f = R.compose(R.inc, R.negate, Math.pow);
	     *
	     *      f(3, 4); // -(3^4) + 1
	     */
	    var compose = function compose() {
	        if (arguments.length === 0) {
	            throw new Error('compose requires at least one argument');
	        }
	        return pipe.apply(this, reverse(arguments));
	    };

	    /**
	     * Returns the right-to-left Kleisli composition of the provided functions,
	     * each of which must return a value of a type supported by [`chain`](#chain).
	     *
	     * `R.composeK(h, g, f)` is equivalent to `R.compose(R.chain(h), R.chain(g), R.chain(f))`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Function
	     * @sig Chain m => ((y -> m z), (x -> m y), ..., (a -> m b)) -> (m a -> m z)
	     * @param {...Function}
	     * @return {Function}
	     * @see R.pipeK
	     * @example
	     *
	     *      //  parseJson :: String -> Maybe *
	     *      //  get :: String -> Object -> Maybe *
	     *
	     *      //  getStateCode :: Maybe String -> Maybe String
	     *      var getStateCode = R.composeK(
	     *        R.compose(Maybe.of, R.toUpper),
	     *        get('state'),
	     *        get('address'),
	     *        get('user'),
	     *        parseJson
	     *      );
	     *
	     *      getStateCode(Maybe.of('{"user":{"address":{"state":"ny"}}}'));
	     *      //=> Just('NY')
	     *      getStateCode(Maybe.of('[Invalid JSON]'));
	     *      //=> Nothing()
	     */
	    var composeK = function composeK() {
	        return compose.apply(this, prepend(identity, map(chain, arguments)));
	    };

	    /**
	     * Performs right-to-left composition of one or more Promise-returning
	     * functions. The rightmost function may have any arity; the remaining
	     * functions must be unary.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.10.0
	     * @category Function
	     * @sig ((y -> Promise z), (x -> Promise y), ..., (a -> Promise b)) -> (a -> Promise z)
	     * @param {...Function} functions
	     * @return {Function}
	     * @see R.pipeP
	     * @example
	     *
	     *      //  followersForUser :: String -> Promise [User]
	     *      var followersForUser = R.composeP(db.getFollowers, db.getUserById);
	     */
	    var composeP = function composeP() {
	        if (arguments.length === 0) {
	            throw new Error('composeP requires at least one argument');
	        }
	        return pipeP.apply(this, reverse(arguments));
	    };

	    /**
	     * Wraps a constructor function inside a curried function that can be called
	     * with the same arguments and returns the same type.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (* -> {*}) -> (* -> {*})
	     * @param {Function} Fn The constructor function to wrap.
	     * @return {Function} A wrapped, curried constructor function.
	     * @example
	     *
	     *      // Constructor function
	     *      var Widget = config => {
	     *        // ...
	     *      };
	     *      Widget.prototype = {
	     *        // ...
	     *      };
	     *      var allConfigs = [
	     *        // ...
	     *      ];
	     *      R.map(R.construct(Widget), allConfigs); // a list of Widgets
	     */
	    var construct = _curry1(function construct(Fn) {
	        return constructN(Fn.length, Fn);
	    });

	    /**
	     * Returns `true` if the specified value is equal, in `R.equals` terms, to at
	     * least one element of the given list; `false` otherwise.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig a -> [a] -> Boolean
	     * @param {Object} a The item to compare against.
	     * @param {Array} list The array to consider.
	     * @return {Boolean} `true` if the item is in the list, `false` otherwise.
	     * @see R.any
	     * @example
	     *
	     *      R.contains(3, [1, 2, 3]); //=> true
	     *      R.contains(4, [1, 2, 3]); //=> false
	     *      R.contains([42], [[42]]); //=> true
	     */
	    var contains = _curry2(_contains);

	    /**
	     * Finds the set (i.e. no duplicates) of all elements in the first list not
	     * contained in the second list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` that are not in `list2`.
	     * @see R.differenceWith, R.symmetricDifference, R.symmetricDifferenceWith
	     * @example
	     *
	     *      R.difference([1,2,3,4], [7,6,5,4,3]); //=> [1,2]
	     *      R.difference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5]
	     */
	    var difference = _curry2(function difference(first, second) {
	        var out = [];
	        var idx = 0;
	        var firstLen = first.length;
	        while (idx < firstLen) {
	            if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
	                out[out.length] = first[idx];
	            }
	            idx += 1;
	        }
	        return out;
	    });

	    /**
	     * Returns a new list without any consecutively repeating elements. `R.equals`
	     * is used to determine equality.
	     *
	     * Dispatches to the `dropRepeats` method of the first argument, if present.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category List
	     * @sig [a] -> [a]
	     * @param {Array} list The array to consider.
	     * @return {Array} `list` without repeating elements.
	     * @see R.transduce
	     * @example
	     *
	     *     R.dropRepeats([1, 1, 1, 2, 3, 4, 4, 2, 2]); //=> [1, 2, 3, 4, 2]
	     */
	    var dropRepeats = _curry1(_dispatchable('dropRepeats', _xdropRepeatsWith(equals), dropRepeatsWith(equals)));

	    /**
	     * "lifts" a function of arity > 1 so that it may "map over" a list, Function or other
	     * object that satisfies the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
	     *
	     * @func
	     * @memberOf R
	     * @since v0.7.0
	     * @category Function
	     * @sig (*... -> *) -> ([*]... -> [*])
	     * @param {Function} fn The function to lift into higher context
	     * @return {Function} The lifted function.
	     * @see R.liftN
	     * @example
	     *
	     *      var madd3 = R.lift(R.curry((a, b, c) => a + b + c));
	     *
	     *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
	     *
	     *      var madd5 = R.lift(R.curry((a, b, c, d, e) => a + b + c + d + e));
	     *
	     *      madd5([1,2], [3], [4, 5], [6], [7, 8]); //=> [21, 22, 22, 23, 22, 23, 23, 24]
	     */
	    var lift = _curry1(function lift(fn) {
	        return liftN(fn.length, fn);
	    });

	    /**
	     * Returns a partial copy of an object omitting the keys specified.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Object
	     * @sig [String] -> {String: *} -> {String: *}
	     * @param {Array} names an array of String property names to omit from the new object
	     * @param {Object} obj The object to copy from
	     * @return {Object} A new object with properties from `names` not on it.
	     * @see R.pick
	     * @example
	     *
	     *      R.omit(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, c: 3}
	     */
	    var omit = _curry2(function omit(names, obj) {
	        var result = {};
	        for (var prop in obj) {
	            if (!_contains(prop, names)) {
	                result[prop] = obj[prop];
	            }
	        }
	        return result;
	    });

	    /**
	     * Returns the left-to-right Kleisli composition of the provided functions,
	     * each of which must return a value of a type supported by [`chain`](#chain).
	     *
	     * `R.pipeK(f, g, h)` is equivalent to `R.pipe(R.chain(f), R.chain(g), R.chain(h))`.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category Function
	     * @sig Chain m => ((a -> m b), (b -> m c), ..., (y -> m z)) -> (m a -> m z)
	     * @param {...Function}
	     * @return {Function}
	     * @see R.composeK
	     * @example
	     *
	     *      //  parseJson :: String -> Maybe *
	     *      //  get :: String -> Object -> Maybe *
	     *
	     *      //  getStateCode :: Maybe String -> Maybe String
	     *      var getStateCode = R.pipeK(
	     *        parseJson,
	     *        get('user'),
	     *        get('address'),
	     *        get('state'),
	     *        R.compose(Maybe.of, R.toUpper)
	     *      );
	     *
	     *      getStateCode(Maybe.of('{"user":{"address":{"state":"ny"}}}'));
	     *      //=> Just('NY')
	     *      getStateCode(Maybe.of('[Invalid JSON]'));
	     *      //=> Nothing()
	     */
	    var pipeK = function pipeK() {
	        return composeK.apply(this, reverse(arguments));
	    };

	    /**
	     * Returns the string representation of the given value. `eval`'ing the output
	     * should result in a value equivalent to the input value. Many of the built-in
	     * `toString` methods do not satisfy this requirement.
	     *
	     * If the given value is an `[object Object]` with a `toString` method other
	     * than `Object.prototype.toString`, this method is invoked with no arguments
	     * to produce the return value. This means user-defined constructor functions
	     * can provide a suitable `toString` method. For example:
	     *
	     *     function Point(x, y) {
	     *       this.x = x;
	     *       this.y = y;
	     *     }
	     *
	     *     Point.prototype.toString = function() {
	     *       return 'new Point(' + this.x + ', ' + this.y + ')';
	     *     };
	     *
	     *     R.toString(new Point(1, 2)); //=> 'new Point(1, 2)'
	     *
	     * @func
	     * @memberOf R
	     * @since v0.14.0
	     * @category String
	     * @sig * -> String
	     * @param {*} val
	     * @return {String}
	     * @example
	     *
	     *      R.toString(42); //=> '42'
	     *      R.toString('abc'); //=> '"abc"'
	     *      R.toString([1, 2, 3]); //=> '[1, 2, 3]'
	     *      R.toString({foo: 1, bar: 2, baz: 3}); //=> '{"bar": 2, "baz": 3, "foo": 1}'
	     *      R.toString(new Date('2001-02-03T04:05:06Z')); //=> 'new Date("2001-02-03T04:05:06.000Z")'
	     */
	    var toString = _curry1(function toString(val) {
	        return _toString(val, []);
	    });

	    /**
	     * Returns a new list without values in the first argument.
	     * `R.equals` is used to determine equality.
	     *
	     * Acts as a transducer if a transformer is given in list position.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category List
	     * @sig [a] -> [a] -> [a]
	     * @param {Array} list1 The values to be removed from `list2`.
	     * @param {Array} list2 The array to remove values from.
	     * @return {Array} The new array without values in `list1`.
	     * @see R.transduce
	     * @example
	     *
	     *      R.without([1, 2], [1, 2, 1, 3, 4]); //=> [3, 4]
	     */
	    var without = _curry2(function (xs, list) {
	        return reject(flip(_contains)(xs), list);
	    });

	    // A simple Set type that honours R.equals semantics
	    /* globals Set */
	    // until we figure out why jsdoc chokes on this
	    // @param item The item to add to the Set
	    // @returns {boolean} true if the item did not exist prior, otherwise false
	    //
	    //
	    // @param item The item to check for existence in the Set
	    // @returns {boolean} true if the item exists in the Set, otherwise false
	    //
	    //
	    // Combines the logic for checking whether an item is a member of the set and
	    // for adding a new item to the set.
	    //
	    // @param item       The item to check or add to the Set instance.
	    // @param shouldAdd  If true, the item will be added to the set if it doesn't
	    //                   already exist.
	    // @param set        The set instance to check or add to.
	    // @return {boolean} true if the item already existed, otherwise false.
	    //
	    // distinguish between +0 and -0
	    // these types can all utilise the native Set
	    // set._items['boolean'] holds a two element array
	    // representing [ falseExists, trueExists ]
	    // compare functions for reference equality
	    /* falls through */
	    // reduce the search size of heterogeneous sets by creating buckets
	    // for each type.
	    // scan through all previously applied items
	    var _Set = function () {
	        function _Set() {
	            /* globals Set */
	            this._nativeSet = typeof Set === 'function' ? new Set() : null;
	            this._items = {};
	        }
	        // until we figure out why jsdoc chokes on this
	        // @param item The item to add to the Set
	        // @returns {boolean} true if the item did not exist prior, otherwise false
	        //
	        _Set.prototype.add = function (item) {
	            return !hasOrAdd(item, true, this);
	        };
	        //
	        // @param item The item to check for existence in the Set
	        // @returns {boolean} true if the item exists in the Set, otherwise false
	        //
	        _Set.prototype.has = function (item) {
	            return hasOrAdd(item, false, this);
	        };
	        //
	        // Combines the logic for checking whether an item is a member of the set and
	        // for adding a new item to the set.
	        //
	        // @param item       The item to check or add to the Set instance.
	        // @param shouldAdd  If true, the item will be added to the set if it doesn't
	        //                   already exist.
	        // @param set        The set instance to check or add to.
	        // @return {boolean} true if the item already existed, otherwise false.
	        //
	        function hasOrAdd(item, shouldAdd, set) {
	            var type = typeof item;
	            var prevSize, newSize;
	            switch (type) {
	            case 'string':
	            case 'number':
	                // distinguish between +0 and -0
	                if (item === 0 && 1 / item === -Infinity) {
	                    if (set._items['-0']) {
	                        return true;
	                    } else {
	                        if (shouldAdd) {
	                            set._items['-0'] = true;
	                        }
	                        return false;
	                    }
	                }
	                // these types can all utilise the native Set
	                if (set._nativeSet !== null) {
	                    if (shouldAdd) {
	                        prevSize = set._nativeSet.size;
	                        set._nativeSet.add(item);
	                        newSize = set._nativeSet.size;
	                        return newSize === prevSize;
	                    } else {
	                        return set._nativeSet.has(item);
	                    }
	                } else {
	                    if (!(type in set._items)) {
	                        if (shouldAdd) {
	                            set._items[type] = {};
	                            set._items[type][item] = true;
	                        }
	                        return false;
	                    } else if (item in set._items[type]) {
	                        return true;
	                    } else {
	                        if (shouldAdd) {
	                            set._items[type][item] = true;
	                        }
	                        return false;
	                    }
	                }
	            case 'boolean':
	                // set._items['boolean'] holds a two element array
	                // representing [ falseExists, trueExists ]
	                if (type in set._items) {
	                    var bIdx = item ? 1 : 0;
	                    if (set._items[type][bIdx]) {
	                        return true;
	                    } else {
	                        if (shouldAdd) {
	                            set._items[type][bIdx] = true;
	                        }
	                        return false;
	                    }
	                } else {
	                    if (shouldAdd) {
	                        set._items[type] = item ? [
	                            false,
	                            true
	                        ] : [
	                            true,
	                            false
	                        ];
	                    }
	                    return false;
	                }
	            case 'function':
	                // compare functions for reference equality
	                if (set._nativeSet !== null) {
	                    if (shouldAdd) {
	                        prevSize = set._nativeSet.size;
	                        set._nativeSet.add(item);
	                        newSize = set._nativeSet.size;
	                        return newSize > prevSize;
	                    } else {
	                        return set._nativeSet.has(item);
	                    }
	                } else {
	                    if (!(type in set._items)) {
	                        if (shouldAdd) {
	                            set._items[type] = [item];
	                        }
	                        return false;
	                    }
	                    if (!_contains(item, set._items[type])) {
	                        if (shouldAdd) {
	                            set._items[type].push(item);
	                        }
	                        return false;
	                    }
	                    return true;
	                }
	            case 'undefined':
	                if (set._items[type]) {
	                    return true;
	                } else {
	                    if (shouldAdd) {
	                        set._items[type] = true;
	                    }
	                    return false;
	                }
	            case 'object':
	                if (item === null) {
	                    if (!set._items['null']) {
	                        if (shouldAdd) {
	                            set._items['null'] = true;
	                        }
	                        return false;
	                    }
	                    return true;
	                }
	            /* falls through */
	            default:
	                // reduce the search size of heterogeneous sets by creating buckets
	                // for each type.
	                type = Object.prototype.toString.call(item);
	                if (!(type in set._items)) {
	                    if (shouldAdd) {
	                        set._items[type] = [item];
	                    }
	                    return false;
	                }
	                // scan through all previously applied items
	                if (!_contains(item, set._items[type])) {
	                    if (shouldAdd) {
	                        set._items[type].push(item);
	                    }
	                    return false;
	                }
	                return true;
	            }
	        }
	        return _Set;
	    }();

	    /**
	     * A function wrapping calls to the two functions in an `&&` operation,
	     * returning the result of the first function if it is false-y and the result
	     * of the second function otherwise. Note that this is short-circuited,
	     * meaning that the second function will not be invoked if the first returns a
	     * false-y value.
	     *
	     * In addition to functions, `R.both` also accepts any fantasy-land compatible
	     * applicative functor.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category Logic
	     * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
	     * @param {Function} f a predicate
	     * @param {Function} g another predicate
	     * @return {Function} a function that applies its arguments to `f` and `g` and `&&`s their outputs together.
	     * @see R.and
	     * @example
	     *
	     *      var gt10 = x => x > 10;
	     *      var even = x => x % 2 === 0;
	     *      var f = R.both(gt10, even);
	     *      f(100); //=> true
	     *      f(101); //=> false
	     */
	    var both = _curry2(function both(f, g) {
	        return _isFunction(f) ? function _both() {
	            return f.apply(this, arguments) && g.apply(this, arguments);
	        } : lift(and)(f, g);
	    });

	    /**
	     * Takes a function `f` and returns a function `g` such that:
	     *
	     *   - applying `g` to zero or more arguments will give __true__ if applying
	     *     the same arguments to `f` gives a logical __false__ value; and
	     *
	     *   - applying `g` to zero or more arguments will give __false__ if applying
	     *     the same arguments to `f` gives a logical __true__ value.
	     *
	     * `R.complement` will work on all other functors as well.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category Logic
	     * @sig (*... -> *) -> (*... -> Boolean)
	     * @param {Function} f
	     * @return {Function}
	     * @see R.not
	     * @example
	     *
	     *      var isEven = n => n % 2 === 0;
	     *      var isOdd = R.complement(isEven);
	     *      isOdd(21); //=> true
	     *      isOdd(42); //=> false
	     */
	    var complement = lift(not);

	    /**
	     * Returns the result of concatenating the given lists or strings.
	     *
	     * Note: `R.concat` expects both arguments to be of the same type,
	     * unlike the native `Array.prototype.concat` method. It will throw
	     * an error if you `concat` an Array with a non-Array value.
	     *
	     * Dispatches to the `concat` method of the first argument, if present.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a] -> [a]
	     * @sig String -> String -> String
	     * @param {Array|String} a
	     * @param {Array|String} b
	     * @return {Array|String}
	     *
	     * @example
	     *
	     *      R.concat([], []); //=> []
	     *      R.concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	     *      R.concat('ABC', 'DEF'); // 'ABCDEF'
	     */
	    var concat = _curry2(function concat(a, b) {
	        if (a == null || !_isFunction(a.concat)) {
	            throw new TypeError(toString(a) + ' does not have a method named "concat"');
	        }
	        if (_isArray(a) && !_isArray(b)) {
	            throw new TypeError(toString(b) + ' is not an array');
	        }
	        return a.concat(b);
	    });

	    /**
	     * A function wrapping calls to the two functions in an `||` operation,
	     * returning the result of the first function if it is truth-y and the result
	     * of the second function otherwise. Note that this is short-circuited,
	     * meaning that the second function will not be invoked if the first returns a
	     * truth-y value.
	     *
	     * In addition to functions, `R.either` also accepts any fantasy-land compatible
	     * applicative functor.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category Logic
	     * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
	     * @param {Function} f a predicate
	     * @param {Function} g another predicate
	     * @return {Function} a function that applies its arguments to `f` and `g` and `||`s their outputs together.
	     * @see R.or
	     * @example
	     *
	     *      var gt10 = x => x > 10;
	     *      var even = x => x % 2 === 0;
	     *      var f = R.either(gt10, even);
	     *      f(101); //=> true
	     *      f(8); //=> true
	     */
	    var either = _curry2(function either(f, g) {
	        return _isFunction(f) ? function _either() {
	            return f.apply(this, arguments) || g.apply(this, arguments);
	        } : lift(or)(f, g);
	    });

	    /**
	     * Turns a named method with a specified arity into a function that can be
	     * called directly supplied with arguments and a target object.
	     *
	     * The returned function is curried and accepts `arity + 1` parameters where
	     * the final parameter is the target object.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig Number -> String -> (a -> b -> ... -> n -> Object -> *)
	     * @param {Number} arity Number of arguments the returned function should take
	     *        before the target object.
	     * @param {String} method Name of the method to call.
	     * @return {Function} A new curried function.
	     * @example
	     *
	     *      var sliceFrom = R.invoker(1, 'slice');
	     *      sliceFrom(6, 'abcdefghijklm'); //=> 'ghijklm'
	     *      var sliceFrom6 = R.invoker(2, 'slice')(6);
	     *      sliceFrom6(8, 'abcdefghijklm'); //=> 'gh'
	     */
	    var invoker = _curry2(function invoker(arity, method) {
	        return curryN(arity + 1, function () {
	            var target = arguments[arity];
	            if (target != null && _isFunction(target[method])) {
	                return target[method].apply(target, _slice(arguments, 0, arity));
	            }
	            throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
	        });
	    });

	    /**
	     * Returns a string made by inserting the `separator` between each element and
	     * concatenating all the elements into a single string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig String -> [a] -> String
	     * @param {Number|String} separator The string used to separate the elements.
	     * @param {Array} xs The elements to join into a string.
	     * @return {String} str The string made by concatenating `xs` with `separator`.
	     * @see R.split
	     * @example
	     *
	     *      var spacer = R.join(' ');
	     *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
	     *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
	     */
	    var join = invoker(1, 'join');

	    /**
	     * Creates a new function that, when invoked, caches the result of calling `fn`
	     * for a given argument set and returns the result. Subsequent calls to the
	     * memoized `fn` with the same argument set will not result in an additional
	     * call to `fn`; instead, the cached result for that set of arguments will be
	     * returned.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Function
	     * @sig (*... -> a) -> (*... -> a)
	     * @param {Function} fn The function to memoize.
	     * @return {Function} Memoized version of `fn`.
	     * @example
	     *
	     *      var count = 0;
	     *      var factorial = R.memoize(n => {
	     *        count += 1;
	     *        return R.product(R.range(1, n + 1));
	     *      });
	     *      factorial(5); //=> 120
	     *      factorial(5); //=> 120
	     *      factorial(5); //=> 120
	     *      count; //=> 1
	     */
	    var memoize = _curry1(function memoize(fn) {
	        var cache = {};
	        return _arity(fn.length, function () {
	            var key = toString(arguments);
	            if (!_has(key, cache)) {
	                cache[key] = fn.apply(this, arguments);
	            }
	            return cache[key];
	        });
	    });

	    /**
	     * Splits a string into an array of strings based on the given
	     * separator.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category String
	     * @sig (String | RegExp) -> String -> [String]
	     * @param {String|RegExp} sep The pattern.
	     * @param {String} str The string to separate into an array.
	     * @return {Array} The array of strings from `str` separated by `str`.
	     * @see R.join
	     * @example
	     *
	     *      var pathComponents = R.split('/');
	     *      R.tail(pathComponents('/usr/local/bin/node')); //=> ['usr', 'local', 'bin', 'node']
	     *
	     *      R.split('.', 'a.b.c.xyz.d'); //=> ['a', 'b', 'c', 'xyz', 'd']
	     */
	    var split = invoker(1, 'split');

	    /**
	     * Finds the set (i.e. no duplicates) of all elements contained in the first or
	     * second list, but not both.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` or `list2`, but not both.
	     * @see R.symmetricDifferenceWith, R.difference, R.differenceWith
	     * @example
	     *
	     *      R.symmetricDifference([1,2,3,4], [7,6,5,4,3]); //=> [1,2,7,6,5]
	     *      R.symmetricDifference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5,1,2]
	     */
	    var symmetricDifference = _curry2(function symmetricDifference(list1, list2) {
	        return concat(difference(list1, list2), difference(list2, list1));
	    });

	    /**
	     * Finds the set (i.e. no duplicates) of all elements contained in the first or
	     * second list, but not both. Duplication is determined according to the value
	     * returned by applying the supplied predicate to two list elements.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.19.0
	     * @category Relation
	     * @sig (a -> a -> Boolean) -> [a] -> [a] -> [a]
	     * @param {Function} pred A predicate used to test whether two items are equal.
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The elements in `list1` or `list2`, but not both.
	     * @see R.symmetricDifference, R.difference, R.differenceWith
	     * @example
	     *
	     *      var eqA = R.eqBy(R.prop('a'));
	     *      var l1 = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
	     *      var l2 = [{a: 3}, {a: 4}, {a: 5}, {a: 6}];
	     *      R.symmetricDifferenceWith(eqA, l1, l2); //=> [{a: 1}, {a: 2}, {a: 5}, {a: 6}]
	     */
	    var symmetricDifferenceWith = _curry3(function symmetricDifferenceWith(pred, list1, list2) {
	        return concat(differenceWith(pred, list1, list2), differenceWith(pred, list2, list1));
	    });

	    /**
	     * Determines whether a given string matches a given regular expression.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.12.0
	     * @category String
	     * @sig RegExp -> String -> Boolean
	     * @param {RegExp} pattern
	     * @param {String} str
	     * @return {Boolean}
	     * @see R.match
	     * @example
	     *
	     *      R.test(/^x/, 'xyz'); //=> true
	     *      R.test(/^y/, 'xyz'); //=> false
	     */
	    var test = _curry2(function test(pattern, str) {
	        if (!_isRegExp(pattern)) {
	            throw new TypeError('\u2018test\u2019 requires a value of type RegExp as its first argument; received ' + toString(pattern));
	        }
	        return _cloneRegExp(pattern).test(str);
	    });

	    /**
	     * The lower case version of a string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category String
	     * @sig String -> String
	     * @param {String} str The string to lower case.
	     * @return {String} The lower case version of `str`.
	     * @see R.toUpper
	     * @example
	     *
	     *      R.toLower('XYZ'); //=> 'xyz'
	     */
	    var toLower = invoker(0, 'toLowerCase');

	    /**
	     * The upper case version of a string.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.9.0
	     * @category String
	     * @sig String -> String
	     * @param {String} str The string to upper case.
	     * @return {String} The upper case version of `str`.
	     * @see R.toLower
	     * @example
	     *
	     *      R.toUpper('abc'); //=> 'ABC'
	     */
	    var toUpper = invoker(0, 'toUpperCase');

	    /**
	     * Returns a new list containing only one copy of each element in the original
	     * list, based upon the value returned by applying the supplied function to
	     * each list element. Prefers the first item if the supplied function produces
	     * the same value on two items. `R.equals` is used for comparison.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.16.0
	     * @category List
	     * @sig (a -> b) -> [a] -> [a]
	     * @param {Function} fn A function used to produce a value to use during comparisons.
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of unique items.
	     * @example
	     *
	     *      R.uniqBy(Math.abs, [-1, -5, 2, 10, 1, 2]); //=> [-1, -5, 2, 10]
	     */
	    var uniqBy = _curry2(function uniqBy(fn, list) {
	        var set = new _Set();
	        var result = [];
	        var idx = 0;
	        var appliedItem, item;
	        while (idx < list.length) {
	            item = list[idx];
	            appliedItem = fn(item);
	            if (set.add(appliedItem)) {
	                result.push(item);
	            }
	            idx += 1;
	        }
	        return result;
	    });

	    /**
	     * Returns a new list containing only one copy of each element in the original
	     * list. `R.equals` is used to determine equality.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category List
	     * @sig [a] -> [a]
	     * @param {Array} list The array to consider.
	     * @return {Array} The list of unique items.
	     * @example
	     *
	     *      R.uniq([1, 1, 2, 1]); //=> [1, 2]
	     *      R.uniq([1, '1']);     //=> [1, '1']
	     *      R.uniq([[42], [42]]); //=> [[42]]
	     */
	    var uniq = uniqBy(identity);

	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of those
	     * elements common to both lists.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} list1 The first list.
	     * @param {Array} list2 The second list.
	     * @return {Array} The list of elements found in both `list1` and `list2`.
	     * @see R.intersectionWith
	     * @example
	     *
	     *      R.intersection([1,2,3,4], [7,6,5,4,3]); //=> [4, 3]
	     */
	    var intersection = _curry2(function intersection(list1, list2) {
	        var lookupList, filteredList;
	        if (list1.length > list2.length) {
	            lookupList = list1;
	            filteredList = list2;
	        } else {
	            lookupList = list2;
	            filteredList = list1;
	        }
	        return uniq(_filter(flip(_contains)(lookupList), filteredList));
	    });

	    /**
	     * Combines two lists into a set (i.e. no duplicates) composed of the elements
	     * of each list.
	     *
	     * @func
	     * @memberOf R
	     * @since v0.1.0
	     * @category Relation
	     * @sig [*] -> [*] -> [*]
	     * @param {Array} as The first list.
	     * @param {Array} bs The second list.
	     * @return {Array} The first and second lists concatenated, with
	     *         duplicates removed.
	     * @example
	     *
	     *      R.union([1, 2, 3], [2, 3, 4]); //=> [1, 2, 3, 4]
	     */
	    var union = _curry2(compose(uniq, _concat));

	    var R = {
	        F: F,
	        T: T,
	        __: __,
	        add: add,
	        addIndex: addIndex,
	        adjust: adjust,
	        all: all,
	        allPass: allPass,
	        always: always,
	        and: and,
	        any: any,
	        anyPass: anyPass,
	        ap: ap,
	        aperture: aperture,
	        append: append,
	        apply: apply,
	        applySpec: applySpec,
	        assoc: assoc,
	        assocPath: assocPath,
	        binary: binary,
	        bind: bind,
	        both: both,
	        call: call,
	        chain: chain,
	        clamp: clamp,
	        clone: clone,
	        comparator: comparator,
	        complement: complement,
	        compose: compose,
	        composeK: composeK,
	        composeP: composeP,
	        concat: concat,
	        cond: cond,
	        construct: construct,
	        constructN: constructN,
	        contains: contains,
	        converge: converge,
	        countBy: countBy,
	        curry: curry,
	        curryN: curryN,
	        dec: dec,
	        defaultTo: defaultTo,
	        difference: difference,
	        differenceWith: differenceWith,
	        dissoc: dissoc,
	        dissocPath: dissocPath,
	        divide: divide,
	        drop: drop,
	        dropLast: dropLast,
	        dropLastWhile: dropLastWhile,
	        dropRepeats: dropRepeats,
	        dropRepeatsWith: dropRepeatsWith,
	        dropWhile: dropWhile,
	        either: either,
	        empty: empty,
	        eqBy: eqBy,
	        eqProps: eqProps,
	        equals: equals,
	        evolve: evolve,
	        filter: filter,
	        find: find,
	        findIndex: findIndex,
	        findLast: findLast,
	        findLastIndex: findLastIndex,
	        flatten: flatten,
	        flip: flip,
	        forEach: forEach,
	        fromPairs: fromPairs,
	        groupBy: groupBy,
	        groupWith: groupWith,
	        gt: gt,
	        gte: gte,
	        has: has,
	        hasIn: hasIn,
	        head: head,
	        identical: identical,
	        identity: identity,
	        ifElse: ifElse,
	        inc: inc,
	        indexBy: indexBy,
	        indexOf: indexOf,
	        init: init,
	        insert: insert,
	        insertAll: insertAll,
	        intersection: intersection,
	        intersectionWith: intersectionWith,
	        intersperse: intersperse,
	        into: into,
	        invert: invert,
	        invertObj: invertObj,
	        invoker: invoker,
	        is: is,
	        isArrayLike: isArrayLike,
	        isEmpty: isEmpty,
	        isNil: isNil,
	        join: join,
	        juxt: juxt,
	        keys: keys,
	        keysIn: keysIn,
	        last: last,
	        lastIndexOf: lastIndexOf,
	        length: length,
	        lens: lens,
	        lensIndex: lensIndex,
	        lensPath: lensPath,
	        lensProp: lensProp,
	        lift: lift,
	        liftN: liftN,
	        lt: lt,
	        lte: lte,
	        map: map,
	        mapAccum: mapAccum,
	        mapAccumRight: mapAccumRight,
	        mapObjIndexed: mapObjIndexed,
	        match: match,
	        mathMod: mathMod,
	        max: max,
	        maxBy: maxBy,
	        mean: mean,
	        median: median,
	        memoize: memoize,
	        merge: merge,
	        mergeAll: mergeAll,
	        mergeWith: mergeWith,
	        mergeWithKey: mergeWithKey,
	        min: min,
	        minBy: minBy,
	        modulo: modulo,
	        multiply: multiply,
	        nAry: nAry,
	        negate: negate,
	        none: none,
	        not: not,
	        nth: nth,
	        nthArg: nthArg,
	        objOf: objOf,
	        of: of,
	        omit: omit,
	        once: once,
	        or: or,
	        over: over,
	        pair: pair,
	        partial: partial,
	        partialRight: partialRight,
	        partition: partition,
	        path: path,
	        pathEq: pathEq,
	        pathOr: pathOr,
	        pathSatisfies: pathSatisfies,
	        pick: pick,
	        pickAll: pickAll,
	        pickBy: pickBy,
	        pipe: pipe,
	        pipeK: pipeK,
	        pipeP: pipeP,
	        pluck: pluck,
	        prepend: prepend,
	        product: product,
	        project: project,
	        prop: prop,
	        propEq: propEq,
	        propIs: propIs,
	        propOr: propOr,
	        propSatisfies: propSatisfies,
	        props: props,
	        range: range,
	        reduce: reduce,
	        reduceBy: reduceBy,
	        reduceRight: reduceRight,
	        reduceWhile: reduceWhile,
	        reduced: reduced,
	        reject: reject,
	        remove: remove,
	        repeat: repeat,
	        replace: replace,
	        reverse: reverse,
	        scan: scan,
	        sequence: sequence,
	        set: set,
	        slice: slice,
	        sort: sort,
	        sortBy: sortBy,
	        split: split,
	        splitAt: splitAt,
	        splitEvery: splitEvery,
	        splitWhen: splitWhen,
	        subtract: subtract,
	        sum: sum,
	        symmetricDifference: symmetricDifference,
	        symmetricDifferenceWith: symmetricDifferenceWith,
	        tail: tail,
	        take: take,
	        takeLast: takeLast,
	        takeLastWhile: takeLastWhile,
	        takeWhile: takeWhile,
	        tap: tap,
	        test: test,
	        times: times,
	        toLower: toLower,
	        toPairs: toPairs,
	        toPairsIn: toPairsIn,
	        toString: toString,
	        toUpper: toUpper,
	        transduce: transduce,
	        transpose: transpose,
	        traverse: traverse,
	        trim: trim,
	        tryCatch: tryCatch,
	        type: type,
	        unapply: unapply,
	        unary: unary,
	        uncurryN: uncurryN,
	        unfold: unfold,
	        union: union,
	        unionWith: unionWith,
	        uniq: uniq,
	        uniqBy: uniqBy,
	        uniqWith: uniqWith,
	        unless: unless,
	        unnest: unnest,
	        until: until,
	        update: update,
	        useWith: useWith,
	        values: values,
	        valuesIn: valuesIn,
	        view: view,
	        when: when,
	        where: where,
	        whereEq: whereEq,
	        without: without,
	        wrap: wrap,
	        xprod: xprod,
	        zip: zip,
	        zipObj: zipObj,
	        zipWith: zipWith
	    };
	  /* eslint-env amd */

	  /* TEST_ENTRY_POINT */

	  if (true) {
	    module.exports = R;
	  } else if (typeof define === 'function' && define.amd) {
	    define(function() { return R; });
	  } else {
	    this.R = R;
	  }

	}.call(this));


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	//     Monet.js 0.8.10

	//     (c) 2012-2016 Chris Myers
	//     Monet.js may be freely distributed under the MIT license.
	//     For all details and documentation:
	//     https://cwmyers.github.com/monet.js


	(function(root, factory) {
	    if (true) {
	        module.exports = factory(root);
	    } else if (typeof define === 'function' && define.amd) {
	        define(factory);
	    } else {
	        root.curry = factory(root);
	    }
	}(this, function(root) {
	    "use strict";

	    var curry = function (fn, args) {
	      return function () {
	        var args1 = args.append(List.fromArray(Array.prototype.slice.call(arguments)));
	        return args1.size() >= fn.length ? fn.apply(this, args1.toArray().slice(0, args1.size())) : curry(fn, args1);
	      };
	    };

	    var isFunction = function (f) {
	        return !!(f && f.constructor && f.call && f.apply)
	    };

	    var idFunction = function (value) {
	        return value
	    };
	    var trueFunction = function () {
	        return true
	    };
	    var falseFunction = function () {
	        return false
	    };

	    var Monet = root.Monet = {}

	    var swap = Monet.swap = function (f) {
	        return function (a, b) {
	            return f(b, a)
	        }
	    }

	    var map = function (fn) {
	        return this.bind(this.of.compose(fn))
	    }

	    var apply2 = Monet.apply2 = function(a1, a2, f) {
	        return a2.ap(a1.map(f.curry()))
	    }

	    Monet.curry = function (fn) {
	        return curry(fn, Nil);
	    }

	    Function.prototype.curry = function () {
	        return curry(this, Nil)
	    }

	    // List monad

	    var list;
	    var List = list = root.List = function (head, tail) {
	        return new List.fn.init(head, tail)
	    }

	    var listMap = function (fn, l) {
	        return listMapC(fn, l).run()
	    }

	    var listMapC = function (fn, l) {
	        return l.isNil ? Return(l) : Suspend(function () {
	            return listMapC(fn, l.tail())
	        }).map(cons.curry()(fn(l.head())))
	    }

	    var listEach = function (effectFn, l) {
	        if (!l.isNil) {
	            effectFn(l.head())
	            listEach(effectFn, l.tail())
	        }
	    }

	    var foldLeft = function (fn, acc, l) {
	        function fL(acc, l) {
	            return l.isNil ?
	                Return(acc) :
	                Suspend(function () {
	                    return fL(fn(acc, l.head()), l.tail())
	                })
	        }

	        return fL(acc, l).run()
	    }

	    var foldRight = function (fn, l, acc) {
	        function fR(l, acc) {
	            return l.isNil ?
	                Return(acc) :
	                Suspend(function () {
	                    return fR(l.tail(), acc)
	                }).map(function (acc1) {
	                        return fn(l.head(), acc1)
	                    })
	        }

	        return fR(l, acc).run()
	    }


	    var append = function (list1, list2) {
	        function append1(list1, list2) {
	            return list1.isNil ?
	                Return(list2) :
	                Suspend(function () {
	                    return append1(list1.tail(), list2).map(function (list) {
	                        return list.cons(list1.head())
	                    })
	                })
	        }

	        return append1(list1, list2).run()
	    }

	    var sequence = function (list, type) {
	        return list.foldRight(type.of(Nil))(type.map2(cons))
	    }

	    var sequenceValidation = function (list) {
	        return list.foldLeft(Success(Nil))(function (acc, a) {
	            return  acc.ap(a.map(function (v) {
	                return function (t) {
	                    return cons(v, t)
	                }
	            }))
	        }).map(listReverse)
	    }

	    var listReverse = function (list) {
	        return list.foldLeft(Nil)(swap(cons))
	    }

	    var listFilter = function(list, fn) {
	      return list.foldRight(Nil)(function(a, acc) {
	        return fn(a) ? cons(a,acc): acc
	      })
	    }

	    var listAp = function(list1, list2) {
	        return list1.bind(function(x) {
	          return list2.map(function(f) {
	                return f(x)
	            })
	        })
	    }

	    var cons = function (head, tail) {
	        return tail.cons(head)
	    }


	    List.fn = List.prototype = {
	        init: function (head, tail) {
	            if (head == null) {
	                this.isNil = true
	                this.size_ = 0
	            } else {
	                this.isNil = false
	                this.head_ = head
	                this.tail_ = tail == null ? Nil : tail
	                this.size_ = tail == null ? 0 : tail.size() + 1
	            }
	        },
	        of: function (value) {
	            return new List(value)
	        },
	        size: function () {
	            return this.size_
	        },
	        cons: function (head) {
	            return List(head, this)
	        },
	        snoc: function (element) {
	            return this.concat(List(element))
	        },
	        map: function (fn) {
	            return listMap(fn, this)
	        },
	        toArray: function () {
	            return foldLeft(function (acc, e) {
	                acc.push(e)
	                return acc
	            }, [], this)
	        },
	        foldLeft: function (initialValue) {
	            var self = this
	            return function (fn) {
	                return foldLeft(fn, initialValue, self)
	            }
	        },
	        foldRight: function (initialValue) {
	            var self = this
	            return function (fn) {
	                return foldRight(fn, self, initialValue)
	            }
	        },
	        append: function (list2) {
	            return append(this, list2)
	        },
	        filter: function(fn) {
	          return listFilter(this, fn)
	        },
	        flatten: function () {
	            return foldRight(append, this, Nil)
	        },
	        flattenMaybe: function () {
	            return this.flatMap(Maybe.toList)
	        },
	        reverse: function () {
	            return listReverse(this)
	        },
	        bind: function (fn) {
	            return this.map(fn).flatten()
	        },
	        each: function (effectFn) {
	            listEach(effectFn, this)
	        },
	        // transforms a list of Maybes to a Maybe list
	        sequenceMaybe: function () {
	            return sequence(this, Maybe)
	        },
	        sequenceValidation: function () {
	            return sequenceValidation(this)
	        },
	        sequenceEither: function () {
	            return sequence(this, Either)
	        },
	        sequenceIO: function () {
	            return sequence(this, IO)
	        },
	        sequenceReader: function () {
	            return sequence(this, Reader)
	        },
	        sequence: function (monadType) {
	            return sequence(this, monadType)
	        },
	        head: function () {
	            return this.head_
	        },
	        headMaybe: function () {
	            return this.isNil ? None() : Some(this.head_)
	        },
	        tail: function () {
	            return this.isNil ? Nil : this.tail_
	        },
	        tails: function () {
	            return this.isNil ? List(Nil, Nil) : this.tail().tails().cons(this)
	        },
	        ap: function(list) {
	            return listAp(this, list)
	        },
	        isNEL: falseFunction
	    }

	    List.fn.init.prototype = List.fn;
	    var Nil = root.Nil = new List.fn.init()

	    // Aliases

	    List.prototype.empty = function () {
	        return Nil
	    }


	    List.fromArray = function (array) {
	        var l = Nil
	        for (var i = array.length; i--; i <= 0) {
	            l = l.cons(array[i])
	        }
	        return l

	    }


	    List.of = function (a) {
	        return new List(a, Nil)
	    }

	    /*
	     * Non-Empty List monad
	     * This is also a comonad because there exists the implementation of extract(copure), which is just head
	     * and cobind and cojoin.
	     *
	     */

	    var NonEmptyList;
	    var NEL = root.NEL = NonEmptyList = root.NonEmptyList = function (head, tail) {
	        if (head == null) {
	            throw "Cannot create an empty Non-Empty List."
	        }
	        return new NEL.fn.init(head, tail)
	    }

	    NEL.of = function(a) {
	      return NEL(a, Nil)
	    }

	    NEL.fn = NEL.prototype = {
	        init: function (head, tail) {
	            if (head == null) {
	                this.isNil = true
	                this.size_ = 0
	            } else {
	                this.isNil = false
	                this.head_ = head
	                this.tail_ = tail == null ? Nil : tail
	                this.size_ = this.tail_.size() + 1
	            }
	        },
	        map: function (fn) {
	            return NEL(fn(this.head_), listMap(fn, this.tail_))
	        },

	        bind: function (fn) {
	            var p = fn(this.head_)
	            if (!p.isNEL()) {
	                throw "function must return a NonEmptyList."
	            }
	            var list = this.tail().foldLeft(Nil.snoc(p.head()).append(p.tail()))(function (acc, e) {
	                var list2 = fn(e).toList()
	                return acc.snoc(list2.head()).append(list2.tail())
	            })

	            return new NEL(list.head(), list.tail())
	        },

	        head: function () {
	            return this.head_
	        },

	        tail: function () {
	            return this.tail_
	        },
	        //NEL[A] -> NEL[NEL[A]]
	        tails: function () {
	            var listsOfNels = this.toList().tails().map(NEL.fromList).flattenMaybe();
	            return  NEL(listsOfNels.head(), listsOfNels.tail())
	        },
	        toList: function () {
	            return List(this.head_, this.tail_)
	        },
	        reverse: function () {
	            if (this.tail().isNil) {
	                return this
	            } else {
	                var reversedTail = this.tail().reverse()
	                return NEL(reversedTail.head(), reversedTail.tail().append(List(this.head())))
	            }
	        },
	        foldLeft: function (initialValue) {
	            return this.toList().foldLeft(initialValue)
	        },
	        foldRight: function (initialValue) {
	            return this.toList().foldRight(initialValue)
	        },
	        reduceLeft: function (fn) {
	          return this.tail().foldLeft(this.head())(fn)
	        },
	        filter: function (fn) {
	            return listFilter(this.toList(), fn)
	        },
	        append: function (list2) {
	            return NEL.fromList(this.toList().append(list2.toList())).some()
	        },
	        // NEL[A] -> (NEL[A] -> B) -> NEL[B]
	        cobind: function (fn) {
	            return this.cojoin().map(fn)
	        },
	        size: function () {
	            return this.size_
	        },
	        isNEL: trueFunction
	    }

	    NEL.fromList = function (list) {
	        return list.isNil ? None() : Some(NEL(list.head(), list.tail()))
	    }

	    NEL.fn.init.prototype = NEL.fn;
	    NEL.prototype.toArray = List.prototype.toArray
	    NEL.prototype.extract = NEL.prototype.copure = NEL.prototype.head
	    NEL.prototype.cojoin = NEL.prototype.tails
	    NEL.prototype.coflatMap = NEL.prototype.mapTails = NEL.prototype.cobind
	    NEL.prototype.ap = List.prototype.ap


	    /* Maybe Monad */

	    var Maybe = root.Maybe = {}

	    Maybe.fromNull = function (val) {
	        return val == null ? Maybe.None() : Maybe.Some(val)
	    };

	    Maybe.of = function (a) {
	        return Some(a)
	    }

	    var Just;
	    var Some = Just = Maybe.Just = Maybe.Some = root.Some = root.Just = function (val) {
	        return new Maybe.fn.init(true, val)
	    };

	    var Nothing;
	    var None = Nothing = Maybe.Nothing = Maybe.None = root.None = function () {
	        return new Maybe.fn.init(false, null)
	    };

	    Maybe.toList = function (maybe) {
	        return maybe.toList()
	    }

	    Maybe.fn = Maybe.prototype = {
	        init: function (isValue, val) {
	            this.isValue = isValue
	            if (val == null && isValue) {
	                throw "Illegal state exception"
	            }
	            this.val = val
	        },
	        isSome: function () {
	            return this.isValue
	        },
	        isNone: function () {
	            return !this.isSome()
	        },
	        bind: function (bindFn) {
	            return this.isValue ? bindFn(this.val) : this
	        },
	        some: function () {
	            if (this.isValue) {
	                return this.val
	            } else {
	                throw "Illegal state exception"
	            }
	        },
	        orSome: function (otherValue) {
	            return this.isValue ? this.val : otherValue
	        },
	        orElse: function (maybe) {
	            return this.isValue ? this : maybe
	        },
	        ap: function (maybeWithFunction) {
	            var value = this.val
	            return this.isValue ? maybeWithFunction.map(function (fn) {
	                return fn(value)
	            }) : this
	        },

	        toList: function () {
	            return this.map(List).orSome(Nil)
	        },
	        toEither: function (failVal) {
	            return this.isSome() ? Right(this.val) : Left(failVal)
	        },
	        toValidation: function (failVal) {
	            return this.isSome() ? Success(this.val) : Fail(failVal)
	        },
	        fold: function (defaultValue) {
	            var self = this
	            return function (fn) {
	                return self.isSome() ? fn(self.val) : defaultValue
	            }
	        },
	        cata: function (none, some) {
	            return this.isSome() ? some(this.val) : none()
	        },
	        filter: function(fn) {
	          var self = this
	          return self.flatMap(function(a) {
	            return fn(a) ? self : None()
	          })
	        }
	    };

	    // aliases
	    Maybe.prototype.orJust = Maybe.prototype.orSome
	    Maybe.prototype.just = Maybe.prototype.some
	    Maybe.prototype.isJust = Maybe.prototype.isSome
	    Maybe.prototype.isNothing = Maybe.prototype.isNone

	    Maybe.fn.init.prototype = Maybe.fn

	    var Validation = root.Validation = {};

	    var Success = Validation.Success = Validation.success = root.Success = function (val) {
	        return new Validation.fn.init(val, true)
	    }

	    var Fail = Validation.Fail = Validation.fail = root.Fail = function (error) {
	        return new Validation.fn.init(error, false)
	    }

	    Validation.of = function (v) {
	        return Success(v)
	    }

	    Validation.fn = Validation.prototype = {
	        init: function (val, success) {
	            this.val = val
	            this.isSuccessValue = success
	        },
	        success: function () {
	            if (this.isSuccess())
	                return this.val;
	            else
	                throw 'Illegal state. Cannot call success() on a Validation.fail'
	        },
	        isSuccess: function () {
	            return this.isSuccessValue
	        },
	        isFail: function () {
	            return !this.isSuccessValue
	        },
	        fail: function () {
	            if (this.isSuccess())
	                throw 'Illegal state. Cannot call fail() on a Validation.success'
	            else
	                return this.val
	        },
	        bind: function (fn) {
	            return this.isSuccess() ? fn(this.val) : this
	        },
	        ap: function (validationWithFn) {
	            var value = this.val
	            return this.isSuccess() ?
	                validationWithFn.map(function (fn) {
	                    return fn(value);
	                })
	                :
	                (validationWithFn.isFail() ?
	                    Validation.Fail(Semigroup.append(value, validationWithFn.fail()))
	                    : this)
	        },
	        acc: function () {
	            var x = function () {
	                return x
	            }
	            return this.isSuccessValue ? Validation.success(x) : this
	        },
	        cata: function (fail, success) {
	            return this.isSuccessValue ?
	                success(this.val)
	                : fail(this.val)
	        },
	        failMap: function (fn) {
	            return this.isFail() ? Fail(fn(this.val)) : this
	        },
	        bimap: function (fail, success) {
	            return this.isSuccessValue ? this.map(success) : this.failMap(fail)
	        },
	        toMaybe: function () {
	            return this.isSuccess() ? Some(this.val) : None()
	        },
	        toEither: function () {
	            return (this.isSuccess() ? Right : Left)(this.val)
	        }
	    };

	    Validation.fn.init.prototype = Validation.fn;


	    var Semigroup = root.Semigroup = {}

	    Semigroup.append = function (a, b) {
	        if (a instanceof Array) {
	            return a.concat(b)
	        }
	        if (typeof a === "string") {
	            return a + b
	        }
	        if (isFunction(a.concat)) {
	            return a.concat(b)
	        }
	        throw "Couldn't find a semigroup appender in the environment, please specify your own append function"
	    }

	    var monadT, monadTransformer, MonadTransformer;
	    var MonadT = monadT = monadTransformer = MonadTransformer = root.monadTransformer = root.MonadT = root.monadT = function (monad) {
	        return new MonadT.fn.init(monad)
	    }

	    MonadT.of = function (m) {
	        return MonadT(m)
	    }

	    MonadT.fn = MonadT.prototype = {
	        init: function (monad) {
	            this.monad = monad
	        },
	        map: function (fn) {
	            return monadT(this.monad.map(function (v) {
	                return v.map(fn)
	            }))
	        },
	        bind: function (fn) {
	            return monadT(this.monad.map(function (v) {
	                return v.flatMap(fn)
	            }))
	        },
	        ap: function (monadWithFn) {
	            return monadT(this.monad.flatMap(function (v) {
	                return monadWithFn.perform().map(function (v2) {
	                    return v.ap(v2)
	                })
	            }))
	        },
	        perform: function () {
	            return this.monad;
	        }
	    }

	    MonadT.fn.init.prototype = MonadT.fn;

	    var io;
	    var IO = io = root.IO = root.io = function (effectFn) {
	        return new IO.fn.init(effectFn)
	    }

	    IO.of = function (a) {
	        return IO(function() {
	          return a
	        })
	    }

	    IO.fn = IO.prototype = {
	        init: function (effectFn) {
	            if (!isFunction(effectFn))
	                throw "IO requires a function"
	            this.effectFn = effectFn;
	        },
	        map: function (fn) {
	            var self = this;
	            return IO(function () {
	                return fn(self.effectFn())
	            })
	        },
	        bind: function (fn) {
	            var self = this
	            return IO(function () {
	                return fn(self.effectFn()).run()
	            });
	        },
	        ap: function (ioWithFn) {
	            var self = this
	            return ioWithFn.map(function (fn) {
	                return fn(self.effectFn())
	            })
	        },
	        run: function () {
	            return this.effectFn()
	        }
	    }

	    IO.fn.init.prototype = IO.fn;

	    IO.prototype.perform = IO.prototype.performUnsafeIO = IO.prototype.run

	    /* Either Monad */

	    var Either = root.Either = {}

	    Either.of = function (a) {
	        return Right(a)
	    }

	    var Right = Either.Right = root.Right = function (val) {
	        return new Either.fn.init(val, true)
	    };
	    var Left = Either.Left = root.Left = function (val) {
	        return new Either.fn.init(val, false)
	    };

	    Either.fn = Either.prototype = {
	        init: function (val, isRightValue) {
	            this.isRightValue = isRightValue
	            this.value = val
	        },
	        bind: function (fn) {
	            return this.isRightValue ? fn(this.value) : this
	        },
	        ap: function (eitherWithFn) {
	            var self = this
	            return this.isRightValue ? eitherWithFn.map(function (fn) {
	                return fn(self.value)
	            }) : this
	        },
	        leftMap: function (fn) {
	            return this.isLeft() ? Left(fn(this.value)) : this
	        },
	        isRight: function () {
	            return this.isRightValue
	        },
	        isLeft: function () {
	            return !this.isRight()
	        },
	        right: function () {
	            if (this.isRightValue) {
	                return this.value
	            } else {
	                throw "Illegal state. Cannot call right() on a Either.left"
	            }
	        },
	        left: function () {
	            if (this.isRightValue) {
	                throw "Illegal state. Cannot call left() on a Either.right"
	            } else {
	                return this.value
	            }
	        },
	        cata: function (leftFn, rightFn) {
	            return this.isRightValue ? rightFn(this.value) : leftFn(this.value)
	        },
	        bimap: function (leftFn, rightFn) {
	            return this.isRightValue ? this.map(rightFn) : this.leftMap(leftFn)
	        },
	        toMaybe: function () {
	            return this.isRight() ? Some(this.value) : None()
	        },
	        toValidation: function () {
	            return this.isRight() ? Success(this.value) : Fail(this.value)
	        }
	    }

	    Either.fn.init.prototype = Either.fn;

	    var reader;
	    var Reader = reader = root.Reader = function (fn) {
	        return new Reader.fn.init(fn)
	    }

	    Reader.of = function (x) {
	      return Reader(function (_) {
	        return x
	      })
	    }

	    Reader.ask = function () {
	      return Reader(idFunction)
	    }

	    Reader.fn = Reader.prototype = {
	        init: function (fn) {
	            this.f = fn
	        },
	        run: function (config) {
	            return this.f(config)
	        },
	        bind: function (fn) {
	            var self = this
	            return Reader(function (config) {
	                return fn(self.run(config)).run(config)
	            })
	        },
	        ap: function (readerWithFn) {
	            var self = this
	            return readerWithFn.bind(function (fn) {
	                return Reader(function (config) {
	                    return fn(self.run(config))
	                })
	            })
	        },
	        map: function (fn) {
	            var self = this
	            return Reader(function (config) {
	                return fn(self.run(config))
	            })
	        },
	        local: function(fn) {
	            var self = this
	             return Reader(function(c) {
	                 return self.run(fn(c))
	            })
	        }
	    }

	    Reader.fn.init.prototype = Reader.fn;

	    var Free = root.Free = {}

	    var Suspend = Free.Suspend = root.Suspend = function (functor) {
	        return new Free.fn.init(functor, true)
	    }
	    var Return = Free.Return = root.Return = function (val) {
	        return new Free.fn.init(val, false)
	    }

	    Free.of = function (a) {
	        return Return(a)
	    }

	    Free.liftF = function (functor) {
	        return Suspend(functor.map(Return))
	    }

	    Free.fn = Free.prototype = {
	        init: function (val, isSuspend) {
	            this.isSuspend = isSuspend
	            if (isSuspend) {
	                this.functor = val
	            } else {
	                this.val = val
	            }
	        },
	        run: function () {
	            return this.go(function (f) {
	                return f()
	            })
	        },
	        bind: function (fn) {
	            return this.isSuspend ?
	                Suspend(
	                    this.functor.map(
	                        function (free) {
	                            return free.bind(fn)
	                        })) :
	                fn(this.val)
	        },
	        ap: function(ff) {
	          return this.bind(function(x) {
	            return ff.map(function(f) {
	              return f(x)
	            })
	          })
	        },

	        resume: function () {
	            return this.isSuspend ? Left(this.functor) : Right(this.val)
	        },

	        go1: function (f) {
	            function go2(t) {
	                return t.resume().cata(function (functor) {
	                    return go2(f(functor))
	                }, idFunction)
	            }

	            return go2(this)
	        },
	        go: function (f) {
	            var result = this.resume()
	            while (result.isLeft()) {
	                var next = f(result.left())
	                result = next.resume()
	            }

	            return result.right()
	        }

	    }

	    Free.fn.init.prototype = Free.fn;

	    var Identity = root.Identity = function (a) {
	        return new Identity.fn.init(a)
	    }

	    Identity.of = function (a) {
	        return new Identity(a)
	    }

	    Identity.fn = Identity.prototype = {
	        init: function (val) {
	            this.val = val
	        },
	        bind: function (fn) {
	            return fn(this.val);
	        },
	        get: function () {
	            return this.val
	        }
	    }

	    Identity.fn.init.prototype = Identity.fn;


	    Function.prototype.io = function () {
	        return IO(this)
	    }

	    Function.prototype.io1 = function () {
	        var f = this;
	        return function (x) {
	            return IO(
	                function () {
	                    return f(x)
	                }
	            )
	        }
	    }

	    Function.prototype.reader = function () {
	        var f = this
	        var wrapReader = function (fn, args) {
	            return function () {
	                var args1 = args.append(List.fromArray(Array.prototype.slice.call(arguments)));
	                var self = this
	                return args1.size() + 1 == fn.length ?
	                    Reader(function (c) {
	                        return fn.apply(self, (args1.append(List(c))).toArray())
	                    }) :
	                    wrapReader(fn, args1)
	            }
	        }
	        return wrapReader(f, Nil)
	    }

	    Function.prototype.compose = Function.prototype.o = function (g) {
	        var f = this
	        return function (x) {
	            return f(g(x))
	        }
	    }

	    Function.prototype.andThen = Function.prototype.map = function (g) {
	        var f = this
	        return function (x) {
	            return g(f(x))
	        }
	    }

	    function addAliases(type) {
	        type.prototype.flatMap = type.prototype.chain = type.prototype.bind
	        type.pure = type.unit = type.of
	        type.prototype.of = type.of
	        if (type.prototype.append != null) {
	            type.prototype.concat = type.prototype.append
	        }
	        type.prototype.point = type.prototype.pure = type.prototype.unit = type.prototype.of
	    }


	    // Wire up aliases
	    function addMonadOps(type) {
	        type.prototype.join = function () {
	            return this.flatMap(idFunction)
	        }

	        type.map2 = function (fn) {
	            return function (ma, mb) {
	                return ma.flatMap(function (a) {
	                    return mb.map(function (b) {
	                        return fn(a, b)
	                    })
	                })
	            }
	        }
	    }

	    function addFunctorOps(type) {
	        if (type.prototype.map == null) {
	            type.prototype.map = function (fn) {
	                return map.call(this, fn)
	            }
	        }
	    }

	    function addApplicativeOps(type) {
	        type.prototype.takeLeft = function (m) {
	            return apply2(this, m, function (a, b) {
	                return a
	            })
	        }

	        type.prototype.takeRight = function (m) {
	            return apply2(this, m, function (a, b) {
	                return b
	            })
	        }
	    }

	    function decorate(type) {
	        addAliases(type)
	        addMonadOps(type);
	        addFunctorOps(type);
	        addApplicativeOps(type);
	    }

	    decorate(MonadT)
	    decorate(Either)
	    decorate(Maybe)
	    decorate(IO)
	    decorate(NEL)
	    decorate(List)
	    decorate(Validation)
	    decorate(Reader)
	    decorate(Free)
	    decorate(Identity)

	    return root
	}));



/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);

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


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);
	const {getTerms, processText, replaceText} = __webpack_require__(6);
	const filterMadLib = __webpack_require__(9).filterMadLib;

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


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);
	const nlp_compromise = __webpack_require__(7);
	const {splitArray, applyCombine} = __webpack_require__(8);
	const {filterFunc, addField, filterMadLib} = __webpack_require__(9);

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


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var require;var require;/* nlp_compromise v6.5.3 MIT*/
	(function(f){if(true){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.nlp_compromise = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return require(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
	//these are common word shortenings used in the lexicon and sentence segmentation methods
	//there are all nouns, or at the least, belong beside one.
	'use strict';

	var honourifics = _dereq_('./honourifics'); //stored seperately, for 'noun.is_person()'

	//common abbreviations
	var main = ['arc', 'al', 'exp', 'rd', 'st', 'dist', 'mt', 'fy', 'pd', 'pl', 'plz', 'tce', 'llb', 'md', 'bl', 'ma', 'ba', 'lit', 'ex', 'eg', 'ie', 'circa', 'ca', 'cca', 'vs', 'etc', 'esp', 'ft', 'bc', 'ad'];

	//person titles like 'jr', (stored seperately)
	main = main.concat(honourifics);

	//org main
	var orgs = ['dept', 'univ', 'assn', 'bros', 'inc', 'ltd', 'co', 'corp',
	//proper nouns with exclamation marks
	'yahoo', 'joomla', 'jeopardy'];
	main = main.concat(orgs);

	//place main
	var places = ['ariz', 'cal', 'calif', 'col', 'colo', 'conn', 'fla', 'fl', 'ga', 'ida', 'ia', 'kan', 'kans', 'md', 'minn', 'neb', 'nebr', 'okla', 'penna', 'penn', 'pa', 'dak', 'tenn', 'tex', 'ut', 'vt', 'va', 'wis', 'wisc', 'wy', 'wyo', 'usafa', 'alta', 'ont', 'que', 'sask', 'ave', 'blvd', 'cl', 'ct', 'cres', 'hwy'];
	main = main.concat(places);

	//date abbrevs.
	//these are added seperately because they are not nouns
	var dates = ['jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];
	main = main.concat(dates);

	module.exports = {
	  abbreviations: main,
	  dates: dates,
	  orgs: orgs,
	  places: places
	};

	},{"./honourifics":9}],2:[function(_dereq_,module,exports){
	//adjectives that either aren't covered by rules, or have superlative/comparative forms
	//this list is the seed, from which various forms are conjugated
	'use strict';

	var fns = _dereq_('../fns');

	//suffix-index adjectives
	//  {cial:'cru,spe'} -> 'crucial', 'special'
	var compressed = {
	  erate: 'degen,delib,desp,lit,mod',
	  icial: 'artif,benef,off,superf',
	  ntial: 'esse,influe,pote,substa',
	  teful: 'gra,ha,tas,was',
	  stant: 'con,di,in,resi',
	  going: 'easy,fore,on,out',
	  hing: 'astonis,das,far-reac,refres,scat,screec,self-loat,soot',
	  eful: 'car,grac,peac,sham,us,veng',
	  ming: 'alar,cal,glea,unassu,unbeco,upco',
	  cial: 'commer,cru,finan,ra,so,spe',
	  tful: 'deligh,doub,fre,righ,though,wis',
	  ight: 'overn,overwe,r,sl,upt',
	  ated: 'antiqu,intoxic,sophistic,unregul,unrel',
	  rant: 'aber,exube,flag,igno,vib',
	  uent: 'congr,fl,freq,subseq',
	  rate: 'accu,elabo,i,sepa',
	  ific: 'horr,scient,spec,terr',
	  rary: 'arbit,contempo,cont,tempo',
	  ntic: 'authe,fra,giga,roma',
	  wing: 'harro,kno,left-,right-',
	  nant: 'domi,malig,preg,reso',
	  nent: 'emi,immi,perma,promi',
	  iant: 'brill,def,g,luxur',
	  ging: 'dama,encoura,han,lon',
	  iate: 'appropr,immed,inappropr,intermed',
	  rect: 'cor,e,incor,indi',
	  zing: 'agoni,ama,appeti,free',
	  ant: 'abund,arrog,eleg,extravag,exult,hesit,irrelev,miscre,nonchal,obeis,observ,pl,pleas,redund,relev,reluct,signific,vac,verd',
	  ing: 'absorb,car,coo,liv,lov,ly,menac,perplex,shock,stand,surpris,tell,unappeal,unconvinc,unend,unsuspect,vex,want',
	  ate: 'adequ,delic,fortun,inadequ,inn,intim,legitim,priv,sed,ultim',
	  ted: 'expec,impor,limi,spiri,talen,tes,unexpec,unpreceden',
	  ish: 'dan,fool,hell,lout,self,snobb,squeam,styl',
	  ary: 'dre,legend,necess,prim,sc,second,w,we',
	  ite: 'el,favor,fin,oppos,pet,pol,recond,tr',
	  ely: 'hom,lik,liv,lon,lov,tim,unlik',
	  ure: 'fut,insec,miniat,obsc,premat,sec,s',
	  tly: 'cos,ghas,ghos,nigh,sain,sprigh,unsigh',
	  dly: 'cowar,cud,frien,frien,kin,ma',
	  ble: 'a,dou,hum,nim,no,proba',
	  rly: 'bu,disorde,elde,hou,neighbo,yea',
	  ine: 'div,femin,genu,mascul,prist,rout',
	  ute: 'absol,ac,c,m,resol',
	  ped: 'cram,pum,stereoty,stri,war',
	  sed: 'clo,disea,distres,unsupervi,u',
	  lly: 'chi,hi,jo,si,sme',
	  per: 'dap,impro,pro,su,up',
	  ile: 'fert,host,juven,mob,volat',
	  led: 'detai,disgrunt,fab,paralle,troub',
	  ern: 'east,north,south,st,west',
	  ast: 'e,l,p,steadf',
	  ent: 'abs,appar,b,pres',
	  ged: 'dama,deran,jag,rag',
	  ded: 'crow,guar,retar,undeci',
	  est: 'b,dishon,hon,quick',
	  ial: 'colon,impart,init,part',
	  ter: 'bet,lat,ou,ut',
	  ond: 'bey,bl,sec,vagab',
	  ady: 'he,re,sh,ste',
	  eal: 'ether,id,r,surr',
	  ard: 'abo,awkw,stand,straightforw',
	  ior: 'jun,pr,sen,super',
	  ale: 'fem,m,upsc,wholes',
	  ed: 'advanc,belov,craz,determin,hallow,hook,inbr,justifi,nak,nuanc,sacr,subdu,unauthoriz,unrecogniz,wick',
	  ly: 'dai,deep,earth,gris,heaven,low,meas,melancho,month,oi,on,prick,seem,s,ug,unru,week,wi,woman',
	  al: 'actu,coloss,glob,illeg,leg,leth,liter,loy,ov,riv,roy,univers,usu',
	  dy: 'baw,bloo,clou,gau,gid,han,mol,moo,stur,ti,tren,unti,unwiel',
	  se: 'adver,den,diver,fal,immen,inten,obe,perver,preci,profu',
	  er: 'clev,form,inn,oth,ov,she,slend,somb,togeth,und',
	  id: 'afra,hum,langu,plac,rab,sord,splend,stup,torp',
	  re: 'awa,bizar,di,enti,macab,me,seve,since,spa',
	  en: 'barr,brok,crav,op,sudd,unev,unwritt,wood',
	  ic: 'alcohol,didact,gener,hispan,organ,publ,symbol',
	  ny: 'ma,pho,pu,shi,skin,ti,za',
	  st: 'again,mo,populi,raci,robu,uttermo',
	  ne: 'do,go,insa,obsce,picayu,sere',
	  nd: 'behi,bla,bli,profou,undergrou,wou',
	  le: 'midd,multip,sing,so,subt,who',
	  pt: 'abru,ade,a,bankru,corru,nondescri',
	  ty: 'faul,hef,lof,mea,sal,uppi',
	  sy: 'bu,chee,lou,no,ro',
	  ct: 'abstra,exa,imperfe,inta,perfe',
	  in: 'certa,highfalut,ma,tw,va',
	  et: 'discre,secr,sovi,ups,viol',
	  me: 'part-ti,pri,sa,supre,welco',
	  cy: 'boun,fan,i,jui,spi',
	  ry: 'fur,sor,tawd,wi,w',
	  te: 'comple,concre,obsole,remo',
	  ld: 'ba,bo,go,mi',
	  an: 'deadp,republic,t,urb',
	  ll: 'a,i,overa,sti',
	  ay: 'everyd,g,gr,ok',
	  or: 'indo,maj,min,outdo',
	  my: 'foa,gloo,roo,sli',
	  ck: 'ba,qua,si,sli',
	  rt: 'cove,expe,hu,ove',
	  ul: 'fo,gainf,helpf,painf'
	};

	var arr = ['ablaze', 'above', 'adult', 'ahead', 'aloof', 'arab', 'asleep', 'average', 'awake', 'backwards', 'bad', 'blank', 'bogus', 'bottom', 'brisk', 'cagey', 'chief', 'civil', 'common', 'complex', 'cozy', 'crisp', 'deaf', 'devout', 'difficult', 'downtown', 'due', 'dumb', 'eerie', 'evil', 'excess', 'extra', 'fake', 'far', 'faux', 'fierce ', 'fit', 'foreign', 'fun', 'good', 'goofy', 'gratis', 'grey', 'groovy', 'gross', 'half', 'huge', 'humdrum', 'inside', 'kaput',
	//  'lax', -> airports
	'left', 'less', 'level', 'lewd', 'magenta', 'makeshift', 'mammoth', 'medium', 'moot', 'naive', 'nearby', 'next', 'nonstop', 'north', 'offbeat', 'ok', 'outside', 'overwrought', 'premium', 'pricey', 'pro', 'quaint', 'random', 'rear', 'rebel', 'ritzy', 'rough', 'savvy', 'sexy', 'shut', 'shy', 'sleek', 'smug', 'solemn', 'south', 'stark', 'superb', 'taboo', 'teenage', 'top', 'tranquil', 'ultra', 'understood', 'unfair', 'unknown', 'upbeat', 'upstairs', 'vanilla', 'various', 'widespread', 'woozy', 'wrong', 'final', 'true', 'modern', 'notable'];

	module.exports = fns.expand_suffixes(arr, compressed);

	},{"../fns":23}],3:[function(_dereq_,module,exports){
	'use strict';

	//these are adjectives that can become comparative + superlative with out "most/more"
	//its a whitelist for conjugation
	//this data is shared between comparative/superlative methods
	module.exports = ['absurd', 'aggressive', 'alert', 'alive', 'awesome', 'beautiful', 'big', 'bitter', 'black', 'blue', 'bored', 'boring', 'brash', 'brave', 'brief', 'bright', 'broad', 'brown', 'calm', 'charming', 'cheap', 'clean', 'cold', 'cool', 'cruel', 'cute', 'damp', 'deep', 'dear', 'dead', 'dark', 'dirty', 'drunk', 'dull', 'eager', 'efficient', 'even', 'faint', 'fair', 'fanc', 'fast', 'fat', 'feeble', 'few', 'fierce', 'fine', 'flat', 'forgetful', 'frail', 'full', 'gentle', 'glib', 'great', 'green', 'gruesome', 'handsome', 'hard', 'harsh', 'high', 'hollow', 'hot', 'impolite', 'innocent', 'keen', 'kind', 'lame', 'lean', 'light', 'little', 'loose', 'long', 'loud', 'low', 'lush', 'macho', 'mean', 'meek', 'mellow', 'mundane', 'near', 'neat', 'new', 'nice', 'normal', 'odd', 'old', 'pale', 'pink', 'plain', 'poor', 'proud', 'purple', 'quick', 'rare', 'rapid', 'red', 'rich', 'ripe', 'rotten', 'round', 'rude', 'sad', 'safe', 'scarce', 'scared', 'shallow', 'sharp', 'short', 'shrill', 'simple', 'slim', 'slow', 'small', 'smart', 'smooth', 'soft', 'sore', 'sour', 'square', 'stale', 'steep', 'stiff', 'straight', 'strange', 'strong', 'sweet', 'swift', 'tall', 'tame', 'tart', 'tender', 'tense', 'thick', 'thin', 'tight', 'tough', 'vague', 'vast', 'vulgar', 'warm', 'weak', 'wet', 'white', 'wide', 'wild', 'wise', 'young', 'yellow', 'easy', 'narrow', 'late', 'early', 'soon', 'close', 'empty', 'dry', 'windy', 'noisy', 'thirsty', 'hungry', 'fresh', 'quiet', 'clear', 'heavy', 'happy', 'funny', 'lucky', 'pretty', 'important', 'interesting', 'attractive', 'dangerous', 'intellegent', 'pure', 'orange', 'large', 'firm', 'grand', 'formal', 'raw', 'weird', 'glad', 'mad', 'strict', 'tired', 'solid', 'extreme', 'mature', 'true', 'free', 'curly', 'angry'].reduce(function (h, s) {
	  h[s] = 'Adjective';
	  return h;
	}, {});

	},{}],4:[function(_dereq_,module,exports){
	'use strict';
	//some most-common iso-codes (most are too ambiguous)

	var shortForms = ['usd', 'cad', 'aud', 'gbp', 'krw', 'inr', 'hkd', 'dkk', 'cny', 'xaf', 'xof', 'eur', 'jpy',
	//currency symbols
	'€', '$', '¥', '£', 'лв', '₡', 'kn', 'kr', '¢', 'Ft', 'Rp', '﷼', '₭', 'ден', '₨', 'zł', 'lei', 'руб', '฿'];

	//some common, unambiguous currency names
	var longForms = ['denar', 'dobra', 'forint', 'kwanza', 'kyat', 'lempira', 'pound sterling', 'riel', 'yen', 'zloty',
	//colloquial currency names
	'dollar', 'cent', 'penny', 'dime', 'dinar', 'euro', 'lira', 'pound', 'pence', 'peso', 'baht', 'sterling', 'rouble', 'shekel', 'sheqel', 'yuan', 'franc', 'rupee', 'shilling', 'krona', 'dirham', 'bitcoin'];
	var irregularPlurals = {
	  yen: 'yen',
	  baht: 'baht',
	  riel: 'riel',
	  penny: 'pennies'
	};

	//add plural forms - 'euros'
	var l = longForms.length;
	for (var i = 0; i < l; i++) {
	  if (irregularPlurals[longForms[i]]) {
	    longForms.push(irregularPlurals[longForms[i]]);
	  } else {
	    longForms.push(longForms[i] + 's');
	  }
	}

	module.exports = shortForms.concat(longForms);

	},{}],5:[function(_dereq_,module,exports){
	'use strict';
	//terms that are 'Date' term

	var months = ['january', 'february',
	// "march",  //ambig
	'april',
	// "may",   //ambig
	'june', 'july', 'august', 'september', 'october', 'november', 'december', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'sept', 'sep'];
	var days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'mon', 'tues', 'wed', 'thurs', 'fri', 'sat', 'sun'];
	//add 'mondays'
	for (var i = 0; i <= 6; i++) {
	  days.push(days[i] + 's');
	}

	var durations = ['millisecond', 'second', 'minute', 'hour', 'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'decade'];
	//add their plurals
	var len = durations.length;
	for (var _i = 0; _i < len; _i++) {
	  durations.push(durations[_i] + 's');
	}
	durations.push('century');
	durations.push('centuries');

	var relative = ['yesterday', 'today', 'tomorrow', 'week', 'weekend', 'tonight'];

	module.exports = {
	  days: days,
	  months: months,
	  durations: durations,
	  relative: relative
	};

	},{}],6:[function(_dereq_,module,exports){
	'use strict';

	//adjectival forms of place names, as adjectives.
	module.exports = ['afghan', 'albanian', 'algerian', 'angolan', 'argentine', 'armenian', 'australian', 'aussie', 'austrian', 'bangladeshi', 'basque', // of Basque Country
	'belarusian', 'belgian', 'bolivian', 'bosnian', 'brazilian', 'bulgarian', 'cambodian', 'cameroonian', 'canadian', 'chadian', 'chilean', 'chinese', 'colombian', 'congolese', 'croatian', 'cuban', 'czech', 'dominican', 'danish', 'egyptian', 'british', 'estonian', 'ethiopian', 'ecuadorian', 'finnish', 'french', 'gambian', 'georgian', 'german', 'greek', 'ghanaian', 'guatemalan', 'haitian', 'hungarian', 'honduran', 'icelandic', 'indian', 'indonesian', 'iranian', 'iraqi', 'irish', 'israeli', 'italian', 'ivorian', // of Ivory Coast
	'jamaican', 'japanese', 'jordanian', 'kazakh', 'kenyan', 'korean', 'kuwaiti', 'lao', // of Laos
	'latvian', 'lebanese', 'liberian', 'libyan', 'lithuanian', 'namibian', 'malagasy', // of Madagascar
	'macedonian', 'malaysian', 'mexican', 'mongolian', 'moroccan', 'dutch', 'nicaraguan', 'nigerian', // of Nigeria
	'nigerien', // of Niger
	'norwegian', 'omani', 'panamanian', 'paraguayan', 'pakistani', 'palestinian', 'peruvian', 'philippine', 'filipino', 'polish', 'portuguese', 'qatari', 'romanian', 'russian', 'rwandan', 'samoan', 'saudi', 'scottish', 'senegalese', 'serbian', 'singaporean', 'slovak', 'somalian', 'sudanese', 'swedish', 'swiss', 'syrian', 'taiwanese', 'trinidadian', 'thai', 'tunisian', 'turkmen', 'ugandan', 'ukrainian', 'american', 'hindi', 'spanish', 'venezuelan', 'vietnamese', 'welsh', 'zambian', 'zimbabwean', 'english', 'african', 'european', 'asian', 'californian'];

	},{}],7:[function(_dereq_,module,exports){
	// common first-names in compressed form.
	// from http://www.ssa.gov/oact/babynames/limits.html  and http://www.servicealberta.gov.ab.ca/pdf/vs/2001_Boys.pdf
	// not sure what regional/cultural/demographic bias this has. Probably a lot.
	// 73% of people are represented in the top 1000 names

	// used to reduce redundant named-entities in longer text. (don't spot the same person twice.)
	// used to identify gender for coreference resolution
	'use strict';

	var male = _dereq_('./names/male');
	var female = _dereq_('./names/female');
	var names = {};

	//names commonly used in either gender
	var ambiguous = ['alexis', 'andra', 'aubrey', 'blair', 'casey', 'cassidy', 'cheyenne', 'devan', 'devon', 'guadalupe', 'jade', 'jaime', 'jamie', 'jammie', 'jan', 'jean', 'jessie', 'kasey', 'kelsey', 'kenyatta', 'kerry', 'lashawn', 'lee', 'marion', 'marlo', 'morgan', 'reagan', 'regan', 'rene', 'robin', 'rosario', 'shay', 'shea', 'shelby', 'shiloh', 'trinity'];
	for (var i = 0; i < male.length; i++) {
	  names[male[i]] = 'm';
	}
	for (var _i = 0; _i < female.length; _i++) {
	  names[female[_i]] = 'f';
	}
	//ambiguous/unisex names
	for (var _i2 = 0; _i2 < ambiguous.length; _i2 += 1) {
	  names[ambiguous[_i2]] = 'a';
	}
	// console.log(names['spencer']);
	// console.log(names['jill']);
	// console.log(names['sue'])
	// console.log(names['jan'])
	module.exports = {
	  all: names,
	  male: male,
	  female: female
	};

	},{"./names/female":14,"./names/male":15}],8:[function(_dereq_,module,exports){
	'use strict';

	var fns = _dereq_('../fns');
	//turns holiday-names into text-versions of their dates
	//https://en.wikipedia.org/wiki/federal_holidays_in_the_united_states

	//some major, and unambiguous holidays with the same date each year
	var annual = {
	  //general
	  'new years eve': 'december 31',
	  'new years': 'january 1',
	  'new years day': 'january 1',
	  'thanksgiving': 'fourth thursday in november',
	  'christmas eve': 'december 24',
	  'christmas': 'december 25',
	  'christmas day': 'december 25',
	  'saint patricks day': 'march 17',
	  'st patricks day': 'march 17',
	  'april fools': 'april 1',
	  'halloween': 'october 31',
	  'valentines': 'february 14',
	  'valentines day': 'february 14',

	  //american
	  'martin luther king': 'third monday in january',
	  'inauguration day': 'january 20',
	  'washingtons birthday': 'third monday in february',
	  'presidents day': 'third monday in february',
	  'memorial day': 'last monday in may',
	  // 'independence': 'july 4',
	  'labor day': 'first monday in september',
	  'columbus day': 'second monday in october',
	  'veterans day': 'november 11',

	  //british
	  'labour day': 'first monday in september',
	  'commonwealth day': 'second monday in march',
	  'st andrews day': 'november 30',
	  'saint andrews day': 'november 30',
	  'may day': 'may 1',

	  //russian
	  'russia day': 'june 12',

	  //australian
	  'australia day': 'january 26',
	  'boxing day': 'december 26',
	  'queens birthday': '2nd monday in june',

	  //canadian
	  'canada day': 'july 1',
	  'victoria day': 'may 24',
	  'canadian thanksgiving': 'second monday in october',
	  'rememberance day': 'november 11',
	  'august civic holiday': 'first monday in august',
	  'natal day': 'first monday in august',

	  //european
	  'all saints day': 'november 1',
	  'armistice day': 'november 11',
	  'bastille day': 'july 14',
	  'st stephens day': 'december 26',
	  'saint stephens day': 'december 26'
	};

	// hardcoded dates for non-regular holidays
	//   ----change every few years(!)---   TODO :do more years
	var astronomical = {
	  2015: {
	    'chinese new year': 'february 19',
	    'easter': 'april 5',
	    'easter sunday': 'april 5',
	    'easter monday': 'april 6',
	    'good friday': 'april 3',
	    'ascension day': 'may 14',
	    'eid': 'july 17',
	    'eid al-fitr': 'july 17',
	    'eid al-adha': 'september 24',
	    'ramadan': 'june 6', //range
	    'ashura': '23 october',
	    'diwali': '11 november'
	  },
	  2016: {
	    'chinese new year': 'february 8',
	    'easter': 'march 27',
	    'easter sunday': 'march 27',
	    'easter monday': 'march 28',
	    'good friday': 'march 25',
	    'ascension day': 'may 5',
	    'eid': 'july 6',
	    'eid al-fitr': 'july 6',
	    'eid al-adha': 'september 11',
	    'ramadan': 'may 27',
	    'diwali': 'october 30'
	  },
	  2017: {
	    'chinese new year': '28 january',
	    'easter': 'april 16',
	    'easter sunday': 'april 16',
	    'easter monday': 'april 17',
	    'good friday': 'april 14',
	    'ascension day': 'may 25',
	    'eid': 'july 25',
	    'eid al-fitr': 'july 25',
	    'diwali': 'october 21',
	    'ramadan': 'may 27'
	  }
	};
	//select current year
	var thisYear = new Date().getFullYear();
	var holidays = fns.extend(annual, astronomical[thisYear] || {});

	module.exports = holidays;

	},{"../fns":23}],9:[function(_dereq_,module,exports){
	'use strict';

	//these are common person titles used in the lexicon and sentence segmentation methods
	//they are also used to identify that a noun is a person
	module.exports = [
	//honourifics
	'jr', 'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'sen', 'corp', 'rep', 'gov', 'atty', 'supt', 'det', 'rev', 'col', 'gen', 'lt', 'cmdr', 'adm', 'capt', 'sgt', 'cpl', 'maj',
	// 'miss',
	// 'misses',
	'mister', 'sir', 'esq', 'mstr', 'phd', 'adj', 'adv', 'asst', 'bldg', 'brig', 'comdr', 'hon', 'messrs', 'mlle', 'mme', 'op', 'ord', 'pvt', 'reps', 'res', 'sens', 'sfc', 'surg'];

	},{}],10:[function(_dereq_,module,exports){
	//nouns with irregular plural/singular forms
	//used in noun.inflect, and also in the lexicon.
	//compressed with '_' to reduce some redundancy.
	'use strict';

	var main = [['child', '_ren'], ['person', 'people'], ['leaf', 'leaves'], ['database', '_s'], ['quiz', '_zes'], ['stomach', '_s'], ['sex', '_es'], ['move', '_s'], ['shoe', '_s'], ['goose', 'geese'], ['phenomenon', 'phenomena'], ['barracks', '_'], ['deer', '_'], ['syllabus', 'syllabi'], ['index', 'indices'], ['appendix', 'appendices'], ['criterion', 'criteria'], ['man', 'men'], ['sex', '_es'], ['rodeo', '_s'], ['epoch', '_s'], ['zero', '_s'], ['avocado', '_s'], ['halo', '_s'], ['tornado', '_s'], ['tuxedo', '_s'], ['sombrero', '_s'], ['addendum', 'addenda'], ['alga', '_e'], ['alumna', '_e'], ['alumnus', 'alumni'], ['bacillus', 'bacilli'], ['cactus', 'cacti'], ['beau', '_x'], ['château', '_x'], ['chateau', '_x'], ['tableau', '_x'], ['corpus', 'corpora'], ['curriculum', 'curricula'], ['echo', '_es'], ['embargo', '_es'], ['foot', 'feet'], ['genus', 'genera'], ['hippopotamus', 'hippopotami'], ['larva', '_e'], ['libretto', 'libretti'], ['loaf', 'loaves'], ['matrix', 'matrices'], ['memorandum', 'memoranda'], ['mosquito', '_es'], ['opus', 'opera'], ['ovum', 'ova'], ['ox', '_en'], ['radius', 'radii'], ['referendum', 'referenda'], ['thief', 'thieves'], ['tooth', 'teeth']];

	main = main.map(function (a) {
	  a[1] = a[1].replace('_', a[0]);
	  return a;
	});

	module.exports = main;

	},{}],11:[function(_dereq_,module,exports){
	'use strict';

	//a list of exceptions to the verb rules
	var irregular_verbs = {
	  take: {
	    perfect: 'have taken',
	    pluperfect: 'had taken',
	    future_perfect: 'will have taken'
	  },
	  can: {
	    gerund: '',
	    present: 'can',
	    past: 'could',
	    future: 'can',
	    perfect: 'could',
	    pluperfect: 'could',
	    future_perfect: 'can',
	    actor: ''
	  },
	  free: {
	    gerund: 'freeing',
	    actor: ''
	  },
	  arise: {
	    past: 'arose',
	    participle: 'arisen'
	  },
	  babysit: {
	    past: 'babysat',
	    actor: 'babysitter'
	  },
	  be: { // this is crazy-hard and shouldn't be here
	    past: 'been',
	    present: 'is',
	    future: 'will be',
	    perfect: 'have been',
	    pluperfect: 'had been',
	    future_perfect: 'will have been',
	    actor: '',
	    gerund: 'am'
	  },
	  is: {
	    past: 'was',
	    present: 'is',
	    future: 'will be',
	    perfect: 'have been',
	    pluperfect: 'had been',
	    future_perfect: 'will have been',
	    actor: '',
	    gerund: 'being'
	  },
	  beat: {
	    gerund: 'beating',
	    actor: 'beater'
	  },
	  begin: {
	    gerund: 'beginning',
	    past: 'began'
	  },
	  bet: {
	    actor: 'better'
	  },
	  bind: {
	    past: 'bound'
	  },
	  bite: {
	    gerund: 'biting',
	    past: 'bit'
	  },
	  bleed: {
	    past: 'bled'
	  },
	  break: {
	    past: 'broke'
	  },
	  breed: {
	    past: 'bred'
	  },
	  bring: {
	    past: 'brought'
	  },
	  broadcast: {
	    past: 'broadcast'
	  },
	  build: {
	    past: 'built'
	  },
	  buy: {
	    past: 'bought'
	  },
	  catch: {
	    past: 'caught'
	  },
	  choose: {
	    gerund: 'choosing',
	    past: 'chose'
	  },
	  cost: {
	    past: 'cost'
	  },
	  deal: {
	    past: 'dealt'
	  },
	  die: {
	    past: 'died',
	    gerund: 'dying'
	  },
	  dig: {
	    gerund: 'digging',
	    past: 'dug'
	  },
	  do: {
	    past: 'did',
	    present: 'does'
	  },
	  draw: {
	    past: 'drew'
	  },
	  drink: {
	    past: 'drank'
	  },
	  drive: {
	    gerund: 'driving',
	    past: 'drove'
	  },
	  eat: {
	    gerund: 'eating',
	    past: 'ate',
	    actor: 'eater'
	  },
	  fall: {
	    past: 'fell'
	  },
	  feed: {
	    past: 'fed'
	  },
	  feel: {
	    past: 'felt',
	    actor: 'feeler'
	  },
	  fight: {
	    past: 'fought'
	  },
	  find: {
	    past: 'found'
	  },
	  fly: {
	    past: 'flew'
	  },
	  forbid: {
	    past: 'forbade'
	  },
	  forget: {
	    gerund: 'forgeting',
	    past: 'forgot'
	  },
	  forgive: {
	    gerund: 'forgiving',
	    past: 'forgave'
	  },
	  freeze: {
	    gerund: 'freezing',
	    past: 'froze'
	  },
	  get: {
	    past: 'got'
	  },
	  give: {
	    gerund: 'giving',
	    past: 'gave'
	  },
	  go: {
	    past: 'went',
	    present: 'goes'
	  },
	  hang: {
	    past: 'hung'
	  },
	  have: {
	    gerund: 'having',
	    past: 'had',
	    present: 'has'
	  },
	  hear: {
	    past: 'heard'
	  },
	  hide: {
	    past: 'hid'
	  },
	  hold: {
	    past: 'held'
	  },
	  hurt: {
	    past: 'hurt'
	  },
	  lay: {
	    past: 'laid'
	  },
	  lead: {
	    past: 'led'
	  },
	  leave: {
	    past: 'left'
	  },
	  lie: {
	    gerund: 'lying',
	    past: 'lay'
	  },
	  light: {
	    past: 'lit'
	  },
	  lose: {
	    gerund: 'losing',
	    past: 'lost'
	  },
	  make: {
	    past: 'made'
	  },
	  mean: {
	    past: 'meant'
	  },
	  meet: {
	    gerund: 'meeting',
	    past: 'met',
	    actor: 'meeter'
	  },
	  pay: {
	    past: 'paid'
	  },
	  read: {
	    past: 'read'
	  },
	  ring: {
	    past: 'rang'
	  },
	  rise: {
	    past: 'rose',
	    gerund: 'rising',
	    pluperfect: 'had risen',
	    future_perfect: 'will have risen'
	  },
	  run: {
	    gerund: 'running',
	    past: 'ran'
	  },
	  say: {
	    past: 'said'
	  },
	  see: {
	    past: 'saw'
	  },
	  sell: {
	    past: 'sold'
	  },
	  shine: {
	    past: 'shone'
	  },
	  shoot: {
	    past: 'shot'
	  },
	  show: {
	    past: 'showed'
	  },
	  sing: {
	    past: 'sang'
	  },
	  sink: {
	    past: 'sank',
	    pluperfect: 'had sunk'
	  },
	  sit: {
	    past: 'sat'
	  },
	  slide: {
	    past: 'slid'
	  },
	  speak: {
	    past: 'spoke',
	    perfect: 'have spoken',
	    pluperfect: 'had spoken',
	    future_perfect: 'will have spoken'
	  },
	  spin: {
	    gerund: 'spinning',
	    past: 'spun'
	  },
	  spread: {
	    past: 'spread'
	  },
	  stand: {
	    past: 'stood'
	  },
	  steal: {
	    past: 'stole',
	    actor: 'stealer'
	  },
	  stick: {
	    past: 'stuck'
	  },
	  sting: {
	    past: 'stung'
	  },
	  stream: {
	    actor: 'streamer'
	  },
	  strike: {
	    gerund: 'striking',
	    past: 'struck'
	  },
	  swear: {
	    past: 'swore'
	  },
	  swim: {
	    past: 'swam'
	  },
	  swing: {
	    past: 'swung'
	  },
	  teach: {
	    past: 'taught',
	    present: 'teaches'
	  },
	  tear: {
	    past: 'tore'
	  },
	  tell: {
	    past: 'told'
	  },
	  think: {
	    past: 'thought'
	  },
	  understand: {
	    past: 'understood'
	  },
	  wake: {
	    past: 'woke'
	  },
	  wear: {
	    past: 'wore'
	  },
	  win: {
	    gerund: 'winning',
	    past: 'won'
	  },
	  withdraw: {
	    past: 'withdrew'
	  },
	  write: {
	    gerund: 'writing',
	    past: 'wrote'
	  },
	  tie: {
	    gerund: 'tying',
	    past: 'tied'
	  },
	  ski: {
	    past: 'skiied'
	  },
	  boil: {
	    actor: 'boiler'
	  },
	  miss: {
	    present: 'miss'
	  },
	  act: {
	    actor: 'actor'
	  },
	  compete: {
	    gerund: 'competing',
	    past: 'competed',
	    actor: 'competitor'
	  },
	  being: {
	    gerund: 'are',
	    past: 'were',
	    present: 'are'
	  },
	  imply: {
	    past: 'implied',
	    present: 'implies'
	  },
	  ice: {
	    gerund: 'icing',
	    past: 'iced'
	  },
	  develop: {
	    past: 'developed',
	    actor: 'developer',
	    gerund: 'developing'
	  },
	  wait: {
	    gerund: 'waiting',
	    past: 'waited',
	    actor: 'waiter'
	  },
	  aim: {
	    actor: 'aimer'
	  },
	  spill: {
	    past: 'spilt'
	  },
	  drop: {
	    gerund: 'dropping',
	    past: 'dropped'
	  },
	  log: {
	    gerund: 'logging',
	    past: 'logged'
	  },
	  rub: {
	    gerund: 'rubbing',
	    past: 'rubbed'
	  },
	  smash: {
	    present: 'smashes'
	  },
	  suit: {
	    gerund: 'suiting',
	    past: 'suited',
	    actor: 'suiter'
	  }
	};
	module.exports = irregular_verbs;

	},{}],12:[function(_dereq_,module,exports){
	'use strict';

	var misc = {
	  'there': 'NN',
	  'here': 'JJ',

	  'better': 'JJR',
	  'earlier': 'JJR',

	  'has': 'VB',
	  'sounds': 'VBZ',
	  //special case for took/taken
	  'taken': 'VBD',
	  'msg': 'VB', //slang
	  //date
	  'noon': 'DA',
	  'midnight': 'DA',
	  //errr....
	  'now': 'DA',
	  'morning': 'DA',
	  'evening': 'DA',
	  'afternoon': 'DA',
	  'ago': 'DA',
	  'sometime': 'DA',
	  //end of day, end of month
	  'eod': 'DA',
	  'eom': 'DA',
	  'number': 'NN',
	  'system': 'NN',
	  'example': 'NN',
	  'part': 'NN',
	  'house': 'NN'
	};

	var compact = {
	  //conjunctions
	  'CC': ['yet', 'therefore', 'or', 'while', 'nor', 'whether', 'though', 'because', 'cuz', 'but', 'for', 'and', 'however', 'before', 'although', 'how', 'plus', 'versus', 'not'],
	  'CO': ['if', 'unless', 'otherwise', 'notwithstanding'],

	  'VBD': ['said', 'had', 'been', 'began', 'came', 'did', 'meant', 'went'],

	  'VBN': ['given', 'known', 'shown', 'seen', 'born'],

	  'VBG': ['going', 'being', 'according', 'resulting', 'developing', 'staining'],

	  //copula
	  'CP': ['is', 'will be', 'are', 'was', 'were', 'am', 'isn\'t', 'ain\'t', 'aren\'t'],

	  //determiners
	  'DT': ['this', 'any', 'enough', 'each', 'whatever', 'every', 'these', 'another', 'plenty', 'whichever', 'neither', 'an', 'a', 'least', 'own', 'few', 'both', 'those', 'the', 'that', 'various', 'either', 'much', 'some', 'else', 'no',
	  //some other languages (what could go wrong?)
	  'la', 'le', 'les', 'des', 'de', 'du', 'el'],

	  //prepositions
	  'IN': ['until', 'onto', 'of', 'into', 'out', 'except', 'across', 'by', 'between', 'at', 'down', 'as', 'from', 'around', 'with', 'among', 'upon', 'amid', 'to', 'along', 'since', 'about', 'off', 'on', 'within', 'in', 'during', 'per', 'without', 'throughout', 'through', 'than', 'via', 'up', 'unlike', 'despite', 'below', 'unless', 'towards', 'besides', 'after', 'whereas', '\'o', 'amidst', 'amongst', 'apropos', 'atop', 'barring', 'chez', 'circa', 'mid', 'midst', 'notwithstanding', 'qua', 'sans', 'vis-a-vis', 'thru', 'till', 'versus', 'without', 'w/o', 'o\'', 'a\''],

	  //modal verbs
	  'MD': ['can', 'may', 'could', 'might', 'will', 'ought to', 'would', 'must', 'shall', 'should', 'ought', 'shant', 'lets'],

	  //Possessive pronouns
	  'PP': ['mine', 'something', 'none', 'anything', 'anyone', 'theirs', 'himself', 'ours', 'his', 'my', 'their', 'yours', 'your', 'our', 'its', 'herself', 'hers', 'themselves', 'myself', 'itself', 'her'],

	  //personal pronouns (nouns)
	  'PRP': ['it', 'they', 'i', 'them', 'you', 'she', 'me', 'he', 'him', 'ourselves', 'us', 'we', 'thou', 'il', 'elle', 'yourself', '\'em', 'he\'s', 'she\'s'],
	  //questions are awkward pos. are clarified in question_pass
	  'QU': ['where', 'why', 'when', 'who', 'whom', 'whose', 'what', 'which'],
	  //some manual adverbs (the rest are generated)
	  'RB': [
	  // 'now',
	  'again', 'already', 'soon', 'directly', 'toward', 'forever', 'apart', 'instead', 'yes', 'alone', 'indeed', 'ever', 'quite', 'perhaps', 'then', 'thus', 'very', 'often', 'once', 'never', 'away', 'always', 'sometimes', 'also', 'maybe', 'so', 'just', 'well', 'several', 'such', 'randomly', 'too', 'rather', 'abroad', 'almost', 'anyway', 'twice', 'aside', 'moreover', 'anymore', 'newly', 'damn', 'somewhat', 'somehow', 'meanwhile', 'hence', 'further', 'furthermore', 'more', 'way', 'kinda', 'totally'],

	  //interjections, expressions
	  'EX': ['uh', 'uhh', 'uh huh', 'uh-oh', 'please', 'ugh', 'sheesh', 'eww', 'pff', 'voila', 'oy', 'hi', 'hello', 'bye', 'goodbye', 'hey', 'hai', 'eep', 'hurrah', 'yuck', 'ow', 'duh', 'oh', 'hmm', 'yeah', 'whoa', 'ooh', 'whee', 'ah', 'bah', 'gah', 'yaa', 'phew', 'gee', 'ahem', 'eek', 'meh', 'yahoo', 'oops', 'd\'oh', 'psst', 'argh', 'grr', 'nah', 'shhh', 'whew', 'mmm', 'ooo', 'yay', 'uh-huh', 'boo', 'wow', 'nope', 'haha', 'hahaha', 'lol', 'lols', 'ya', 'hee', 'ohh', 'eh', 'yup'],

	  //special nouns that shouldnt be seen as a verb
	  'NN': ['nothing', 'everything', 'god', 'student', 'patent', 'funding', 'banking', 'ceiling', 'energy', 'purpose', 'friend', 'event', 'room', 'door', 'thing', 'things', 'stuff', 'lunch', 'breakfast', 'dinner', 'home', 'problem', 'body', 'world', 'city', 'death', 'others'],
	  //family-terms are people
	  PN: ['father', 'mother', 'mom', 'dad', 'mommy', 'daddy', 'sister', 'brother', 'aunt', 'uncle', 'grandfather', 'grandmother', 'cousin', 'stepfather', 'stepmother', 'boy', 'girl', 'man', 'men', 'woman', 'women', 'guy', 'dude', 'bro', 'gentleman', 'someone']
	};
	//unpack the compact terms into the misc lexicon..
	var keys = Object.keys(compact);
	for (var i = 0; i < keys.length; i++) {
	  var arr = compact[keys[i]];
	  for (var i2 = 0; i2 < arr.length; i2++) {
	    misc[arr[i2]] = keys[i];
	  }
	}
	// console.log(misc.a);
	module.exports = misc;

	},{}],13:[function(_dereq_,module,exports){
	'use strict';

	//common terms that are multi-word, but one part-of-speech
	//these should not include phrasal verbs, like 'looked out'. These are handled elsewhere.
	module.exports = {
	  'a few': 'CD', //different than 'few people'
	  'of course': 'RB',
	  'at least': 'RB',
	  'no longer': 'RB',
	  'sort of': 'RB',
	  // 'at first': 'RB',
	  'once again': 'RB',
	  'once more': 'RB',
	  'up to': 'RB',
	  'by now': 'RB',
	  'all but': 'RB',
	  'just about': 'RB',
	  'so called': 'JJ', //?
	  'on board': 'JJ',
	  'a lot': 'RB',
	  'by far': 'RB',
	  'at best': 'RB',
	  'at large': 'RB',
	  'for good': 'RB',
	  'for example': 'RB',
	  'vice versa': 'JJ',
	  'en route': 'JJ',
	  'for sure': 'RB',
	  'upside down': 'JJ',
	  'at most': 'RB',
	  'per se': 'RB',
	  'at worst': 'RB',
	  'upwards of': 'RB',
	  'en masse': 'RB',
	  'point blank': 'RB',
	  'up front': 'JJ',
	  'in front': 'JJ',
	  'in situ': 'JJ',
	  'in vitro': 'JJ',
	  'ad hoc': 'JJ',
	  'de facto': 'JJ',
	  'ad infinitum': 'JJ',
	  'ad nauseam': 'RB',
	  'all that': 'RB',
	  'for keeps': 'JJ',
	  'a priori': 'JJ',
	  'et cetera': 'IN',
	  'off guard': 'JJ',
	  'spot on': 'JJ',
	  'ipso facto': 'JJ',
	  'not withstanding': 'RB',
	  'de jure': 'RB',
	  'a la': 'IN',
	  'ad hominem': 'NN',
	  'par excellence': 'RB',
	  'de trop': 'RB',
	  'a posteriori': 'RB',
	  'fed up': 'JJ',
	  'brand new': 'JJ',
	  'old fashioned': 'JJ',
	  'bona fide': 'JJ',
	  'well off': 'JJ',
	  'far off': 'JJ',
	  'straight forward': 'JJ',
	  'hard up': 'JJ',
	  'sui generis': 'JJ',
	  'en suite': 'JJ',
	  'avant garde': 'JJ',
	  'sans serif': 'JJ',
	  'gung ho': 'JJ',
	  'super duper': 'JJ',
	  'new york': 'NN',
	  'new england': 'NN',
	  'new hampshire': 'NN',
	  'new delhi': 'NN',
	  'new jersey': 'NN',
	  'new mexico': 'NN',
	  'united states': 'NN',
	  'united kingdom': 'NN',
	  'great britain': 'NN',
	  'head start': 'NN',
	  'make sure': 'VB',
	  'keep tabs': 'VB',
	  'credit card': 'NN',
	  //timezones
	  'standard time': 'DA',
	  'daylight time': 'DA',
	  'summer time': 'DA',
	  'fl oz': 'NN',
	  'us dollar': 'NN'
	};

	},{}],14:[function(_dereq_,module,exports){
	'use strict';

	var fns = _dereq_('../../fns');

	//the unique/uncompressed names..
	var arr = ['abby', 'amy', 'autumn', 'bobbi', 'brooke', 'carol', 'cheryl', 'claire', 'cleo', 'consuelo',
	// 'dawn',
	'eleanor', 'eliza', 'erika', 'faye', 'fern', 'genevieve', 'gertrude', 'gladys', 'inez', 'ingrid', 'jenny', 'jo', 'joni', 'kathryn', 'kelli', 'kim', 'latoya', 'leigh', 'lupe', 'luz', 'lynn', 'mae', 'maude', 'mildred', 'miriam', 'naomi', 'nikki', 'olga', 'reba', 'robyn', 'rosalind', 'ruth', 'sheryl', 'socorro', 'sonja', 'staci', 'tanya', 'therese', 'toni', 'traci', 'vicki', 'vicky'];

	//compressed by frequent suffixes
	var suffix_compressed = {
	  nette: 'an,antoi,ja,jea,jean,ly',
	  eline: 'ad,ang,jacqu,mad',
	  rlene: 'a,cha,da,ma',
	  stine: 'chri,erne,ju,kri',
	  tasha: 'la,na,',
	  andra: 'alex,cass,s',
	  helle: 'mic,rac,roc',
	  linda: 'be,,me',
	  stina: 'chri,cri,kri',
	  annie: ',f,je',
	  anne: ',di,je,jo,le,mari,rox,sus,suz',
	  elia: 'am,ang,cec,c,corn,d,of,sh',
	  llie: 'ca,ke,li,mi,mo,ne,o,sa',
	  anna: ',de,di,jo,joh,sh',
	  ette: 'bernad,b,bridg,claud,paul,yv',
	  ella: 'd,,est,lu,marc,st',
	  nnie: 'bo,co,je,mi,wi',
	  elle: 'dani,est,gabri,isab,jan',
	  icia: 'al,fel,let,patr,tr',
	  leen: 'ai,cath,col,ei,kath',
	  elma: ',s,th,v',
	  etta: ',henri,lor,ros',
	  anie: 'j,mel,stef,steph',
	  anda: 'am,mir,w,yol',
	  arla: 'c,d,k,m',
	  lena: 'e,he,,magda',
	  rina: 'kat,ma,sab,t',
	  isha: 'al,ke,lat,tr',
	  olly: 'd,m,p',
	  rice: 'beat,cla,pat',
	  ttie: 'be,ma,ne',
	  acie: 'gr,st,tr',
	  isty: 'chr,kr,m',
	  dith: 'e,ju,mere',
	  onya: 'lat,s,t',
	  onia: 'ant,s,t',
	  erri: 'k,sh,t',
	  lisa: 'a,e,',
	  rine: 'cathe,katha,kathe',
	  nita: 'a,bo,jua',
	  elyn: 'ev,jacqu,joc',
	  nine: 'ja,jea,jean',
	  nice: 'ber,eu,ja',
	  tney: 'brit,cour,whi',
	  ssie: 'be,ca,e',
	  beth: ',elisa,eliza',
	  ine: 'carol,ela,franc,gerald,jasm,joseph,lorra,max,nad,paul',
	  ana: 'adri,,d,de,di,j,ju,l,sh,sus',
	  rie: 'car,che,lau,lo,ma,marjo,rosema,sher,vale',
	  ina: 'angel,carol,d,georg,g,josef,mart,n,t',
	  ora: 'c,deb,d,fl,len,l,n,',
	  ara: 'barb,c,cl,k,l,s,tam,t',
	  ela: 'ang,carm,gabri,graci,l,manu,pam',
	  ica: 'angel,er,jess,mon,patr,veron',
	  nda: 'bre,gle,luci,ly,rho,ro',
	  ley: 'ash,kel,kimber,les,shel,shir',
	  eri: 'ch,j,k,sh,t',
	  ndy: 'ci,ma,mi,sa,we',
	  ene: 'hel,imog,ir,jol,lor',
	  ula: 'e,l,pa,urs',
	  ann: ',jo,le,mary',
	  ola: 'le,l,,vi',
	  nna: 'do,gle,je,lado',
	  nne: 'adrie,cori,ly,yvo',
	  lie: 'ju,les,nata,rosa',
	  ise: 'den,el,elo,lou',
	  die: 'ad,gol,jo,sa',
	  ena: 'd,lor,r,she',
	  ian: 'jill,lill,mar,viv',
	  lyn: 'caro,gwendo,jac,mari',
	  ssa: 'aly,mari,meli,vane',
	  thy: 'ca,doro,dor,ka',
	  tha: 'ber,mar,saman,tabi',
	  sie: 'el,jo,ro,su',
	  bel: 'isa,ma,mari',
	  via: 'oli,sil,syl',
	  tie: 'chris,ka,kris',
	  dra: 'au,ken,son',
	  ria: 'glo,ma,victo',
	  gie: 'an,mag,mar',
	  lly: 'ke,sa,she',
	  ila: 'le,l,she',
	  rna: 'lo,my,ve',
	  ole: 'car,nich,nic',
	  rma: 'e,i,no',
	  any: 'beth,britt,tiff',
	  ona: 'le,m,ram',
	  rta: 'albe,ma,robe',
	  en: 'carm,dore,ell,gretch,gw,hel,kar,kirst,krist,laur,maure',
	  ia: 'cecil,claud,cynth,eugen,georg,jul,luc,lyd,marc,soph,virgin',
	  le: 'ade,camil,ceci,ga,gay,luci,lucil,mab,miche,myrt',
	  ie: 'bobb,debb,dix,eff,jack,lizz,mam,soph,tamm,vick',
	  ra: 'barb,deb,elvi,lau,may,my,pet,ve',
	  er: 'amb,est,esth,heath,jenif,jennif,summ',
	  da: 'a,ai,fre,frie,hil,i,matil',
	  ce: 'ali,canda,candi,constan,floren,gra,joy',
	  ah: 'beul,debor,hann,le,rebek,sar',
	  sa: 'el,lui,mari,ro,tere,there',
	  ne: 'daph,dia,ja,jay,laver,simo',
	  el: 'eth,laur,muri,racha,rach,raqu',
	  is: 'delor,dor,jan,lo,mav,phyll',
	  et: 'bridg,harri,jan,margar,margr',
	  ta: 'al,chris,kris,margari,ri',
	  es: 'agn,delor,dolor,franc,merced',
	  an: 'jo,meag,meg,megh,sus',
	  cy: 'lu,mar,nan,sta,tra',
	  in: 'caitl,er,kar,krist',
	  ey: 'audr,linds,stac,trac',
	  ca: 'bian,blan,francis,rebec',
	  on: 'alis,allis,shann,shar',
	  il: 'abiga,apr,ga,syb',
	  ly: 'bever,emi,kimber,li',
	  ea: 'andr,chels,doroth,l',
	  ee: 'aim,d,desir,ren',
	  ma: 'al,em,wil',
	  di: 'bran,hei,jo',
	  va: 'el,e,i',
	  ue: 'dominiq,moniq,s',
	  ay: 'f,k,linds',
	  te: 'celes,ka,margueri',
	  ry: 'ma,rosema,sher',
	  na: 'ed,shau,shaw',
	  dy: 'jo,ju,tru',
	  ti: 'chris,kris,pat',
	  sy: 'bet,dai,pat',
	  ri: 'ka,lo,sha',
	  la: 'kay,priscil,wil',
	  al: 'cryst,kryst,op',
	  ll: 'jewe,ji,ne'
	};
	arr = fns.expand_suffixes(arr, suffix_compressed);

	var prefix_compressed = {
	  mar: 'go,isol,itza,sha',
	  tam: 'i,ika,my',
	  be: 'atriz,cky,tty,ttye',
	  pe: 'arl,ggy,nny',
	  pa: 'ige,m,tty'
	};
	arr = fns.expand_prefixes(arr, prefix_compressed);

	module.exports = arr;

	},{"../../fns":23}],15:[function(_dereq_,module,exports){
	'use strict';

	var fns = _dereq_('../../fns');

	//the unique/uncompressed names..
	var arr = ['adolfo', 'angelo', 'anthony', 'armand', 'arthur', 'bill', 'billy', 'bobby', 'bradford', 'bret', 'caleb', 'carroll', 'cliff', 'clifford', 'craig', 'curt', 'derek', 'doug', 'dwight', 'edmund', 'eli', 'elliot', 'enrique', 'erik', 'felipe', 'felix', 'francisco', 'frank', 'george', 'glenn', 'greg', 'gregg', 'hans', 'hugh', 'ira', 'irving', 'isaac', 'jim', 'kermit', 'kurt', 'leo', 'levi', 'lorenzo', 'lou', 'pablo', 'pat', 'percy', 'philip', 'phillip', 'rex', 'ricky', 'ruben', 'shaun', 'shawn', 'sterling', 'steve', 'tim', 'timothy', 'wilbur', 'williams', 'wm', 'woodrow'];

	//compressed by frequent suffixes
	var suffix_compressed = {
	  rence: 'cla,lau,law,te,ter',
	  lbert: 'a,de,e,gi,wi',
	  ustin: 'ag,a,d,j',
	  berto: 'al,gil,hum,ro',
	  ester: 'ch,l,sylv',
	  onnie: 'd,l,r',
	  wayne: 'de,d,',
	  erick: ',fred,rod',
	  athan: 'john,jon,n',
	  elvin: ',k,m',
	  anuel: 'em,emm,m',
	  bert: ',her,hu,nor,ro',
	  rick: 'der,fred,kend,pat,',
	  land: 'cleve,gar,le,ro',
	  ando: 'arm,fern,orl,rol',
	  ardo: 'edu,ger,leon,ric',
	  lton: 'a,car,e,mi',
	  arry: 'b,g,h,l',
	  nton: 'a,cli,qui',
	  fred: 'al,,wil',
	  ance: 'l,terr,v',
	  mmie: 'ji,sa,to',
	  erry: 'j,p,t',
	  mond: 'des,ed,ray',
	  rman: 'he,no,she',
	  rvin: 'e,i,ma',
	  nald: 'do,regi,ro',
	  rett: 'b,eve,gar',
	  son: 'harri,jack,ja,ma,nel,ty,wil',
	  ell: 'darn,darr,low,mitch,russ,terr,wend',
	  ard: 'bern,edw,ger,how,leon,rich,will',
	  ian: 'adr,br,christ,dam,fab,,jul',
	  don: 'bran,,el,gor,shel',
	  ron: 'aa,by,came,my,',
	  ton: 'bur,clay,clif,pres,wins',
	  lan: 'a,al,dy,har,no',
	  rey: 'ca,co,geoff,jeff',
	  ent: 'br,k,tr,vinc',
	  ael: 'ism,mich,raf,raph',
	  mmy: 'ji,sa,ti,to',
	  mon: 'da,ra,si,solo',
	  las: 'dal,doug,nicho,nico',
	  vin: 'al,cal,de,ke',
	  nny: 'be,da,joh,ke',
	  ius: 'cornel,dar,demetr,jul',
	  ley: 'brad,har,stan,wes',
	  lio: 'emi,ju,roge',
	  ben: ',reu,ru',
	  ory: 'c,greg,r',
	  lie: 'bil,char,wil',
	  van: 'e,i,',
	  roy: 'le,,t',
	  all: 'kend,marsh,rand',
	  ary: 'c,g,zach',
	  ddy: 'bu,fre,te',
	  art: 'b,stew,stu',
	  iel: 'dan,gabr,nathan',
	  lin: 'co,frank,mar',
	  yle: 'do,k,l',
	  her: 'christop,kristop,lut',
	  oyd: 'b,fl,ll',
	  ren: 'dar,lo,war',
	  ter: 'dex,pe,wal',
	  arl: 'c,e,k',
	  ane: 'd,du,sh',
	  aul: 'p,r,s',
	  dan: 'bren,,jor',
	  nie: 'ben,er,john',
	  ine: 'anto,bla,jerma',
	  lph: 'ra,rando,rudo',
	  est: 'earn,ern,forr',
	  win: 'dar,ed,er',
	  is: 'chr,curt,den,denn,ell,franc,lew,lou,lu,morr,ot,trav,will',
	  er: 'alexand,elm,grov,hom,jasp,javi,oliv,rodg,rog,spenc,tyl,xavi',
	  an: 'bry,de,esteb,eth,ju,log,rom,ry,se,st,steph',
	  el: 'ab,darr,fid,jo,lion,marc,mich,migu,no,russ,samu',
	  in: 'benjam,bra,dar,darr,efra,joaqu,mart,quent',
	  ie: 'arch,edd,frank,fredd,lou,regg,robb',
	  en: 'all,dami,gl,k,ow,steph,stev',
	  ey: 'dew,harv,jo,mick,rick,rodn,sidn',
	  al: ',h,jam,miche,ne,rand',
	  on: 'bry,j,jonath,le,marl,vern',
	  or: 'hect,juni,salvad,tayl,trev,vict',
	  dy: 'an,bra,co,gra,ran,ru',
	  ce: 'bru,bry,hora,mauri,roy,walla',
	  il: 'cec,em,ne,ph,virg',
	  ar: 'ces,edg,lam,om,osc',
	  es: 'andr,charl,jam,mil,mos',
	  ro: 'alejand,alva,artu,ped,rami',
	  am: 'abrah,ad,grah,s,willi',
	  ck: 'chu,domini,ja,ma,ni',
	  io: 'anton,gregor,ignac,mar,serg',
	  ah: 'elij,jeremi,mic,no',
	  nt: 'brya,cli,gra,lamo',
	  re: 'and,pier,salvato,theodo',
	  ed: ',jar,n,t',
	  ld: 'arno,gera,haro,jera',
	  as: 'eli,luc,thom,tom',
	  os: 'am,carl,marc,sant',
	  ew: 'andr,dr,math,matth',
	  ke: 'bla,ja,lu,mi',
	  tt: 'ellio,emme,ma,sco',
	  ty: 'mar,mon,rus,scot',
	  th: 'hea,kei,kenne,se',
	  ay: 'cl,j,murr,r',
	  le: 'da,mer,orvil',
	  te: 'mon,pe,vicen',
	  us: 'jes,marc,ruf',
	  od: 'elwo,jarr,r',
	  ob: 'b,jac,r',
	  to: 'beni,ernes,ot',
	  ne: 'euge,ge,tyro',
	  go: 'domin,hu,santia',
	  de: 'clau,cly,wa',
	  do: 'alfre,reynal,wilfre',
	  rk: 'cla,ki,ma',
	  se: 'cha,jes,jo',
	  ry: 'hen,jeffe,jeff',
	  ic: 'cedr,domin,er',
	  ad: 'br,ch,conr'
	};

	arr = fns.expand_suffixes(arr, suffix_compressed);

	var prefix_compressed = {
	  jos: 'eph,h,hua',
	  ro: 'cky,dolfo,osevelt,scoe,ss',
	  je: 'ff,remy,rome,ss',
	  to: 'by,dd,m,ny',
	  da: 'rryl,ryl,ve,vid',
	  jo: 'e,esph,hn,rge',
	  ma: 'lcolm,rc,rco,x',
	  al: 'ex,fonso,i,onzo',
	  gu: 'illermo,stavo,y'
	};
	arr = fns.expand_prefixes(arr, prefix_compressed);

	module.exports = arr;

	},{"../../fns":23}],16:[function(_dereq_,module,exports){
	'use strict';

	var cardinal = {
	  ones: {
	    'a': 1,
	    'zero': 0,
	    'one': 1,
	    'two': 2,
	    'three': 3,
	    'four': 4,
	    'five': 5,
	    'six': 6,
	    'seven': 7,
	    'eight': 8,
	    'nine': 9
	  },
	  teens: {
	    'ten': 10,
	    'eleven': 11,
	    'twelve': 12,
	    'thirteen': 13,
	    'fourteen': 14,
	    'fifteen': 15,
	    'sixteen': 16,
	    'seventeen': 17,
	    'eighteen': 18,
	    'nineteen': 19
	  },
	  tens: {
	    'twenty': 20,
	    'thirty': 30,
	    'forty': 40,
	    'fifty': 50,
	    'sixty': 60,
	    'seventy': 70,
	    'eighty': 80,
	    'ninety': 90
	  },
	  multiples: {
	    'hundred': 1e2,
	    'grand': 1e3,
	    'thousand': 1e3,
	    'million': 1e6,
	    'billion': 1e9,
	    'trillion': 1e12,
	    'quadrillion': 1e15,
	    'quintillion': 1e18,
	    'sextillion': 1e21,
	    'septillion': 1e24
	  }
	};

	var ordinal = {
	  ones: {
	    'first': 1,
	    'second': 2,
	    'third': 3,
	    'fourth': 4,
	    'fifth': 5,
	    'sixth': 6,
	    'seventh': 7,
	    'eighth': 8,
	    'ninth': 9
	  },
	  teens: {
	    'tenth': 10,
	    'eleventh': 11,
	    'twelfth': 12,
	    'thirteenth': 13,
	    'fourteenth': 14,
	    'fifteenth': 15,
	    'sixteenth': 16,
	    'seventeenth': 17,
	    'eighteenth': 18,
	    'nineteenth': 19
	  },
	  tens: {
	    'twentieth': 20,
	    'thirtieth': 30,
	    'fourtieth': 40,
	    'fiftieth': 50,
	    'sixtieth': 60,
	    'seventieth': 70,
	    'eightieth': 80,
	    'ninetieth': 90
	  },
	  multiples: {
	    'hundredth': 1e2,
	    'thousandth': 1e3,
	    'millionth': 1e6,
	    'billionth': 1e9,
	    'trillionth': 1e12,
	    'quadrillionth': 1e15,
	    'quintillionth': 1e18,
	    'sextillionth': 1e21,
	    'septillionth': 1e24
	  }
	};

	//used for the units
	var prefixes = {
	  'yotta': 1,
	  'zetta': 1,
	  'exa': 1,
	  'peta': 1,
	  'tera': 1,
	  'giga': 1,
	  'mega': 1,
	  'kilo': 1,
	  'hecto': 1,
	  'deka': 1,
	  'deci': 1,
	  'centi': 1,
	  'milli': 1,
	  'micro': 1,
	  'nano': 1,
	  'pico': 1,
	  'femto': 1,
	  'atto': 1,
	  'zepto': 1,
	  'yocto': 1,

	  'square': 1,
	  'cubic': 1,
	  'quartic': 1
	};

	module.exports = {
	  ones: cardinal.ones,
	  teens: cardinal.teens,
	  tens: cardinal.tens,
	  multiples: cardinal.multiples,

	  ordinal_ones: ordinal.ones,
	  ordinal_teens: ordinal.teens,
	  ordinal_tens: ordinal.tens,
	  ordinal_multiples: ordinal.multiples,

	  prefixes: prefixes
	};

	},{}],17:[function(_dereq_,module,exports){
	'use strict';
	//just a few named-organizations
	//no acronyms needed. no product/brand pollution.

	var organizations = ['google', 'microsoft', 'walmart', 'exxonmobil', 'glencore', 'samsung', 'chevron', 'at&t', 'verizon', 'costco', 'nestlé', '7-eleven', 'adidas', 'nike', 'acer', 'mcdonalds', 'mcdonald\'s', 'comcast', 'compaq', 'craigslist', 'cisco', 'disney', 'coca cola', 'dupont', 'ebay', 'facebook', 'fedex', 'kmart', 'kkk', 'kodak', 'monsanto', 'myspace', 'netflix', 'sony', 'telus', 'twitter', 'usps', 'ubs', 'ups', 'walgreens', 'youtube', 'yahoo!', 'yamaha'];

	var suffixes = ['center', 'centre', 'memorial', 'school', 'government', 'faculty', 'society', 'union', 'ministry', 'collective', 'association', 'committee', 'university', 'bank', 'college', 'foundation', 'department', 'institute', 'club', 'co', 'sons'];

	module.exports = {
	  suffixes: suffixes,
	  organizations: organizations
	};

	},{}],18:[function(_dereq_,module,exports){
	//phrasal verbs are two words that really mean one verb.
	//'beef up' is one verb, and not some direction of beefing.
	//by @spencermountain, 2015 mit
	//many credits to http://www.allmyphrasalverbs.com/
	'use strict';

	var verb_conjugate = _dereq_('../term/verb/conjugate/conjugate.js');

	//start the list with some randoms
	var main = ['be onto', 'fall behind', 'fall through', 'fool with', 'get across', 'get along', 'get at', 'give way', 'hear from', 'hear of', 'lash into', 'make do', 'run across', 'set upon', 'take aback', 'keep from'];

	//if there's a phrasal verb "keep on", there's often a "keep off"
	var opposites = {
	  'away': 'back',
	  'in': 'out',
	  'on': 'off',
	  'over': 'under',
	  'together': 'apart',
	  'up': 'down'
	};

	//forms that have in/out symmetry
	var symmetric = {
	  'away': 'blow,bounce,bring,call,come,cut,drop,fire,get,give,go,keep,pass,put,run,send,shoot,switch,take,tie,throw',
	  'in': 'bang,barge,bash,beat,block,book,box,break,bring,burn,butt,carve,cash,check,come,cross,drop,fall,fence,fill,give,grow,hand,hang,head,jack,keep,leave,let,lock,log,move,opt,pack,peel,pull,put,reach,ring,rub,send,set,settle,shut,sign,smash,snow,strike,take,try,turn,type,warm,wave,wean,wear,wheel',
	  'on': 'add,call,carry,catch,count,feed,get,give,go,grind,head,hold,keep,lay,log,pass,pop,power,put,send,show,snap,switch,take,tell,try,turn,wait',
	  'over': 'come,go,look,read,run,talk',
	  'together': 'come,pull,put',
	  'up': 'add,back,beat,bend,blow,boil,bottle,break,bring,buckle,bulk,bundle,call,carve,clean,cut,dress,fill,flag,fold,get,give,grind,grow,hang,hold,keep,let,load,lock,look,man,mark,melt,move,pack,pin,pipe,plump,pop,power,pull,put,rub,scale,scrape,send,set,settle,shake,show,sit,slow,smash,square,stand,strike,take,tear,tie,top,turn,use,wash,wind'
	};
	Object.keys(symmetric).forEach(function (k) {
	  symmetric[k].split(',').forEach(function (s) {
	    //add the given form
	    main.push(s + ' ' + k);
	    //add its opposite form
	    main.push(s + ' ' + opposites[k]);
	  });
	});

	//forms that don't have in/out symmetry
	var asymmetric = {
	  'about': 'bring,fool,gad,go,root,mess',
	  'after': 'go,look,take',
	  'ahead': 'get,go,press',
	  'along': 'bring,move',
	  'apart': 'fall,take',
	  'around': 'ask,boss,bring,call,come,fool,get,horse,joke,lie,mess,play',
	  'away': 'back,carry,file,frighten,hide,wash',
	  'back': 'fall,fight,hit,hold,look,pay,stand,think',
	  'by': 'come,drop,get,go,stop,swear,swing,tick,zip',
	  'down': 'bog,calm,fall,hand,hunker,jot,knock,lie,narrow,note,pat,pour,run,tone,trickle,wear',
	  'for': 'fend,file,gun,hanker,root,shoot',
	  'forth': 'bring,come',
	  'forward': 'come,look',
	  'in': 'cave,chip,hone,jump,key,pencil,plug,rein,shade,sleep,stop,suck,tie,trade,tuck,usher,weigh,zero',
	  'into': 'look,run',
	  'it': 'go,have',
	  'off': 'auction,be,beat,blast,block,brush,burn,buzz,cast,cool,drop,end,face,fall,fend,frighten,goof,jack,kick,knock,laugh,level,live,make,mouth,nod,pair,pay,peel,read,reel,ring,rip,round,sail,shave,shoot,sleep,slice,split,square,stave,stop,storm,strike,tear,tee,tick,tip,top,walk,work,write',
	  'on': 'bank,bargain,frown,hit,latch,pile,prattle,press,spring,spur,tack,urge,yammer',
	  'out': 'act,ask,back,bail,bear,black,blank,bleed,blow,blurt,branch,buy,cancel,cut,eat,edge,farm,figure,find,fill,find,fish,fizzle,flake,flame,flare,flesh,flip,geek,get,help,hide,hold,iron,knock,lash,level,listen,lose,luck,make,max,miss,nerd,pan,pass,pick,pig,point,print,psych,rat,read,rent,root,rule,run,scout,see,sell,shout,single,sit,smoke,sort,spell,splash,stamp,start,storm,straighten,suss,time,tire,top,trip,trot,wash,watch,weird,whip,wimp,wipe,work,zone,zonk',
	  'over': 'bend,bubble,do,fall,get,gloss,hold,keel,mull,pore,sleep,spill,think,tide,tip',
	  'round': 'get,go',
	  'through': 'go,run',
	  'to': 'keep,see',
	  'up': 'act,beef,board,bone,boot,brighten,build,buy,catch,cheer,cook,end,eye,face,fatten,feel,fess,finish,fire,firm,flame,flare,free,freeze,freshen,fry,fuel,gang,gear,goof,hack,ham,heat,hit,hole,hush,jazz,juice,lap,light,lighten,line,link,listen,live,loosen,make,mash,measure,mess,mix,mock,mop,muddle,open,own,pair,patch,pick,prop,psych,read,rough,rustle,save,shack,sign,size,slice,slip,snap,sober,spark,split,spruce,stack,start,stay,stir,stitch,straighten,string,suck,suit,sum,team,tee,think,tidy,tighten,toss,trade,trip,type,vacuum,wait,wake,warm,weigh,whip,wire,wise,word,write,zip'
	};
	Object.keys(asymmetric).forEach(function (k) {
	  asymmetric[k].split(',').forEach(function (s) {
	    main.push(s + ' ' + k);
	  });
	});

	//at his point all verbs are infinitive. lets make this explicit.
	main = main.reduce(function (h, s) {
	  h[s] = 'VBP';
	  return h;
	}, {});

	//conjugate every phrasal verb. takes ~30ms
	var tags = {
	  present: 'VB',
	  past: 'VBD',
	  future: 'VBF',
	  gerund: 'VBG',
	  infinitive: 'VBP'
	};
	var cache = {}; //cache individual verbs to speed it up
	var split = void 0,
	    verb = void 0,
	    particle = void 0,
	    phrasal = void 0;
	Object.keys(main).forEach(function (s) {
	  split = s.split(' ');
	  verb = split[0];
	  particle = split[1];
	  if (cache[verb] === undefined) {
	    cache[verb] = verb_conjugate(verb);
	  }
	  Object.keys(cache[verb]).forEach(function (k) {
	    phrasal = cache[verb][k] + ' ' + particle;
	    if (tags[k]) {
	      main[phrasal] = tags[k];
	    }
	  });
	});

	// console.log(main);
	// console.log(main['mess about']);
	module.exports = main;

	},{"../term/verb/conjugate/conjugate.js":102}],19:[function(_dereq_,module,exports){
	'use strict';

	var fns = _dereq_('../fns');

	//uncompressed country names
	var countries = ['bahamas', 'bangladesh', 'belgium', 'brazil', 'burkina faso', 'burundi', 'cape verde', 'chad', 'chile', 'comoros', 'congo-brazzaville', 'cuba', 'côte d\'ivoire', 'denmark', 'djibouti', 'ecuador', 'egypt', 'el salvador', 'fiji', 'france', 'germany', 'greece', 'guinea-bissau', 'haiti', 'honduras', 'hungary', 'iraq', 'israel', 'italy', 'jamaica', 'kenya', 'kuwait', 'laos', 'lesotho', 'libya', 'luxembourg', 'malawi', 'mali', 'malta', 'mexico', 'moldova', 'morocco', 'mozambique', 'netherlands', 'nicaragua', 'niger', 'panama', 'peru', 'solomon islands', 'sri lanka', 'suriname', 'sweden', 'timor-leste', 'turkey', 'u.s.a.', 'united kingdom', 'usa', 'ussr', 'vietnam', 'yemen', 'zimbabwe'];
	var compressed_countries = {
	  istan: 'pak,uzbek,afghan,tajik,turkmen',
	  ublic: 'czech rep,dominican rep,central african rep',
	  uinea: 'g,papua new g,equatorial g',
	  land: 'thai,po,switzer,fin,republic of ire,new zea,swazi,ice',
	  ania: 'tanz,rom,maurit,lithu,alb',
	  rica: 'ame,united states of ame,south af,costa ',
	  mbia: 'colo,za,ga',
	  eria: 'nig,alg,lib',
	  nia: 'arme,macedo,slove,esto',
	  sia: 'indone,rus,malay,tuni',
	  ina: 'ch,argent,bosnia and herzegov',
	  tan: 'kazakhs,kyrgyzs,bhu',
	  ana: 'gh,botsw,guy',
	  bia: 'saudi ara,ser,nami',
	  lia: 'austra,soma,mongo',
	  rea: 'south ko,north ko,erit',
	  dan: 'su,south su,jor',
	  ria: 'sy,aust,bulga',
	  ia: 'ind,ethiop,cambod,boliv,slovak,georg,croat,latv',
	  an: 'jap,ir,taiw,azerbaij,om',
	  da: 'ugan,cana,rwan',
	  us: 'belar,mauriti,cypr',
	  al: 'nep,seneg,portug',
	  in: 'spa,ben,bahra',
	  go: 'dr con,to,trinidad-toba',
	  la: 'venezue,ango,guatema',
	  es: 'united stat,philippin,united arab emirat',
	  on: 'camero,leban,gab',
	  ar: 'myanm,madagasc,qat',
	  ay: 'paragu,norw,urugu',
	  ne: 'ukrai,sierra leo,palesti'
	};
	countries = fns.expand_suffixes(countries, compressed_countries);

	/////uncomressed cities
	var cities = ['aalborg', 'abu dhabi', 'ahmedabad', 'almaty', 'antwerp', 'aqaba', 'ashdod', 'ashgabat', 'athens', 'auckland', 'bogotá', 'brno', 'brussels', 'calgary', 'cape town', 'cebu', 'cluj-napoca', 'curitiba', 'doha', 'dushanbe', 'espoo', 'frankfurt', 'genoa', 'ghent', 'giza', 'graz', 'guangzhou', 'haifa', 'hanoi', 'helsinki', 'ho chi minh', 'homs', 'iași', 'innsbruck', 'i̇zmir', 'jakarta', 'kiev', 'kingston', 'klaipėda', 'kobe', 'košice', 'kraków', 'kuwait', 'la plata', 'luxembourg', 'medellín', 'mexico', 'miskolc', 'montevideo', 'montreal', 'moscow', 'nagoya', 'nice', 'niš', 'odessa', 'oslo', 'ottawa', 'palermo', 'paris', 'perth', 'phnom penh', 'phoenix', 'port elizabeth', 'poznań', 'prague', 'reykjavik', 'riga', 'rome', 'rosario', 'seville', 'skopje', 'split', 'stockholm', 'stuttgart', 'sydney', 'tbilisi', 'tegucigalpa', 'the hague', 'thessaloniki', 'tokyo', 'toulouse', 'trondheim', 'tunis', 'turku', 'utrecht', 'vantaa', 'västerås', 'warsaw', 'winnipeg', 'wrocław', 'zagreb', 'zaragoza', 'łódź'];

	var suffix_compressed_cities = {
	  burg: 'saint peters,yekaterin,ham,til,gothen,salz',
	  ton: 'hous,edmon,welling,hamil',
	  ion: 'hauts-bassins reg,nord reg,herakl',
	  ana: 'hav,tir,ljublj',
	  ara: 'guadalaj,ank,timișo',
	  an: 'tehr,mil,durb,bus,tain,abidj,amm,yerev',
	  ia: 'philadelph,brasíl,alexandr,pretor,valenc,sof,nicos',
	  on: 'ly,lond,yang,inche,daeje,lisb',
	  en: 'shenzh,eindhov,pils,copenhag,berg',
	  ng: 'beiji,chittago,pyongya,kaohsiu,taichu',
	  in: 'tianj,berl,tur,dubl,duned',
	  es: 'los angel,nant,napl,buenos air,f',
	  la: 'pueb,mani,barranquil,kampa,guatema',
	  or: 'salvad,san salvad,ulan bat,marib',
	  us: 'damasc,pirae,aarh,vilni',
	  as: 'carac,patr,burg,kaun',
	  va: 'craio,petah tik,gene,bratisla',
	  ai: 'shangh,mumb,chenn,chiang m',
	  ne: 'colog,melbour,brisba,lausan',
	  er: 'manchest,vancouv,tangi',
	  ka: 'dha,osa,banja lu',
	  ro: 'rio de janei,sappo,cai',
	  am: 'birmingh,amsterd,rotterd',
	  ur: 'kuala lump,winterth,kópavog',
	  ch: 'muni,züri,christchur',
	  na: 'barcelo,vien,var',
	  ma: 'yokoha,li,pana',
	  ul: 'istanb,seo,kab',
	  to: 'toron,qui,por',
	  iv: 'khark,lv,tel av',
	  sk: 'dnipropetrov,gdań,min'
	};

	cities = fns.expand_suffixes(cities, suffix_compressed_cities);

	var prefix_compressed_cities = {
	  'new ': 'delhi,york,taipei',
	  san: 'a\'a,tiago, josé',
	  ta: 'ipei,mpere,llinn,rtu',
	  ba: 'ngalore,ngkok,ku,sel',
	  li: 'verpool,ège,nz,massol',
	  ma: 'rseille,ndalay,drid,lmö',
	  be: 'rn,lgrade,irut',
	  ka: 'rachi,raj,ndy',
	  da: 'egu,kar,ugavpils',
	  ch: 'icago,arleroi,ișinău',
	  co: 'lombo,nstanța,rk',
	  bu: 'rsa,charest,dapest'
	};
	cities = fns.expand_prefixes(cities, prefix_compressed_cities);

	//some of the busiest airports in the world from
	//https://www.world-airport-codes.com/world-top-30-airports.html
	var airports = ['ams', 'atl', 'bcn', 'bkk', 'cdg', 'cgk', 'clt', 'den', 'dfw', 'dxb', 'fco', 'fra', 'hkg', 'hnd', 'iax', 'icn', 'ist', 'jfk', 'kul', 'las', 'lax', 'lgw', 'lhr', 'mco', 'mia', 'muc', 'ord', 'pek', 'phl', 'phx', 'sfo', 'syd', 'yyz'];

	module.exports = {
	  countries: countries,
	  cities: cities,
	  airports: airports
	};
	// console.log(cities[99]);
	// console.log(countries[99]);

	},{"../fns":23}],20:[function(_dereq_,module,exports){
	'use strict';

	//professions 'lawyer' that aren't covered by verb.to_actor()

	module.exports = ['accountant', 'advisor', 'farmer', 'mechanic', 'technician', 'architect', 'clerk', 'therapist', 'bricklayer', 'butcher', 'carpenter', 'nurse', 'engineer', 'supervisor', 'attendant', 'operator', 'dietician', 'housekeeper', 'advisor', 'agent', 'firefighter', 'fireman', 'policeman', 'attendant', 'scientist', 'gardener', 'hairdresser', 'instructor', 'programmer', 'administrator', 'journalist', 'assistant', 'lawyer', 'officer', 'plumber', 'inspector', 'psychologist', 'receptionist', 'roofer', 'sailor', 'security guard', 'photographer', 'soldier', 'surgeon', 'researcher', 'practitioner', 'politician', 'musician', 'artist', 'secretary', 'minister', 'deputy', 'president'];

	},{}],21:[function(_dereq_,module,exports){
	'use strict';

	//common nouns that have no plural form. These are suprisingly rare
	//used in noun.inflect(), and added as nouns in lexicon
	module.exports = ['aircraft', 'bass', 'bison', 'fowl', 'halibut', 'moose', 'salmon', 'spacecraft', 'tuna', 'trout', 'advice', 'information', 'knowledge', 'trouble', 'enjoyment', 'fun', 'recreation', 'relaxation', 'meat', 'rice', 'bread', 'cake', 'coffee', 'ice', 'water', 'oil', 'grass', 'hair', 'fruit', 'wildlife', 'equipment', 'machinery', 'furniture', 'mail', 'luggage', 'jewelry', 'clothing', 'money', 'mathematics', 'economics', 'physics', 'civics', 'ethics', 'gymnastics', 'mumps', 'measles', 'news', 'tennis', 'baggage', 'currency', 'soap', 'toothpaste', 'food', 'sugar', 'butter', 'flour', 'research', 'leather', 'wool', 'wood', 'coal', 'weather', 'homework', 'cotton', 'silk', 'patience', 'impatience', 'vinegar', 'art', 'beef', 'blood', 'cash', 'chaos', 'cheese', 'chewing', 'conduct', 'confusion', 'education', 'electricity', 'entertainment', 'fiction', 'forgiveness', 'gold', 'gossip', 'ground', 'happiness', 'history', 'honey', 'hospitality', 'importance', 'justice', 'laughter', 'leisure', 'lightning', 'literature', 'luck', 'melancholy', 'milk', 'mist', 'music', 'noise', 'oxygen', 'paper', 'peace', 'peanut', 'pepper', 'petrol', 'plastic', 'pork', 'power', 'pressure', 'rain', 'recognition', 'sadness', 'safety', 'salt', 'sand', 'scenery', 'shopping', 'silver', 'snow', 'softness', 'space', 'speed', 'steam', 'sunshine', 'tea', 'thunder', 'time', 'traffic', 'trousers', 'violence', 'warmth', 'wine', 'steel', 'soccer', 'hockey', 'golf', 'fish', 'gum', 'liquid', 'series', 'sheep', 'species', 'fahrenheit', 'celcius', 'kelvin', 'hertz', 'everyone', 'everybody'];

	},{}],22:[function(_dereq_,module,exports){
	//most-frequent non-irregular verbs, in infinitive form, to be conjugated for the lexicon
	//this list is the seed, from which various forms are conjugated
	'use strict';

	var fns = _dereq_('../fns');

	//suffix-index adjectives
	//  {cial:'cru,spe'} -> 'crucial', 'special'
	var compressed = {
	  prove: ',im,ap,disap',
	  serve: ',de,ob,re',
	  ress: 'exp,p,prog,st,add,d',
	  lect: 'ref,se,neg,col,e',
	  sist: 'in,con,per,re,as',
	  tain: 'ob,con,main,s,re',
	  mble: 'rese,gru,asse,stu',
	  ture: 'frac,lec,tor,fea',
	  port: 're,sup,ex,im',
	  ate: 'rel,oper,indic,cre,h,activ,estim,particip,d,anticip,evalu',
	  use: ',ca,over,ref,acc,am,pa,ho',
	  ive: 'l,rece,d,arr,str,surv,thr,rel',
	  are: 'prep,c,comp,sh,st,decl,d,sc',
	  ine: 'exam,imag,determ,comb,l,decl,underm,def',
	  nce: 'annou,da,experie,influe,bou,convi,enha',
	  ain: 'tr,rem,expl,dr,compl,g,str',
	  ent: 'prev,repres,r,res,rel,inv',
	  age: 'dam,mess,man,encour,eng,discour',
	  rge: 'su,cha,eme,u,me',
	  ise: 'ra,exerc,prom,surpr,pra',
	  ect: 'susp,dir,exp,def,rej',
	  ter: 'en,mat,cen,ca,al',
	  end: ',t,dep,ext,att',
	  est: 't,sugg,prot,requ,r',
	  ock: 'kn,l,sh,bl,unl',
	  nge: 'cha,excha,ra,challe,plu',
	  ase: 'incre,decre,purch,b,ce',
	  ish: 'establ,publ,w,fin,distingu',
	  mit: 'per,ad,sub,li',
	  ure: 'fig,ens,end,meas',
	  der: 'won,consi,mur,wan',
	  ave: 's,sh,w,cr',
	  ire: 'requ,des,h,ret',
	  tch: 'scra,swi,ma,stre',
	  ack: 'att,l,p,cr',
	  ion: 'ment,quest,funct,envis',
	  ump: 'j,l,p,d',
	  ide: 'dec,prov,gu,s',
	  ush: 'br,cr,p,r',
	  eat: 'def,h,tr,ch',
	  ash: 'sm,spl,w,fl',
	  rry: 'ca,ma,hu,wo',
	  ear: 'app,f,b,disapp',
	  er: 'answ,rememb,off,suff,cov,discov,diff,gath,deliv,both,empow,with',
	  le: 'fi,sett,hand,sca,whist,enab,smi,ming,ru,sprink,pi',
	  st: 'exi,foreca,ho,po,twi,tru,li,adju,boa,contra,boo',
	  it: 'vis,ed,depos,sp,awa,inhib,cred,benef,prohib,inhab',
	  nt: 'wa,hu,pri,poi,cou,accou,confro,warra,pai',
	  ch: 'laun,rea,approa,sear,tou,ar,enri,atta',
	  ss: 'discu,gue,ki,pa,proce,cro,glo,dismi',
	  ll: 'fi,pu,ki,ca,ro,sme,reca,insta',
	  rn: 'tu,lea,conce,retu,bu,ea,wa,gove',
	  ce: 'redu,produ,divor,fa,noti,pla,for,repla',
	  te: 'contribu,uni,tas,vo,no,constitu,ci',
	  rt: 'sta,comfo,exe,depa,asse,reso,conve',
	  ck: 'su,pi,che,ki,tri,wre',
	  ct: 'intera,restri,predi,attra,depi,condu',
	  ke: 'sta,li,bra,overta,smo,disli',
	  se: 'collap,suppo,clo,rever,po,sen',
	  nd: 'mi,surrou,dema,remi,expa,comma',
	  ve: 'achie,invol,remo,lo,belie,mo',
	  rm: 'fo,perfo,confi,confo,ha',
	  or: 'lab,mirr,fav,monit,hon',
	  ue: 'arg,contin,val,iss,purs',
	  ow: 'all,foll,sn,fl,borr',
	  ay: 'pl,st,betr,displ,portr',
	  ze: 'recogni,reali,snee,ga,emphasi',
	  ip: 'cl,d,gr,sl,sk',
	  re: 'igno,sto,interfe,sco',
	  ng: 'spri,ba,belo,cli',
	  ew: 'scr,vi,revi,ch',
	  gh: 'cou,lau,outwei,wei',
	  ly: 'app,supp,re,multip',
	  ge: 'jud,acknowled,dod,alle',
	  en: 'list,happ,threat,strength',
	  ee: 'fors,agr,disagr,guarant',
	  et: 'budg,regr,mark,targ',
	  rd: 'rega,gua,rewa,affo',
	  am: 'dre,j,sl,ro',
	  ry: 'va,t,c,bu'
	};
	var arr = ['hope', 'thank', 'work', 'stop', 'control', 'join', 'enjoy', 'fail', 'aid', 'ask', 'talk', 'add', 'walk', 'describe', 'study', 'seem', 'occur', 'claim', 'fix', 'help', 'design', 'include', 'need', 'keep', 'assume', 'accept', 'do', 'look', 'die', 'seek', 'attempt', 'bomb', 'cook', 'copy', 'claw', 'doubt', 'drift', 'envy', 'fold', 'flood', 'focus', 'lift', 'link', 'load', 'loan', 'melt', 'overlap', 'rub', 'repair', 'sail', 'sleep', 'trade', 'trap', 'travel', 'tune', 'undergo', 'undo', 'uplift', 'yawn', 'plan', 'reveal', 'owe', 'sneak', 'drop', 'name', 'head', 'spoil', 'echo', 'deny', 'yield', 'reason', 'defy', 'applaud', 'risk', 'step', 'deem', 'embody', 'adopt', 'convey', 'pop', 'grab', 'revel', 'stem', 'mark', 'drag', 'pour', 'reckon', 'assign', 'rank', 'destroy', 'float', 'appeal', 'grasp', 'shout', 'overcome', 'relax', 'excel', 'plug', 'proclaim', 'ruin', 'abandon', 'overwhelm', 'wipe', 'added', 'took', 'goes', 'avoid', 'come', 'set', 'pay', 'grow', 'inspect', 'instruct', 'know', 'take', 'let', 'sort', 'put', 'take', 'cut', 'become', 'reply', 'happen', 'watch', 'associate', 'send', 'archive', 'cancel', 'learn', 'transfer', 'minus', 'plus', 'multiply', 'divide'];

	module.exports = fns.expand_suffixes(arr, compressed);

	},{"../fns":23}],23:[function(_dereq_,module,exports){
	'use strict';

	exports.pluck = function (arr, str) {
	  arr = arr || [];
	  return arr.map(function (o) {
	    return o[str];
	  });
	};

	//make an array of strings easier to lookup
	exports.toObj = function (arr) {
	  return arr.reduce(function (h, a) {
	    h[a] = true;
	    return h;
	  }, {});
	};
	//turn key->value into value->key
	exports.reverseObj = function (obj) {
	  return Object.keys(obj).reduce(function (h, k) {
	    h[obj[k]] = k;
	    return h;
	  }, {});
	};

	//turn a nested array into one array
	exports.flatten = function (arr) {
	  var all = [];
	  arr.forEach(function (a) {
	    all = all.concat(a);
	  });
	  return all;
	};

	//string utilities
	exports.endsWith = function (str, suffix) {
	  //if suffix is regex
	  if (suffix && suffix instanceof RegExp) {
	    if (str.match(suffix)) {
	      return true;
	    }
	  }
	  //if suffix is a string
	  if (str && suffix && str.indexOf(suffix, str.length - suffix.length) !== -1) {
	    return true;
	  }
	  return false;
	};
	exports.startsWith = function (str, prefix) {
	  if (str && str.length && str.substr(0, 1) === prefix) {
	    return true;
	  }
	  return false;
	};

	exports.extend = function (a, b) {
	  var keys = Object.keys(b);
	  for (var i = 0; i < keys.length; i++) {
	    a[keys[i]] = b[keys[i]];
	  }
	  return a;
	};

	exports.titlecase = function (str) {
	  if (!str) {
	    return '';
	  }
	  str = str.toLowerCase();
	  return str.charAt(0).toUpperCase() + str.slice(1);
	};

	// typeof obj == "function" also works
	// but not in older browsers. :-/
	exports.isFunction = function (obj) {
	  return Object.prototype.toString.call(obj) === '[object Function]';
	};

	//uncompress data in the adhoc compressed form {'ly':'kind,quick'}
	exports.expand_suffixes = function (list, obj) {
	  var keys = Object.keys(obj);
	  var l = keys.length;
	  for (var i = 0; i < l; i++) {
	    var arr = obj[keys[i]].split(',');
	    for (var i2 = 0; i2 < arr.length; i2++) {
	      list.push(arr[i2] + keys[i]);
	    }
	  }
	  return list;
	};
	//uncompress data in the adhoc compressed form {'over':'blown,kill'}
	exports.expand_prefixes = function (list, obj) {
	  var keys = Object.keys(obj);
	  var l = keys.length;
	  for (var i = 0; i < l; i++) {
	    var arr = obj[keys[i]].split(',');
	    for (var i2 = 0; i2 < arr.length; i2++) {
	      list.push(keys[i] + arr[i2]);
	    }
	  }
	  return list;
	};

	},{}],24:[function(_dereq_,module,exports){
	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var fns = _dereq_('./fns.js');

	var models = {
	  Term: _dereq_('./term/term.js'),
	  Text: _dereq_('./text/text.js'),
	  Sentence: _dereq_('./sentence/sentence.js'),
	  Statement: _dereq_('./sentence/statement/statement.js'),
	  Question: _dereq_('./sentence/question/question.js'),
	  Verb: _dereq_('./term/verb/verb.js'),
	  Adjective: _dereq_('./term/adjective/adjective.js'),
	  Adverb: _dereq_('./term/adverb/adverb.js'),
	  Noun: _dereq_('./term/noun/noun.js'),
	  Value: _dereq_('./term/noun/value/value.js'),
	  Person: _dereq_('./term/noun/person/person.js'),
	  Place: _dereq_('./term/noun/place/place.js'),
	  Date: _dereq_('./term/noun/date/date.js'),
	  Organization: _dereq_('./term/noun/organization/organization.js')
	};

	function NLP() {

	  this.plugin = function (obj) {
	    obj = obj || {};
	    // if obj is a function, pass it an instance of this nlp library
	    if (fns.isFunction(obj)) {
	      // run it in this current context
	      obj = obj.call(this, this);
	    }
	    //apply each plugin to the correct prototypes
	    Object.keys(obj).forEach(function (k) {
	      Object.keys(obj[k]).forEach(function (method) {
	        models[k].prototype[method] = obj[k][method];
	      });
	    });
	  };
	  this.lexicon = function (obj) {
	    obj = obj || {};
	    var lex = _dereq_('./lexicon.js');

	    Object.keys(obj).forEach(function (k) {
	      lex[k] = obj[k];
	    });

	    return lex;
	  };

	  this.term = function (s) {
	    return new models.Term(s);
	  };
	  this.noun = function (s) {
	    return new models.Noun(s);
	  };
	  this.verb = function (s) {
	    return new models.Verb(s);
	  };
	  this.adjective = function (s) {
	    return new models.Adjective(s);
	  };
	  this.adverb = function (s) {
	    return new models.Adverb(s);
	  };

	  this.value = function (s) {
	    return new models.Value(s);
	  };
	  this.person = function (s) {
	    return new models.Person(s);
	  };
	  this.place = function (s) {
	    return new models.Place(s);
	  };
	  this.date = function (s) {
	    return new models.Date(s);
	  };
	  this.organization = function (s) {
	    return new models.Organization(s);
	  };

	  this.text = function (s, options) {
	    return new models.Text(s, options);
	  };
	  this.sentence = function (s, options) {
	    return new models.Sentence(s, options);
	  };
	  this.statement = function (s) {
	    return new models.Statement(s);
	  };
	  this.question = function (s) {
	    return new models.Question(s);
	  };
	}

	var nlp = new NLP();
	//export to window or webworker
	if ((typeof window === 'undefined' ? 'undefined' : _typeof(window)) === 'object' || typeof DedicatedWorkerGlobalScope === 'function') {
	  self.nlp_compromise = nlp;
	}
	//export to commonjs
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = nlp;
	}
	//export to amd
	if (typeof define === 'function' && define.amd) {
	  define(nlp);
	}

	// console.log(nlp.verb('played').conjugate());

	},{"./fns.js":23,"./lexicon.js":25,"./sentence/question/question.js":57,"./sentence/sentence.js":60,"./sentence/statement/statement.js":63,"./term/adjective/adjective.js":64,"./term/adverb/adverb.js":69,"./term/noun/date/date.js":74,"./term/noun/noun.js":80,"./term/noun/organization/organization.js":82,"./term/noun/person/person.js":86,"./term/noun/place/place.js":88,"./term/noun/value/value.js":100,"./term/term.js":101,"./term/verb/verb.js":111,"./text/text.js":114}],25:[function(_dereq_,module,exports){
	//the lexicon is a big hash of words to pos tags
	//it's built by conjugating and inflecting a small seed of terms
	'use strict';

	var fns = _dereq_('./fns.js');
	var verb_conjugate = _dereq_('./term/verb/conjugate/conjugate.js');
	var verb_to_adjective = _dereq_('./term/verb/to_adjective.js');
	var to_comparative = _dereq_('./term/adjective/to_comparative.js');
	var to_superlative = _dereq_('./term/adjective/to_superlative.js');
	var to_adverb = _dereq_('./term/adjective/to_adverb.js');
	var grand_mapping = _dereq_('./sentence/pos/parts_of_speech.js').tag_mapping;

	var lexicon = {};

	var addObj = function addObj(obj) {
	  var keys = Object.keys(obj);
	  var l = keys.length;
	  for (var i = 0; i < l; i++) {
	    lexicon[keys[i]] = obj[keys[i]];
	  }
	};

	var addArr = function addArr(arr, tag) {
	  var l = arr.length;
	  for (var i = 0; i < l; i++) {
	    lexicon[arr[i]] = tag;
	  }
	};

	//conjugate all verbs.
	var verbMap = {
	  infinitive: 'Infinitive',
	  present: 'PresentTense',
	  past: 'PastTense',
	  gerund: 'Gerund',
	  actor: 'Actor',
	  future: 'FutureTense',
	  pluperfect: 'PluperfectTense',
	  perfect: 'PerfectTense',

	  PerfectTense: 'PerfectTense',
	  PluperfectTense: 'PluperfectTense',
	  FutureTense: 'FutureTense',
	  PastTense: 'PastTense',
	  PresentTense: 'PresentTense'
	};

	var irregulars = _dereq_('./data/irregular_verbs.js');
	var verbs = _dereq_('./data/verbs.js').concat(Object.keys(irregulars));

	var _loop = function _loop(i) {
	  var o = verb_conjugate(verbs[i]);
	  Object.keys(o).forEach(function (k) {
	    if (k && o[k] && verbMap[k]) {
	      lexicon[o[k]] = verbMap[k];
	    }
	  });
	  //also add their adjective form - "walkable"
	  lexicon[verb_to_adjective(verbs[i])] = 'Adjective';
	};

	for (var i = 0; i < verbs.length; i++) {
	  _loop(i);
	}

	var orgs = _dereq_('./data/organizations.js');
	addArr(orgs.organizations, 'Organization');
	addArr(orgs.suffixes, 'Noun');

	var places = _dereq_('./data/places.js');
	addArr(places.countries, 'Country');
	addArr(places.cities, 'City');

	_dereq_('./data/adjectives.js').forEach(function (s) {
	  lexicon[s] = 'Adjective';
	  lexicon[to_comparative(s)] = 'Comparative';
	  lexicon[to_superlative(s)] = 'Superlative';
	  lexicon[to_adverb(s)] = 'Adverb';
	});
	Object.keys(_dereq_('./data/convertables.js')).forEach(function (s) {
	  lexicon[s] = 'Adjective';
	  lexicon[to_comparative(s)] = 'Comparative';
	  lexicon[to_superlative(s)] = 'Superlative';
	  lexicon[to_adverb(s)] = 'Adverb';
	});

	addArr(_dereq_('./data/abbreviations.js').abbreviations, 'Abbreviation');
	addArr(_dereq_('./data/demonyms.js'), 'Demonym');
	addArr(_dereq_('./data/currencies.js'), 'Currency');
	addArr(_dereq_('./data/honourifics.js'), 'Honourific');
	addArr(_dereq_('./data/uncountables.js'), 'Noun');
	var dates = _dereq_('./data/dates.js');
	addArr(dates.days, 'Date');
	addArr(dates.months, 'Date');
	addArr(dates.durations, 'Date');
	addArr(dates.relative, 'Date');

	//unpack the numbers
	var nums = _dereq_('./data/numbers.js');
	var all_nums = Object.keys(nums).reduce(function (arr, k) {
	  arr = arr.concat(Object.keys(nums[k]));
	  return arr;
	}, []);
	addArr(all_nums, 'Value');

	//a little fancy
	var firstNames = _dereq_('./data/firstnames.js');
	//add all names
	addArr(Object.keys(firstNames.all), 'Person');
	//overwrite to MalePerson, FemalePerson
	addArr(firstNames.male, 'MalePerson');
	addArr(firstNames.female, 'FemalePerson');
	//add irregular nouns
	var irregNouns = _dereq_('./data/irregular_nouns.js');
	addArr(fns.pluck(irregNouns, 0), 'Noun');
	addArr(fns.pluck(irregNouns, 1), 'Plural');

	addObj(_dereq_('./data/misc.js'));
	addObj(_dereq_('./data/multiples.js'));
	addObj(_dereq_('./data/phrasal_verbs.js'));
	//add named holidays, like 'easter'
	Object.keys(_dereq_('./data/holidays.js')).forEach(function (k) {
	  lexicon[k] = 'Date';
	});

	//professions
	addArr(_dereq_('./data/professions.js'), 'Actor');

	//just in case
	delete lexicon[false];
	delete lexicon[true];
	delete lexicon[undefined];
	delete lexicon[null];
	delete lexicon[''];

	//use 'Noun', not 'NN'
	Object.keys(lexicon).forEach(function (k) {
	  lexicon[k] = grand_mapping[lexicon[k]] || lexicon[k];
	});

	module.exports = lexicon;
	// console.log(lexicon['doing']);

	},{"./data/abbreviations.js":1,"./data/adjectives.js":2,"./data/convertables.js":3,"./data/currencies.js":4,"./data/dates.js":5,"./data/demonyms.js":6,"./data/firstnames.js":7,"./data/holidays.js":8,"./data/honourifics.js":9,"./data/irregular_nouns.js":10,"./data/irregular_verbs.js":11,"./data/misc.js":12,"./data/multiples.js":13,"./data/numbers.js":16,"./data/organizations.js":17,"./data/phrasal_verbs.js":18,"./data/places.js":19,"./data/professions.js":20,"./data/uncountables.js":21,"./data/verbs.js":22,"./fns.js":23,"./sentence/pos/parts_of_speech.js":38,"./term/adjective/to_adverb.js":65,"./term/adjective/to_comparative.js":66,"./term/adjective/to_superlative.js":68,"./term/verb/conjugate/conjugate.js":102,"./term/verb/to_adjective.js":110}],26:[function(_dereq_,module,exports){
	'use strict';
	// a regex-like lookup for a list of terms.
	// returns matches in a 'Terms' class

	var Result = _dereq_('./result');
	var syntax_parse = _dereq_('./syntax_parse');
	var match_term = _dereq_('./match_term');

	// take a slice of our terms, and try a match starting here
	var tryFromHere = function tryFromHere(terms, regs, options) {
	  var result = [];
	  var which_term = 0;
	  for (var i = 0; i < regs.length; i++) {
	    var term = terms[which_term];
	    //if we hit the end of terms, prematurely
	    if (!term) {
	      return null;
	    }
	    //find a match with term, (..), [..], or ~..~ syntax
	    if (match_term(term, regs[i], options)) {
	      //handle '$' logic
	      if (regs[i].signals.trailing && terms[which_term + 1]) {
	        return null;
	      }
	      //handle '^' logic
	      if (regs[i].signals.leading && which_term !== 0) {
	        return null;
	      }
	      result.push(terms[which_term]);
	      which_term += 1;
	      continue;
	    }
	    //if it's a contraction, go to next term
	    if (term.normal === '') {
	      result.push(terms[which_term]);
	      which_term += 1;
	      term = terms[which_term];
	    }
	    //support wildcards, some matching logic
	    // '.' means easy-pass
	    if (regs[i].signals.any_one) {
	      result.push(terms[which_term]);
	      which_term += 1;
	      continue;
	    }
	    //else, if term was optional, continue anyways
	    if (regs[i].signals.optional) {
	      continue; //(this increments i, but not which_term)
	    }
	    //attempt is dead.
	    return null;
	  }
	  //success, return terms subset
	  return result;
	};

	//find first match and return []Terms
	var findAll = function findAll(terms, regs, options) {
	  var result = [];
	  regs = syntax_parse(regs || '');
	  // one-off lookup for ^
	  // '^' token is 'must start at 0'
	  if (regs[0].signals.leading) {
	    var match = tryFromHere(terms, regs, options) || [];
	    if (match) {
	      return [new Result(match)];
	    } else {
	      return null;
	    }
	  }

	  //repeating version starting from each term
	  var len = terms.length; // - regs.length + 1;
	  for (var i = 0; i < len; i++) {
	    var termSlice = terms.slice(i, terms.length);
	    var _match = tryFromHere(termSlice, regs, options);
	    if (_match) {
	      result.push(new Result(_match));
	    }
	  }
	  //if we have no results, return null
	  if (result.length === 0) {
	    return null;
	  }
	  return result;
	};

	//calls Terms.replace() on each found result
	var replaceAll = function replaceAll(terms, regs, replacement, options) {
	  var list = findAll(terms, regs, options);
	  if (list) {
	    list.forEach(function (t) {
	      t.replace(replacement, options);
	    });
	  }
	};

	module.exports = {
	  findAll: findAll,
	  replaceAll: replaceAll
	};

	},{"./match_term":27,"./result":28,"./syntax_parse":29}],27:[function(_dereq_,module,exports){
	'use strict';

	var fns = _dereq_('../fns.js');

	//a regex-like string search
	// returns a boolean for match/not
	var match_term = function match_term(term, reg) {
	  //fail-fast
	  if (!term || !reg || !reg.signals) {
	    return false;
	  }
	  var signals = reg.signals;

	  //support optional (foo|bar) syntax
	  if (signals.one_of) {
	    var arr = reg.term.split('|');
	    for (var i = 0; i < arr.length; i++) {
	      if (arr[i] === term.normal || arr[i] === term.text) {
	        return true;
	      }
	    }
	    return false;
	  }
	  //support [Pos] syntax
	  if (signals.pos) {
	    var pos = fns.titlecase(reg.term);
	    if (term.pos[pos]) {
	      return true;
	    }
	    return false;
	  }
	  //support ~alias~ syntax
	  if (signals.alias) {
	    if (reg.term === term.root()) {
	      return true;
	    }
	    return false;
	  }
	  //straight-up text match
	  if (reg.term === term.normal || reg.term === term.text || reg.term === term.expansion) {
	    return true;
	  }

	  return false;
	};

	module.exports = match_term;

	},{"../fns.js":23}],28:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _match = _dereq_('./match.js');

	// a slice of term objects returned from .match()
	// ideally changes that happen here happen in the original object

	var Result = function () {
	  function Result(terms) {
	    _classCallCheck(this, Result);

	    this.terms = terms;
	  }
	  //wha, this is possible eg. text.match().match()


	  _createClass(Result, [{
	    key: 'match',
	    value: function match(str, options) {
	      return _match(this.terms, str, options);
	    }
	    //a 1-1 replacement of strings

	  }, {
	    key: 'replace',
	    value: function replace(words) {
	      for (var i = 0; i < this.terms.length; i++) {
	        //umm, this is like a capture-group in regexp..
	        //so just leave it
	        if (words[i] === '$') {
	          continue;
	        }
	        //allow replacements with the capture group, like 'cyber-$1'
	        if (words[i].match(/\$1/)) {
	          var combined = words[1].replace(/\$1/, this.terms[i].text);
	          this.terms[i].changeTo(combined);
	          continue;
	        }
	        this.terms[i].changeTo(words[i] || '');
	      }
	      return this;
	    }
	  }, {
	    key: 'text',
	    value: function text() {
	      return this.terms.reduce(function (s, t) {
	        //implicit contractions shouldn't be included
	        if (t.text) {
	          s += ' ' + t.text;
	        }
	        return s;
	      }, '').trim();
	    }
	  }, {
	    key: 'normal',
	    value: function normal() {
	      return this.terms.reduce(function (s, t) {
	        //implicit contractions shouldn't be included
	        if (t.normal) {
	          s += ' ' + t.normal;
	        }
	        return s;
	      }, '').trim();
	    }
	  }]);

	  return Result;
	}();
	//a slice of term objects


	module.exports = Result;

	},{"./match.js":26}],29:[function(_dereq_,module,exports){
	'use strict';
	// parse a search lookup term find the regex-like syntax in this term

	var fns = _dereq_('../fns.js');
	// flags:
	// {
	//   pos: true,
	//   optional: true,
	//   one_of: true,
	//   alias: true,
	//   leading: true,
	//   trailing: true,
	//   any_one: true,
	//   any_many: true,
	// }


	var parse_term = function parse_term(term, i) {
	  term = term || '';
	  term = term.trim();
	  var signals = {};
	  //order matters!

	  //leading ^ flag
	  if (fns.startsWith(term, '^')) {
	    term = term.substr(1, term.length);
	    signals.leading = true;
	  }
	  //trailing $ flag means ending
	  if (fns.endsWith(term, '$')) {
	    term = term.replace(/\$$/, '');
	    signals.trailing = true;
	  }
	  //optional flag
	  if (fns.endsWith(term, '?')) {
	    term = term.replace(/\?$/, '');
	    signals.optional = true;
	  }

	  //pos flag
	  if (fns.startsWith(term, '[') && fns.endsWith(term, ']')) {
	    term = term.replace(/\]$/, '');
	    term = term.replace(/^\[/, '');
	    signals.pos = true;
	  }
	  //one_of options flag
	  if (fns.startsWith(term, '(') && fns.endsWith(term, ')')) {
	    term = term.replace(/\)$/, '');
	    term = term.replace(/^\(/, '');
	    signals.one_of = true;
	  }
	  //alias flag
	  if (fns.startsWith(term, '~')) {
	    term = term.replace(/^\~/, '');
	    term = term.replace(/\~$/, '');
	    signals.alias = true;
	  }
	  //addition flag
	  if (fns.startsWith(term, '+')) {
	    term = term.replace(/^\+/, '');
	    term = term.replace(/\+$/, '');
	    signals.extra = true;
	  }

	  //a period means anything
	  if (term === '.') {
	    signals.any_one = true;
	  }
	  //a * means anything
	  if (term === '*') {
	    signals.any_many = true;
	  }
	  return {
	    term: term,
	    signals: signals,
	    i: i
	  };
	};
	// console.log(parse_term('(one|1) (two|2)'));


	//turn a match string into an array of objects
	var parse_all = function parse_all(regs) {
	  regs = regs || [];
	  return regs.map(parse_term);
	};
	// console.log(parse_all(''));

	module.exports = parse_all;

	},{"../fns.js":23}],30:[function(_dereq_,module,exports){
	'use strict';
	//change a sentence to past, present, or future tense

	var pos = _dereq_('./pos/parts_of_speech.js');

	//conjugate a specific verb
	var flip_verb = function flip_verb(t, tense) {
	  if (tense === 'present') {
	    t.to_present();
	  } else if (tense === 'past') {
	    t.to_past();
	  } else if (tense === 'future') {
	    t.to_future();
	  }
	  return t;
	};

	var change_tense = function change_tense(s, tense) {
	  //convert all verbs
	  for (var i = 0; i < s.terms.length; i++) {
	    var t = s.terms[i];
	    if (t instanceof pos.Verb) {
	      //ignore gerunds too - "is walking"
	      if (t.pos['Gerund']) {
	        continue;
	      }
	      //ignore true infinitives, "go to sleep"
	      if (t.pos['Infinitive']) {
	        if (s.terms[i - 1] && s.terms[i - 1].normal === 'to') {
	          continue;
	        }
	      }
	      s.terms[i] = flip_verb(t, tense);
	    }
	  }
	  return s;
	};

	// [
	//   'john walks to the church',
	//   'john walks and feeds the birds',
	//   'john always walks',
	//   'will you walk?',
	// ];


	module.exports = change_tense;

	},{"./pos/parts_of_speech.js":38}],31:[function(_dereq_,module,exports){
	'use strict';
	//turns 'is not' into "isn't", and "he is" into "he's"

	var contractor = {
	  'will': 'll',
	  'would': 'd',
	  'have': 've',
	  'are': 're',
	  'not': 't',
	  'is': 's'
	  // 'was': 's' //this is too folksy
	};

	var contract = function contract(terms) {
	  for (var i = 1; i < terms.length; i++) {
	    if (contractor[terms[i].normal]) {
	      //remember expansion
	      terms[i - 1].expansion = terms[i - 1].text;
	      terms[i].expansion = terms[i].text;
	      //handle special `n't` case
	      if (terms[i].normal === 'not') {
	        terms[i - 1].text += 'n';
	      }
	      terms[i - 1].text += '\'' + contractor[terms[i].normal];
	      terms[i - 1].rebuild();
	      terms[i].text = '';
	      terms[i].rebuild();
	    }
	  }
	  return terms;
	};

	module.exports = contract;

	},{}],32:[function(_dereq_,module,exports){
	'use strict';

	var expand = function expand(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    if (terms[i].expansion) {
	      terms[i].text = terms[i].expansion;
	      terms[i].rebuild();
	    }
	  }
	  return terms;
	};

	module.exports = expand;

	},{}],33:[function(_dereq_,module,exports){
	'use strict';

	//boolean if sentence has

	// "[copula] [pastTense] by"
	// "[pastParticiple] by"

	var passive_voice = function passive_voice(s) {
	  var terms = s.terms;
	  for (var i = 0; i < terms.length - 2; i++) {
	    if (terms[i].pos['Copula'] && terms[i + 1].pos['Verb'] && terms[i + 2].normal === 'by') {
	      //don't do 'june was approaching by then'
	      if (terms[i + 1].pos['Gerund']) {
	        continue;
	      }
	      return true;
	    }
	  }
	  return false;
	};

	module.exports = passive_voice;

	},{}],34:[function(_dereq_,module,exports){
	'use strict';

	var pos = _dereq_('./parts_of_speech');

	//set the part-of-speech of a particular term
	var assign = function assign(t, tag, reason) {
	  //check if redundant, first
	  if (t.pos[tag]) {
	    return t;
	  }
	  var P = pos.classMapping[tag] || pos.Term;
	  var expansion = t.expansion;
	  var whitespace = t.whitespace;
	  var reasoning = t.reasoning;
	  t = new P(t.text, tag);
	  t.reasoning = reasoning;
	  t.reasoning.push(reason);
	  t.whitespace = whitespace;
	  t.expansion = expansion;
	  return t;
	};
	module.exports = assign;

	},{"./parts_of_speech":38}],35:[function(_dereq_,module,exports){
	'use strict';

	var pos = _dereq_('../parts_of_speech');
	var fns = _dereq_('../../../fns');

	//get the combined text
	var new_string = function new_string(a, b) {
	  var space = a.whitespace.trailing + b.whitespace.preceding;
	  return a.text + space + b.text;
	};

	var combine_two = function combine_two(terms, i, tag, reason) {
	  var a = terms[i];
	  var b = terms[i + 1];
	  //fail-fast
	  if (!a || !b) {
	    return terms;
	  }
	  //keep relevant/consistant old POS tags
	  var old_pos = {};
	  if (a.pos[tag]) {
	    old_pos = a.pos;
	  }
	  if (b.pos[tag]) {
	    old_pos = fns.extend(old_pos, b.pos);
	  }
	  //find the new Pos class
	  var Pos = pos.classMapping[tag] || pos.Term;
	  terms[i] = new Pos(new_string(a, b), tag);
	  //copy-over reasoning
	  terms[i].reasoning = [a.reasoning.join(', '), b.reasoning.join(', ')];
	  terms[i].reasoning.push(reason);
	  //copy-over old pos
	  terms[i].pos = fns.extend(terms[i].pos, old_pos);
	  //combine whitespace
	  terms[i].whitespace.preceding = a.whitespace.preceding;
	  terms[i].whitespace.trailing = b.whitespace.trailing;
	  //kill 'b'
	  terms[i + 1] = null;
	  return terms;
	};

	var combine_three = function combine_three(terms, i, tag, reason) {
	  var a = terms[i];
	  var b = terms[i + 1];
	  var c = terms[i + 2];
	  //fail-fast
	  if (!a || !b || !c) {
	    return terms;
	  }
	  var Pos = pos.classMapping[tag] || pos.Term;
	  var space1 = a.whitespace.trailing + b.whitespace.preceding;
	  var space2 = b.whitespace.trailing + c.whitespace.preceding;
	  var text = a.text + space1 + b.text + space2 + c.text;
	  terms[i] = new Pos(text, tag);
	  terms[i].reasoning = [a.reasoning.join(', '), b.reasoning.join(', ')];
	  terms[i].reasoning.push(reason);
	  //transfer unused-up whitespace
	  terms[i].whitespace.preceding = a.whitespace.preceding;
	  terms[i].whitespace.trailing = c.whitespace.trailing;
	  terms[i + 1] = null;
	  terms[i + 2] = null;
	  return terms;
	};

	module.exports = {
	  two: combine_two,
	  three: combine_three
	};

	},{"../../../fns":23,"../parts_of_speech":38}],36:[function(_dereq_,module,exports){
	'use strict';

	var combine = _dereq_('./combine').three;

	// const dont_lump = [
	// {
	//   condition: (a, b, c) => (),
	//   reason: ''
	// },
	// ];

	var do_lump = [{
	  //John & Joe's
	  condition: function condition(a, b, c) {
	    return a.pos.Noun && (b.text === '&' || b.normal === 'n') && c.pos.Noun;
	  },
	  result: 'Person',
	  reason: 'Noun-&-Noun'
	}, {
	  //June the 5th
	  condition: function condition(a, b, c) {
	    return a.pos.Date && b.normal === 'the' && c.pos.Value;
	  },
	  result: 'Date',
	  reason: 'Date-the-Value'
	}, {
	  //5th of June
	  condition: function condition(a, b, c) {
	    return a.pos.Value && (b.pos.Conjunction || b.pos.Preposition) && c.pos.Date;
	  },
	  result: 'Date',
	  reason: 'Value-Prep-Date'
	}, {
	  //June 5th to 7th
	  condition: function condition(a, b, c) {
	    return a.pos.Date && (b.pos.Conjunction || b.pos.Preposition) && c.pos.Value;
	  },
	  result: 'Date',
	  reason: 'Date-Preposition-Value'
	}, {
	  //3hrs after 5pm
	  condition: function condition(a, b, c) {
	    return a.pos.Date && (c.pos.Date || c.pos.Ordinal) && (b.pos.Preposition || b.pos.Determiner || b.pos.Conjunction || b.pos.Adjective);
	  },
	  result: 'Date',
	  reason: 'Date-Preposition-Date'
	}, {
	  //President of Mexico
	  condition: function condition(a, b, c) {
	    return a.is_capital() && b.normal === 'of' && c.is_capital();
	  },
	  result: 'Noun',
	  reason: 'Capital-of-Capital'
	}, {
	  //three-word quote
	  condition: function condition(a, b, c) {
	    return a.text.match(/^["']/) && !b.text.match(/["']/) && c.text.match(/["']$/);
	  },
	  result: 'Noun',
	  reason: 'Three-word-quote'
	}, {
	  //will have walk
	  condition: function condition(a, b, c) {
	    return a.normal === 'will' && b.normal === 'have' && c.pos.Verb;
	  },
	  result: 'FutureTense',
	  reason: 'will-have-Verb'
	}, {
	  //two hundred and three
	  condition: function condition(a, b, c) {
	    return a.pos.Value && b.normal === 'and' && c.pos.Value;
	  },
	  result: 'Value',
	  reason: 'Value-and-Value'
	}];

	var lump_three = function lump_three(terms) {
	  //fail-fast
	  if (terms.length < 3) {
	    return terms;
	  }
	  for (var i = 0; i < terms.length - 2; i++) {
	    var a = terms[i];
	    var b = terms[i + 1];
	    var c = terms[i + 2];
	    if (!a || !b || !c) {
	      continue;
	    }
	    for (var o = 0; o < do_lump.length; o++) {
	      if (do_lump[o].condition(a, b, c)) {
	        var new_tag = do_lump[o].result;
	        var reason = do_lump[o].reason;
	        terms = combine(terms, i, new_tag, reason);
	        break;
	      }
	    }
	  }
	  //remove empties
	  terms = terms.filter(function (t) {
	    return t;
	  });
	  return terms;
	};

	module.exports = lump_three;

	},{"./combine":35}],37:[function(_dereq_,module,exports){
	'use strict';
	//apply lumper+splitter words to terms to combine them

	var combine = _dereq_('./combine').two;

	//not just 'Noun', but something more deliberate
	var is_specific = function is_specific(t) {
	  var specific = ['Person', 'Place', 'Value', 'Date', 'Organization'];
	  for (var i = 0; i < specific.length; i++) {
	    if (t.pos[specific[i]]) {
	      return true;
	    }
	  }
	  return false;
	};

	//rules that combine two words
	var do_lump = [{
	  condition: function condition(a, b) {
	    return a.pos.Person && b.pos.Honourific || a.pos.Honourific && b.pos.Person;
	  }, //"John sr."
	  result: 'Person',
	  reason: 'person-words'
	}, {
	  //6 am
	  condition: function condition(a, b) {
	    return (a.pos.Value || a.pos.Date) && (b.normal === 'am' || b.normal === 'pm');
	  },
	  result: 'Date',
	  reason: 'date-am/pm'
	}, {
	  //'Dr. John'
	  condition: function condition(a, b) {
	    return a.pos.Honourific && b.is_capital();
	  },
	  result: 'Person',
	  reason: 'person-honourific'
	}, {
	  // "john lkjsdf's"
	  condition: function condition(a, b) {
	    return a.pos.Person && b.pos.Possessive;
	  },
	  result: 'Person',
	  reason: 'person-possessive'
	}, {
	  //"John Abcd" - needs to be careful
	  condition: function condition(a, b) {
	    return a.pos.Person && !a.pos.Pronoun && !a.pos.Possessive && !a.has_comma() && b.is_capital() && !a.is_acronym() && !b.pos.Verb;
	  }, //'Person, Capital -> Person'
	  result: 'Person',
	  reason: 'person-titleCase'
	}, {
	  //June 4
	  condition: function condition(a, b) {
	    return a.pos.Date && b.pos.Value;
	  },
	  result: 'Date',
	  reason: 'date-value'
	}, {
	  //4 June
	  condition: function condition(a, b) {
	    return a.pos.Value && b.pos.Date;
	  },
	  result: 'Date',
	  reason: 'value-date'
	}, {
	  //last wednesday
	  condition: function condition(a, b) {
	    return (a.normal === 'last' || a.normal === 'next' || a.normal === 'this') && b.pos.Date;
	  },
	  result: 'Date',
	  reason: 'relative-date'
	}, {
	  //Aircraft designer
	  condition: function condition(a, b) {
	    return a.pos.Noun && b.pos.Actor;
	  },
	  result: 'Actor',
	  reason: 'thing-doer'
	}, {
	  //Canada Inc
	  condition: function condition(a, b) {
	    return a.is_capital() && a.pos.Noun && b.pos['Organization'] || b.is_capital() && a.pos['Organization'];
	  },
	  result: 'Organization',
	  reason: 'organization-org'
	}, {
	  //two-word quote
	  condition: function condition(a, b) {
	    return a.text.match(/^["']/) && b.text.match(/["']$/);
	  },
	  result: 'Quotation',
	  reason: 'two-word-quote'
	}, {
	  //will walk (perfect)
	  condition: function condition(a, b) {
	    return a.normal === 'will' && b.pos.Verb;
	  },
	  result: 'PerfectTense',
	  reason: 'will-verb'
	}, {
	  //will have walked (pluperfect)
	  condition: function condition(a, b) {
	    return a.normal.match(/^will ha(ve|d)$/) && b.pos.Verb;
	  },
	  result: 'PluperfectTense',
	  reason: 'will-have-verb'
	}, {
	  //timezones
	  condition: function condition(a, b) {
	    return b.normal.match(/(standard|daylight|summer) time/) && (a.pos['Adjective'] || a.pos['Place']);
	  },
	  result: 'Date',
	  reason: 'timezone'
	}, {
	  //canadian dollar, Brazilian pesos
	  condition: function condition(a, b) {
	    return a.pos.Demonym && b.pos.Currency;
	  },
	  result: 'Currency',
	  reason: 'demonym-currency'
	}, {
	  //for verbs in Past/Present Continuous ('is raining')
	  condition: function condition(a, b) {
	    return a.pos.Copula && a.normal.match(/^(am|is|are|was|were)$/) && b.pos.Verb && b.normal.match(/ing$/);
	  },
	  result: 'Verb',
	  reason: 'copula-gerund'
	}, {
	  //7 ft
	  condition: function condition(a, b) {
	    return a.pos.Value && b.pos.Abbreviation || a.pos.Abbreviation && b.pos.Value;
	  },
	  result: 'Value',
	  reason: 'value-abbreviation'
	}, {
	  //NASA Flordia
	  condition: function condition(a, b) {
	    return a.pos.Noun && b.pos.Abbreviation || a.pos.Abbreviation && b.pos.Noun;
	  },
	  result: 'Noun',
	  reason: 'noun-abbreviation'
	}, {
	  //both dates
	  condition: function condition(a, b) {
	    return a.pos.Date && b.pos.Date;
	  },
	  result: 'Date',
	  reason: 'two-dates'
	}, {
	  //both values
	  condition: function condition(a, b) {
	    return a.pos.Value && b.pos.Value;
	  },
	  result: 'Value',
	  reason: 'two-values'
	}, {
	  //both places
	  condition: function condition(a, b) {
	    return a.pos.Place && b.pos.Place;
	  },
	  result: 'Place',
	  reason: 'two-places'
	}, {
	  //'have not'
	  condition: function condition(a, b) {
	    return (a.pos.Infinitive || a.pos.Copula || a.pos.PresentTense) && b.normal === 'not';
	  },
	  result: 'Verb',
	  reason: 'verb-not'
	}, {
	  //both places (this is the most aggressive rule of them all)
	  condition: function condition(a, b) {
	    return a.pos.Noun && b.pos.Noun && !is_specific(a) && !is_specific(b);
	  },
	  result: 'Noun',
	  reason: 'two-nouns'
	}];

	//exceptions or guards to the above rules, more or less
	var dont_lump = [{ //don't chunk non-word things with word-things
	  condition: function condition(a, b) {
	    return a.is_word() === false || b.is_word() === false;
	  },
	  reason: 'not a word'
	}, {
	  //if A has a comma, don't chunk it, (unless it's a date)
	  condition: function condition(a) {
	    return a.has_comma() && !a.pos.Date;
	  },
	  reason: 'has a comma'
	}, { //dont chunk over possessives, eg "spencer's house"
	  condition: function condition(a) {
	    return a.pos['Possessive'];
	  },
	  reason: 'has possessive'
	}, {
	  condition: function condition(a) {
	    return a.pos['Expression'] || a.pos['Phrasal'] || a.pos['Pronoun'];
	  },
	  reason: 'unchunkable pos'
	}, { //dont chunk contractions (again)
	  condition: function condition(a, b) {
	    return a.expansion || b.expansion;
	  },
	  reason: 'is contraction'
	}, { //"Toronto Montreal"
	  condition: function condition(a, b) {
	    return a.pos['City'] && b.pos['City'];
	  },
	  reason: 'two cities'
	}, { //"Canada Cuba"
	  condition: function condition(a, b) {
	    return a.pos['Country'] && b.pos['Country'];
	  },
	  reason: 'two countries'
	}, { //"John you"
	  condition: function condition(a, b) {
	    return a.pos['Person'] && b.pos['Pronoun'];
	  },
	  reason: 'person-pronoun'
	}, { //url singleton
	  condition: function condition(a, b) {
	    return a.pos['Url'] || b.pos['Url'];
	  },
	  reason: 'url-no-lump'
	}, { //Hashtag singleton
	  condition: function condition(a, b) {
	    return a.pos['Hashtag'] || b.pos['Hashtag'];
	  },
	  reason: 'hashtag-no-lump'
	}, { //Email singleton
	  condition: function condition(a, b) {
	    return a.pos['Email'] || b.pos['Email'];
	  },
	  reason: 'email-no-lump'
	}, { //Quotation singleton
	  condition: function condition(a, b) {
	    return a.pos['Quotation'] || b.pos['Quotation'];
	  },
	  reason: 'quotation-no-lump'
	}];

	//check lumping 'blacklist'
	var ignore_pair = function ignore_pair(a, b) {
	  for (var o = 0; o < dont_lump.length; o++) {
	    if (dont_lump[o].condition(a, b)) {
	      return true;
	    }
	  }
	  return false;
	};

	//pairwise-compare two terms (find the 'twosies')
	var lump_two = function lump_two(terms) {
	  //each term..
	  for (var i = 0; i < terms.length; i++) {
	    var a = terms[i];
	    var b = terms[i + 1];
	    if (!a || !b) {
	      continue;
	    }
	    //first check lumping 'blacklist'
	    if (ignore_pair(a, b)) {
	      continue;
	    }
	    //check each lumping rule
	    for (var o = 0; o < do_lump.length; o++) {
	      //should it combine?
	      if (do_lump[o].condition(a, b)) {
	        var new_tag = do_lump[o].result;
	        var reason = do_lump[o].reason;
	        // console.log(a.normal);
	        // console.log(a.pos);
	        terms = combine(terms, i, new_tag, 'chunked ' + reason);
	        break;
	      }
	    }
	  }
	  //remove empties
	  terms = terms.filter(function (t) {
	    return t;
	  });
	  return terms;
	};

	module.exports = lump_two;

	},{"./combine":35}],38:[function(_dereq_,module,exports){
	'use strict';

	var Term = _dereq_('../../term/term.js');

	var Verb = _dereq_('../../term/verb/verb.js');
	var Adverb = _dereq_('../../term/adverb/adverb.js');
	var Adjective = _dereq_('../../term/adjective/adjective.js');

	var Noun = _dereq_('../../term/noun/noun.js');
	var Person = _dereq_('../../term/noun/person/person.js');
	var Place = _dereq_('../../term/noun/place/place.js');
	var Organization = _dereq_('../../term/noun/organization/organization.js');
	var Value = _dereq_('../../term/noun/value/value.js');
	var _Date = _dereq_('../../term/noun/date/date.js');
	var Url = _dereq_('../../term/noun/url/url.js');

	var tag_mapping = {
	  //nouns
	  'NNA': 'Acronym',
	  'NNS': 'Plural',
	  'NN': 'Noun',
	  'NNO': 'Possessive',
	  'CD': 'Value',
	  // 'NNP': 'Noun',
	  // 'NNPA': 'Noun',
	  // 'NNAB': 'Noun',
	  // 'NNPS': 'Noun',
	  // 'NNG': 'Noun',
	  'AC': 'Actor',
	  'DA': 'Date',
	  'CO': 'Condition',
	  'PN': 'Person',

	  //glue
	  'PP': 'Possessive',
	  'PRP': 'Pronoun',
	  'EX': 'Expression', //interjection
	  'DT': 'Determiner',
	  'CC': 'Conjunction',
	  'IN': 'Preposition',

	  //verbs
	  'VB': 'Verb',
	  'VBD': 'PastTense',
	  'VBF': 'FutureTense',
	  'VBP': 'Infinitive',
	  'VBZ': 'PresentTense',
	  'VBG': 'Gerund',
	  'VBN': 'Verb',
	  'CP': 'Copula',
	  'MD': 'Modal',
	  'JJ': 'Adjective',
	  'JJR': 'Comparative',
	  'JJS': 'Superlative',
	  'RB': 'Adverb',

	  'QU': 'Question'
	};

	var classMapping = {
	  'Noun': Noun,
	  'Honourific': Noun,
	  'Acronym': Noun,
	  'Plural': Noun,
	  'Pronoun': Noun,
	  'Actor': Noun,
	  'Abbreviation': Noun,
	  'Currency': Noun,

	  'Verb': Verb,
	  'PresentTense': Verb,
	  'FutureTense': Verb,
	  'PastTense': Verb,
	  'Infinitive': Verb,
	  'PerfectTense': Verb,
	  'PluperfectTense': Verb,
	  'Gerund': Verb,
	  'Copula': Verb,
	  'Modal': Verb,

	  'Comparative': Adjective,
	  'Superlative': Adjective,
	  'Adjective': Adjective,
	  'Demonym': Adjective,

	  'Determiner': Term,
	  'Preposition': Term,
	  'Expression': Term,
	  'Conjunction': Term,
	  'Possessive': Term,
	  'Question': Term,
	  'Symbol': Term,

	  'Email': Noun,
	  'AtMention': Noun,
	  'HashTag': Noun,
	  'Url': Url,

	  //not yet fully-supported as a POS
	  'MalePerson': Person,
	  'FemalePerson': Person,

	  'Adverb': Adverb,
	  'Value': Value,

	  'Place': Place,
	  'City': Place,
	  'Country': Place,

	  'Person': Person,
	  'Organization': Organization,
	  'Date': _Date
	};

	module.exports = {
	  tag_mapping: tag_mapping,
	  classMapping: classMapping,
	  Term: Term,
	  'Date': _Date,
	  Value: Value,
	  Verb: Verb,
	  Person: Person,
	  Place: Place,
	  Organization: Organization,
	  Adjective: Adjective,
	  Adverb: Adverb,
	  Noun: Noun
	};

	},{"../../term/adjective/adjective.js":64,"../../term/adverb/adverb.js":69,"../../term/noun/date/date.js":74,"../../term/noun/noun.js":80,"../../term/noun/organization/organization.js":82,"../../term/noun/person/person.js":86,"../../term/noun/place/place.js":88,"../../term/noun/url/url.js":93,"../../term/noun/value/value.js":100,"../../term/term.js":101,"../../term/verb/verb.js":111}],39:[function(_dereq_,module,exports){
	'use strict';

	var assign = _dereq_('../assign');

	//date words that are sometimes-not..
	var tough_dates = {
	  may: true,
	  april: true,
	  march: true,
	  june: true,
	  jan: true
	};

	//an integer that looks year-like
	var maybe_year = function maybe_year(t) {
	  if (t.pos.Value) {
	    var num = t.number || 0;
	    if (num >= 1900 && num < 2030) {
	      return true;
	    }
	  }
	  return false;
	};

	//neighbouring words that indicate it is a date
	var date_signals = {
	  between: true,
	  before: true,
	  after: true,
	  during: true,
	  from: true,
	  to: true,
	  in: true,
	  of: true,
	  the: true,
	  next: true
	};

	var ambiguous_dates = function ambiguous_dates(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    var t = terms[i];
	    if (tough_dates[t.normal] || maybe_year(t)) {
	      //'march' or '2015'
	      //if nearby another date or value
	      if (terms[i + 1] && (terms[i + 1].pos['Value'] || terms[i + 1].pos['Date'])) {
	        terms[i] = assign(t, 'Date', 'date_signal');
	        continue;
	      }
	      if (terms[i - 1] && (terms[i - 1].pos['Value'] || terms[i - 1].pos['Date'])) {
	        terms[i] = assign(t, 'Date', 'date_signal');
	        continue;
	      }

	      //if next term is date-like
	      if (terms[i + 1] && date_signals[terms[i + 1].normal]) {
	        terms[i] = assign(t, 'Date', 'date_signal');
	        continue;
	      }
	      //if last term is date-like
	      if (terms[i - 1] && date_signals[terms[i - 1].normal]) {
	        terms[i] = assign(t, 'Date', 'date_signal');
	        continue;
	      }
	    }
	  }
	  return terms;
	};

	module.exports = ambiguous_dates;

	},{"../assign":34}],40:[function(_dereq_,module,exports){
	'use strict';

	var assign = _dereq_('../assign');
	//set POS for capitalised words
	var capital_signals = function capital_signals(terms) {
	  //first words need careful rules
	  if (terms[0] && terms[0].is_acronym()) {
	    terms[0] = assign(terms[0], 'Noun', 'acronym');
	  }
	  //non-first-word capitals are nouns
	  for (var i = 1; i < terms.length; i++) {
	    if (terms[i].is_capital() || terms[i].is_acronym()) {
	      terms[i] = assign(terms[i], 'Noun', 'capital_signal');
	    }
	  }
	  return terms;
	};
	module.exports = capital_signals;

	},{"../assign":34}],41:[function(_dereq_,module,exports){
	'use strict';

	var starts = {
	  'if': true,
	  'in the event': true,
	  'in order to': true,
	  'so long as': true,
	  'provided': true,
	  'save that': true,
	  'after': true,
	  'once': true,
	  'subject to': true,
	  'without': true,
	  'effective': true,
	  'upon': true,
	  'during': true,
	  'unless': true,
	  'according': true,
	  'notwithstanding': true,
	  'when': true,
	  'before': true
	};

	// ensure there's a verb in a couple words
	var verbSoon = function verbSoon(terms, x) {
	  for (var i = 0; i < 5; i++) {
	    if (terms[i + x] && terms[i + x].pos['Verb']) {
	      return true;
	    }
	  }
	  return false;
	};

	// find the next upcoming comma
	var nextComma = function nextComma(terms, i) {
	  //don't be too aggressive
	  var max = terms.length - 1;
	  if (max > i + 7) {
	    max = i + 7;
	  }
	  for (var x = i; x < max; x++) {
	    //ensure there's a command and a verb coming up soon
	    if (terms[x].has_comma() && verbSoon(terms, x)) {
	      return x;
	    }
	  }
	  //allow trailing conditions too
	  if (i > 5 && terms.length - i < 5) {
	    return terms.length;
	  }
	  return null;
	};

	//set these terms as conditional
	var tagCondition = function tagCondition(terms, start, stop) {
	  for (var i = start; i <= stop; i++) {
	    if (!terms[i]) {
	      break;
	    }
	    terms[i].pos['Condition'] = true;
	  }
	};

	var conditional_pass = function conditional_pass(terms) {

	  //try leading condition
	  if (terms[0] && starts[terms[0].normal]) {
	    var until = nextComma(terms, 0);
	    if (until) {
	      tagCondition(terms, 0, until);
	    }
	  }

	  //try trailing condition
	  for (var i = 3; i < terms.length; i++) {
	    if (starts[terms[i].normal] && terms[i - 1].has_comma()) {
	      var _until = nextComma(terms, i);
	      if (_until) {
	        tagCondition(terms, i, _until);
	        i += _until;
	      }
	    }
	  }
	  return terms;
	};

	module.exports = conditional_pass;

	},{}],42:[function(_dereq_,module,exports){
	'use strict';

	var pos = _dereq_('../../parts_of_speech');
	//places a 'silent' term where a contraction, like "they're" exists

	//the formulaic contraction types:
	var supported = {
	  'll': 'will',
	  'd': 'would',
	  've': 'have',
	  're': 'are',
	  'm': 'am' //this is not the safest way to support i'm
	  //these ones are a bit tricksier:
	  // 't': 'not',
	  // 's': 'is' //or was
	};

	var irregulars = {
	  'dunno': ['do not', 'know'],
	  'wanna': ['want', 'to'],
	  'gonna': ['going', 'to'],
	  'im': ['i', 'am'],
	  'alot': ['a', 'lot'],

	  'dont': ['do not'],
	  'don\'t': ['do not'],
	  'dun': ['do not'],

	  'won\'t': ['will not'],
	  'wont': ['will not'],

	  'can\'t': ['can not'],
	  'cannot': ['can not'],

	  'aint': ['is not'], //or 'are'
	  'ain\'t': ['is not'],
	  'shan\'t': ['should not'],

	  'where\'d': ['where', 'did'],
	  'when\'d': ['when', 'did'],
	  'how\'d': ['how', 'did'],
	  'what\'d': ['what', 'did'],
	  'brb': ['be', 'right', 'back'],
	  'let\'s': ['let', 'us']
	};

	// `n't` contractions - negate doesn't have a second term
	var handle_negate = function handle_negate(terms, i) {
	  terms[i].expansion = terms[i].text.replace(/n'.*/, '');
	  terms[i].expansion += ' not';
	  return terms;
	};

	//puts a 'implicit term' in this sentence, at 'i'
	var handle_simple = function handle_simple(terms, i, particle) {
	  terms[i].expansion = terms[i].text.replace(/'.*/, '');
	  //make ghost-term
	  var second_word = new pos.Verb('');
	  second_word.expansion = particle;
	  second_word.whitespace.trailing = terms[i].whitespace.trailing;
	  terms[i].whitespace.trailing = ' ';
	  terms.splice(i + 1, 0, second_word);
	  return terms;
	};

	// expand manual contractions
	var handle_irregulars = function handle_irregulars(terms, x, arr) {
	  terms[x].expansion = arr[0];
	  for (var i = 1; i < arr.length; i++) {
	    var t = new pos.Term('');
	    t.whitespace.trailing = terms[x].whitespace.trailing; //move whitespace
	    terms[x].whitespace.trailing = ' ';
	    t.expansion = arr[i];
	    terms.splice(x + i, 0, t);
	  }
	  return terms;
	};

	// `'s` contractions
	var handle_copula = function handle_copula(terms, i) {
	  //fixup current term
	  terms[i].expansion = terms[i].text.replace(/'s$/, '');
	  //make ghost-term
	  var second_word = new pos.Verb('');
	  second_word.whitespace.trailing = terms[i].whitespace.trailing; //move whitespace
	  terms[i].whitespace.trailing = ' ';
	  second_word.expansion = 'is';
	  terms.splice(i + 1, 0, second_word);
	  return terms;
	};

	//turn all contraction-forms into 'silent' tokens
	var interpret = function interpret(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    //known-forms
	    if (irregulars[terms[i].normal]) {
	      terms = handle_irregulars(terms, i, irregulars[terms[i].normal]);
	      continue;
	    }
	    //words with an apostrophe
	    if (terms[i].has_abbreviation()) {
	      var split = terms[i].normal.split(/'/);
	      var pre = split[0];
	      var post = split[1];
	      // eg "they've"
	      if (supported[post]) {
	        terms = handle_simple(terms, i, supported[post]);
	        continue;
	      }
	      // eg "couldn't"
	      if (post === 't' && pre.match(/n$/)) {
	        terms = handle_negate(terms, i);
	        continue;
	      }
	      //eg "spencer's" -if it's possessive, it's not a contraction.
	      if (post === 's' && terms[i].pos['Possessive']) {
	        continue;
	      }
	      // eg "spencer's"
	      if (post === 's') {
	        terms = handle_copula(terms, i);
	        continue;
	      }
	    }
	  }

	  return terms;
	};

	module.exports = interpret;

	// let t = new pos.Verb(`spencer's`);
	// let terms = interpret([t]);
	// console.log(terms);

	},{"../../parts_of_speech":38}],43:[function(_dereq_,module,exports){
	'use strict';

	var assign = _dereq_('../assign');
	var grammar_rules = _dereq_('./rules/grammar_rules');
	var fns = _dereq_('../../../fns');
	// const match = require('../../match/match');


	//tests a subset of terms against a array of tags
	var hasTags = function hasTags(terms, tags) {
	  if (terms.length !== tags.length) {
	    return false;
	  }
	  for (var i = 0; i < tags.length; i++) {
	    //do a [tag] match
	    if (fns.startsWith(tags[i], '[') && fns.endsWith(tags[i], ']')) {
	      var pos = tags[i].match(/^\[(.*?)\]$/)[1];
	      if (!terms[i].pos[pos]) {
	        return false;
	      }
	    } else if (terms[i].normal !== tags[i]) {
	      //do a text-match
	      return false;
	    }
	  }
	  return true;
	};

	//hints from the sentence grammar
	var grammar_rules_pass = function grammar_rules_pass(s) {
	  for (var i = 0; i < s.terms.length; i++) {
	    for (var o = 0; o < grammar_rules.length; o++) {
	      var rule = grammar_rules[o];
	      //does this rule match
	      var terms = s.terms.slice(i, i + rule.before.length);
	      if (hasTags(terms, rule.before)) {
	        //change before/after for each term
	        for (var c = 0; c < rule.before.length; c++) {
	          if (rule.after[c]) {
	            var newPos = rule.after[c].match(/^\[(.*?)\]$/)[1];
	            s.terms[i + c] = assign(s.terms[i + c], newPos, 'grammar_rule  (' + rule.before.join(',') + ')');
	          }
	        }
	        break;
	      }
	    }
	  }
	  return s.terms;
	};
	module.exports = grammar_rules_pass;

	},{"../../../fns":23,"../assign":34,"./rules/grammar_rules":51}],44:[function(_dereq_,module,exports){
	'use strict';

	var assign = _dereq_('../assign');

	//clear-up ambiguous interjections "ok"[Int], "thats ok"[Adj]
	var interjection_fixes = function interjection_fixes(terms) {
	  var interjections = {
	    ok: true,
	    so: true,
	    please: true,
	    alright: true,
	    well: true,
	    now: true
	  };
	  for (var i = 0; i < terms.length; i++) {
	    if (i > 3) {
	      break;
	    }
	    if (interjections[terms[i].normal]) {
	      terms[i] = assign(terms[i], 'Expression', 'interjection_fixes');
	    } else {
	      break;
	    }
	  }
	  return terms;
	};

	module.exports = interjection_fixes;

	},{"../assign":34}],45:[function(_dereq_,module,exports){
	'use strict';

	var defaultLexicon = _dereq_('../../../lexicon.js');
	var assign = _dereq_('../assign');

	//consult lexicon for this known-word
	var lexicon_pass = function lexicon_pass(terms, options) {
	  var lexicon = options.lexicon || defaultLexicon;
	  return terms.map(function (t) {

	    var normal = t.normal;
	    //normalize apostrophe s for grammatical purposes
	    if (t.has_abbreviation()) {
	      var split = normal.split(/'/);
	      if (split[1] === 's') {
	        normal = split[0];
	      }
	    }

	    //check lexicon straight-up
	    if (lexicon[normal] !== undefined) {
	      return assign(t, lexicon[normal], 'lexicon_pass');
	    }

	    if (lexicon[t.expansion] !== undefined) {
	      return assign(t, lexicon[t.expansion], 'lexicon_expansion');
	    }
	    //try to match it without a prefix - eg. outworked -> worked
	    if (normal.match(/^(over|under|out|-|un|re|en).{3}/)) {
	      var attempt = normal.replace(/^(over|under|out|.*?-|un|re|en)/, '');
	      if (lexicon[attempt]) {
	        return assign(t, lexicon[attempt], 'lexicon_prefix');
	      }
	    }
	    //try to match without a contraction - "they've" -> "they"
	    if (t.has_abbreviation()) {
	      var _attempt = normal.replace(/'(ll|re|ve|re|d|m|s)$/, '');
	      // attempt = attempt.replace(/n't/, '');
	      if (lexicon[_attempt]) {
	        return assign(t, lexicon[_attempt], 'lexicon_suffix');
	      }
	    }

	    //match 'twenty-eight'
	    if (normal.match(/-/)) {
	      var sides = normal.split('-');
	      if (lexicon[sides[0]]) {
	        return assign(t, lexicon[sides[0]], 'lexicon_dash');
	      }
	      if (lexicon[sides[1]]) {
	        return assign(t, lexicon[sides[1]], 'lexicon_dash');
	      }
	    }
	    return t;
	  });
	};
	module.exports = lexicon_pass;

	},{"../../../lexicon.js":25,"../assign":34}],46:[function(_dereq_,module,exports){
	'use strict';

	var lexicon = _dereq_('../../../lexicon.js');
	var assign = _dereq_('../assign');

	var should_merge = function should_merge(a, b) {
	  if (!a || !b) {
	    return false;
	  }
	  //if it's a known multiple-word term
	  if (lexicon[a.normal + ' ' + b.normal]) {
	    return true;
	  }
	  return false;
	};

	var multiples_pass = function multiples_pass(terms) {
	  var new_terms = [];
	  var last_one = null;
	  for (var i = 0; i < terms.length; i++) {
	    var t = terms[i];
	    //if the tags match (but it's not a hidden contraction)
	    if (should_merge(last_one, t)) {
	      var last = new_terms[new_terms.length - 1];
	      var space = t.whitespace.preceding + last.whitespace.trailing;
	      last.text += space + t.text;
	      last.rebuild();
	      last.whitespace.trailing = t.whitespace.trailing;
	      var pos = lexicon[last.normal];
	      new_terms[new_terms.length - 1] = assign(last, pos, 'multiples_pass_lexicon');
	      new_terms[new_terms.length - 1].whitespace = last.whitespace;
	    } else {
	      new_terms.push(t);
	    }
	    last_one = t;
	  }
	  return new_terms;
	};

	module.exports = multiples_pass;

	},{"../../../lexicon.js":25,"../assign":34}],47:[function(_dereq_,module,exports){
	'use strict';

	var assign = _dereq_('../assign');
	//decide if an apostrophe s is a contraction or not
	// 'spencer's nice' -> 'spencer is nice'
	// 'spencer's house' -> 'spencer's house'

	//these are always contractions
	var blacklist = {
	  'it\'s': true,
	  'that\'s': true
	};

	//a possessive means "'s" describes ownership, not a contraction, like 'is'
	var is_possessive = function is_possessive(terms, x) {
	  //these are always contractions, not possessive
	  if (blacklist[terms[x].normal]) {
	    return false;
	  }
	  //"spencers'" - this is always possessive - eg "flanders'"
	  if (terms[x].normal.match(/[a-z]s'$/)) {
	    return true;
	  }
	  //if no apostrophe s, return
	  if (!terms[x].normal.match(/[a-z]'s$/)) {
	    return false;
	  }
	  //some parts-of-speech can't be possessive
	  if (terms[x].pos['Pronoun']) {
	    return false;
	  }
	  var nextWord = terms[x + 1];
	  //last word is possessive  - "better than spencer's"
	  if (!nextWord) {
	    return true;
	  }
	  //next word is 'house'
	  if (nextWord.pos['Noun']) {
	    return true;
	  }
	  //rocket's red glare
	  if (nextWord.pos['Adjective'] && terms[x + 2] && terms[x + 2].pos['Noun']) {
	    return true;
	  }
	  //next word is an adjective
	  if (nextWord.pos['Adjective'] || nextWord.pos['Verb'] || nextWord.pos['Adverb']) {
	    return false;
	  }
	  return false;
	};

	//tag each term as possessive, if it should
	var possessive_pass = function possessive_pass(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    if (is_possessive(terms, i)) {
	      //if it's not already a noun, co-erce it to one
	      if (!terms[i].pos['Noun']) {
	        terms[i] = assign(terms[i], 'Noun', 'possessive_pass');
	      }
	      terms[i].pos['Possessive'] = true;
	    }
	  }
	  return terms;
	};
	module.exports = possessive_pass;

	},{"../assign":34}],48:[function(_dereq_,module,exports){
	'use strict';

	var assign = _dereq_('../assign');
	// question-words are awkward,
	// 'why',  //*
	// 'where',
	// 'when',
	// 'what',
	// 'who',
	// 'whom',
	// 'whose',
	// 'which'

	//differentiate pos for "who walked?" -vs- "he who walked"
	// Pick up that book on the floor.
	var is_pronoun = function is_pronoun(terms, x) {
	  var determiners = {
	    who: true,
	    whom: true,
	    whose: true,
	    which: true
	  };
	  //if it starts a sentence, it's probably a question
	  if (x === 0) {
	    return false;
	  }
	  if (determiners[terms[x].normal]) {
	    //if it comes after a Noun..
	    if (terms[x - 1] && terms[x - 1].pos['Noun']) {
	      //if next word is a verb
	      if (terms[x + 1] && (terms[x + 1].pos['Verb'] || terms[x + 1].pos['Adverb'])) {
	        return true;
	      }
	    }
	  }
	  return false;
	};

	var question_pass = function question_pass(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    if (terms[i].pos.Question && is_pronoun(terms, i)) {
	      terms[i] = assign(terms[i], 'Pronoun', 'question_is_pronoun');
	    }
	  }
	  return terms;
	};

	module.exports = question_pass;

	},{"../assign":34}],49:[function(_dereq_,module,exports){
	'use strict';
	// knowing if something is inside a quotation is important grammatically
	//set all the words inside quotations marks as pos['Quotation']=true
	// verbatim change of narration only, 'scare quotes' don't count.

	var startQuote = function startQuote(s) {
	  return s.match(/^["\u201C]./);
	};
	var endQuote = function endQuote(s) {
	  return s.match(/.["\u201D]$/);
	};

	//find the next quotation terminator
	var quotation_ending = function quotation_ending(terms, start) {
	  for (var i = start; i < terms.length; i++) {
	    if (endQuote(terms[i].text)) {
	      return i;
	    }
	  }
	  return null;
	};

	//set these terms as quotations
	var tagQuotation = function tagQuotation(terms, start, stop) {
	  for (var i = start; i <= stop; i++) {
	    if (!terms[i]) {
	      break;
	    }
	    terms[i].pos['Quotation'] = true;
	  }
	};

	//hunt
	var quotation_pass = function quotation_pass(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    if (startQuote(terms[i].text)) {
	      var end = quotation_ending(terms, [i]);
	      if (end !== null) {
	        tagQuotation(terms, i, end);
	        return terms;
	      }
	    }
	  }
	  return terms;
	};

	module.exports = quotation_pass;

	},{}],50:[function(_dereq_,module,exports){
	'use strict';

	var word_rules = _dereq_('./rules/word_rules');
	var assign = _dereq_('../assign');

	//word-rules that run on '.text', not '.normal'
	var punct_rules = [{ //'+'
	  reg: new RegExp('^[@%^&*+=~-]?$', 'i'),
	  pos: 'Symbol',
	  reason: 'independent-symbol'
	}, { //2:54pm
	  reg: new RegExp('^[12]?[0-9]\:[0-9]{2}( am| pm)?$', 'i'),
	  pos: 'Date',
	  reason: 'time_reg'
	}, { //1999/12/25
	  reg: new RegExp('^[0-9]{1,4}[-/][0-9]{1,2}[-/][0-9]{1,4}$', 'i'),
	  pos: 'Date',
	  reason: 'numeric_date'
	}, { //3:32
	  reg: new RegExp('^[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?', 'i'),
	  pos: 'Date',
	  reason: 'time'
	}];

	var regex_pass = function regex_pass(terms) {
	  terms.forEach(function (t, i) {
	    //don't overwrite
	    if (terms[i].tag !== '?') {
	      return;
	    }
	    var text = terms[i].text;
	    var normal = terms[i].normal;
	    //normalize apostrophe s for grammatical purposes
	    if (terms[i].has_abbreviation()) {
	      var split = terms[i].normal.split(/'/);
	      if (split[1] === 's') {
	        normal = split[0];
	      }
	    }
	    //regexes that involve punctuation
	    for (var o = 0; o < punct_rules.length; o++) {
	      if (text.match(punct_rules[o].reg)) {
	        terms[i] = assign(terms[i], punct_rules[o].pos, punct_rules[o].rules);
	        return;
	      }
	    }
	    //bigger list of regexes on normal
	    for (var _o = 0; _o < word_rules.length; _o++) {
	      if (normal.match(word_rules[_o].reg)) {
	        var reason = 'regex #' + _o + ' ' + word_rules[_o].pos;
	        terms[i] = assign(terms[i], word_rules[_o].pos, reason);
	        return;
	      }
	    }
	  });
	  return terms;
	};

	module.exports = regex_pass;

	},{"../assign":34,"./rules/word_rules":52}],51:[function(_dereq_,module,exports){
	'use strict';

	module.exports = [
	//determiner hints
	{
	  'before': ['[Determiner]', '[?]'],
	  'after': ['[Determiner]', '[Noun]']
	}, {
	  'before': ['the', '[Verb]'],
	  'after': [null, '[Noun]']
	}, {
	  'before': ['[Determiner]', '[Adjective]', '[Verb]'],
	  'after': ['[Noun]', '[Noun]', '[Noun]']
	}, {
	  'before': ['[Determiner]', '[Adverb]', '[Adjective]', '[?]'],
	  'after': ['[Determiner]', '[Adverb]', '[Adjective]', '[Noun]']
	}, {
	  'before': ['[?]', '[Determiner]', '[Noun]'],
	  'after': ['[Verb]', '[Determiner]', '[Noun]']
	},
	//"peter the great"
	{
	  'before': ['[Person]', 'the', '[Noun]'],
	  'after': ['[Person]', null, '[Noun]']
	},
	// //"book the flight"
	{
	  'before': ['[Noun]', 'the', '[Noun]'],
	  'after': ['[Verb]', null, '[Noun]']
	},

	//Possessive hints
	{
	  'before': ['[Possessive]', '[?]'],
	  'after': ['[Possessive]', '[Noun]']
	},
	// {
	//   'before': ['[Possessive]', '[Verb]'],
	//   'after': ['[Possessive]', '[Noun]'],
	// },
	{
	  'before': ['[?]', '[Possessive]', '[Noun]'],
	  'after': ['[Verb]', '[Possessive]', '[Noun]']
	},
	//copula hints
	{
	  'before': ['[Copula]', '[?]'],
	  'after': ['[Copula]', '[Adjective]'] }, {
	  'before': ['[Copula]', '[Adverb]', '[?]'],
	  'after': ['[Copula]', '[Adverb]', '[Adjective]'] },
	//preposition hints
	{
	  'before': ['[?]', '[Preposition]'],
	  'after': ['[Verb]', '[Preposition]']
	},
	//conjunction hints, like lists (a little sloppy)
	{
	  'before': ['[Adverb]', '[Conjunction]', '[Adverb]'],
	  'after': ['[Adverb]', '[Adverb]', '[Adverb]']
	},
	//do not
	// {
	//   'before': ['[Verb]', 'not'],
	//   'after': ['[Verb]', '[Verb]'],
	// },
	// {
	//   'before': ['[Noun]', '[Conjunction]', '[Noun]'],
	//   'after': ['[Noun]', '[Noun]', '[Noun]'],
	// },
	{
	  'before': ['[Adjective]', '[Conjunction]', '[Adjective]'],
	  'after': ['[Adjective]', '[Adjective]', '[Adjective]']
	}, {
	  'before': ['[?]', '[Conjunction]', '[Verb]'],
	  'after': ['[Verb]', '[Conjunction]', '[Verb]']
	}, {
	  'before': ['[Verb]', '[Conjunction]', '[?]'],
	  'after': ['[Verb]', '[Conjunction]', '[Verb]']
	},
	//adverb hints
	{
	  'before': ['[Noun]', '[Adverb]', '[Noun]'],
	  'after': ['[Noun]', '[Adverb]', '[Verb]']
	},
	//pronoun hints
	{
	  'before': ['[?]', '[Pronoun]'],
	  'after': ['[Verb]', '[Pronoun]']
	},
	//modal hints
	{
	  'before': ['[Modal]', '[?]'],
	  'after': ['[Modal]', '[Verb]']
	}, {
	  'before': ['[Modal]', '[Adverb]', '[?]'],
	  'after': ['[Modal]', '[Adverb]', '[Verb]']
	}, { // 'red roses' => Adjective, Noun
	  'before': ['[Adjective]', '[Verb]'],
	  'after': ['[Adjective]', '[Noun]']
	}, { // 5 kittens => Value, Nouns
	  'before': ['[Value]', '[Verb]'],
	  'after': ['[Value]', '[Noun]']
	},

	//ambiguous dates (march/may)
	// {
	//   'before': ['[Modal]', '[Value]'],
	//   'after': ['[Modal]', '[Verb]'],
	// },
	{
	  'before': ['[Adverb]', '[Value]'],
	  'after': ['[Adverb]', '[Verb]']
	}];

	},{}],52:[function(_dereq_,module,exports){
	'use strict';

	var tag_mapping = _dereq_('../../parts_of_speech.js').tag_mapping;
	//regex patterns and parts of speech],
	module.exports = [['^[0-9]+ ?(am|pm)$', 'DA'], ['^[0-9]+(st|nd|rd)?$', 'CD'], ['^[a-z]et$', 'VB'], ['cede$', 'VB'], ['.[cts]hy$', 'JJ'], ['.[st]ty$', 'JJ'], ['.[lnr]ize$', 'VB'], ['.[gk]y$', 'JJ'], ['.fies$', 'VB'], ['.some$', 'JJ'], ['.[nrtumcd]al$', 'JJ'], ['.que$', 'JJ'], ['.[tnl]ary$', 'JJ'], ['.[di]est$', 'JJS'], ['^(un|de|re)\\-[a-z]..', 'VB'], ['.lar$', 'JJ'], ['[bszmp]{2}y', 'JJ'], ['.zes$', 'VB'], ['.[icldtgrv]ent$', 'JJ'], ['.[rln]ates$', 'VBZ'], ['.[oe]ry$', 'NN'], ['[rdntkdhs]ly$', 'RB'], ['.[lsrnpb]ian$', 'JJ'], ['.[^aeiou]ial$', 'JJ'], ['.[^aeiou]eal$', 'JJ'], ['.[vrl]id$', 'JJ'], ['.[ilk]er$', 'JJR'], ['.ike$', 'JJ'], ['.ends?$', 'VB'], ['.wards$', 'RB'], ['.rmy$', 'JJ'], ['.rol$', 'NN'], ['.tors$', 'NN'], ['.azy$', 'JJ'], ['.where$', 'RB'], ['.ify$', 'VB'], ['.bound$', 'JJ'], ['.[^z]ens$', 'VB'], ['.oid$', 'JJ'], ['.vice$', 'NN'], ['.rough$', 'JJ'], ['.mum$', 'JJ'], ['.teen(th)?$', 'CD'], ['.oses$', 'VB'], ['.ishes$', 'VB'], ['.ects$', 'VB'], ['.tieth$', 'CD'], ['.ices$', 'NN'], ['.pose$', 'VB'], ['.ions$', 'NN'], ['.ean$', 'JJ'], ['.[ia]sed$', 'JJ'], ['.tized$', 'VB'], ['.llen$', 'JJ'], ['.fore$', 'RB'], ['.ances$', 'NN'], ['.gate$', 'VB'], ['.nes$', 'VB'], ['.less$', 'RB'], ['.ried$', 'JJ'], ['.gone$', 'JJ'], ['.made$', 'JJ'], ['.ing$', 'VB'], //likely to be converted to adjective after lexicon pass
	['.tions$', 'NN'], ['.tures$', 'NN'], ['.ous$', 'JJ'], ['.ports$', 'NN'], ['. so$', 'RB'], ['.ints$', 'NN'], ['.[gt]led$', 'JJ'], ['.lked$', 'VB'], ['.fully$', 'RB'], ['.*ould$', 'MD'], ['^-?[0-9]+(.[0-9]+)?$', 'CD'], ['[a-z]*\\-[a-z]*\\-', 'JJ'], ['[a-z]\'s$', 'NNO'], ['.\'n$', 'VB'], ['.\'re$', 'CP'], ['.\'ll$', 'MD'], ['.\'t$', 'VB'], ['.tches$', 'VB'], ['^https?\:?\/\/[a-z0-9]', 'NN'], //the colon is removed in normalisation
	['^www\.[a-z0-9]', 'NN'], ['.ize$', 'VB'], ['.[^aeiou]ise$', 'VB'], ['.[aeiou]te$', 'VB'], ['.ea$', 'NN'], ['[aeiou][pns]er$', 'NN'], ['.ia$', 'NN'], ['.sis$', 'NN'], ['.[aeiou]na$', 'NN'], ['.[^aeiou]ity$', 'NN'], ['.[^aeiou]ium$', 'NN'], ['.[^aeiou][ei]al$', 'JJ'], ['.ffy$', 'JJ'], ['.[^aeiou]ic$', 'JJ'], ['.(gg|bb|zz)ly$', 'JJ'], ['.[aeiou]my$', 'JJ'], ['.[^aeiou][ai]ble$', 'JJ'], ['.[^aeiou]eable$', 'JJ'], ['.[^aeiou]ful$', 'JJ'], ['.[^aeiou]ish$', 'JJ'], ['.[^aeiou]ica$', 'NN'], ['[aeiou][^aeiou]is$', 'NN'], ['[^aeiou]ard$', 'NN'], ['[^aeiou]ism$', 'NN'], ['.[^aeiou]ity$', 'NN'], ['.[^aeiou]ium$', 'NN'], ['.[lstrn]us$', 'NN'], ['..ic$', 'JJ'], ['[aeiou][^aeiou]id$', 'JJ'], ['.[^aeiou]ish$', 'JJ'], ['.[^aeiou]ive$', 'JJ'], ['[ea]{2}zy$', 'JJ'], ['[^aeiou]ician$', 'AC'], ['.keeper$', 'AC'], ['.logist$', 'AC'], ['..ier$', 'AC'], ['.[^aeiou][ao]pher$', 'AC'], ['.tive$', 'AC'], ['[aeiou].*ist$', 'JJ'], ['[^i]fer$', 'VB'],
	//slang things
	['^um+$', 'EX'], //ummmm
	['^([hyj]a)+$', 'EX'], //hahah
	['^(k)+$', 'EX'], //kkkk
	['^(yo)+$', 'EX'], //yoyo
	['^yes+$', 'EX'], //yessss
	['^no+$', 'EX'], //noooo
	['^lol[sz]$', 'EX'], //lol
	['^woo+[pt]?$', 'EX'], //woo
	['^ug?h+$', 'EX'], //uhh
	['^uh[ -]?oh$', 'EX']].map(function (a) {
	  return {
	    reg: new RegExp(a[0], 'i'),
	    pos: tag_mapping[a[1]]
	  };
	});

	},{"../../parts_of_speech.js":38}],53:[function(_dereq_,module,exports){
	'use strict';
	//identify urls, hashtags, @mentions, emails

	var assign = _dereq_('../assign');
	// 'Email': Noun,
	// 'Url': Noun,
	// 'AtMention': Noun,
	// 'HashTag': Noun,

	var is_email = function is_email(str) {
	  if (str.match(/^\w+@\w+\.[a-z]{2,3}$/)) {
	    //not fancy
	    return true;
	  }
	  return false;
	};

	var is_hashtag = function is_hashtag(str) {
	  if (str.match(/^#[a-z0-9_]{2,}$/)) {
	    return true;
	  }
	  return false;
	};

	var is_atmention = function is_atmention(str) {
	  if (str.match(/^@\w{2,}$/)) {
	    return true;
	  }
	  return false;
	};

	var is_url = function is_url(str) {
	  //with http/www
	  if (str.match(/^(https?:\/\/|www\.)\w+\.[a-z]{2,3}/)) {
	    //not fancy
	    return true;
	  }
	  // 'boo.com'
	  //http://mostpopularwebsites.net/top-level-domain
	  if (str.match(/^[\w\.\/]+\.(com|net|gov|org|ly|edu|info|biz|ru|jp|de|in|uk|br)/)) {
	    return true;
	  }
	  return false;
	};

	var web_pass = function web_pass(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    var str = terms[i].text.trim().toLowerCase();
	    if (is_email(str)) {
	      terms[i] = assign(terms[i], 'Email', 'web_pass');
	    }
	    if (is_hashtag(str)) {
	      terms[i] = assign(terms[i], 'HashTag', 'web_pass');
	    }
	    if (is_atmention(str)) {
	      terms[i] = assign(terms[i], 'AtMention', 'web_pass');
	    }
	    if (is_url(str)) {
	      terms[i] = assign(terms[i], 'Url', 'web_pass');
	    }
	  }
	  return terms;
	};

	module.exports = web_pass;

	},{"../assign":34}],54:[function(_dereq_,module,exports){
	//part-of-speech tagging
	'use strict';

	var lump_two = _dereq_('./lumper/lump_two');
	var lump_three = _dereq_('./lumper/lump_three');
	var pos = _dereq_('./parts_of_speech');
	var assign = _dereq_('./assign');

	var grammar_pass = _dereq_('./passes/grammar_pass');
	var interjection_fixes = _dereq_('./passes/interjection_fixes');
	var lexicon_pass = _dereq_('./passes/lexicon_pass');
	var capital_signals = _dereq_('./passes/capital_signals');
	var conditional_pass = _dereq_('./passes/conditional_pass');
	var ambiguous_dates = _dereq_('./passes/ambiguous_dates');
	var multiple_pass = _dereq_('./passes/multiples_pass');
	var regex_pass = _dereq_('./passes/regex_pass');
	var quotation_pass = _dereq_('./passes/quotation_pass');
	var possessive_pass = _dereq_('./passes/possessive_pass');
	var contraction_pass = _dereq_('./passes/contractions/interpret');
	var question_pass = _dereq_('./passes/question_pass');
	var web_text_pass = _dereq_('./passes/web_text_pass');

	var noun_fallback = function noun_fallback(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    if (terms[i].tag === '?' && terms[i].normal.match(/[a-z]/)) {
	      terms[i] = assign(terms[i], 'Noun', 'fallback');
	    }
	  }
	  return terms;
	};

	//turn nouns into person/place
	var specific_noun = function specific_noun(terms) {
	  for (var i = 0; i < terms.length; i++) {
	    var t = terms[i];
	    if (t instanceof pos.Noun) {
	      //don't overwrite known forms...
	      if (t.pos.Person || t.pos.Place || t.pos.Value || t.pos.Date || t.pos.Organization) {
	        continue;
	      }
	      if (t.is_person()) {
	        terms[i] = assign(t, 'Person', 'is_person');
	      } else if (t.is_place()) {
	        terms[i] = assign(t, 'Place', 'is_place');
	      } else if (t.is_value()) {
	        terms[i] = assign(t, 'Value', 'is_value');
	      } else if (t.is_date()) {
	        terms[i] = assign(t, 'Date', 'is_date');
	      } else if (t.is_organization()) {
	        terms[i] = assign(t, 'Organization', 'is_organization');
	      }
	    }
	  }
	  return terms;
	};

	var tagger = function tagger(s, options) {
	  //word-level rules
	  s.terms = capital_signals(s.terms);
	  s.terms = lexicon_pass(s.terms, options);
	  s.terms = multiple_pass(s.terms);
	  s.terms = regex_pass(s.terms);
	  s.terms = interjection_fixes(s.terms);
	  s.terms = web_text_pass(s.terms);
	  //sentence-level rules
	  //(repeat these steps a couple times, to wiggle-out the grammar)
	  for (var i = 0; i < 3; i++) {
	    s.terms = grammar_pass(s);
	    s.terms = specific_noun(s.terms);
	    s.terms = ambiguous_dates(s.terms);
	    s.terms = possessive_pass(s.terms);
	    s.terms = lump_two(s.terms);
	    s.terms = noun_fallback(s.terms);
	    s.terms = lump_three(s.terms);
	  }
	  s.terms = conditional_pass(s.terms);
	  s.terms = quotation_pass(s.terms);
	  s.terms = contraction_pass(s.terms);
	  s.terms = question_pass(s.terms);
	  return s.terms;
	};

	module.exports = tagger;

	},{"./assign":34,"./lumper/lump_three":36,"./lumper/lump_two":37,"./parts_of_speech":38,"./passes/ambiguous_dates":39,"./passes/capital_signals":40,"./passes/conditional_pass":41,"./passes/contractions/interpret":42,"./passes/grammar_pass":43,"./passes/interjection_fixes":44,"./passes/lexicon_pass":45,"./passes/multiples_pass":46,"./passes/possessive_pass":47,"./passes/question_pass":48,"./passes/quotation_pass":49,"./passes/regex_pass":50,"./passes/web_text_pass":53}],55:[function(_dereq_,module,exports){
	'use strict';
	//build-out this mapping

	var interrogatives = {
	  'who': 'who',
	  'whose': 'who',
	  'whom': 'who',
	  'which person': 'who',

	  'where': 'where',
	  'when': 'when',

	  'why': 'why',
	  'how come': 'why'
	};

	var easyForm = function easyForm(s, i) {
	  var t = s.terms[i];
	  var nextTerm = s.terms[i + 1];

	  //some interrogative forms are two-terms, try it.
	  if (nextTerm) {
	    var twoTerm = t.normal + ' ' + nextTerm.normal;
	    if (interrogatives[twoTerm]) {
	      return interrogatives[twoTerm];
	    }
	  }
	  //try an interrogative first - 'who'
	  if (interrogatives[t.normal]) {
	    return interrogatives[t.normal];
	  }
	  //an interrogative as a contraction - 'why'd'
	  if (interrogatives[t.expansion]) {
	    return interrogatives[t.expansion];
	  }
	  return false;
	};

	module.exports = easyForm;

	},{}],56:[function(_dereq_,module,exports){
	'use strict';

	var hardFormVerb = {
	  'which': 'which',
	  'what': 'what'
	};

	// "what time" -> 'when'
	var knownForm = {
	  time: 'when',
	  day: 'when',
	  year: 'when',

	  person: 'who', //more covered by pos["Actor"]

	  amount: 'number',
	  number: 'number'
	};

	var hardForm = function hardForm(s, i) {
	  var t = s.terms[i];
	  var nextTerm = s.terms[i + 1];
	  // which, or what
	  var questionWord = hardFormVerb[t.normal] || hardFormVerb[t.expanded];
	  // end early.
	  if (!nextTerm || !questionWord) {
	    return null;
	  }

	  //"which is.."
	  if (nextTerm.pos['Copula']) {
	    return t.normal;
	  }
	  //"which politician.."
	  if (nextTerm.pos['Actor']) {
	    return 'who';
	  }
	  //"what time.."
	  if (knownForm[nextTerm.normal]) {
	    return knownForm[nextTerm.normal];
	  }

	  return questionWord;
	};

	module.exports = hardForm;

	},{}],57:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Sentence = _dereq_('../sentence.js');
	var question_form = _dereq_('./question_form');

	var Question = function (_Sentence) {
	  _inherits(Question, _Sentence);

	  function Question(str, options) {
	    _classCallCheck(this, Question);

	    return _possibleConstructorReturn(this, (Question.__proto__ || Object.getPrototypeOf(Question)).call(this, str, options));
	  }

	  _createClass(Question, [{
	    key: 'form',
	    value: function form() {
	      return question_form(this);
	    }
	  }]);

	  return Question;
	}(Sentence);

	Question.fn = Question.prototype;

	module.exports = Question;

	// let q = new Question(`accordingly, is he cool?`);
	// let q = new Question(`what time did you show up?`);
	// console.log(q.form());

	},{"../sentence.js":60,"./question_form":58}],58:[function(_dereq_,module,exports){
	'use strict';
	//classifies a question into:

	var yesNoTerm = _dereq_('./yesNo.js');
	var easyForm = _dereq_('./easyForm.js');
	var hardForm = _dereq_('./hardForm.js');

	// how, when, where, who, why
	// what, which
	// number
	// yesNo

	//exceptions:
	// You bought what!? - Echo question
	// Who bought what? - Multiple wh-expressions
	// I wonder who Fred will ask to leave. - passive question

	// "Five Ws and one H" + 'which'
	// let forms = {
	// how: ['in what way'],
	// what: ['what\'s'],
	// which: ['what one'],
	// number: ['how many', 'how much', 'how far', 'how long'],
	// };

	var question_form = function question_form(s) {
	  //loop through and find first signal
	  for (var i = 0; i < s.terms.length; i++) {

	    //who is.. -> "who"
	    var form = easyForm(s, i);
	    if (form) {
	      return form;
	    }
	    //which politician.. -> "who"
	    form = hardForm(s, i);
	    if (form) {
	      return form;
	    }
	    //is he..  -> "yesNo"
	    if (yesNoTerm(s, i)) {
	      return 'yesNo';
	    }
	  }
	  return null;
	};

	module.exports = question_form;

	},{"./easyForm.js":55,"./hardForm.js":56,"./yesNo.js":59}],59:[function(_dereq_,module,exports){
	'use strict';

	// Yes/No questions take the form:
	// he is -> is he?

	var yesNoVerb = {
	  is: true,
	  are: true,
	  was: true,
	  will: true,
	  do: true,
	  did: true
	};

	var yesNoTerm = function yesNoTerm(s, i) {
	  var t = s.terms[i];
	  var lastTerm = s.terms[i - 1];
	  var nextTerm = s.terms[i + 1];
	  //try a yes/no question then
	  if (yesNoVerb[t.normal] || yesNoVerb[t.expansion]) {
	    //leading 'is x...' is a question
	    if (!lastTerm) {
	      return true;
	    }
	    //ending '... are.' is a not question
	    if (!lastTerm) {
	      return false;
	    }
	    // 'he is' is not a question..
	    if (lastTerm.pos['Pronoun'] || lastTerm.pos['Person']) {
	      return false;
	    }
	    // 'is he' is a question..
	    if (nextTerm.pos['Pronoun'] || nextTerm.pos['Person']) {
	      return true;
	    }
	  }
	  return false;
	};

	module.exports = yesNoTerm;

	},{}],60:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Term = _dereq_('../term/term');
	var tagger = _dereq_('./pos/tagger');
	var passive_voice = _dereq_('./passive_voice');
	var contractions = {
	  contract: _dereq_('./contractions/contract'),
	  expand: _dereq_('./contractions/expand')
	};
	var change_tense = _dereq_('./change_tense');
	var spot = _dereq_('./spot');
	var _match = _dereq_('../match/match');
	var tokenize_match = function tokenize_match() {};

	//a sentence is an array of Term objects, along with their various methods

	var Sentence = function () {
	  function Sentence(str, options) {
	    _classCallCheck(this, Sentence);

	    this.str = '';
	    if (typeof str === 'string') {
	      this.str = str;
	    } else if (typeof str === 'number') {
	      this.str = '' + str;
	    }
	    options = options || {};
	    var the = this;
	    var words = this.str.split(/( +)/);
	    //build-up term-objects
	    this.terms = [];
	    if (words[0] === '') {
	      words.shift();
	    }
	    for (var i = 0; i < words.length; i++) {
	      if (!words[i] || !words[i].match(/\S/i)) {
	        continue;
	      }
	      var whitespace = {
	        preceding: words[i - 1],
	        trailing: words[i + 1]
	      };
	      //don't use them twice
	      words[i - 1] = null;
	      words[i + 1] = null;
	      this.terms.push(new Term(words[i], null, whitespace));
	    }
	    // console.log(this.terms);
	    //part-of-speech tagging
	    this.terms = tagger(this, options);
	    // process contractions
	    //now the hard part is already done, just flip them
	    this.contractions = {
	      // "he'd go" -> "he would go"
	      expand: function expand() {
	        the.terms = contractions.expand(the.terms);
	        return the;
	      },
	      // "he would go" -> "he'd go"
	      contract: function contract() {
	        the.terms = contractions.contract(the.terms);
	        return the;
	      }
	    };
	  }

	  //Sentence methods:

	  //insert a new word at this point


	  _createClass(Sentence, [{
	    key: 'addBefore',
	    value: function addBefore(i, str) {
	      var t = new Term(str);
	      this.terms.splice(i, 0, t);
	    }
	  }, {
	    key: 'addAfter',
	    value: function addAfter(i, str) {
	      var t = new Term(str);
	      this.terms.splice(i + 1, 0, t);
	    }

	    // a regex-like lookup for a list of terms.
	    // returns [] of matches in a 'Terms' class

	  }, {
	    key: 'match',
	    value: function match(match_str, options) {
	      var regs = tokenize_match(match_str);
	      return _match.findAll(this.terms, regs, options);
	    }
	    //returns a transformed sentence

	  }, {
	    key: 'replace',
	    value: function replace(match_str, replacement, options) {
	      var regs = tokenize_match(match_str);
	      replacement = tokenize_match(replacement);
	      _match.replaceAll(this.terms, regs, replacement, options);
	      return this;
	    }

	    //the ending punctuation

	  }, {
	    key: 'terminator',
	    value: function terminator() {
	      var allowed = {
	        '.': true,
	        '?': true,
	        '!': true
	      };
	      var char = this.str.match(/([\.\?\!])\W*$/);
	      if (char && allowed[char[1]]) {
	        return char[1];
	      }
	      return '';
	    }

	    //part-of-speech assign each term

	  }, {
	    key: 'tag',
	    value: function tag() {
	      this.terms = tagger(this);
	      return this.terms;
	    }

	    //is it a question/statement

	  }, {
	    key: 'sentence_type',
	    value: function sentence_type() {
	      var char = this.terminator();
	      var types = {
	        '?': 'interrogative',
	        '!': 'exclamative',
	        '.': 'declarative'
	      };
	      return types[char] || 'declarative';
	    }

	    // A was verbed by B - B verbed A

	  }, {
	    key: 'is_passive',
	    value: function is_passive() {
	      return passive_voice(this);
	    }
	    // Question doesn't have negate, this is a placeholder

	  }, {
	    key: 'negate',
	    value: function negate() {
	      return this;
	    }

	    //map over Term methods

	  }, {
	    key: 'text',
	    value: function text() {
	      return this.terms.reduce(function (s, t) {
	        //implicit contractions shouldn't be included
	        if (t.text) {
	          s += (t.whitespace.preceding || '') + t.text + (t.whitespace.trailing || '');
	        }
	        return s;
	      }, '');
	    }
	    //like text but for cleaner text

	  }, {
	    key: 'normal',
	    value: function normal() {
	      var str = this.terms.reduce(function (s, t) {
	        if (t.normal) {
	          s += ' ' + t.normal;
	        }
	        return s;
	      }, '').trim();
	      return str + this.terminator();
	    }

	    //further 'lemmatisation/inflection'

	  }, {
	    key: 'root',
	    value: function root() {
	      return this.terms.reduce(function (s, t) {
	        s += ' ' + t.root();
	        return s;
	      }, '').trim();
	    }
	    //return only the main POS classnames/tags

	  }, {
	    key: 'tags',
	    value: function tags() {
	      return this.terms.map(function (t) {
	        return t.tag || '?';
	      });
	    }
	    //mining for specific things

	  }, {
	    key: 'people',
	    value: function people() {
	      return this.terms.filter(function (t) {
	        return t.pos['Person'];
	      });
	    }
	  }, {
	    key: 'places',
	    value: function places() {
	      return this.terms.filter(function (t) {
	        return t.pos['Place'];
	      });
	    }
	  }, {
	    key: 'dates',
	    value: function dates() {
	      return this.terms.filter(function (t) {
	        return t.pos['Date'];
	      });
	    }
	  }, {
	    key: 'organizations',
	    value: function organizations() {
	      return this.terms.filter(function (t) {
	        return t.pos['Organization'];
	      });
	    }
	  }, {
	    key: 'values',
	    value: function values() {
	      return this.terms.filter(function (t) {
	        return t.pos['Value'];
	      });
	    }

	    //parts of speech

	  }, {
	    key: 'nouns',
	    value: function nouns() {
	      return this.terms.filter(function (t) {
	        return t.pos['Noun'];
	      });
	    }
	  }, {
	    key: 'adjectives',
	    value: function adjectives() {
	      return this.terms.filter(function (t) {
	        return t.pos['Adjective'];
	      });
	    }
	  }, {
	    key: 'verbs',
	    value: function verbs() {
	      return this.terms.filter(function (t) {
	        return t.pos['Verb'];
	      });
	    }
	  }, {
	    key: 'adverbs',
	    value: function adverbs() {
	      return this.terms.filter(function (t) {
	        return t.pos['Adverb'];
	      });
	    }

	    // john walks quickly -> john walked quickly

	  }, {
	    key: 'to_past',
	    value: function to_past() {
	      change_tense(this, 'past');
	      return this;
	    }
	    // john walked quickly -> john walks quickly

	  }, {
	    key: 'to_present',
	    value: function to_present() {
	      change_tense(this, 'present');
	      return this;
	    }
	    // john walked quickly -> john will walk quickly

	  }, {
	    key: 'to_future',
	    value: function to_future() {
	      change_tense(this, 'future');
	      return this;
	    }
	  }, {
	    key: 'strip_conditions',
	    value: function strip_conditions() {
	      var _this = this;

	      this.terms = this.terms.filter(function (t, i) {
	        //remove preceding condition
	        if (i > 0 && t.pos['Condition'] && !_this.terms[i - 1].pos['Condition']) {
	          _this.terms[i - 1].text = _this.terms[i - 1].text.replace(/,$/, '');
	          _this.terms[i - 1].whitespace.trailing = '';
	          _this.terms[i - 1].rebuild();
	        }
	        return !t.pos['Condition'];
	      });
	      return this;
	    }

	    //'semantic' word-count, skips over implicit terms and things

	  }, {
	    key: 'word_count',
	    value: function word_count() {
	      return this.terms.filter(function (t) {
	        //a quiet term, from a contraction
	        if (t.normal === '') {
	          return false;
	        }
	        return true;
	      }).length;
	    }

	    //named-entity recognition

	  }, {
	    key: 'topics',
	    value: function topics() {
	      return spot(this);
	    }
	  }]);

	  return Sentence;
	}();

	//unpublished methods
	//tokenize the match string, just like you'd tokenize the sentence.
	//this avoids lumper/splitter problems between haystack and needle


	tokenize_match = function tokenize_match(str) {
	  var regs = new Sentence(str).terms; //crazy!
	  regs = regs.map(function (t) {
	    return t.text;
	  });
	  regs = regs.filter(function (t) {
	    return t !== '';
	  });
	  return regs;
	};

	Sentence.fn = Sentence.prototype;

	module.exports = Sentence;

	// let s = new Sentence(`don't go`);
	// console.log(s.text());
	// s.contractions.expand();
	// console.log(s.text());
	// s.contractions.contract();
	// console.log(s.text());

	},{"../match/match":26,"../term/term":101,"./change_tense":30,"./contractions/contract":31,"./contractions/expand":32,"./passive_voice":33,"./pos/tagger":54,"./spot":61}],61:[function(_dereq_,module,exports){
	'use strict';
	//generic named-entity-recognition

	var blacklist = {
	  man: true,
	  woman: true,
	  girl: true,
	  boy: true,
	  guy: true,
	  father: true,
	  mother: true,
	  sister: true,
	  brother: true
	};

	var consolidate = function consolidate(topics) {
	  var names = {};
	  for (var i = 0; i < topics.length; i++) {
	    var normal = topics[i].root();
	    if (normal) {
	      names[normal] = names[normal] || {
	        count: 0,
	        text: normal
	      };
	      names[normal].count += 1;
	    }
	  }
	  //sort by freq
	  var arr = Object.keys(names).map(function (k) {
	    return names[k];
	  });
	  return arr.sort(function (a, b) {
	    if (a.count > b.count) {
	      return -1;
	    } else {
	      return 1;
	    }
	  });
	};

	var spot = function spot(s) {
	  var topics = [];
	  for (var i = 0; i < s.terms.length; i++) {
	    var t = s.terms[i];
	    //some stop-words
	    if (blacklist[t.normal]) {
	      continue;
	    }
	    //grab person, place, locations
	    if (t.pos['Place'] || t.pos['Organization']) {
	      topics.push(t);
	      continue;
	    }
	    if (t.pos['Person'] && !t.pos['Pronoun']) {
	      topics.push(t);
	      continue;
	    }
	    //add capitalized nouns...
	    if (i !== 0 && t.pos['Noun'] && t.is_capital()) {
	      //no dates, or values
	      if (t.pos['Value'] || t.pos['Date'] || t.pos['Pronoun']) {
	        continue;
	      }
	      topics.push(t);
	    }
	  }
	  return consolidate(topics);
	};

	module.exports = spot;

	},{}],62:[function(_dereq_,module,exports){
	'use strict';

	var fns = _dereq_('../../../fns');

	//these terms are nicer ways to negate a sentence
	//ie. john always walks -> john always doesn't walk
	var logical_negate = {
	  'everyone': 'no one',
	  'everybody': 'nobody',
	  'someone': 'no one',
	  'somebody': 'nobody',
	  // everything:"nothing",
	  'always': 'never'
	};
	//create corrollary
	var logical_affirm = fns.reverseObj(logical_negate);
	//these are not symmetic
	logical_affirm['nobody'] = 'somebody';

	var negate = function negate(s) {
	  var _loop = function _loop(i) {
	    var t = s.terms[i];
	    //these verbs are red-herrings
	    if (t.pos['Condition'] || t.pos['Quotation']) {
	      return 'continue';
	    }
	    //logical-negations are smoother than verb-negations
	    //ie. always -> never
	    if (logical_negate[t.normal]) {
	      t.changeTo(logical_negate[t.normal]);
	      return 'break';
	    }
	    if (logical_affirm[t.normal]) {
	      t.changeTo(logical_affirm[t.normal]);
	      return 'break';
	    }
	    //negate the first verb
	    if (t.pos['Verb']) {

	      //different rule for i/we/they/you + infinitive
	      //that is, 'i walk' -> 'i don\'t walk', not 'I not walk'
	      var isPronounAndInfinitive = function isPronounAndInfinitive() {
	        if (s.terms[i - 1]) {
	          var p = s.terms[i - 1].text;
	          return (p === 'i' || p === 'we' || p === 'they' || p === 'you') && t.pos['Infinitive'];
	        }
	        return false;
	      };

	      if (isPronounAndInfinitive()) {
	        t.changeTo('don\'t ' + t.text);
	        return 'break';
	      }
	      t.negate();
	      return 'break';
	    }
	  };

	  _loop2: for (var i = 0; i < s.terms.length; i++) {
	    var _ret = _loop(i);

	    switch (_ret) {
	      case 'continue':
	        continue;

	      case 'break':
	        break _loop2;}
	  }

	  return;
	};

	module.exports = negate;

	},{"../../../fns":23}],63:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Sentence = _dereq_('../sentence.js');
	var _negate = _dereq_('./negate/negate.js');

	var Statement = function (_Sentence) {
	  _inherits(Statement, _Sentence);

	  function Statement(str, options) {
	    _classCallCheck(this, Statement);

	    return _possibleConstructorReturn(this, (Statement.__proto__ || Object.getPrototypeOf(Statement)).call(this, str, options));
	  }

	  _createClass(Statement, [{
	    key: 'negate',
	    value: function negate() {
	      _negate(this);
	      return this;
	    }
	  }]);

	  return Statement;
	}(Sentence);

	Statement.fn = Statement.prototype;

	module.exports = Statement;

	// let s = new Statement('john is a person');
	// console.log(s);

	},{"../sentence.js":60,"./negate/negate.js":62}],64:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Term = _dereq_('../term.js');

	var _to_comparative = _dereq_('./to_comparative');
	var _to_superlative = _dereq_('./to_superlative');
	var adj_to_adv = _dereq_('./to_adverb');
	var adj_to_noun = _dereq_('./to_noun');

	var Adjective = function (_Term) {
	  _inherits(Adjective, _Term);

	  function Adjective(str, tag) {
	    _classCallCheck(this, Adjective);

	    var _this = _possibleConstructorReturn(this, (Adjective.__proto__ || Object.getPrototypeOf(Adjective)).call(this, str));

	    _this.tag = tag;
	    if (tag) {
	      _this.pos[tag] = true;
	    }
	    _this.pos['Adjective'] = true;
	    return _this;
	  }

	  _createClass(Adjective, [{
	    key: 'to_comparative',
	    value: function to_comparative() {
	      return _to_comparative(this.normal);
	    }
	  }, {
	    key: 'to_superlative',
	    value: function to_superlative() {
	      return _to_superlative(this.normal);
	    }
	  }, {
	    key: 'to_noun',
	    value: function to_noun() {
	      return adj_to_noun(this.normal);
	    }
	  }, {
	    key: 'to_adverb',
	    value: function to_adverb() {
	      return adj_to_adv(this.normal);
	    }
	  }, {
	    key: 'conjugate',
	    value: function conjugate() {
	      return {
	        comparative: _to_comparative(this.normal),
	        superlative: _to_superlative(this.normal),
	        adverb: adj_to_adv(this.normal),
	        noun: adj_to_noun(this.normal)
	      };
	    }
	  }, {
	    key: 'all_forms',
	    value: function all_forms() {
	      var forms = this.conjugate();
	      forms['normal'] = this.normal;
	      return forms;
	    }
	  }]);

	  return Adjective;
	}(Term);

	Adjective.fn = Adjective.prototype;

	//let t = new Adjective("quick")
	//console.log(t.all_forms());

	module.exports = Adjective;

	},{"../term.js":101,"./to_adverb":65,"./to_comparative":66,"./to_noun":67,"./to_superlative":68}],65:[function(_dereq_,module,exports){
	//turn 'quick' into 'quickly'
	'use strict';

	var adj_to_adv = function adj_to_adv(str) {
	  var irregulars = {
	    'idle': 'idly',
	    'public': 'publicly',
	    'vague': 'vaguely',
	    'day': 'daily',
	    'icy': 'icily',
	    'single': 'singly',
	    'female': 'womanly',
	    'male': 'manly',
	    'simple': 'simply',
	    'whole': 'wholly',
	    'special': 'especially',
	    'straight': 'straight',
	    'wrong': 'wrong',
	    'fast': 'fast',
	    'hard': 'hard',
	    'late': 'late',
	    'early': 'early',
	    'well': 'well',
	    'good': 'well',
	    'little': 'little',
	    'long': 'long',
	    'low': 'low',
	    'best': 'best',
	    'latter': 'latter',
	    'bad': 'badly'
	  };

	  var dont = {
	    'foreign': 1,
	    'black': 1,
	    'modern': 1,
	    'next': 1,
	    'difficult': 1,
	    'degenerate': 1,
	    'young': 1,
	    'awake': 1,
	    'back': 1,
	    'blue': 1,
	    'brown': 1,
	    'orange': 1,
	    'complex': 1,
	    'cool': 1,
	    'dirty': 1,
	    'done': 1,
	    'empty': 1,
	    'fat': 1,
	    'fertile': 1,
	    'frozen': 1,
	    'gold': 1,
	    'grey': 1,
	    'gray': 1,
	    'green': 1,
	    'medium': 1,
	    'parallel': 1,
	    'outdoor': 1,
	    'unknown': 1,
	    'undersized': 1,
	    'used': 1,
	    'welcome': 1,
	    'yellow': 1,
	    'white': 1,
	    'fixed': 1,
	    'mixed': 1,
	    'super': 1,
	    'guilty': 1,
	    'tiny': 1,
	    'able': 1,
	    'unable': 1,
	    'same': 1,
	    'adult': 1
	  };

	  var transforms = [{
	    reg: /al$/i,
	    repl: 'ally'
	  }, {
	    reg: /ly$/i,
	    repl: 'ly'
	  }, {
	    reg: /(.{3})y$/i,
	    repl: '$1ily'
	  }, {
	    reg: /que$/i,
	    repl: 'quely'
	  }, {
	    reg: /ue$/i,
	    repl: 'uly'
	  }, {
	    reg: /ic$/i,
	    repl: 'ically'
	  }, {
	    reg: /ble$/i,
	    repl: 'bly'
	  }, {
	    reg: /l$/i,
	    repl: 'ly'
	  }];

	  var not_matches = [/airs$/, /ll$/, /ee.$/, /ile$/];

	  if (dont[str]) {
	    return null;
	  }
	  if (irregulars[str]) {
	    return irregulars[str];
	  }
	  if (str.length <= 3) {
	    return null;
	  }
	  for (var i = 0; i < not_matches.length; i++) {
	    if (str.match(not_matches[i])) {
	      return null;
	    }
	  }
	  for (var _i = 0; _i < transforms.length; _i++) {
	    if (str.match(transforms[_i].reg)) {
	      return str.replace(transforms[_i].reg, transforms[_i].repl);
	    }
	  }
	  return str + 'ly';
	};
	// console.log(adj_to_adv('direct'))

	module.exports = adj_to_adv;

	},{}],66:[function(_dereq_,module,exports){
	//turn 'quick' into 'quickly'
	'use strict';

	var convertables = _dereq_('../../data/convertables.js');

	var irregulars = {
	  'grey': 'greyer',
	  'gray': 'grayer',
	  'green': 'greener',
	  'yellow': 'yellower',
	  'red': 'redder',
	  'good': 'better',
	  'well': 'better',
	  'bad': 'worse',
	  'sad': 'sadder',
	  'big': 'bigger'
	};

	var dont = {
	  'overweight': 1,
	  'main': 1,
	  'nearby': 1,
	  'asleep': 1,
	  'weekly': 1,
	  'secret': 1,
	  'certain': 1
	};

	var transforms = [{
	  reg: /y$/i,
	  repl: 'ier'
	}, {
	  reg: /([aeiou])t$/i,
	  repl: '$1tter'
	}, {
	  reg: /([aeou])de$/i,
	  repl: '$1der'
	}, {
	  reg: /nge$/i,
	  repl: 'nger'
	}];

	var matches = [/ght$/, /nge$/, /ough$/, /ain$/, /uel$/, /[au]ll$/, /ow$/, /old$/, /oud$/, /e[ae]p$/];

	var not_matches = [/ary$/, /ous$/];

	var to_comparative = function to_comparative(str) {
	  if (dont.hasOwnProperty(str)) {
	    return null;
	  }

	  if (irregulars.hasOwnProperty(str)) {
	    return irregulars[str];
	  }

	  for (var i = 0; i < transforms.length; i++) {
	    if (str.match(transforms[i].reg)) {
	      return str.replace(transforms[i].reg, transforms[i].repl);
	    }
	  }

	  if (convertables.hasOwnProperty(str)) {
	    if (str.match(/e$/)) {
	      return str + 'r';
	    }
	    return str + 'er';
	  }

	  for (var _i = 0; _i < not_matches.length; _i++) {
	    if (str.match(not_matches[_i])) {
	      return 'more ' + str;
	    }
	  }

	  for (var _i2 = 0; _i2 < matches.length; _i2++) {
	    if (str.match(matches[_i2])) {
	      return str + 'er';
	    }
	  }
	  return 'more ' + str;
	};

	// console.log(to_comparative('big'));

	module.exports = to_comparative;

	},{"../../data/convertables.js":3}],67:[function(_dereq_,module,exports){
	//convert cute to cuteness
	'use strict';

	var to_noun = function to_noun(w) {
	  var irregulars = {
	    'clean': 'cleanliness',
	    'naivety': 'naivety'
	  };
	  if (!w) {
	    return '';
	  }
	  if (irregulars.hasOwnProperty(w)) {
	    return irregulars[w];
	  }
	  if (w.match(' ')) {
	    return w;
	  }
	  if (w.match(/w$/)) {
	    return w;
	  }
	  var transforms = [{
	    'reg': /y$/,
	    'repl': 'iness'
	  }, {
	    'reg': /le$/,
	    'repl': 'ility'
	  }, {
	    'reg': /ial$/,
	    'repl': 'y'
	  }, {
	    'reg': /al$/,
	    'repl': 'ality'
	  }, {
	    'reg': /ting$/,
	    'repl': 'ting'
	  }, {
	    'reg': /ring$/,
	    'repl': 'ring'
	  }, {
	    'reg': /bing$/,
	    'repl': 'bingness'
	  }, {
	    'reg': /sing$/,
	    'repl': 'se'
	  }, {
	    'reg': /ing$/,
	    'repl': 'ment'
	  }, {
	    'reg': /ess$/,
	    'repl': 'essness'
	  }, {
	    'reg': /ous$/,
	    'repl': 'ousness'
	  }];

	  for (var i = 0; i < transforms.length; i++) {
	    if (w.match(transforms[i].reg)) {
	      return w.replace(transforms[i].reg, transforms[i].repl);
	    }
	  }

	  if (w.match(/s$/)) {
	    return w;
	  }
	  return w + 'ness';
	};

	// console.log(to_noun("great"))

	module.exports = to_noun;

	},{}],68:[function(_dereq_,module,exports){
	//turn 'quick' into 'quickest'
	'use strict';

	var convertables = _dereq_('../../data/convertables.js');

	var irregulars = {
	  'nice': 'nicest',
	  'late': 'latest',
	  'hard': 'hardest',
	  'inner': 'innermost',
	  'outer': 'outermost',
	  'far': 'furthest',
	  'worse': 'worst',
	  'bad': 'worst',
	  'good': 'best',
	  'big': 'biggest'
	};

	var dont = {
	  'overweight': 1,
	  'ready': 1
	};

	var transforms = [{
	  'reg': /y$/i,
	  'repl': 'iest'
	}, {
	  'reg': /([aeiou])t$/i,
	  'repl': '$1ttest'
	}, {
	  'reg': /([aeou])de$/i,
	  'repl': '$1dest'
	}, {
	  'reg': /nge$/i,
	  'repl': 'ngest'
	}];

	var matches = [/ght$/, /nge$/, /ough$/, /ain$/, /uel$/, /[au]ll$/, /ow$/, /oud$/, /...p$/];

	var not_matches = [/ary$/];

	var generic_transformation = function generic_transformation(s) {
	  if (s.match(/e$/)) {
	    return s + 'st';
	  }
	  return s + 'est';
	};

	var to_superlative = function to_superlative(str) {
	  if (irregulars.hasOwnProperty(str)) {
	    return irregulars[str];
	  }
	  for (var i = 0; i < transforms.length; i++) {
	    if (str.match(transforms[i].reg)) {
	      return str.replace(transforms[i].reg, transforms[i].repl);
	    }
	  }

	  if (convertables.hasOwnProperty(str)) {
	    return generic_transformation(str);
	  }

	  if (dont.hasOwnProperty(str)) {
	    return 'most ' + str;
	  }

	  for (var _i = 0; _i < not_matches.length; _i++) {
	    if (str.match(not_matches[_i])) {
	      return 'most ' + str;
	    }
	  }

	  for (var _i2 = 0; _i2 < matches.length; _i2++) {
	    if (str.match(matches[_i2])) {
	      if (irregulars.hasOwnProperty(str)) {
	        return irregulars[str];
	      }
	      return generic_transformation(str);
	    }
	  }
	  return 'most ' + str;
	};

	// console.log(to_superlative("great"))

	module.exports = to_superlative;

	},{"../../data/convertables.js":3}],69:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Term = _dereq_('../term.js');
	var _to_adjective = _dereq_('./to_adjective.js');

	var Adverb = function (_Term) {
	  _inherits(Adverb, _Term);

	  function Adverb(str, tag) {
	    _classCallCheck(this, Adverb);

	    var _this = _possibleConstructorReturn(this, (Adverb.__proto__ || Object.getPrototypeOf(Adverb)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Adverb'] = true;
	    return _this;
	  }

	  _createClass(Adverb, [{
	    key: 'to_adjective',
	    value: function to_adjective() {
	      return _to_adjective(this.normal);
	    }
	  }, {
	    key: 'all_forms',
	    value: function all_forms() {
	      return {
	        adjective: this.to_adjective(),
	        normal: this.normal
	      };
	    }
	  }]);

	  return Adverb;
	}(Term);

	Adverb.fn = Adverb.prototype;

	//let t = new Adverb("quickly")
	//console.log(t.all_forms());

	module.exports = Adverb;

	},{"../term.js":101,"./to_adjective.js":70}],70:[function(_dereq_,module,exports){
	//turns 'quickly' into 'quick'
	'use strict';

	var to_adjective = function to_adjective(str) {
	  var irregulars = {
	    'idly': 'idle',
	    'sporadically': 'sporadic',
	    'basically': 'basic',
	    'grammatically': 'grammatical',
	    'alphabetically': 'alphabetical',
	    'economically': 'economical',
	    'conically': 'conical',
	    'politically': 'political',
	    'vertically': 'vertical',
	    'practically': 'practical',
	    'theoretically': 'theoretical',
	    'critically': 'critical',
	    'fantastically': 'fantastic',
	    'mystically': 'mystical',
	    'pornographically': 'pornographic',
	    'fully': 'full',
	    'jolly': 'jolly',
	    'wholly': 'whole'
	  };
	  var transforms = [{
	    'reg': /bly$/i,
	    'repl': 'ble'
	  }, {
	    'reg': /gically$/i,
	    'repl': 'gical'
	  }, {
	    'reg': /([rsdh])ically$/i,
	    'repl': '$1ical'
	  }, {
	    'reg': /ically$/i,
	    'repl': 'ic'
	  }, {
	    'reg': /uly$/i,
	    'repl': 'ue'
	  }, {
	    'reg': /ily$/i,
	    'repl': 'y'
	  }, {
	    'reg': /(.{3})ly$/i,
	    'repl': '$1'
	  }];
	  if (irregulars.hasOwnProperty(str)) {
	    return irregulars[str];
	  }
	  for (var i = 0; i < transforms.length; i++) {
	    if (str.match(transforms[i].reg)) {
	      return str.replace(transforms[i].reg, transforms[i].repl);
	    }
	  }
	  return str;
	};

	// console.log(to_adjective('quickly') === 'quick')
	// console.log(to_adjective('marvelously') === 'marvelous')
	module.exports = to_adjective;

	},{}],71:[function(_dereq_,module,exports){
	'use strict';
	//turn "plz"  "please"

	var implications = {
	  'plz': 'please',
	  'tmrw': 'tomorrow',
	  'wat': 'what',
	  'r': 'are',
	  'u': 'you'
	};

	var implied = function implied(str) {
	  if (implications[str]) {
	    return implications[str];
	  }
	  return null;
	};

	module.exports = implied;

	},{}],72:[function(_dereq_,module,exports){
	'use strict';

	var is_acronym = function is_acronym(str) {
	  //like N.D.A
	  if (str.match(/([A-Z]\.)+[A-Z]?$/)) {
	    return true;
	  }
	  //like NDA
	  if (str.match(/[A-Z]{2,}$/)) {
	    return true;
	  }
	  return false;
	};
	module.exports = is_acronym;

	},{}],73:[function(_dereq_,module,exports){
	'use strict';

	var is_acronym = _dereq_('../is_acronym.js');

	//chooses an indefinite aricle 'a/an' for a word
	var irregulars = {
	  'hour': 'an',
	  'heir': 'an',
	  'heirloom': 'an',
	  'honest': 'an',
	  'honour': 'an',
	  'honor': 'an',
	  'uber': 'an' //german u
	};

	var indefinite_article = function indefinite_article(str) {
	  if (!str) {
	    return null;
	  }

	  //pronounced letters of acronyms that get a 'an'
	  var an_acronyms = {
	    A: true,
	    E: true,
	    F: true,
	    H: true,
	    I: true,
	    L: true,
	    M: true,
	    N: true,
	    O: true,
	    R: true,
	    S: true,
	    X: true
	  };
	  //'a' regexes
	  var a_regexs = [/^onc?e/i, //'wu' sound of 'o'
	  /^u[bcfhjkqrstn][aeiou]/i, // 'yu' sound for hard 'u'
	  /^eul/i];

	  //begin business time
	  ////////////////////
	  //explicit irregular forms
	  if (irregulars.hasOwnProperty(str)) {
	    return irregulars[str];
	  }
	  //spelled-out acronyms
	  if (is_acronym(str) && an_acronyms.hasOwnProperty(str.substr(0, 1))) {
	    return 'an';
	  }
	  //'a' regexes
	  for (var i = 0; i < a_regexs.length; i++) {
	    if (str.match(a_regexs[i])) {
	      return 'a';
	    }
	  }
	  //basic vowel-startings
	  if (str.match(/^[aeiou]/i)) {
	    return 'an';
	  }
	  return 'a';
	};

	module.exports = indefinite_article;

	// console.log(indefinite_article('N.D.A'));

	},{"../is_acronym.js":72}],74:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Noun = _dereq_('../noun.js');
	var parse_date = _dereq_('./parse_date.js');

	var _Date = function (_Noun) {
	  _inherits(_Date, _Noun);

	  function _Date(str, tag) {
	    _classCallCheck(this, _Date);

	    var _this = _possibleConstructorReturn(this, (_Date.__proto__ || Object.getPrototypeOf(_Date)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Date'] = true;
	    _this.data = parse_date(_this.text) || {};
	    return _this;
	  }

	  //can we make it a js Date object?


	  _createClass(_Date, [{
	    key: 'is_date',
	    value: function is_date() {
	      var o = this.data;
	      if (o.month === null || o.day === null || o.year === null) {
	        return false;
	      }
	      return true;
	    }
	  }, {
	    key: 'date',
	    value: function date() {
	      if (this.is_date() === false) {
	        return null;
	      }
	      var d = new Date();
	      if (this.data.year) {
	        d.setYear(this.data.year);
	      }
	      if (this.data.month !== null) {
	        d.setMonth(this.data.month);
	      }
	      if (this.data.day !== null) {
	        d.setDate(this.data.day);
	      }
	      return d;
	    }
	  }]);

	  return _Date;
	}(Noun);

	_Date.fn = _Date.prototype;

	module.exports = _Date;

	// let d = new _Date('June 4th 1993');
	// console.log(d.date());

	},{"../noun.js":80,"./parse_date.js":77}],75:[function(_dereq_,module,exports){
	'use strict';

	var months = _dereq_('../../../data/dates').months.concat(['march', 'may']); //(march and may are ambiguous grammatically)
	var month = '(' + months.join('|') + ')';
	var day = '([0-9]{1,2})';
	var year = '\'?([12][0-9]{3})';

	var rules = [{
	  reg: month + ' ' + day + ' ' + year, //'March 1st 1987'
	  order: ['month', 'day', 'year']
	}, {
	  reg: day + ' of ' + month + ' ' + year, //'3rd of March 1969',
	  order: ['day', 'month', 'year']
	},

	//incomplete versions
	{
	  reg: day + ' of ' + month, //'3rd of March',
	  order: ['day', 'month']
	}, {
	  reg: month + ' ' + year, //'March 1969',
	  order: ['month', 'year']
	}, {
	  reg: month + ' ' + day, //'March 18th',
	  order: ['month', 'day']
	}, {
	  reg: day + ' ' + month, //'18th of March',
	  order: ['day', 'month']
	}, {
	  reg: '' + month, //'january'
	  order: ['month']
	}, {
	  reg: '' + year, //'1998'
	  order: ['year']
	}].map(function (o) {
	  o.reg = new RegExp('\\b' + o.reg + '\\b', '');
	  return o;
	});
	module.exports = rules;

	},{"../../../data/dates":5}],76:[function(_dereq_,module,exports){

	'use strict';

	var dates = _dereq_('../../../data/dates');

	//build date regex
	var terms = dates.months.concat(dates.days);
	var day_reg = '(\\b' + terms.join('\\b|\\b') + '\\b)';
	day_reg = new RegExp(day_reg, 'i');
	var times_reg = /1?[0-9]:[0-9]{2}/;
	var is_date = function is_date(str) {
	  if (str.match(day_reg) || str.match(times_reg)) {
	    return true;
	  }
	  //a straight-up year, like '2016'
	  if (str.match(/^[12][0-9]{3}$/)) {
	    var n = parseInt(str, 10);
	    if (n > 1300 && n < 2100) {
	      return true;
	    }
	  }
	  return false;
	};

	module.exports = is_date;

	// console.log(is_date('2015'));

	},{"../../../data/dates":5}],77:[function(_dereq_,module,exports){
	'use strict';
	// #generates properly-formatted dates from free-text date forms
	// #by spencer kelly 2015

	var to_number = _dereq_('../value/parse/to_number.js');
	//regexes to top-parse
	var rules = _dereq_('./date_rules.js');

	//return integers from strings
	var wrangle = {

	  year: function year(s) {
	    var num = s.match(/[0-9]+/);
	    num = parseInt(num, 10);
	    if (!num || num > 2900 || num < 0) {
	      return null;
	    }
	    //honestly, prob not a year either
	    if (num > 100 && num < 1000) {
	      return null;
	    }
	    //'20BC' becomes -20
	    if (s.match(/[0-9] ?bc/i)) {
	      return num *= -1;
	    }
	    // '98 becomes 1998
	    if (num < 100 && num > 30) {
	      num += 1900;
	    }
	    return num;
	  },

	  month: function month(s) {
	    //0 based months, 1 based days...
	    var months_obj = {
	      january: 0,
	      february: 1,
	      march: 2,
	      april: 3,
	      may: 4,
	      june: 5,
	      july: 6,
	      august: 7,
	      september: 8,
	      october: 9,
	      november: 10,
	      december: 11,
	      jan: 0,
	      feb: 1,
	      mar: 2,
	      apr: 3,
	      jun: 5,
	      jul: 6,
	      aug: 7,
	      sep: 8,
	      sept: 8,
	      oct: 9,
	      nov: 10,
	      dec: 11
	    };
	    return months_obj[s];
	  },

	  day: function day(s) {
	    var n = to_number(s) || parseInt(s, 10);
	    if (n < 0 || n > 31) {
	      return null;
	    }
	    return n;
	  }
	};

	//cleanup string
	var preprocess = function preprocess(str) {
	  str = str.toLowerCase();
	  str = str.replace(/([0-9]+)(nd|rd|th|st)/i, '$1');
	  var words = str.split(' ').map(function (w) {
	    if (!w.match(/[0-9]/)) {
	      return to_number(w) || w;
	    }
	    return w;
	  });
	  return words.join(' ');
	};

	var date_parser = function date_parser(str) {
	  str = preprocess(str);
	  var result = {
	    year: null,
	    month: null,
	    day: null
	  };
	  for (var i = 0; i < rules.length; i++) {
	    if (str.match(rules[i].reg)) {
	      var m = str.match(rules[i].reg);
	      for (var o = 0; o < rules[i].order.length; o++) {
	        var type = rules[i].order[o];
	        result[type] = wrangle[type](m[o + 1]);
	      }
	      break;
	    }
	  }
	  return result;
	};
	module.exports = date_parser;
	// console.log(wrangle.year('1998'));
	// console.log(date_parser('March 1st 1987'));
	// console.log(date_extractor('june second 1999'));

	},{"../value/parse/to_number.js":97,"./date_rules.js":75}],78:[function(_dereq_,module,exports){
	'use strict';

	var irregulars = _dereq_('../../data/irregular_nouns');

	//similar to plural/singularize rules, but not the same
	var plural_indicators = [/(^v)ies$/i, /ises$/i, /ives$/i, /(antenn|formul|nebul|vertebr|vit)ae$/i, /(octop|vir|radi|nucle|fung|cact|stimul)i$/i, /(buffal|tomat|tornad)oes$/i, /(analy|ba|diagno|parenthe|progno|synop|the)ses$/i, /(vert|ind|cort)ices$/i, /(matr|append)ices$/i, /(x|ch|ss|sh|s|z|o)es$/i, /men$/i, /news$/i, /.tia$/i, /(^f)ves$/i, /(lr)ves$/i, /(^aeiouy|qu)ies$/i, /(m|l)ice$/i, /(cris|ax|test)es$/i, /(alias|status)es$/i, /ics$/i];

	//similar to plural/singularize rules, but not the same
	var singular_indicators = [/(ax|test)is$/i, /(octop|vir|radi|nucle|fung|cact|stimul)us$/i, /(octop|vir)i$/i, /(rl)f$/i, /(alias|status)$/i, /(bu)s$/i, /(al|ad|at|er|et|ed|ad)o$/i, /(ti)um$/i, /(ti)a$/i, /sis$/i, /(?:(^f)fe|(lr)f)$/i, /hive$/i, /(^aeiouy|qu)y$/i, /(x|ch|ss|sh|z)$/i, /(matr|vert|ind|cort)(ix|ex)$/i, /(m|l)ouse$/i, /(m|l)ice$/i, /(antenn|formul|nebul|vertebr|vit)a$/i, /.sis$/i, /^(?!talis|.*hu)(.*)man$/i];

	var is_plural = function is_plural(str) {
	  str = (str || '').toLowerCase();
	  //handle 'mayors of chicago'
	  var preposition = str.match(/([a-z]*) (of|in|by|for) [a-z]/);
	  if (preposition && preposition[1]) {
	    str = preposition[1];
	  }
	  // if it's a known irregular case
	  for (var i = 0; i < irregulars.length; i++) {
	    if (irregulars[i][1] === str) {
	      return true;
	    }
	    if (irregulars[i][0] === str) {
	      return false;
	    }
	  }
	  for (var _i = 0; _i < plural_indicators.length; _i++) {
	    if (str.match(plural_indicators[_i])) {
	      return true;
	    }
	  }
	  for (var _i2 = 0; _i2 < singular_indicators.length; _i2++) {
	    if (str.match(singular_indicators[_i2])) {
	      return false;
	    }
	  }
	  // some 'looks pretty plural' rules
	  if (str.match(/s$/) && !str.match(/ss$/) && str.length > 3) {
	    //needs some lovin'
	    return true;
	  }
	  return false;
	};

	// console.log(is_plural('octopus') === false)
	// console.log(is_plural('octopi') === true)
	// console.log(is_plural('eyebrow') === false)
	// console.log(is_plural('eyebrows') === true)
	// console.log(is_plural('child') === false)
	// console.log(is_plural('children') === true)

	module.exports = is_plural;

	},{"../../data/irregular_nouns":10}],79:[function(_dereq_,module,exports){
	//uncountables are words that shouldn't ever inflect, for metaphysical reasons, like 'peace'
	'use strict';

	var uncountable_arr = _dereq_('../../data/uncountables.js');

	var uncountable = uncountable_arr.reduce(function (h, a) {
	  h[a] = true;
	  return h;
	}, {});

	var is_uncountable = function is_uncountable(str) {
	  if (uncountable[str]) {
	    return true;
	  }
	  return false;
	};
	// console.log(is_uncountable("peace") === true)
	// console.log(is_uncountable("dog") === false)
	module.exports = is_uncountable;

	},{"../../data/uncountables.js":21}],80:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Term = _dereq_('../term.js');
	var _article = _dereq_('./article.js');
	var _is_plural = _dereq_('./is_plural.js');
	var _is_place = _dereq_('./place/is_place.js');
	var _is_person = _dereq_('./person/is_person.js');
	var _pronoun = _dereq_('./pronoun.js');
	var _is_value = _dereq_('./value/is_value.js');
	var _is_date = _dereq_('./date/is_date.js');
	var _is_organization = _dereq_('./organization/is_organization.js');
	var _singularize = _dereq_('./singularize.js');
	var _pluralize = _dereq_('./pluralize.js');
	var _is_uncountable = _dereq_('./is_uncountable.js');

	var Noun = function (_Term) {
	  _inherits(Noun, _Term);

	  function Noun(str, tag) {
	    _classCallCheck(this, Noun);

	    var _this = _possibleConstructorReturn(this, (Noun.__proto__ || Object.getPrototypeOf(Noun)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Noun'] = true;
	    if (tag) {
	      _this.pos[tag] = true;
	    }
	    if (_this.is_plural()) {
	      _this.pos['Plural'] = true;
	    }
	    return _this;
	  }
	  //noun methods


	  _createClass(Noun, [{
	    key: 'article',
	    value: function article() {
	      //if it's a person, it's he/she, not a/an
	      if (this.pos['Person']) {
	        return this.pronoun();
	      }
	      //groups of people are 'they'
	      if (this.pos['Organization']) {
	        return 'they';
	      }
	      return _article(this.text);
	    }
	  }, {
	    key: 'root',
	    value: function root() {
	      return this.singularize();
	    }
	  }, {
	    key: 'pronoun',
	    value: function pronoun() {
	      if (this.is_organization() || this.is_place() || this.is_value()) {
	        return 'it';
	      }
	      return _pronoun(this.normal);
	    }
	  }, {
	    key: 'is_plural',
	    value: function is_plural() {
	      if (this.pos['Date'] || this.pos['Possessive']) {
	        return false;
	      } else if (this.has_abbreviation()) {
	        //contractions & possessives are not plural
	        return false;
	      } else {
	        return _is_plural(this.normal);
	      }
	    }
	  }, {
	    key: 'is_uncountable',
	    value: function is_uncountable() {
	      return _is_uncountable(this.strip_apostrophe());
	    }
	  }, {
	    key: 'pluralize',
	    value: function pluralize() {
	      return _pluralize(this.strip_apostrophe());
	    }
	  }, {
	    key: 'singularize',
	    value: function singularize() {
	      return _singularize(this.strip_apostrophe());
	    }
	    //sub-classes

	  }, {
	    key: 'is_person',
	    value: function is_person() {
	      //don't overwrite dates, etc
	      if (this.pos['Date']) {
	        return false;
	      }
	      return _is_person(this.strip_apostrophe());
	    }
	  }, {
	    key: 'is_organization',
	    value: function is_organization() {
	      //don't overwrite urls
	      if (this.pos['Url']) {
	        return false;
	      }
	      return _is_organization(this.strip_apostrophe(), this.text);
	    }
	  }, {
	    key: 'is_date',
	    value: function is_date() {
	      return _is_date(this.strip_apostrophe());
	    }
	  }, {
	    key: 'is_value',
	    value: function is_value() {
	      //don't overwrite dates, etc
	      if (this.pos['Date'] || this.pos['HashTag']) {
	        return false;
	      }
	      return _is_value(this.strip_apostrophe());
	    }
	  }, {
	    key: 'is_place',
	    value: function is_place() {
	      return _is_place(this.strip_apostrophe());
	    }
	  }, {
	    key: 'all_forms',
	    value: function all_forms() {
	      return {
	        'singular': this.singularize(),
	        'plural': this.pluralize(),
	        'normal': this.normal
	      };
	    }
	  }]);

	  return Noun;
	}(Term);

	Noun.fn = Noun.prototype;

	module.exports = Noun;

	//let t = new Noun('mouse');
	//console.log(t.all_forms());

	},{"../term.js":101,"./article.js":73,"./date/is_date.js":76,"./is_plural.js":78,"./is_uncountable.js":79,"./organization/is_organization.js":81,"./person/is_person.js":84,"./place/is_place.js":87,"./pluralize.js":89,"./pronoun.js":90,"./singularize.js":91,"./value/is_value.js":94}],81:[function(_dereq_,module,exports){
	'use strict';

	var abbreviations = _dereq_('../../../data/abbreviations');
	var org_data = _dereq_('../../../data/organizations');

	//some boring capitalised acronyms you see frequently
	var blacklist = {
	  url: true,
	  http: true,
	  wtf: true,
	  irl: true,
	  ie: true,
	  eg: true,
	  gps: true,
	  dna: true,
	  sms: true };

	//words like 'co' and ltd
	var org_suffix = abbreviations.orgs.reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});
	org_data.suffixes.forEach(function (s) {
	  //a few more
	  org_suffix[s] = true;
	});

	//named orgs like google and nestle
	var org_names = org_data.organizations.reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});

	var is_organization = function is_organization(str, text) {
	  text = text || '';
	  //blacklist some boring ones
	  if (blacklist[str]) {
	    return false;
	  }
	  //some known organizations, like microsoft
	  if (org_names[str]) {
	    return true;
	  }
	  //no period acronyms
	  if (text.length <= 5 && text.match(/^[A-Z][A-Z]+$/) !== null) {
	    return true;
	  }
	  //period acronyms
	  if (text.length >= 4 && text.match(/^([A-Z]\.)*$/) !== null) {
	    return true;
	  }
	  // eg 'Smith & Co'
	  if (str.match(/ & /)) {
	    return true;
	  }
	  // Girlscouts of Canada
	  if (str.match(/..s of /)) {
	    return true;
	  }
	  // eg pets.com
	  if (str.match(/[a-z]{3}\.(com|net|org|biz)/)) {
	    //not a perfect url regex, but a "org.com"
	    return true;
	  }
	  // "foobar inc."
	  var words = str.split(' ');
	  if (words.length > 1) {
	    var last = words[words.length - 1];
	    if (org_suffix[last]) {
	      return true;
	    }
	  }

	  return false;
	};

	module.exports = is_organization;

	// console.log(is_organization('Captain of Jamaica'));

	},{"../../../data/abbreviations":1,"../../../data/organizations":17}],82:[function(_dereq_,module,exports){
	'use strict';

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Noun = _dereq_('../noun.js');

	var Organization = function (_Noun) {
	  _inherits(Organization, _Noun);

	  function Organization(str, tag) {
	    _classCallCheck(this, Organization);

	    var _this = _possibleConstructorReturn(this, (Organization.__proto__ || Object.getPrototypeOf(Organization)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Organization'] = true;

	    return _this;
	  }

	  return Organization;
	}(Noun);

	Organization.fn = Organization.prototype;
	module.exports = Organization;

	},{"../noun.js":80}],83:[function(_dereq_,module,exports){
	'use strict';

	var firstnames = _dereq_('../../../data/firstnames').all;
	var parse_name = _dereq_('./parse_name.js');

	var gender = function gender(normal) {
	  if (normal === 'he') {
	    return 'Male';
	  }
	  if (normal === 'she') {
	    return 'Female';
	  }
	  var o = parse_name(normal);
	  var firstName = o.firstName;
	  if (!firstName) {
	    return null;
	  }
	  if (firstnames[firstName] === 'm') {
	    return 'Male';
	  }
	  if (firstnames[firstName] === 'f') {
	    return 'Female';
	  }
	  //male honourifics
	  if (normal.match(/\b(mr|mister|sr|sir|jr)\b/i)) {
	    return 'Male';
	  }
	  //female honourifics
	  if (normal.match(/^(mrs|miss|ms|misses|mme|mlle)\.? /i)) {
	    return 'Female';
	  }
	  //statistical guesses
	  if (firstName.match(/.(i|ee|[a|e]y|a)$/i)) {
	    //this is almost-always true
	    return 'Female';
	  }
	  if (firstName.match(/[ou]$/i)) {
	    //if it ends in a 'oh or uh', male
	    return 'Male';
	  }
	  if (firstName.match(/(nn|ll|tt)/i)) {
	    //if it has double-consonants, female
	    return 'Female';
	  }
	  // name not recognized, or recognized as of indeterminate gender
	  return null;
	};
	module.exports = gender;

	// console.log(gender('john', 'john') === 'Male');
	// console.log(gender('jane smith', 'jane') === 'Female');
	// console.log(gender('jan smith', 'jan') === null);

	},{"../../../data/firstnames":7,"./parse_name.js":85}],84:[function(_dereq_,module,exports){
	'use strict';

	var firstnames = _dereq_('../../../data/firstnames').all;
	var honourifics = _dereq_('../../../data/honourifics').reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});

	//these pronouns are people
	var whitelist = {
	  'he': true,
	  'she': true,
	  'i': true,
	  'you': true
	};
	var is_person = function is_person(str) {
	  if (whitelist[str] || firstnames[str]) {
	    return true;
	  }
	  var words = str.split(' ');
	  if (words.length > 1) {
	    var first = words[0];
	    if (honourifics[first] || firstnames[first]) {
	      return true;
	    }
	  }
	  //check middle initial - "phil k dick"
	  if (words.length > 2) {
	    if (words[0].length > 1 && words[2].length > 1) {
	      if (words[1].match(/^[a-z]\.?$/)) {
	        return true;
	      }
	    }
	  }
	  return false;
	};

	module.exports = is_person;

	// console.log(is_person('Illi Danza'));

	},{"../../../data/firstnames":7,"../../../data/honourifics":9}],85:[function(_dereq_,module,exports){
	'use strict';

	var firstnames = _dereq_('../../../data/firstnames').all;
	var honourifics = _dereq_('../../../data/honourifics').reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});

	//str is a normalized string
	//str_orig is original text [optional]
	var parse_name = function parse_name(str, str_orig) {

	  var words = str.split(' ');
	  var o = {
	    honourific: null,
	    firstName: null,
	    middleName: null,
	    lastName: null
	  };

	  var double_firstname = 0; //assuming no

	  //first-word honourific
	  if (honourifics[words[0]]) {
	    o.honourific = words[0];
	    words = words.slice(1, words.length);
	  }
	  //last-word honourific
	  if (honourifics[words[words.length - 1]]) {
	    o.honourific = words[words.length - 1];
	    words = words.slice(0, words.length - 1);
	  }
	  //see if the first word is now a known first-name
	  if (firstnames[words[0]]) {
	    o.firstName = words[0];
	    //is it a double name like Ann-Marie?
	    if (firstnames[words[1]] && str_orig && words.length > 1 && (str_orig.indexOf(' ') > str_orig.indexOf('-') || str_orig.indexOf(' ') === -1)) {
	      o.firstName += '-' + words[1];
	      words = words.slice(1, words.length);
	      double_firstname = str_orig.indexOf('-'); // > 0
	    }
	    words = words.slice(1, words.length);
	  } else {
	    //ambiguous one-word name
	    if (words.length === 1) {
	      return o;
	    }
	    //looks like an unknown first-name
	    o.firstName = words[0];
	    words = words.slice(1, words.length);
	  }
	  //assume the remaining is '[middle..] [last]'
	  //is it a double surname?
	  if (str_orig && str_orig.lastIndexOf('-') > double_firstname) {
	    if (words[words.length - 2]) {
	      o.lastName = words[words.length - 2] + '-' + words[words.length - 1].replace(/'s$/, '');
	      words = words.slice(0, words.length - 2);
	    }
	  } else if (words[words.length - 1]) {
	    o.lastName = words[words.length - 1].replace(/'s$/, '');
	    words = words.slice(0, words.length - 1);
	  }
	  o.middleName = words.join(' ');
	  return o;
	};

	module.exports = parse_name;

	},{"../../../data/firstnames":7,"../../../data/honourifics":9}],86:[function(_dereq_,module,exports){
	// not all cultures use the firstname-lastname practice. this does make some assumptions.
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Noun = _dereq_('../noun.js');
	var guess_gender = _dereq_('./gender.js');
	var parse_name = _dereq_('./parse_name.js');

	//capitalizes first letter of every word in a string
	var title_case = function title_case(s) {
	  if (!s) {
	    return s;
	  }
	  s = s.replace(/(^\w|-\w| \w)/g, function (v) {
	    return v.toUpperCase();
	  });
	  return s;
	};

	//capitalizes last name taking into account Mc-, Mac-, O'-
	var lastname_case = function lastname_case(s) {
	  if (!s) {
	    return s;
	  }

	  s = title_case(s);
	  s = s.replace(/(Mc|Mac|O\')(\w)/g, function (v) {
	    return v.replace(/\w$/, function (w) {
	      return w.toUpperCase();
	    });
	  });
	  return s;
	};

	var Person = function (_Noun) {
	  _inherits(Person, _Noun);

	  function Person(str, tag) {
	    _classCallCheck(this, Person);

	    var _this = _possibleConstructorReturn(this, (Person.__proto__ || Object.getPrototypeOf(Person)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Person'] = true;
	    _this.honourific = null;
	    _this.firstName = null;
	    _this.middleName = null;
	    _this.lastName = null;
	    _this.parse();
	    if (_this.isPronoun()) {
	      _this.pos['Pronoun'] = true;
	    }
	    if (tag) {
	      _this.pos[tag] = true;
	    }
	    return _this;
	  }

	  _createClass(Person, [{
	    key: 'isPronoun',
	    value: function isPronoun() {
	      var whitelist = {
	        'he': true,
	        'she': true,
	        'i': true,
	        'you': true
	      };
	      return whitelist[this.normal];
	    }

	    //proper normalised name without the cruft

	  }, {
	    key: 'root',
	    value: function root() {
	      if (this.isPronoun()) {
	        return this.normal;
	      }
	      var str = '';

	      if (this.firstName) {
	        str = this.firstName.toLowerCase();
	      }
	      if (this.middleName) {
	        str += ' ' + this.middleName.toLowerCase();
	      }
	      if (this.lastName) {
	        str += ' ' + this.lastName.toLowerCase();
	      }
	      return str.trim() || this.normal;
	    }

	    //turn a multi-word string into [first, middle, last, honourific]

	  }, {
	    key: 'parse',
	    value: function parse() {
	      var o = parse_name(this.normal, this.text.trim());
	      this.honourific = o.honourific;
	      this.firstName = title_case(o.firstName);
	      this.middleName = title_case(o.middleName);
	      this.lastName = lastname_case(o.lastName);
	    }
	  }, {
	    key: 'gender',
	    value: function gender() {
	      //if we already know it, from the lexicon
	      if (this.pos.FemalePerson) {
	        return 'Female';
	      }
	      if (this.pos.MalePerson) {
	        return 'Male';
	      }
	      return guess_gender(this.normal);
	    }
	  }, {
	    key: 'pronoun',
	    value: function pronoun() {
	      var pronouns = {
	        Male: 'he',
	        Female: 'she'
	      };
	      var gender = this.gender();
	      //return 'singular they' if no gender is found
	      return pronouns[gender] || 'they';
	    }
	  }]);

	  return Person;
	}(Noun);

	Person.fn = Person.prototype;
	module.exports = Person;
	/*
	let p = new Person('Jani-Lee K. o\'brien-macneil');
	console.log(p);
	let z = new Person('Mary-Jane Willson-Johnson');
	console.log(z);*/

	},{"../noun.js":80,"./gender.js":83,"./parse_name.js":85}],87:[function(_dereq_,module,exports){
	'use strict';

	var places = _dereq_('../../../data/places');
	var abbreviations = _dereq_('../../../data/abbreviations');
	//add Country names
	var isPlace = places.countries.reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});
	//add City names
	places.cities.forEach(function (s) {
	  isPlace[s] = true;
	});
	//add airports
	places.airports.forEach(function (s) {
	  isPlace[s] = true;
	});
	//add place abbreviations names
	abbreviations.places.forEach(function (s) {
	  isPlace[s] = true;
	});
	//these are signals too
	var firstwords = ['east', 'eastern', 'north', 'northeast', 'northern', 'northwest', 'south', 'southeast', 'southern', 'southwest', 'west', 'western'].reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});
	/*
	 USPS Commonly Used Street suffixes and abbreviations
	 http://pe.usps.gov/text/pub28/28apc_002.htm
	 These are USPS recognized Street Designators, but an address pattern is necessary for disambiguation (ex: #237 Jacksonville Circl)
	 */
	// const common_street_designators = [
	//   'allee',
	//   'anex',
	//   'annx',
	//   'aven',
	//   'avenu',
	//   'avnue',
	//   'bayoo',
	//   'blfs',
	//   'bluf',
	//   'bottm',
	//   'boul',
	//   'boulv',
	//   'brdge',
	//   'brks',
	//   'brnch',
	//   'bypa',
	//   'bypas',
	//   'byps',
	//   'canyn',
	//   'causwa',
	//   'centr',
	//   'circ',
	//   'circl',
	//   'cirs',
	//   'clfs',
	//   'cmns',
	//   'cnter',
	//   'cntr',
	//   'cnyn',
	//   'cors',
	//   'crcl',
	//   'crcle',
	//   'cres',
	//   'crse',
	//   'crsent',
	//   'crsnt',
	//   'crssng',
	//   'crst',
	//   'cswy',
	//   'ctrs',
	//   'curv',
	//   'driv',
	//   'ests',
	//   'expw',
	//   'expy',
	//   'extn',
	//   'extnsn',
	//   'exts',
	//   'flds',
	//   'flts',
	//   'forg',
	//   'frds',
	//   'freewy',
	//   'frgs',
	//   'frks',
	//   'frry',
	//   'frst',
	//   'frway',
	//   'frwy',
	//   'gardn',
	//   'gatewy',
	//   'gatway',
	//   'gdns',
	//   'glns',
	//   'grden',
	//   'grdn',
	//   'grdns',
	//   'grns',
	//   'grov',
	//   'grvs',
	//   'gtway',
	//   'gtwy',
	//   'harb',
	//   'harbr',
	//   'hbrs',
	//   'highwy',
	//   'hiway',
	//   'hiwy',
	//   'hllw',
	//   'holw',
	//   'holws',
	//   'hrbor',
	//   'hway',
	//   'inlt',
	//   'islnd',
	//   'islnds',
	//   'jction',
	//   'jctn',
	//   'jctns',
	//   'jcts',
	//   'junctn',
	//   'juncton',
	//   'knls',
	//   'knol',
	//   'lcks',
	//   'ldge',
	//   'lgts',
	//   'lndg',
	//   'lndng',
	//   'lodg',
	//   'mdws',
	//   'medows',
	//   'missn',
	//   'mnrs',
	//   'mntain',
	//   'mntn',
	//   'mntns',
	//   'mountin',
	//   'mssn',
	//   'mtin',
	//   'mtwy',
	//   'opas',
	//   'orch',
	//   'orchrd',
	//   'parkwy',
	//   'pkway',
	//   'pkwys',
	//   'plns',
	//   'plza',
	//   'pnes',
	//   'prts',
	//   'psge',
	//   'radiel',
	//   'radl',
	//   'rdge',
	//   'rdgs',
	//   'rivr',
	//   'rnch',
	//   'rnchs',
	//   'rpds',
	//   'shls',
	//   'shoar',
	//   'shoars',
	//   'shrs',
	//   'skwy',
	//   'skyway',
	//   'spgs',
	//   'spng',
	//   'spngs',
	//   'sprng',
	//   'sprngs',
	//   'sqre',
	//   'sqrs',
	//   'statn',
	//   'stra',
	//   'strav',
	//   'straven',
	//   'stravenue',
	//   'stravn',
	//   'streme',
	//   'strm',
	//   'strt',
	//   'strvn',
	//   'strvnue',
	//   'sumit',
	//   'sumitt',
	//   'throughway',
	//   'tpke',
	//   'trafficway',
	//   'trak',
	//   'trce',
	//   'trfy',
	//   'trks',
	//   'trlr',
	//   'trlrs',
	//   'trls',
	//   'trnpk',
	//   'trwy',
	//   'tunel',
	//   'tunl',
	//   'tunls',
	//   'tunnl',
	//   'turnpk',
	//   'upas',
	//   'vdct',
	//   'viadct',
	//   'vill',
	//   'villag',
	//   'villg',
	//   'villiage',
	//   'vist',
	//   'vlgs',
	//   'vlly',
	//   'vlys',
	//   'vsta',
	//   'xing',
	//   'xrds'
	// ];
	/*
	 USPS Primary Street Suffix Names
	 http://pe.usps.gov/text/pub28/28apc_002.htm
	 */
	var street_designators = ['alley', 'annex', 'arcade', 'avenue', 'bayou', 'beach', 'bend', 'bluff', 'bluffs', 'blvd', 'bottom', 'boulevard', 'branch', 'bridge', 'brook', 'brooks', 'bypass', 'camp', 'canyon', 'cape', 'causeway', 'center', 'centers', 'centre', 'circle', 'circles', 'cliff', 'cliffs', 'club', 'common', 'commons', 'corner', 'corners', 'course', 'court', 'courts', 'cove', 'coves', 'creek', 'crescent', 'crest', 'crossing', 'crossroad', 'crossroads', 'curve', 'divide', 'drive', 'drives', 'estate', 'estates', 'express', 'expressway', 'extension', 'extensions', 'fall', 'falls', 'ferry', 'field', 'fields', 'flat', 'flats', 'ford', 'fords', 'forest', 'forests', 'forge', 'forges', 'fork', 'forks', 'fort', 'freeway', 'garden', 'gardens', 'gateway', 'glen', 'glens', 'green', 'greens', 'grove', 'groves', 'harbor', 'harbors', 'haven', 'heights', 'highway', 'hill', 'hills', 'hollow', 'hollows', 'inlet', 'island', 'islands', 'isle', 'isles', 'junction', 'junctions', 'key', 'keys', 'knoll', 'knolls', 'lake', 'lakes', 'land', 'landing', 'lane', 'light', 'lights', 'loaf', 'lock', 'locks', 'lodge', 'loop', 'loops', 'mall', 'manor', 'manors', 'meadow', 'meadows', 'mews', 'mill', 'mills', 'mission', 'motorway', 'mount', 'mountain', 'mountains', 'neck', 'orchard', 'overpass', 'park', 'parks', 'parkway', 'parkways', 'pass', 'passage', 'path', 'paths', 'pike', 'pikes', 'pine', 'pines', 'place', 'plain', 'plains', 'plaza', 'point', 'points', 'port', 'ports', 'prairie', 'rad', 'radial', 'ramp', 'ranch', 'ranches', 'rapid', 'rapids', 'rest', 'ridge', 'ridges', 'river', 'road', 'roads', 'route', 'run', 'row', 'shoal', 'shoals', 'shore', 'shores', 'spring', 'springs', 'spur', 'spurs', 'square', 'squares', 'station', 'stream', 'street', 'streets', 'summit', 'terrace', 'trace', 'traces', 'track', 'tracks', 'trail', 'trailer', 'trails', 'tunnel', 'tunnels', 'turnpike', 'underpass', 'union', 'unions', 'valley', 'valleys', 'vally', 'via', 'viaduct', 'view', 'views', 'village', 'villages', 'ville', 'vista', 'walk', 'walks', 'wall', 'way', 'ways', 'well', 'wells'].reduce(function (h, s) {
	  h[s] = true;
	  return h;
	}, {});
	/*
	/*
	 USPS Primary Street Suffix Names
	 http://pe.usps.gov/text/pub28/28apc_002.htm
	 These are valid, but only given an address pattern (such as street number)
	 */
	// const street_designator_abbreviation = [
	//   'ally',
	//   'aly',
	//   'anx',
	//   'arc',
	//   'av',
	//   'ave',
	//   'avn',
	//   'bch',
	//   'bg',
	//   'bgs',
	//   'blf',
	//   'bnd',
	//   'bot',
	//   'br',
	//   'brg',
	//   'brk',
	//   'btm',
	//   'burg',
	//   'burgs',
	//   'byp',
	//   'byu',
	//   'cen',
	//   'cent',
	//   'cir',
	//   'clb',
	//   'clf',
	//   'cmn',
	//   'cmp',
	//   'cor',
	//   'cp',
	//   'cpe',
	//   'crk',
	//   'ct',
	//   'ctr',
	//   'cts',
	//   'cv',
	//   'cvs',
	//   'cyn',
	//   'dale',
	//   'dam',
	//   'div',
	//   'dl',
	//   'dm',
	//   'dr',
	//   'drs',
	//   'drv',
	//   'dv',
	//   'dvd',
	//   'est',
	//   'exp',
	//   'expr',
	//   'ext',
	//   'fld',
	//   'fls',
	//   'flt',
	//   'frd',
	//   'frg',
	//   'frk',
	//   'frt',
	//   'fry',
	//   'ft',
	//   'fwy',
	//   'gdn',
	//   'gln',
	//   'grn',
	//   'grv',
	//   'hbr',
	//   'hl',
	//   'hls',
	//   'ht',
	//   'hts',
	//   'hvn',
	//   'hwy',
	//   'iss',
	//   'jct',
	//   'knl',
	//   'ky',
	//   'kys',
	//   'lc',
	//   'ldg',
	//   'lf',
	//   'lgt',
	//   'lk',
	//   'lks',
	//   'ln',
	//   'mdw',
	//   'ml',
	//   'mls',
	//   'mnr',
	//   'mnt',
	//   'msn',
	//   'mt',
	//   'mtn',
	//   'mtns',
	//   'nck',
	//   'oval',
	//   'ovl',
	//   'pkwy',
	//   'pky',
	//   'pl',
	//   'pln',
	//   'plz',
	//   'pne',
	//   'pr',
	//   'prk',
	//   'prr',
	//   'prt',
	//   'pt',
	//   'pts',
	//   'rd',
	//   'rdg',
	//   'rds',
	//   'riv',
	//   'rpd',
	//   'rst',
	//   'rte',
	//   'rue',
	//   'rvr',
	//   'shl',
	//   'shr',
	//   'smt',
	//   'spg',
	//   'sq',
	//   'sqr',
	//   'sqs',
	//   'squ',
	//   'st',
	//   'sta',
	//   'stn',
	//   'str',
	//   'sts',
	//   'ter',
	//   'terr',
	//   'trk',
	//   'trl',
	//   'un',
	//   'uns',
	//   'vis',
	//   'vl',
	//   'vlg',
	//   'vly',
	//   'vst',
	//   'vw',
	//   'vws',
	//   'wl',
	//   'wls',
	//   'wy',
	//   'xrd',
	// ];
	var lastwords = ['city', 'county', 'province', 'state', 'territory', 'town'];
	var is_place = function is_place(str) {
	  var words = str.split(' ');
	  if (words.length > 1) {
	    //first words, like 'eastern'
	    if (firstwords[words[0]]) {
	      return true;
	    }
	    //last words, like 'road, street, lane, circle'
	    if (street_designators[words[words.length - 1]]) {
	      return true;
	    }
	    //last words, like 'city, town, state'
	    if (lastwords[words[words.length - 1]]) {
	      return true;
	    }
	  }
	  for (var i = 0; i < words.length; i++) {
	    if (isPlace[words[i]]) {
	      return true;
	    }
	  }
	  return false;
	};
	module.exports = is_place;

	},{"../../../data/abbreviations":1,"../../../data/places":19}],88:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Noun = _dereq_('../noun.js');
	var places = _dereq_('../../../data/places.js');
	var fns = _dereq_('../../../fns.js');
	//make cities/countries easy to lookup
	var countries = fns.toObj(places.countries);
	var cities = fns.toObj(places.cities);

	var Place = function (_Noun) {
	  _inherits(Place, _Noun);

	  function Place(str, tag) {
	    _classCallCheck(this, Place);

	    var _this = _possibleConstructorReturn(this, (Place.__proto__ || Object.getPrototypeOf(Place)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Place'] = true;
	    _this.pos[tag] = true;
	    _this.title = null;
	    _this.city = null;
	    _this.region = null; //'2nd-tier' (state/province/county/whatever)
	    _this.country = null;
	    _this.parse();
	    return _this;
	  }

	  _createClass(Place, [{
	    key: 'root',
	    value: function root() {
	      return this.title || this.normal;
	    }
	  }, {
	    key: 'parse',
	    value: function parse() {
	      //parse a comma-described place like "toronto, ontario"
	      var terms = this.strip_apostrophe().split(' ');
	      this.title = terms[0];
	      for (var i = 1; i < terms.length; i++) {
	        var t = terms[i];
	        if (cities[t]) {
	          this.city = fns.titlecase(t);
	        } else if (countries[t]) {
	          this.country = fns.titlecase(t);
	        } else if (this.city !== null) {
	          //if we already got the city..
	          this.region = fns.titlecase(t);
	        } else {
	          //it's part of the title
	          this.title += ' ' + t;
	        }
	      }
	    }
	  }]);

	  return Place;
	}(Noun);
	Place.fn = Place.prototype;
	module.exports = Place;

	// console.log(new Place('Toronto, Ontario, Canada'));

	},{"../../../data/places.js":19,"../../../fns.js":23,"../noun.js":80}],89:[function(_dereq_,module,exports){
	'use strict';

	var is_uncountable = _dereq_('./is_uncountable.js');
	var irregulars = _dereq_('../../data/irregular_nouns.js');
	var is_plural = _dereq_('./is_plural.js');
	var fns = _dereq_('../../fns.js');

	var pluralize_rules = [[/(ax|test)is$/i, '$1es'], [/(octop|vir|radi|nucle|fung|cact|stimul)us$/i, '$1i'], [/(octop|vir)i$/i, '$1i'], [/(kn|l|w)ife$/i, '$1ives'], [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)f$/i, '$1ves'], [/^(dwar|handkerchie|hoo|scar|whar)f$/i, '$1ves'], [/(alias|status)$/i, '$1es'], [/(bu)s$/i, '$1ses'], [/(al|ad|at|er|et|ed|ad)o$/i, '$1oes'], [/([ti])um$/i, '$1a'], [/([ti])a$/i, '$1a'], [/sis$/i, 'ses'], [/(hive)$/i, '$1s'], [/([^aeiouy]|qu)y$/i, '$1ies'], [/(x|ch|ss|sh|s|z)$/i, '$1es'], [/(matr|vert|ind|cort)(ix|ex)$/i, '$1ices'], [/([m|l])ouse$/i, '$1ice'], [/([m|l])ice$/i, '$1ice'], [/^(ox)$/i, '$1en'], [/^(oxen)$/i, '$1'], [/(quiz)$/i, '$1zes'], [/(antenn|formul|nebul|vertebr|vit)a$/i, '$1ae'], [/(sis)$/i, 'ses'], [/^(?!talis|.*hu)(.*)man$/i, '$1men'], [/(.*)/i, '$1s']].map(function (a) {
	  return {
	    reg: a[0],
	    repl: a[1]
	  };
	});

	var pluralize = function pluralize(str) {
	  var low = str.toLowerCase();
	  //uncountable
	  if (is_uncountable(low)) {
	    //uncountables shouldn't ever inflect
	    return str;
	  }
	  //is it already plural?
	  if (is_plural(low) === true) {
	    return str;
	  }
	  //irregular
	  var found = irregulars.filter(function (r) {
	    return r[0] === low;
	  });
	  if (found[0]) {
	    if (fns.titlecase(low) === str) {
	      //handle capitalisation properly
	      return fns.titlecase(found[0][1]);
	    }
	    return found[0][1];
	  }
	  //inflect first word of preposition-phrase
	  if (str.match(/([a-z]*) (of|in|by|for) [a-z]/)) {
	    var first = (str.match(/^([a-z]*) (of|in|by|for) [a-z]/) || [])[1];
	    if (first) {
	      var better_first = pluralize(first);
	      return better_first + str.replace(first, '');
	    }
	  }
	  //regular
	  for (var i = 0; i < pluralize_rules.length; i++) {
	    if (str.match(pluralize_rules[i].reg)) {
	      return str.replace(pluralize_rules[i].reg, pluralize_rules[i].repl);
	    }
	  }
	  return null;
	};
	// console.log(pluralize('gas') === "gases")
	// console.log(pluralize('narrative') === "narratives")
	// console.log(pluralize('video') === "videos")
	// console.log(pluralize('photo') === "photos")
	// console.log(pluralize('stomach') === "stomachs")
	// console.log(pluralize('database') === "databases")
	// console.log(pluralize('kiss') === "kisses")
	// console.log(pluralize('towns') === "towns")
	// console.log(pluralize('peace') === "peace")
	// console.log(pluralize('mayor of chicago') === "mayors of chicago")
	module.exports = pluralize;

	},{"../../data/irregular_nouns.js":10,"../../fns.js":23,"./is_plural.js":78,"./is_uncountable.js":79}],90:[function(_dereq_,module,exports){
	'use strict';

	var is_person = _dereq_('./person/is_person.js');
	var is_plural = _dereq_('./is_plural.js');
	var gender = _dereq_('./person/gender.js');

	var pronoun = function pronoun(str) {
	  if (is_person(str)) {
	    var g = gender(str);
	    if (g === 'Male') {
	      return 'he';
	    } else if (g === 'Female') {
	      return 'she';
	    }
	    return 'they'; //singular they
	  }
	  //non-person, like 'microwaves'
	  if (is_plural(str)) {
	    return 'they';
	  }
	  return 'it';
	};

	module.exports = pronoun;

	// console.log(pronoun('Illi Danza'));

	},{"./is_plural.js":78,"./person/gender.js":83,"./person/is_person.js":84}],91:[function(_dereq_,module,exports){
	'use strict';

	var is_uncountable = _dereq_('./is_uncountable.js');
	var irregulars = _dereq_('../../data/irregular_nouns.js');
	var is_plural = _dereq_('./is_plural.js');
	var fns = _dereq_('../../fns.js');

	var singularize_rules = [[/([^v])ies$/i, '$1y'], [/ises$/i, 'isis'], [/(kn|[^o]l|w)ives$/i, '$1ife'], [/^((?:ca|e|ha|(?:our|them|your)?se|she|wo)l|lea|loa|shea|thie)ves$/i, '$1f'], [/^(dwar|handkerchie|hoo|scar|whar)ves$/i, '$1f'], [/(antenn|formul|nebul|vertebr|vit)ae$/i, '$1a'], [/(octop|vir|radi|nucle|fung|cact|stimul)(i)$/i, '$1us'], [/(buffal|tomat|tornad)(oes)$/i, '$1o'], [/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, '$1sis'], [/(vert|ind|cort)(ices)$/i, '$1ex'], [/(matr|append)(ices)$/i, '$1ix'], [/(x|ch|ss|sh|s|z|o)es$/i, '$1'], [/men$/i, 'man'], [/(n)ews$/i, '$1ews'], [/([ti])a$/i, '$1um'], [/([^aeiouy]|qu)ies$/i, '$1y'], [/(s)eries$/i, '$1eries'], [/(m)ovies$/i, '$1ovie'], [/([m|l])ice$/i, '$1ouse'], [/(cris|ax|test)es$/i, '$1is'], [/(alias|status)es$/i, '$1'], [/(ss)$/i, '$1'], [/(ics)$/i, '$1'], [/s$/i, '']].map(function (a) {
	  return {
	    reg: a[0],
	    repl: a[1]
	  };
	});

	var singularize = function singularize(str) {
	  var low = str.toLowerCase();
	  //uncountable
	  if (is_uncountable(low)) {
	    return str;
	  }
	  //is it already singular?
	  if (is_plural(low) === false) {
	    return str;
	  }
	  //irregular
	  var found = irregulars.filter(function (r) {
	    return r[1] === low;
	  });
	  if (found[0]) {
	    if (fns.titlecase(low) === str) {
	      //handle capitalisation properly
	      return fns.titlecase(found[0][0]);
	    }
	    return found[0][0];
	  }
	  //inflect first word of preposition-phrase
	  if (str.match(/([a-z]*) (of|in|by|for) [a-z]/)) {
	    var first = str.match(/^([a-z]*) (of|in|by|for) [a-z]/);
	    if (first && first[1]) {
	      var better_first = singularize(first[1]);
	      return better_first + str.replace(first[1], '');
	    }
	  }
	  //regular
	  for (var i = 0; i < singularize_rules.length; i++) {
	    if (str.match(singularize_rules[i].reg)) {
	      return str.replace(singularize_rules[i].reg, singularize_rules[i].repl);
	    }
	  }
	  return str;
	};

	// console.log(singularize('gases') === "gas")
	// console.log(singularize('kisses') === "kiss")
	// console.log(singularize('kiss') === "kiss")
	// console.log(singularize('children') === "child")
	// console.log(singularize('peace') === "peace")
	// console.log(singularize('child') === "child")
	// console.log(singularize('mayors of chicago') === "mayor of chicago")

	module.exports = singularize;

	},{"../../data/irregular_nouns.js":10,"../../fns.js":23,"./is_plural.js":78,"./is_uncountable.js":79}],92:[function(_dereq_,module,exports){
	'use strict';
	//parse a url into components, in 'loose' mode
	//taken from   http://locutus.io/php/url/parse_url/

	var parse_url = function parse_url(str) {
	  // eslint-disable-line camelcase
	  var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'];
	  var reg = new RegExp(['(?:(?![^:@]+:[^:@\\/]*@)([^:\\/?#.]+):)?', '(?:\\/\\/\\/?)?', '((?:(([^:@\\/]*):?([^:@\\/]*))?@)?([^:\\/?#]*)(?::(\\d*))?)', '(((\\/(?:[^?#](?![^?#\\/]*\\.[^?#\\/.]+(?:[?#]|$)))*\\/?)?([^?#\\/]*))', '(?:\\?([^#]*))?(?:#(.*))?)'].join(''));
	  var m = reg.exec(str);
	  var uri = {};
	  var i = 14;
	  while (i--) {
	    if (m[i]) {
	      uri[key[i]] = m[i];
	    }
	  }
	  return uri;
	};

	module.exports = parse_url;
	// console.log(parse_url('http://fun.domain.com/fun?foo=bar'));

	},{}],93:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Noun = _dereq_('../noun');
	var parse_url = _dereq_('./parse_url');

	var Url = function (_Noun) {
	  _inherits(Url, _Noun);

	  function Url(str, tag) {
	    _classCallCheck(this, Url);

	    var _this = _possibleConstructorReturn(this, (Url.__proto__ || Object.getPrototypeOf(Url)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Url'] = true;
	    _this.parsed = _this.parse();
	    _this.normal = _this.parsed.host || str;
	    _this.normal = _this.normal.replace(/^www\./, '');
	    return _this;
	  }

	  _createClass(Url, [{
	    key: 'parse',
	    value: function parse() {
	      return parse_url(this.text);
	    }
	  }]);

	  return Url;
	}(Noun);

	Url.fn = Url.prototype;
	module.exports = Url;
	// console.log(new Url('http://fun.domain.com/fun?foo=bar'));

	},{"../noun":80,"./parse_url":92}],94:[function(_dereq_,module,exports){
	'use strict';

	var nums = _dereq_('../../../data/numbers.js');
	var is_date = _dereq_('../date/is_date');

	var is_value = function is_value(str) {
	  var words = str.split(' ');
	  //'january 5' is not a value
	  if (is_date(str)) {
	    return false;
	  }
	  for (var i = 0; i < words.length; i++) {
	    var w = words[i];
	    if (nums.ones[w] || nums.teens[w] || nums.tens[w] || nums.multiples[w] || nums.prefixes[w]) {
	      return true;
	    }
	    if (parseFloat(w)) {
	      return true;
	    }
	  }
	  return false;
	};

	module.exports = is_value;

	},{"../../../data/numbers.js":16,"../date/is_date":76}],95:[function(_dereq_,module,exports){
	'use strict';
	// handle 'nine point eight four'

	var nums = _dereq_('../../../../data/numbers.js');
	var fns = _dereq_('../../../../fns');
	var ones = {};
	ones = fns.extend(ones, nums.ones);
	ones = fns.extend(ones, nums.teens);
	ones = fns.extend(ones, nums.ordinal_ones);
	ones = fns.extend(ones, nums.ordinal_teens);

	//concatenate into a string with leading '0.'
	var decimals = function decimals(words) {
	  var str = '0.';
	  for (var i = 0; i < words.length; i++) {
	    var w = words[i];
	    if (ones[w]) {
	      str += ones[w];
	    } else {
	      return 0;
	    }
	  }
	  return parseFloat(str);
	};

	module.exports = decimals;

	},{"../../../../data/numbers.js":16,"../../../../fns":23}],96:[function(_dereq_,module,exports){
	'use strict';

	//support global multipliers, like 'half-million' by doing 'million' then multiplying by 0.5

	var find_modifiers = function find_modifiers(str) {
	  var mults = [{
	    reg: /^(minus|negative)[\s\-]/i,
	    mult: -1
	  }, {
	    reg: /^(a\s)?half[\s\-](of\s)?/i,
	    mult: 0.5
	  }, {
	    reg: /^(a\s)?quarter[\s\-]/i,
	    mult: 0.25
	  }];
	  for (var i = 0; i < mults.length; i++) {
	    if (str.match(mults[i].reg)) {
	      return {
	        amount: mults[i].mult,
	        str: str.replace(mults[i].reg, '')
	      };
	    }
	  }
	  return {
	    amount: 1,
	    str: str
	  };
	};

	module.exports = find_modifiers;

	},{}],97:[function(_dereq_,module,exports){
	'use strict';
	// Spoken numbers take the following format
	// [sixty five] (thousand) [sixty five] (hundred) [sixty five]
	// aka: [one/teen/ten] (multiple) [one/teen/ten] (multiple) ...

	var nums = _dereq_('../../../../data/numbers.js');
	var fns = _dereq_('../../../../fns.js');
	var find_modifiers = _dereq_('./modifiers.js');
	var parse_decimals = _dereq_('./decimals.js');

	var ones = {};
	var teens = {};
	var tens = {};
	var multiples = {};
	ones = fns.extend(ones, nums.ones);
	ones = fns.extend(ones, nums.ordinal_ones);

	teens = fns.extend(teens, nums.teens);
	teens = fns.extend(teens, nums.ordinal_teens);

	tens = fns.extend(tens, nums.tens);
	tens = fns.extend(tens, nums.ordinal_tens);

	multiples = fns.extend(multiples, nums.multiples);
	multiples = fns.extend(multiples, nums.ordinal_multiples);

	var normalize = function normalize(s) {
	  //pretty-printed numbers
	  s = s.replace(/, ?/g, '');
	  s = s.replace(/([a-z])-([a-z])/gi, '$1 $2');
	  //parse-out currency
	  s = s.replace(/[$£€]/, '');
	  s = s.replace(/[\$%\(\)~,]/g, '');
	  s = s.trim();
	  return s;
	};

	var section_sum = function section_sum(obj) {
	  return Object.keys(obj).reduce(function (sum, k) {
	    sum += obj[k];
	    return sum;
	  }, 0);
	};

	//prevent things like 'fifteen ten', and 'five sixty'
	var appropriate = function appropriate(w, has) {
	  if (ones[w]) {
	    if (has.ones || has.teens) {
	      return false;
	    }
	  } else if (teens[w]) {
	    if (has.ones || has.teens || has.tens) {
	      return false;
	    }
	  } else if (tens[w]) {
	    if (has.ones || has.teens || has.tens) {
	      return false;
	    }
	  }
	  return true;
	};

	var to_number = function to_number(str) {
	  //try to fail-fast
	  if (!str || typeof str === 'number') {
	    return str;
	  }
	  str = normalize(str);
	  var modifier = find_modifiers(str);
	  str = modifier.str;
	  var biggest_yet = 0;
	  var has = {};
	  var sum = 0;
	  var isNegative = false;
	  var words = str.split(' ');
	  for (var i = 0; i < words.length; i++) {
	    var w = words[i];
	    if (!w || w === 'and') {
	      continue;
	    }
	    if (w === '-' || w === 'negative') {
	      isNegative = true;
	      continue;
	    }
	    if (fns.startsWith(w, '-')) {
	      isNegative = true;
	      w = w.substr(1);
	    }
	    //decimal mode
	    if (w === 'point') {
	      sum += section_sum(has);
	      sum += parse_decimals(words.slice(i + 1, words.length));
	      sum *= modifier.amount;
	      return sum;
	    }
	    //maybe it's just a number typed as a string
	    if (w.match(/^[0-9,\. ]+$/)) {
	      sum += parseFloat(w.replace(/[, ]/g, '')) || 0;
	      continue;
	    }
	    //improper fraction
	    var improperFractionMatch = w.match(/^([0-9,\. ]+)\/([0-9,\. ]+)$/);
	    if (improperFractionMatch) {
	      var num = parseFloat(improperFractionMatch[1].replace(/[, ]/g, ''));
	      var denom = parseFloat(improperFractionMatch[2].replace(/[, ]/g, ''));
	      sum += num / denom || 0;
	      continue;
	    }
	    //prevent mismatched units, like 'seven eleven'
	    if (!appropriate(w, has)) {
	      return null;
	    }
	    //collect 'has' values
	    if (ones[w]) {
	      has['ones'] = ones[w];
	    } else if (teens[w]) {
	      has['teens'] = teens[w];
	    } else if (tens[w]) {
	      has['tens'] = tens[w];
	    } else if (multiples[w]) {
	      //something has gone wrong : 'two hundred five hundred'
	      if (multiples[w] === biggest_yet) {
	        return null;
	      }
	      //if it's the biggest yet, multiply the whole sum - eg 'five hundred thousand'
	      if (multiples[w] > biggest_yet) {
	        biggest_yet = multiples[w];
	        sum += section_sum(has);
	        sum = (sum || 1) * multiples[w];
	      } else {
	        //it's smaller, so only multiply section_sum - eg 'five thousand one hundred'
	        sum += (section_sum(has) || 1) * multiples[w];
	      }
	      //reset our section
	      has = {};
	    }
	  }
	  //dump the remaining has values
	  sum += section_sum(has);
	  //post-process add modifier
	  sum *= modifier.amount;
	  sum *= isNegative ? -1 : 1;
	  return sum;
	};

	module.exports = to_number;

	// console.log(to_number('half a million'));

	},{"../../../../data/numbers.js":16,"../../../../fns.js":23,"./decimals.js":95,"./modifiers.js":96}],98:[function(_dereq_,module,exports){
	'use strict';
	// const nums = require('../../../data/numbers.js');
	// const fns = require('../../../fns.js');

	var ones_mapping = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
	var tens_mapping = [['ninety', 90], ['eighty', 80], ['seventy', 70], ['sixty', 60], ['fifty', 50], ['forty', 40], ['thirty', 30], ['twenty', 20]];

	var sequence = [[1000000000, 'million'], [100000000, 'hundred million'], [1000000, 'million'], [100000, 'hundred thousand'], [1000, 'thousand'], [100, 'hundred'], [1, 'one']];

	//turn number into an array of magnitudes
	var breakdown_magnitudes = function breakdown_magnitudes(num) {
	  var working = num;
	  var have = [];
	  sequence.forEach(function (a) {
	    if (num > a[0]) {
	      var howmany = Math.floor(working / a[0]);
	      working -= howmany * a[0];
	      if (howmany) {
	        have.push({
	          unit: a[1],
	          count: howmany
	        });
	      }
	    }
	  });
	  return have;
	};

	//turn numbers from 100-0 into their text
	var breakdown_hundred = function breakdown_hundred(num) {
	  var str = '';
	  for (var i = 0; i < tens_mapping.length; i++) {
	    if (num >= tens_mapping[i][1]) {
	      num -= tens_mapping[i][1];
	      str += ' ' + tens_mapping[i][0];
	    }
	  }
	  //(hopefully) we should only have 20-0 now
	  if (ones_mapping[num]) {
	    str += ' ' + ones_mapping[num];
	  }
	  return str.trim();
	};

	var to_text = function to_text(num) {
	  var isNegative = false;
	  if (num < 0) {
	    isNegative = true;
	    num = Math.abs(num);
	  }
	  //break-down into units, counts
	  var units = breakdown_magnitudes(num);
	  //build-up the string from its components
	  var str = '';
	  for (var i = 0; i < units.length; i++) {
	    var unit_name = units[i].unit;
	    if (unit_name === 'one') {
	      unit_name = '';
	      //put an 'and' in here
	      if (str.length > 1) {
	        str += ' and';
	      }
	    }
	    str += ' ' + breakdown_hundred(units[i].count) + ' ' + unit_name;
	  }
	  str = str || 'zero';
	  str = str.replace(/ +/g, ' ');
	  str = str.trim();
	  if (isNegative) {
	    str = 'negative ' + str;
	  }
	  return str;
	};

	module.exports = to_text;

	// console.log(to_text(-5));

	},{}],99:[function(_dereq_,module,exports){
	'use strict';

	var money = _dereq_('../../../data/currencies').reduce(function (h, s) {
	  h[s] = 'currency';
	  return h;
	}, {});

	var units = {
	  'Temperature': {
	    '°c': 'Celsius',
	    '°f': 'Fahrenheit',
	    'k': 'Kelvin',
	    '°re': 'Reaumur',
	    '°n': 'Newton',
	    '°ra': 'Rankine'
	  },
	  'Volume': {
	    'm³': 'cubic meter',
	    'm3': 'cubic meter',
	    'dm³': 'cubic decimeter',
	    'dm3': 'cubic decimeter',
	    'cm³': 'cubic centimeter',
	    'cm3': 'cubic centimeter',
	    'l': 'liter',
	    'dl': 'deciliter',
	    'cl': 'centiliter',
	    'ml': 'milliliter',
	    'in³': 'cubic inch',
	    'in3': 'cubic inch',
	    'ft³': 'cubic foot',
	    'ft3': 'cubic foot',
	    'yd³': 'cubic yard',
	    'yd3': 'cubic yard',
	    'gal': 'gallon',
	    'bbl': 'petroleum barrel',
	    'pt': 'pint',
	    'qt': 'quart',
	    'tbl': 'tablespoon',
	    'tsp': 'teaspoon',
	    'tbsp': 'tablespoon',
	    'cp': 'cup',
	    'fl oz': 'fluid ounce'
	  },
	  'Distance': {
	    'km': 'kilometer',
	    'm': 'meter',
	    'dm': 'decimeter',
	    'cm': 'centimeter',
	    'mm': 'millimeter',
	    'mi': 'mile',
	    'in': 'inch',
	    'ft': 'foot',
	    'feet': 'foot',
	    'yd': 'yard'
	  },
	  'Weight': {
	    't': 'tonne',
	    'kg': 'kilogram',
	    'hg': 'hectogram',
	    'g': 'gram',
	    'dg': 'decigram',
	    'cg': 'centigram',
	    'mg': 'milligram',
	    'µg': 'microgram',
	    'carat': 'carat',
	    'grain': 'grain',
	    'oz': 'ounce',
	    'lb': 'pound',
	    'ton': 'tonne',
	    'st': 'stone'
	  },
	  'Area': {
	    'km²': 'square kilometer',
	    'km2': 'square kilometer',
	    'm²': 'square meter',
	    'm2': 'square meter',
	    'dm²': 'square decimeter',
	    'dm2': 'square decimeter',
	    'cm²': 'square centimeter',
	    'cm2': 'square centimeter',
	    'mm²': 'square millimeter',
	    'mm2': 'square millimeter',
	    'ha': 'hectare',
	    'ca': 'centiare',
	    'mile²': 'square mile',
	    'mile2': 'square mile',
	    'in²': 'square inch',
	    'in2': 'square inch',
	    'yd²': 'square yard',
	    'yd2': 'square yard',
	    'ft²': 'square foot',
	    'ft2': 'square foot',
	    'acre': 'acre'
	  },
	  'Frequency': {
	    'hz': 'hertz'
	  },
	  'Speed': {
	    'km/h': 'kilometer per hour',
	    'kmph': 'kilometer per hour',
	    'mps': 'meter per second',
	    'm/s': 'meter per second',
	    'mph': 'mile per hour',
	    'mi/h': 'mile per hour',
	    'knot': 'knot'
	  },
	  'Data': {
	    'b': 'byte',
	    'kb': 'kilobyte',
	    'mb': 'megabyte',
	    'gb': 'gigabyte',
	    'tb': 'terabyte',
	    'pt': 'petabyte',
	    'eb': 'exabyte',
	    'zb': 'zettabyte',
	    'yb': 'yottabyte'
	  },
	  'Energy': {
	    'j': 'joule',
	    'pa': 'pascal',
	    'bar': 'bar',
	    'w': 'watt',
	    'n': 'newton',
	    'wb': 'weber',
	    't': 'tesla',
	    'h': 'henry',
	    'c': 'coulomb',
	    'v': 'volt',
	    'f': 'farad',
	    's': 'siemens',
	    'o': 'ohm',
	    'lx': 'lux',
	    'lm': 'lumen'
	  },
	  'Time': {
	    'year': 'year',
	    'week': 'week',
	    'day': 'day',
	    'h': 'hour',
	    'min': 'minute',
	    's': 'second',
	    'ms': 'millisecond',
	    'µs': 'microsecond',
	    'nanosecond': 'nanosecond',
	    'picosecond': 'picosecond',
	    'femtosecond': 'femtosecond',
	    'attosecond': 'attosecond'
	  },
	  'Money': money
	};

	module.exports = Object.keys(units).reduce(function (h, k) {
	  Object.keys(units[k]).forEach(function (u) {
	    h[u] = {
	      name: units[k][u],
	      category: k
	    };
	    h[units[k][u]] = {
	      name: units[k][u],
	      category: k
	    };
	  });
	  return h;
	}, {});

	},{"../../../data/currencies":4}],100:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Noun = _dereq_('../noun');
	var to_number = _dereq_('./parse/to_number');
	var to_text = _dereq_('./to_text');
	var units = _dereq_('./units');
	var nums = _dereq_('../../../data/numbers');
	var fns = _dereq_('../../../fns');
	//get an array of ordinal (first, second...) numbers
	var ordinals = {};
	ordinals = fns.extend(ordinals, nums.ordinal_ones);
	ordinals = fns.extend(ordinals, nums.ordinal_teens);
	ordinals = fns.extend(ordinals, nums.ordinal_tens);
	ordinals = fns.extend(ordinals, nums.ordinal_multiples);
	ordinals = Object.keys(ordinals);

	var Value = function (_Noun) {
	  _inherits(Value, _Noun);

	  function Value(str, tag) {
	    _classCallCheck(this, Value);

	    var _this = _possibleConstructorReturn(this, (Value.__proto__ || Object.getPrototypeOf(Value)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Value'] = true;
	    _this.number = null;
	    _this.unit = null;
	    _this.unit_name = null;
	    _this.measurement = null;
	    _this.of_what = '';
	    // this.text = str;
	    // this.normal = str;
	    if (_this.is_ordinal()) {
	      _this.pos['Ordinal'] = true;
	    }
	    _this.parse();
	    return _this;
	  }

	  //test for nearly-numbers, like phonenumbers, or whatever


	  _createClass(Value, [{
	    key: 'is_number',
	    value: function is_number(s) {
	      //phone numbers, etc
	      if (s.match(/[:@]/)) {
	        return false;
	      }
	      //if there's a number, then something, then a number
	      if (s.match(/[0-9][^(0-9|\/),\.][0-9]/)) {
	        if (s.match(/((?:[0-9]|\.)+) ((?:[0-9]|\.)+)\/((?:[0-9]|\.)+)/)) {
	          // I'm sure there is a better regexpxs
	          return true;
	        }
	        return false;
	      }
	      return true;
	    }
	  }, {
	    key: 'is_number_word',
	    value: function is_number_word(w) {
	      var number_words = {
	        minus: true,
	        negative: true,
	        point: true,
	        half: true,
	        quarter: true
	      };

	      if (w.match(/[0-9]/) || number_words[w]) {
	        return true;
	      } else if (nums.ones[w] || nums.teens[w] || nums.tens[w] || nums.multiples[w]) {
	        return true;
	      } else if (nums.ordinal_ones[w] || nums.ordinal_teens[w] || nums.ordinal_tens[w] || nums.ordinal_multiples[w]) {
	        return true;
	      }

	      return false;
	    }
	  }, {
	    key: 'is_ordinal',
	    value: function is_ordinal() {
	      //1st
	      if (this.normal.match(/^[0-9]+(rd|st|nd|th)$/)) {
	        return true;
	      }
	      //first, second...
	      for (var i = 0; i < ordinals.length; i++) {
	        if (fns.endsWith(this.normal, ordinals[i])) {
	          return true;
	        }
	      }
	      return false;
	    }

	    //turn an integer like 22 into '22nd'

	  }, {
	    key: 'to_ordinal',
	    value: function to_ordinal() {
	      var num = this.number;
	      //fail fast
	      if (!num && num !== 0) {
	        return '';
	      }
	      //teens are all 'th'
	      if (num >= 10 && num <= 20) {
	        return '' + num + 'th';
	      }
	      //treat it as a string..
	      num = '' + num;
	      //fail safely
	      if (!num.match(/[0-9]$/)) {
	        return num;
	      }
	      if (fns.endsWith(num, '1')) {
	        return num + 'st';
	      }
	      if (fns.endsWith(num, '2')) {
	        return num + 'nd';
	      }
	      if (fns.endsWith(num, '3')) {
	        return num + 'rd';
	      }
	      return num + 'th';
	    }

	    //overwrite term.normal?
	    // normal() {
	    //   let str = '' + (this.number || '');
	    //   if (this.is_ordinal()) {
	    //     str = this.to_ordinal(str);
	    //   }
	    //   if (this.unit) {
	    //     str += ' ' + this.unit;
	    //   }
	    //   return str;
	    // }

	  }, {
	    key: 'root',
	    value: function root() {
	      var str = this.number;
	      if (this.unit) {
	        str += ' ' + this.unit;
	      }
	      return str;
	    }
	  }, {
	    key: 'is_unit',
	    value: function is_unit() {
	      //if it's a known unit
	      if (units[this.unit]) {
	        return true;
	      }
	      //currencies are derived-through POS
	      if (this.pos['Currency']) {
	        return true;
	      }

	      var s = this.unit.toLowerCase();
	      if (nums.prefixes[s]) {
	        return true;
	      }

	      //try singular version
	      s = this.unit.replace(/s$/, '');
	      if (units[s]) {
	        this.unit = this.unit.replace(/s$/, '');
	        return true;
	      }

	      s = this.unit.replace(/es$/, '');
	      if (units[s]) {
	        this.unit = this.unit.replace(/es$/, '');
	        return true;
	      }
	      return false;
	    }
	  }, {
	    key: 'parse',
	    value: function parse() {
	      if (!this.is_number(this.text)) {
	        return;
	      }

	      var words = this.text.toLowerCase().split(/[ ]/);
	      //split at '-' only for numbers like twenty-two, sixty-seven, etc.
	      //so that 'twelve six-gram pieces' returns 12 for number, not null
	      //however, still returns null for 'three sevel-eleven stores'
	      for (var i = 0; i < words.length; i++) {
	        var w = words[i];
	        if (w.indexOf('-') === w.lastIndexOf('-') && w.indexOf('-') > -1) {
	          var halves = w.split(/[-]/);
	          if (this.is_number_word(halves[0]) && this.is_number_word(halves[1])) {
	            words[i] = halves[0];
	            words.splice(i + 1, 0, halves[1]);
	          }
	        }
	      }

	      var numbers = '';
	      var raw_units = '';

	      //seperate number-words from unit-words
	      for (var _i = 0; _i < words.length; _i++) {
	        var _w = words[_i];
	        if (this.is_number_word(_w)) {
	          numbers += ' ' + _w;
	        } else {
	          raw_units += ' ' + _w;
	        }
	      }
	      this.unit = raw_units.trim();

	      //if raw_units is something like "grams of sugar", try it first,
	      //then "grams of", and then "grams".
	      while (this.unit !== '') {
	        if (this.is_unit() && units[this.unit]) {
	          this.measurement = units[this.unit].category;
	          this.unit_name = units[this.unit].name;
	          break;
	        } else {
	          this.unit = this.unit.substr(0, this.unit.lastIndexOf(' ')).trim();
	        }
	      }

	      //support '$400' => 400 dollars
	      var firstChar = this.text.substr(0, 1);
	      var symbolic_currency = {
	        '€': 'euro',
	        '$': 'dollar',
	        '¥': 'yen',
	        '£': 'pound',
	        '¢': 'cent',
	        '฿': 'bitcoin'
	      };
	      if (symbolic_currency[firstChar]) {
	        this.measurement = 'Money';
	        this.unit_name = 'currency';
	        this.unit = symbolic_currency[firstChar];
	      }

	      numbers = numbers.trim();
	      this.number = to_number(numbers);

	      //of_what
	      var of_pos = this.text.indexOf(' of ');
	      if (of_pos > 0) {
	        var before = this.text.substring(0, of_pos).trim();
	        var after = this.text.substring(of_pos + 4).trim();

	        var space_pos = before.lastIndexOf(' ');
	        var _w2 = before.substring(space_pos).trim();

	        //if the word before 'of' is a unit, return whatever is after 'of'
	        //else return this word + of + whatever is after 'of'
	        if (_w2 && (this.is_unit(_w2) || this.is_number_word(_w2))) {
	          this.of_what = after;
	        } else {
	          this.of_what = _w2 + ' of ' + after;
	        }
	      } else if (this.unit_name) {
	        //if value contains a unit but no 'of', return unit
	        this.of_what = this.unit;
	      } else {
	        //if value is a number followed by words, skip numbers
	        //and return words; if there is no numbers, return full
	        var temp_words = this.text.split(' ');
	        for (var _i2 = 0; _i2 < temp_words.length; _i2++) {
	          if (this.is_number_word(temp_words[_i2])) {
	            temp_words[_i2] = '';
	            continue;
	          }
	          this.of_what = temp_words.join(' ').trim();
	        }
	      }
	    }
	  }, {
	    key: 'textual',
	    value: function textual() {
	      return to_text(this.number || this.normal || this.text);
	    }
	  }]);

	  return Value;
	}(Noun);

	Value.fn = Value.prototype;
	module.exports = Value;

	},{"../../../data/numbers":16,"../../../fns":23,"../noun":80,"./parse/to_number":97,"./to_text":98,"./units":99}],101:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var _is_acronym = _dereq_('./is_acronym');
	var match_term = _dereq_('../match/match_term');
	var syntax_parse = _dereq_('../match/syntax_parse');
	var implied = _dereq_('./implied');

	var Term = function () {
	  function Term(str, tag, whitespace) {
	    _classCallCheck(this, Term);

	    //don't pass non-strings through here any further..
	    if (typeof str === 'number') {
	      str = '' + str;
	    } else if (typeof str !== 'string') {
	      str = '';
	    }
	    str = str.toString();
	    //trailing & preceding whitespace
	    this.whitespace = whitespace || {};
	    this.whitespace.preceding = this.whitespace.preceding || '';
	    this.whitespace.trailing = this.whitespace.trailing || '';
	    //set .text
	    this.text = str;
	    //the normalised working-version of the word
	    this.normal = '';
	    //if it's a contraction or slang, the implication, or 'hidden word'
	    this.expansion = '';
	    //set .normal
	    this.rebuild();
	    //the reasoning behind it's part-of-speech
	    this.reasoning = [];
	    //these are orphaned POS that have no methods
	    this.pos = {};
	    this.tag = tag || '?';
	    if (tag) {
	      this.pos[tag] = true;
	    }
	  }

	  //when the text changes, rebuild derivative fields


	  _createClass(Term, [{
	    key: 'rebuild',
	    value: function rebuild() {
	      this.text = this.text || '';
	      this.text = this.text.trim();

	      this.normal = '';
	      this.normalize();
	      this.expansion = implied(this.normal);
	    }
	  }, {
	    key: 'changeTo',
	    value: function changeTo(str) {
	      this.text = str;
	      this.rebuild();
	    }
	    //a regex-like string search

	  }, {
	    key: 'match',
	    value: function match(match_str, options) {
	      var reg = syntax_parse([match_str]);
	      return match_term(this, reg[0], options);
	    }
	    //the 'root' singular/infinitive/whatever.
	    // method is overloaded by each pos type

	  }, {
	    key: 'root',
	    value: function root() {
	      return this.strip_apostrophe();
	    }
	    //strip apostrophe s

	  }, {
	    key: 'strip_apostrophe',
	    value: function strip_apostrophe() {
	      if (this.normal.match(/[a-z]'[a-z][a-z]?$/)) {
	        var split = this.normal.split(/'/);
	        if (split[1] === 's') {
	          return split[0];
	        }
	      }
	      return this.normal;
	    }
	  }, {
	    key: 'has_comma',
	    value: function has_comma() {
	      if (this.text.match(/,$/)) {
	        return true;
	      }
	      return false;
	    }
	  }, {
	    key: 'has_abbreviation',
	    value: function has_abbreviation() {
	      // "spencer's"
	      if (this.text.match(/[a-z]'[a-z][a-z]?$/)) {
	        return true;
	      }
	      // "flanders' house"
	      if (this.text.match(/[a-z]s'$/)) {
	        return true;
	      }
	      return false;
	    }
	  }, {
	    key: 'is_capital',
	    value: function is_capital() {
	      if (this.text.match(/[A-Z][a-z]/)) {
	        return true;
	      }
	      return false;
	    }
	    //utility method to avoid lumping words with non-word stuff

	  }, {
	    key: 'is_word',
	    value: function is_word() {
	      if (this.text.match(/^\[.*?\]\??$/)) {
	        return false;
	      }
	      if (!this.text.match(/[a-z|0-9]/i)) {
	        return false;
	      }
	      if (this.text.match(/[\|#\<\>]/i)) {
	        return false;
	      }
	      return true;
	    }
	    //FBI or F.B.I.

	  }, {
	    key: 'is_acronym',
	    value: function is_acronym() {
	      return _is_acronym(this.text);
	    }
	    //working word

	  }, {
	    key: 'normalize',
	    value: function normalize() {
	      var str = this.text || '';
	      str = str.toLowerCase();
	      //strip grammatical punctuation
	      str = str.replace(/[,\.!:;\?\(\)^$]/g, '');
	      //hashtags, atmentions
	      str = str.replace(/^[#@]/, '');
	      //convert hyphenations to a multiple-word term
	      str = str.replace(/([a-z])\-([a-z])/g, '$1 $2');
	      // coerce single curly quotes
	      str = str.replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]+/g, '\'');
	      // coerce double curly quotes
	      str = str.replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]+/g, '');
	      //remove quotations + scare-quotes
	      str = str.replace(/^'/g, '');
	      str = str.replace(/'$/g, '');
	      str = str.replace(/"/g, '');
	      if (!str.match(/[a-z0-9]/i)) {
	        return '';
	      }
	      this.normal = str;
	      return this.normal;
	    }
	  }, {
	    key: 'all_forms',
	    value: function all_forms() {
	      return {};
	    }
	  }]);

	  return Term;
	}();

	Term.fn = Term.prototype;

	module.exports = Term;

	},{"../match/match_term":27,"../match/syntax_parse":29,"./implied":71,"./is_acronym":72}],102:[function(_dereq_,module,exports){
	//turn a verb into its other grammatical forms.
	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var verb_to_actor = _dereq_('./to_actor');
	var to_infinitive = _dereq_('./to_infinitive');
	var from_infinitive = _dereq_('./from_infinitive');
	var irregular_verbs = _dereq_('../../../data/irregular_verbs');
	var predict = _dereq_('./predict_form.js');
	var generic = _dereq_('./generic.js');
	var strip_prefix = _dereq_('./strip_prefix.js');
	var fns = _dereq_('../../../fns.js');

	//make sure object has all forms
	var fufill = function fufill(obj, prefix) {
	  //we're toast if there's no infinitive
	  if (!obj.infinitive) {
	    return obj;
	  }
	  //apply generic methods to missing forms
	  if (!obj.gerund) {
	    obj.gerund = generic.gerund(obj);
	  }
	  if (!obj.present) {
	    obj.present = generic.present(obj);
	  }
	  if (!obj.past) {
	    obj.past = generic.past(obj);
	  }
	  if (obj.actor === undefined) {
	    obj.actor = verb_to_actor(obj.infinitive);
	  }

	  //add the prefix to all forms, if it exists
	  if (prefix) {
	    Object.keys(obj).forEach(function (k) {
	      obj[k] = prefix + obj[k];
	    });
	  }
	  //future is 'will'+infinitive
	  if (!obj.future) {
	    obj.future = generic.future(obj);
	  }
	  //perfect is 'have'+past-tense
	  if (!obj.perfect) {
	    obj.perfect = generic.perfect(obj);
	  }
	  //pluperfect is 'had'+past-tense
	  if (!obj.pluperfect) {
	    obj.pluperfect = generic.pluperfect(obj);
	  }
	  //future perfect is 'will have'+past-tense
	  if (!obj.future_perfect) {
	    obj.future_perfect = generic.future_perfect(obj);
	  }
	  return obj;
	};

	var conjugate = function conjugate(w) {
	  if (w === undefined) {
	    return {};
	  }

	  //for phrasal verbs ('look out'), conjugate look, then append 'out'
	  var phrasal_reg = new RegExp('^(.*?) (in|out|on|off|behind|way|with|of|away|across|ahead|back|over|under|together|apart|up|upon|aback|down|about|before|after|around|to|forth|round|through|along|onto)$', 'i');
	  if (w.match(phrasal_reg)) {
	    var _ret = function () {
	      var split = w.match(phrasal_reg, '');
	      var phrasal_verb = split[1];
	      var particle = split[2];
	      var result = conjugate(phrasal_verb); //recursive
	      Object.keys(result).forEach(function (k) {
	        if (result[k]) {
	          result[k] += ' ' + particle;
	        }
	      });
	      return {
	        v: result
	      };
	    }();

	    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	  }

	  //for pluperfect ('had tried') remove 'had' and call it past-tense
	  w = w.replace(/^had /i, '');
	  //for perfect ('have tried') remove 'have' and call it past-tense
	  w = w.replace(/^have /i, '');
	  //for future perfect ('will have tried') remove 'will have' and call it past-tense
	  w = w.replace(/^will have /i, '');
	  //chop it if it's future-tense
	  w = w.replace(/^will /i, '');

	  //un-prefix the verb, and add it in later
	  var prefix = strip_prefix(w);
	  w = w.replace(prefix, '');

	  //guess the tense, so we know which transormation to make
	  var predicted = predict(w) || 'infinitive';
	  //check against suffix rules
	  var infinitive = to_infinitive(w, predicted) || '';
	  //check irregulars
	  var obj = irregular_verbs[w] || irregular_verbs[infinitive] || {};
	  obj = fns.extend({}, obj);
	  //apply regex-transformations
	  var conjugations = from_infinitive(infinitive);
	  Object.keys(conjugations).forEach(function (k) {
	    if (!obj[k]) {
	      obj[k] = conjugations[k];
	    }
	  });
	  return fufill(obj, prefix);
	};
	module.exports = conjugate;

	// console.log(conjugate('played'));

	},{"../../../data/irregular_verbs":11,"../../../fns.js":23,"./from_infinitive":103,"./generic.js":104,"./predict_form.js":105,"./strip_prefix.js":106,"./to_actor":108,"./to_infinitive":109}],103:[function(_dereq_,module,exports){
	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var rules = [{
	  reg: /(eave)$/i,
	  repl: {
	    pr: '$1s',
	    pa: '$1d',
	    gr: 'eaving',
	    ar: '$1r'
	  }
	}, {
	  reg: /(ink)$/i,
	  repl: {
	    pr: '$1s',
	    pa: 'unk',
	    gr: '$1ing',
	    ar: '$1er'
	  }
	}, {
	  reg: /(end)$/i,
	  repl: {
	    pr: '$1s',
	    pa: 'ent',
	    gr: '$1ing',
	    ar: '$1er'
	  }
	}, {
	  reg: /(ide)$/i,
	  repl: {
	    pr: '$1s',
	    pa: 'ode',
	    gr: 'iding',
	    ar: 'ider'
	  }
	}, {
	  reg: /(ake)$/i,
	  repl: {
	    pr: '$1s',
	    pa: 'ook',
	    gr: 'aking',
	    ar: '$1r'
	  }
	}, {
	  reg: /(eed)$/i,
	  repl: {
	    pr: '$1s',
	    pa: '$1ed',
	    gr: '$1ing',
	    ar: '$1er'
	  }
	}, {
	  reg: /(e)(ep)$/i,
	  repl: {
	    pr: '$1$2s',
	    pa: '$1pt',
	    gr: '$1$2ing',
	    ar: '$1$2er'
	  }
	}, {
	  reg: /(a[tg]|i[zn]|ur|nc|gl|is)e$/i,
	  repl: {
	    pr: '$1es',
	    pa: '$1ed',
	    gr: '$1ing',
	    prt: '$1en'
	  }
	}, {
	  reg: /([i|f|rr])y$/i,
	  repl: {
	    pr: '$1ies',
	    pa: '$1ied',
	    gr: '$1ying'
	  }
	}, {
	  reg: /([td]er)$/i,
	  repl: {
	    pr: '$1s',
	    pa: '$1ed',
	    gr: '$1ing'
	  }
	}, {
	  reg: /([bd]l)e$/i,
	  repl: {
	    pr: '$1es',
	    pa: '$1ed',
	    gr: '$1ing'
	  }
	}, {
	  reg: /(ish|tch|ess)$/i,
	  repl: {
	    pr: '$1es',
	    pa: '$1ed',
	    gr: '$1ing'
	  }
	}, {
	  reg: /(ion|end|e[nc]t)$/i,
	  repl: {
	    pr: '$1s',
	    pa: '$1ed',
	    gr: '$1ing'
	  }
	}, {
	  reg: /(om)e$/i,
	  repl: {
	    pr: '$1es',
	    pa: 'ame',
	    gr: '$1ing'
	  }
	}, {
	  reg: /([aeiu])([pt])$/i,
	  repl: {
	    pr: '$1$2s',
	    pa: '$1$2',
	    gr: '$1$2$2ing'
	  }
	}, {
	  reg: /(er)$/i,
	  repl: {
	    pr: '$1s',
	    pa: '$1ed',
	    gr: '$1ing'
	  }
	}, {
	  reg: /(en)$/i,
	  repl: {
	    pr: '$1s',
	    pa: '$1ed',
	    gr: '$1ing'
	  }
	}, {
	  reg: /(..)(ow)$/i,
	  repl: {
	    pr: '$1$2s',
	    pa: '$1ew',
	    gr: '$1$2ing',
	    prt: '$1$2n'
	  }
	}, {
	  reg: /(..)([cs]h)$/i,
	  repl: {
	    pr: '$1$2es',
	    pa: '$1$2ed',
	    gr: '$1$2ing'
	  }
	}, {
	  reg: /([^aeiou][ou])(g|d)$/i,
	  repl: {
	    pr: '$1$2s',
	    pa: '$1$2$2ed',
	    gr: '$1$2$2ing'
	  }
	}, {
	  reg: /([^aeiou][aeiou])(b|t|p|m)$/i,
	  repl: {
	    pr: '$1$2s',
	    pa: '$1$2$2ed',
	    gr: '$1$2$2ing'
	  }
	}];

	var keys = {
	  pr: 'present',
	  pa: 'past',
	  gr: 'gerund',
	  prt: 'participle',
	  ar: 'actor'
	};

	var from_infinitive = function from_infinitive(str) {
	  var obj = {
	    infinitive: str
	  };
	  if (!str || typeof str !== 'string') {
	    // console.log(str);
	    return obj;
	  }

	  var _loop = function _loop(i) {
	    if (str.match(rules[i].reg)) {
	      // console.log(rules[i]);
	      Object.keys(rules[i].repl).forEach(function (k) {
	        obj[keys[k]] = str.replace(rules[i].reg, rules[i].repl[k]);
	      });
	      return {
	        v: obj
	      };
	    }
	  };

	  for (var i = 0; i < rules.length; i++) {
	    var _ret = _loop(i);

	    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	  }
	  return obj;
	};
	// console.log(from_infinitive('watch'));

	module.exports = from_infinitive;

	},{}],104:[function(_dereq_,module,exports){
	'use strict';
	//non-specifc, 'hail-mary' transforms from infinitive, into other forms

	var fns = _dereq_('../../../fns');
	var generic = {

	  gerund: function gerund(o) {
	    var inf = o.infinitive;
	    if (fns.endsWith(inf, 'e')) {
	      return inf.replace(/e$/, 'ing');
	    }
	    return inf + 'ing';
	  },

	  present: function present(o) {
	    var inf = o.infinitive;
	    if (fns.endsWith(inf, 's')) {
	      return inf + 'es';
	    }
	    if (fns.endsWith(inf, /[bcdfghjklmnpqrstvwxz]y$/)) {
	      return inf.slice(0, -1) + 'ies';
	    }
	    return inf + 's';
	  },

	  past: function past(o) {
	    var inf = o.infinitive;
	    if (fns.endsWith(inf, 'e')) {
	      return inf + 'd';
	    }
	    if (fns.endsWith(inf, 'ed')) {
	      return inf;
	    }
	    if (fns.endsWith(inf, /[bcdfghjklmnpqrstvwxz]y$/)) {
	      return inf.slice(0, -1) + 'ied';
	    }
	    return inf + 'ed';
	  },

	  future: function future(o) {
	    return 'will ' + o.infinitive;
	  },

	  perfect: function perfect(o) {
	    return 'have ' + (o.participle || o.past);
	  },

	  pluperfect: function pluperfect(o) {
	    return 'had ' + o.past;
	  },

	  future_perfect: function future_perfect(o) {
	    return 'will have ' + o.past;
	  }

	};

	module.exports = generic;

	},{"../../../fns":23}],105:[function(_dereq_,module,exports){
	'use strict';
	//this method is used to predict which current conjugation a verb is

	//this method is the slowest in the whole library,

	var fns = _dereq_('../../../fns.js');
	var suffix_rules = _dereq_('./suffix_rules');
	var irregular_verbs = _dereq_('../../../data/irregular_verbs');
	var known_verbs = Object.keys(irregular_verbs).reduce(function (h, k) {
	  Object.keys(irregular_verbs[k]).forEach(function (k2) {
	    h[irregular_verbs[k][k2]] = k2;
	  });
	  return h;
	}, {});

	var predict = function predict(w) {

	  //check if known infinitive
	  if (irregular_verbs[w]) {
	    return 'infinitive';
	  }
	  //check if known infinitive
	  if (known_verbs[w]) {
	    return known_verbs[w];
	  }

	  if (w.match(/will ha(ve|d) [a-z]{2}/)) {
	    return 'future_perfect';
	  }
	  if (w.match(/will [a-z]{2}/)) {
	    return 'future';
	  }
	  if (w.match(/had [a-z]{2}/)) {
	    return 'pluperfect';
	  }
	  if (w.match(/have [a-z]{2}/)) {
	    return 'perfect';
	  }
	  if (w.match(/..erer$/)) {
	    return 'actor';
	  }
	  if (w.match(/[^aeiou]ing$/)) {
	    return 'gerund';
	  }

	  var arr = Object.keys(suffix_rules);
	  for (var i = 0; i < arr.length; i++) {
	    if (fns.endsWith(w, arr[i]) && arr[i].length < w.length) {
	      return suffix_rules[arr[i]];
	    }
	  }
	  return 'infinitive';
	};

	module.exports = predict;

	},{"../../../data/irregular_verbs":11,"../../../fns.js":23,"./suffix_rules":107}],106:[function(_dereq_,module,exports){
	'use strict';
	// 'over-kill' should use conjugation rules of 'kill', etc..

	var strip_prefix = function strip_prefix(str) {
	  var prefix = '';
	  var match = str.match(/^(over|under|re|anti|full|cross)([- ])?([^aeiou][a-z]*)/i);
	  if (match) {
	    prefix = match[1] + (match[2] || '');
	  }
	  return prefix;
	};

	module.exports = strip_prefix;

	},{}],107:[function(_dereq_,module,exports){
	'use strict';
	//suffix signals for verb tense, generated from test data

	var compact = {
	  'gerund': ['ing'],
	  'infinitive': ['ate', 'ize', 'tion', 'rify', 'then', 'ress', 'ify', 'age', 'nce', 'ect', 'ise', 'ine', 'ish', 'ace', 'ash', 'ure', 'tch', 'end', 'ack', 'and', 'ute', 'ade', 'ock', 'ite', 'ase', 'ose', 'use', 'ive', 'int', 'nge', 'lay', 'est', 'ain', 'ant', 'eed', 'er', 'le'],
	  'participle': ['own', 'unk', 'ung', 'en'],
	  'past': ['ed', 'lt', 'nt', 'pt', 'ew', 'ld'],
	  'present': ['rks', 'cks', 'nks', 'ngs', 'mps', 'tes', 'zes', 'ers', 'les', 'acks', 'ends', 'ands', 'ocks', 'lays', 'eads', 'lls', 'els', 'ils', 'ows', 'nds', 'ays', 'ams', 'ars', 'ops', 'ffs', 'als', 'urs', 'lds', 'ews', 'ips', 'es', 'ts', 'ns', 's']
	};
	var suffix_rules = {};
	var keys = Object.keys(compact);
	var l = keys.length;

	for (var i = 0; i < l; i++) {
	  var l2 = compact[keys[i]].length;
	  for (var o = 0; o < l2; o++) {
	    suffix_rules[compact[keys[i]][o]] = keys[i];
	  }
	}
	module.exports = suffix_rules;

	},{}],108:[function(_dereq_,module,exports){
	//somone who does this present-tense verb
	//turn 'walk' into 'walker'
	'use strict';

	var actor = function actor(str) {
	  str = str || '';
	  var irregulars = {
	    'tie': 'tier',
	    'dream': 'dreamer',
	    'sail': 'sailer',
	    'run': 'runner',
	    'rub': 'rubber',
	    'begin': 'beginner',
	    'win': 'winner',
	    'claim': 'claimant',
	    'deal': 'dealer',
	    'spin': 'spinner'
	  };
	  var dont = {
	    'aid': 1,
	    'fail': 1,
	    'appear': 1,
	    'happen': 1,
	    'seem': 1,
	    'try': 1,
	    'say': 1,
	    'marry': 1,
	    'be': 1,
	    'forbid': 1,
	    'understand': 1,
	    'bet': 1
	  };
	  var transforms = [{
	    'reg': /e$/i,
	    'repl': 'er'
	  }, {
	    'reg': /([aeiou])([mlgp])$/i,
	    'repl': '$1$2$2er'
	  }, {
	    'reg': /([rlf])y$/i,
	    'repl': '$1ier'
	  }, {
	    'reg': /^(.?.[aeiou])t$/i,
	    'repl': '$1tter'
	  }];

	  if (dont.hasOwnProperty(str)) {
	    return null;
	  }
	  if (irregulars.hasOwnProperty(str)) {
	    return irregulars[str];
	  }
	  for (var i = 0; i < transforms.length; i++) {
	    if (str.match(transforms[i].reg)) {
	      return str.replace(transforms[i].reg, transforms[i].repl);
	    }
	  }
	  return str + 'er';
	};

	// console.log(verb_to_actor('set'))
	// console.log(verb_to_actor('sweep'))
	// console.log(verb_to_actor('watch'))
	module.exports = actor;

	},{}],109:[function(_dereq_,module,exports){
	//turns a verb in any form, into it's infinitive version
	// eg "walked" -> "walk"
	'use strict';

	var irregular_verbs = _dereq_('../../../data/irregular_verbs');
	var known_verbs = Object.keys(irregular_verbs).reduce(function (h, k) {
	  Object.keys(irregular_verbs[k]).forEach(function (k2) {
	    h[irregular_verbs[k][k2]] = k;
	  });
	  return h;
	}, {});

	var rules = {
	  participle: [{
	    reg: /own$/i,
	    to: 'ow'
	  }, {
	    reg: /(.)un([g|k])$/i,
	    to: '$1in$2'
	  }],
	  actor: [{
	    reg: /(er)er$/i,
	    to: '$1'
	  }],
	  present: [{
	    reg: /(ies)$/i,
	    to: 'y'
	  }, {
	    reg: /(tch|sh)es$/i,
	    to: '$1'
	  }, {
	    reg: /(ss)es$/i,
	    to: '$1'
	  }, {
	    reg: /([tzlshicgrvdnkmu])es$/i,
	    to: '$1e'
	  }, {
	    reg: /(n[dtk]|c[kt]|[eo]n|i[nl]|er|a[ytrl])s$/i,
	    to: '$1'
	  }, {
	    reg: /(ow)s$/i,
	    to: '$1'
	  }, {
	    reg: /(op)s$/i,
	    to: '$1'
	  }, {
	    reg: /([eirs])ts$/i,
	    to: '$1t'
	  }, {
	    reg: /(ll)s$/i,
	    to: '$1'
	  }, {
	    reg: /(el)s$/i,
	    to: '$1'
	  }, {
	    reg: /(ip)es$/i,
	    to: '$1e'
	  }, {
	    reg: /ss$/i,
	    to: 'ss'
	  }, {
	    reg: /s$/i,
	    to: ''
	  }],
	  gerund: [{
	    reg: /pping$/i,
	    to: 'p'
	  }, {
	    reg: /lling$/i,
	    to: 'll'
	  }, {
	    reg: /tting$/i,
	    to: 't'
	  }, {
	    reg: /ssing$/i,
	    to: 'ss'
	  }, {
	    reg: /gging$/i,
	    to: 'g'
	  }, {
	    reg: /([^aeiou])ying$/i,
	    to: '$1y'
	  }, {
	    reg: /([^ae]i.)ing$/i,
	    to: '$1e'
	  }, {
	    reg: /(ea.)ing$/i,
	    to: '$1'
	  }, {
	    reg: /(u[rtcb]|[bdtpkg]l|n[cg]|a[gdkvtc]|[ua]s|[dr]g|yz|o[rlsp]|cre)ing$/i,
	    to: '$1e'
	  }, {
	    reg: /(ch|sh)ing$/i,
	    to: '$1'
	  }, {
	    reg: /(..)ing$/i,
	    to: '$1'
	  }],
	  past: [{
	    reg: /(ued)$/i,
	    to: 'ue'
	  }, {
	    reg: /(e|i)lled$/i,
	    to: '$1ll'
	  }, {
	    reg: /(sh|ch)ed$/i,
	    to: '$1'
	  }, {
	    reg: /(tl|gl)ed$/i,
	    to: '$1e'
	  }, {
	    reg: /(um?pt?)ed$/i,
	    to: '$1'
	  }, {
	    reg: /(ss)ed$/i,
	    to: '$1'
	  }, {
	    reg: /pped$/i,
	    to: 'p'
	  }, {
	    reg: /tted$/i,
	    to: 't'
	  }, {
	    reg: /gged$/i,
	    to: 'g'
	  }, {
	    reg: /(h|ion|n[dt]|ai.|[cs]t|pp|all|ss|tt|int|ail|ld|en|oo.|er|k|pp|w|ou.|rt|ght|rm)ed$/i,
	    to: '$1'
	  }, {
	    reg: /(.ut)ed$/i,
	    to: '$1e'
	  }, {
	    reg: /(us)ed$/i,
	    to: '$1e'
	  }, {
	    reg: /(..[^aeiouy])ed$/i,
	    to: '$1e'
	  }, {
	    reg: /ied$/i,
	    to: 'y'
	  }, {
	    reg: /(.o)ed$/i,
	    to: '$1o'
	  }, {
	    reg: /(.i)ed$/i,
	    to: '$1'
	  }, {
	    reg: /(a[^aeiou])ed$/i,
	    to: '$1'
	  }, {
	    reg: /([rl])ew$/i,
	    to: '$1ow'
	  }, {
	    reg: /([pl])t$/i,
	    to: '$1t'
	  }]
	};

	var to_infinitive = function to_infinitive(str, from_tense) {
	  if (known_verbs.hasOwnProperty(str)) {
	    return known_verbs[str];
	  }
	  if (from_tense === 'infinitive') {
	    return str;
	  }
	  var regs = rules[from_tense] || [];
	  for (var i = 0; i < regs.length; i++) {
	    if (str.match(regs[i].reg)) {
	      return str.replace(regs[i].reg, regs[i].to);
	    }
	  }
	  return str;
	};

	// console.log(to_infinitive('played', 'past'));

	module.exports = to_infinitive;

	},{"../../../data/irregular_verbs":11}],110:[function(_dereq_,module,exports){
	'use strict';
	//turn a infinitiveVerb, like "walk" into an adjective like "walkable"

	var rules = [[/y$/, 'i'], //relay - reliable
	[/([aeiou][n])$/, '$1n']];

	//convert - 'convertible'
	//http://grammarist.com/usage/able-ible/
	//http://blog.oxforddictionaries.com/2012/10/ibles-and-ables/
	var ible_suffixes = {
	  collect: true,
	  exhaust: true,
	  convert: true,
	  digest: true,
	  discern: true,
	  dismiss: true,
	  reverse: true,
	  access: true,
	  collapse: true,
	  express: true
	};

	var irregulars = {
	  eat: 'edible',
	  hear: 'audible',
	  see: 'visible',
	  defend: 'defensible',
	  write: 'legible',
	  move: 'movable',
	  divide: 'divisible',
	  perceive: 'perceptible'
	};

	//takes an infitive verb, and returns an adjective form
	var to_adjective = function to_adjective(str) {
	  if (irregulars[str]) {
	    return irregulars[str];
	  }
	  for (var i = 0; i < rules.length; i++) {
	    if (str.match(rules[i][0])) {
	      str = str.replace(rules[i][0], rules[i][1]);
	    }
	  }
	  var adj = str + 'able';
	  if (ible_suffixes[str]) {
	    adj = str + 'ible';
	  }
	  return adj;
	};

	module.exports = to_adjective;

	},{}],111:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var Term = _dereq_('../term.js');
	var _conjugate = _dereq_('./conjugate/conjugate.js');
	var _negate = _dereq_('./verb_negate.js');
	var _to_adjective = _dereq_('./to_adjective.js');
	var predict_form = _dereq_('./conjugate/predict_form.js');

	var verbTags = {
	  infinitive: 'Infinitive',
	  present: 'PresentTense',
	  past: 'PastTense',
	  gerund: 'Gerund',
	  actor: 'Actor',
	  future: 'FutureTense',
	  pluperfect: 'PluperfectTense',
	  perfect: 'PerfectTense'
	};

	var Verb = function (_Term) {
	  _inherits(Verb, _Term);

	  function Verb(str, tag) {
	    _classCallCheck(this, Verb);

	    var _this = _possibleConstructorReturn(this, (Verb.__proto__ || Object.getPrototypeOf(Verb)).call(this, str));

	    _this.tag = tag;
	    _this.pos['Verb'] = true;
	    //if we've been told which
	    if (tag) {
	      _this.pos[tag] = true;
	    }
	    return _this;
	  }

	  //'root' for a verb means infinitive


	  _createClass(Verb, [{
	    key: 'root',
	    value: function root() {
	      return this.conjugate().infinitive;
	    }

	    //retrieve a specific form

	  }, {
	    key: 'conjugation',
	    value: function conjugation() {
	      //check cached conjugations
	      var conjugations = this.conjugate();
	      var keys = Object.keys(conjugations);
	      for (var i = 0; i < keys.length; i++) {
	        if (conjugations[keys[i]] === this.normal) {
	          return verbTags[keys[i]];
	        }
	      }
	      //try to guess
	      return verbTags[predict_form(this.normal)];
	    }
	  }, {
	    key: 'tense',
	    value: function tense() {
	      //map conjugation onto past/present/future
	      var tenses = {
	        infinitive: 'present',
	        gerund: 'present',
	        actor: 'present',
	        present: 'present',
	        past: 'past',
	        future: 'future',
	        perfect: 'past',
	        pluperfect: 'past',
	        future_perfect: 'future'
	      };
	      var c = this.conjugation();
	      return tenses[c] || 'present';
	    }
	  }, {
	    key: 'conjugate',
	    value: function conjugate() {
	      return _conjugate(this.normal);
	    }
	  }, {
	    key: 'to_past',
	    value: function to_past() {
	      var tense = 'past';
	      var conjugations = this.conjugate(this.normal);
	      this.tag = verbTags[tense];
	      this.changeTo(conjugations[tense]);
	      return conjugations[tense];
	    }
	  }, {
	    key: 'to_present',
	    value: function to_present() {
	      var tense = 'present';
	      var conjugations = this.conjugate(this.normal);
	      this.tag = verbTags[tense];
	      this.changeTo(conjugations[tense]);
	      return conjugations[tense];
	    }
	  }, {
	    key: 'to_future',
	    value: function to_future() {
	      var tense = 'future';
	      var conjugations = this.conjugate(this.normal);
	      this.tag = verbTags[tense];
	      this.changeTo(conjugations[tense]);
	      return conjugations[tense];
	    }
	  }, {
	    key: 'to_adjective',
	    value: function to_adjective() {
	      return _to_adjective(this.conjugate().infinitive);
	    }

	    //is this verb negative already?

	  }, {
	    key: 'isNegative',
	    value: function isNegative() {
	      var str = this.normal;
	      //yep, pretty simple
	      if (str.match(/(n't|\bnot\b)/)) {
	        return true;
	      }
	      return false;
	    }

	    //turn 'walked' to "didn't walk"

	  }, {
	    key: 'negate',
	    value: function negate() {
	      this.changeTo(_negate(this));
	      return this;
	    }
	  }, {
	    key: 'all_forms',
	    value: function all_forms() {
	      var forms = this.conjugate();
	      forms['negated'] = _negate(this);
	      forms['normal'] = this.normal;
	      return forms;
	    }
	  }]);

	  return Verb;
	}(Term);

	Verb.fn = Verb.prototype;

	module.exports = Verb;

	//let v = new Verb('run');
	//console.log(v.all_forms());

	},{"../term.js":101,"./conjugate/conjugate.js":102,"./conjugate/predict_form.js":105,"./to_adjective.js":110,"./verb_negate.js":112}],112:[function(_dereq_,module,exports){
	'use strict';
	//recieves a verb object, and returns a negated string
	//sort out don't/didn't/doesn't/won't

	var fns = _dereq_('../../fns');

	// logic:
	// [past tense] - "sold" -> "didn't sell"
	// [present] - "sells" -> "doesn't sell"
	// [future] - "will sell" -> "won't sell"

	var negate = function negate(v) {

	  var known_negation = {
	    'is': 'isn\'t',
	    'are': 'aren\'t',
	    'was': 'wasn\'t',
	    'will': 'won\'t',
	    'had': 'hadn\'t',
	    //modals
	    'did': 'didn\'t',
	    'would': 'wouldn\'t',
	    'could': 'couldn\'t',
	    'should': 'shouldn\'t',
	    'can': 'can\'t',
	    'must': 'mustn\'t',
	    'have': 'haven\'t',
	    'has': 'hasn\'t',
	    'does': 'doesn\'t',
	    'do': 'don\'t'
	  };
	  //hard-coded explicit forms
	  if (known_negation[v.normal]) {
	    return known_negation[v.normal];
	  }
	  //try to un-negate?  create corrollary
	  var known_affirmation = fns.reverseObj(known_negation);
	  if (known_affirmation[v.normal]) {
	    return known_affirmation[v.normal];
	  }

	  //multiple-word verbs, like 'have walked'
	  var words = v.normal.split(' ');
	  if (words.length > 1 && words[1] === 'not') {
	    return words[0];
	  }
	  if (words.length > 1 && known_negation[words[0]]) {
	    return known_negation[words[0]] + ' ' + words.slice(1, words.length).join(' ');
	  }
	  var form = v.conjugation();
	  //walked -> didn't walk
	  if (form === 'PastTense') {
	    return 'didn\'t ' + v.conjugate()['infinitive'];
	  }
	  //walks -> doesn't walk
	  if (form === 'PresentTense') {
	    return 'doesn\'t ' + v.conjugate()['infinitive'];
	  }
	  //walking -> not walking
	  if (form === 'Gerund') {
	    return 'not ' + v.text;
	  }
	  //walker -> non-walker ?
	  if (form === 'Actor') {
	    return 'non-' + v.text;
	  }
	  //walk -> don't walk ?
	  if (form === 'Infinitive') {
	    return 'don\'t ' + v.text;
	  }

	  return v.text;
	};

	module.exports = negate;

	},{"../../fns":23}],113:[function(_dereq_,module,exports){
	//(Rule-based sentence boundary segmentation) - chop given text into its proper sentences.
	// Ignore periods/questions/exclamations used in acronyms/abbreviations/numbers, etc.
	// @spencermountain 2015 MIT
	'use strict';

	var abbreviations = _dereq_('../data/abbreviations').abbreviations;
	var fns = _dereq_('../fns');

	var naiive_split = function naiive_split(text) {
	  //first, split by newline
	  var splits = text.split(/(\n+)/);
	  //split by period, question-mark, and exclamation-mark
	  splits = splits.map(function (str) {
	    return str.split(/(\S.+?[.!?])(?=\s+|$)/g);
	  });
	  return fns.flatten(splits);
	};

	var sentence_parser = function sentence_parser(text) {
	  var sentences = [];
	  //first do a greedy-split..
	  var chunks = [];
	  //ensure it 'smells like' a sentence
	  if (!text || typeof text !== 'string' || !text.match(/\w/)) {
	    return sentences;
	  }
	  // This was the splitter regex updated to fix quoted punctuation marks.
	  // let splits = text.split(/(\S.+?[.\?!])(?=\s+|$|")/g);
	  // todo: look for side effects in this regex replacement:
	  var splits = naiive_split(text);
	  //filter-out the grap ones
	  for (var i = 0; i < splits.length; i++) {
	    var s = splits[i];
	    if (!s || s === '') {
	      continue;
	    }
	    //this is meaningful whitespace
	    if (!s.match(/\S/)) {
	      //add it to the last one
	      if (chunks[chunks.length - 1]) {
	        chunks[chunks.length - 1] += s;
	        continue;
	      } else if (splits[i + 1]) {
	        //add it to the next one
	        splits[i + 1] = s + splits[i + 1];
	        continue;
	      }
	      //else, only whitespace, no terms, no sentence
	    }
	    chunks.push(s);
	  }

	  //detection of non-sentence chunks
	  var abbrev_reg = new RegExp('\\b(' + abbreviations.join('|') + ')[.!?] ?$', 'i');
	  var acronym_reg = new RegExp('[ |\.][A-Z]\.? +?$', 'i');
	  var elipses_reg = new RegExp('\\.\\.\\.* +?$');
	  //loop through these chunks, and join the non-sentence chunks back together..
	  for (var _i = 0; _i < chunks.length; _i++) {
	    //should this chunk be combined with the next one?
	    if (chunks[_i + 1] && (chunks[_i].match(abbrev_reg) || chunks[_i].match(acronym_reg) || chunks[_i].match(elipses_reg))) {
	      chunks[_i + 1] = chunks[_i] + (chunks[_i + 1] || ''); //.replace(/ +/g, ' ');
	    } else if (chunks[_i] && chunks[_i].length > 0) {
	      //this chunk is a proper sentence..
	      sentences.push(chunks[_i]);
	      chunks[_i] = '';
	    }
	  }
	  //if we never got a sentence, return the given text
	  if (sentences.length === 0) {
	    return [text];
	  }

	  return sentences;
	};

	module.exports = sentence_parser;
	// console.log(sentence_parser('hi John. He is good'));

	},{"../data/abbreviations":1,"../fns":23}],114:[function(_dereq_,module,exports){
	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var sentence_parser = _dereq_('./sentence_parser.js');
	// const Sentence = require('../sentence/sentence.js');
	var Question = _dereq_('../sentence/question/question.js');
	var Statement = _dereq_('../sentence/statement/statement.js');
	var fns = _dereq_('../fns.js');

	//a text object is a series of sentences, along with the generic methods for transforming them

	var Text = function () {
	  function Text(str, options) {
	    _classCallCheck(this, Text);

	    options = options || {};
	    var the = this;
	    if (typeof str === 'string') {
	      this.raw_text = str;
	    } else if (typeof str === 'number') {
	      this.raw_text = '' + str;
	    } else {
	      this.raw_text = '';
	    }
	    //build-up sentence/statement methods
	    this.sentences = sentence_parser(this.raw_text).map(function (s) {
	      var last_char = s.slice(-1);
	      if (last_char === '?') {
	        //TODO:be smartr
	        return new Question(s, options);
	      }
	      return new Statement(s, options);
	    });

	    this.contractions = {
	      // he'd -> he would
	      expand: function expand() {
	        the.sentences = the.sentences.map(function (s) {
	          return s.contractions.expand();
	        });
	        return the;
	      },
	      // he would -> he'd
	      contract: function contract() {
	        the.sentences = the.sentences.map(function (s) {
	          return s.contractions.contract();
	        });
	        return the;
	      }
	    };
	  }

	  //map over sentence methods


	  _createClass(Text, [{
	    key: 'text',
	    value: function text() {
	      var arr = this.sentences.map(function (s) {
	        return s.text();
	      });
	      return fns.flatten(arr).join('');
	    }
	  }, {
	    key: 'normal',
	    value: function normal() {
	      var arr = this.sentences.map(function (s) {
	        return s.normal();
	      });
	      return fns.flatten(arr).join(' ');
	    }

	    //further 'lemmatisation/inflection'

	  }, {
	    key: 'root',
	    value: function root() {
	      var arr = this.sentences.map(function (s) {
	        return s.root();
	      });
	      return fns.flatten(arr).join(' ');
	    }
	  }, {
	    key: 'terms',
	    value: function terms() {
	      var arr = this.sentences.map(function (s) {
	        return s.terms;
	      });
	      return fns.flatten(arr);
	    }
	  }, {
	    key: 'tags',
	    value: function tags() {
	      return this.sentences.map(function (s) {
	        return s.tags();
	      });
	    }

	    //a regex-like lookup for a sentence.
	    // returns an array of terms

	  }, {
	    key: 'match',
	    value: function match(str, options) {
	      var arr = [];
	      for (var i = 0; i < this.sentences.length; i++) {
	        arr = arr.concat(this.sentences[i].match(str, options));
	      }
	      return arr;
	    }
	  }, {
	    key: 'replace',
	    value: function replace(str, replacement, options) {
	      for (var i = 0; i < this.sentences.length; i++) {
	        this.sentences[i].replace(str, replacement, options);
	      }
	      return this;
	    }

	    //transformations

	  }, {
	    key: 'to_past',
	    value: function to_past() {
	      this.sentences = this.sentences.map(function (s) {
	        return s.to_past();
	      });
	      return this;
	    }
	  }, {
	    key: 'to_present',
	    value: function to_present() {
	      this.sentences = this.sentences.map(function (s) {
	        return s.to_present();
	      });
	      return this;
	    }
	  }, {
	    key: 'to_future',
	    value: function to_future() {
	      this.sentences = this.sentences.map(function (s) {
	        return s.to_future();
	      });
	      return this;
	    }
	  }, {
	    key: 'negate',
	    value: function negate() {
	      this.sentences = this.sentences.map(function (s) {
	        return s.negate();
	      });
	      return this;
	    }

	    //returns an array with elements from this.sentences[i].func()

	  }, {
	    key: 'generate_arr',
	    value: function generate_arr(func) {
	      var arr = [];
	      for (var i = 0; i < this.sentences.length; i++) {
	        arr = arr.concat(this.sentences[i][func]());
	      }
	      return arr;
	    }

	    //parts of speech

	  }, {
	    key: 'nouns',
	    value: function nouns() {
	      return this.generate_arr('nouns');
	    }
	  }, {
	    key: 'adjectives',
	    value: function adjectives() {
	      return this.generate_arr('adjectives');
	    }
	  }, {
	    key: 'verbs',
	    value: function verbs() {
	      return this.generate_arr('verbs');
	    }
	  }, {
	    key: 'adverbs',
	    value: function adverbs() {
	      return this.generate_arr('adverbs');
	    }

	    //mining

	  }, {
	    key: 'people',
	    value: function people() {
	      return this.generate_arr('people');
	    }
	  }, {
	    key: 'places',
	    value: function places() {
	      return this.generate_arr('places');
	    }
	  }, {
	    key: 'organizations',
	    value: function organizations() {
	      return this.generate_arr('organizations');
	    }
	  }, {
	    key: 'dates',
	    value: function dates() {
	      return this.generate_arr('dates');
	    }
	  }, {
	    key: 'values',
	    value: function values() {
	      return this.generate_arr('values');
	    }

	    //more generic named-entity recognition

	  }, {
	    key: 'topics',
	    value: function topics() {
	      //consolodate topics across sentences
	      var obj = {};
	      for (var i = 0; i < this.sentences.length; i++) {
	        var topics = this.sentences[i].topics();
	        for (var o = 0; o < topics.length; o++) {
	          if (obj[topics[o].text]) {
	            obj[topics[o].text].count += topics[o].count;
	          } else {
	            obj[topics[o].text] = topics[o];
	          }
	        }
	      }
	      //sort by frequency
	      var arr = Object.keys(obj).map(function (k) {
	        return obj[k];
	      });
	      return arr.sort(function (a, b) {
	        if (a.count > b.count) {
	          return -1;
	        } else {
	          return 1;
	        }
	      });
	    }
	    //'semantic' word-count, skips over implicit terms and things

	  }, {
	    key: 'word_count',
	    value: function word_count() {
	      var count = 0;
	      for (var i = 0; i < this.sentences.length; i++) {
	        count += this.sentences[i].word_count();
	      }
	      return count;
	    }
	  }]);

	  return Text;
	}();

	Text.fn = Text.prototype;

	module.exports = Text;

	},{"../fns.js":23,"../sentence/question/question.js":57,"../sentence/statement/statement.js":63,"./sentence_parser.js":113}]},{},[24])(24)
	});

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);

	module.exports.splitArray = R.curry((func, a) => {
	  return [R.filter(func, a), R.filter(R.complement(func), a) ];
	});
	module.exports.applyCombine = R.curry((func, a) => {
	  return [func(a[0]), a[1]];
	});


/***/ },
/* 9 */
/***/ function(module, exports) {

	module.exports.filterFunc = (type, term) => term.pos[type] !== undefined;
	module.exports.addField = (field, term, value) => {
	  return Object.assign({}, term, {[field]: value})
	};
	module.exports.filterMadLib = (term) => term.MadLib;


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);

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


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);

	//make this configurable
	module.exports = R.curry((changeClass, changeDisabled, createRenderFn,
	  enterRenderFn, doneRenderFn, state) => {
	  changeClass(`${state.step} ${state.highlight}`).run();
	  changeDisabled(state.disableDone).run();

	  switch(state.step){
	    case 'create':
	      createRenderFn(state.madIndexes, state.text).run();
	      break;
	    case 'enter':
	      enterRenderFn(state.madIndexes, state.madWords, state.text).run();
	      break;
	    case 'done':
	      doneRenderFn(state.madIndexes, state.madWords, state.text).run();
	      break;
	  }
	});


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	const R = __webpack_require__(2);

	//event filter functions
	module.exports.onlyClass = (filterFn, className) => {
	  return R.compose(
	    R.any(R.equals(className)),
	    R.flatten,
	    R.map(R.prop('classList')),
	    R.filter(filterFn)
	  );
	}

	module.exports.onlyThese = (classArray) => {
	  return R.compose(
	    R.lt(0),
	    R.prop('length'),
	    R.intersection(classArray),
	    R.prop('classList')
	 );
	}


/***/ }
/******/ ]);