const assert = require('assert');
const document = require('./document_mock.js');
const {spanMap, inputMap} = require('../src/dom_element_map_functions.js');
const getTerms = require('../src/text_functions.js').getTerms;

let terms = getTerms(" dog eats ");
terms[0].Index = 0;
terms[1].Index = 1;
terms[1].MadLib = true;

describe('spanMap test', () => {
  it('should create spans based on term', (done) => {
    let span = spanMap(document, terms[0]);
    let madSpan = spanMap(document, terms[1]);

    assert.equal(span.nodeName, 'span');
    assert.equal(span.className, 'Noun');
    assert.equal(span.dataset.index, 0);
    assert.equal(span.title, 'Noun');
    assert.equal(span.innerHTML, ' dog ');

    assert.equal(madSpan.className, 'Verb PresentTense MadLib');
    assert.equal(madSpan.dataset.index, 1);
    assert.equal(madSpan.title, 'Verb PresentTense');
    assert.equal(madSpan.innerHTML, 'eats ');
    done();
  });
});

describe('inputMap test', () => {
  let blankInput = inputMap(document, ['', 'Noun']);
  let input = inputMap(document, ['hey', 'Verb']);
  it('should create an input box based on term', (done) => {
    assert.equal(blankInput.nodeName, 'input');
    assert.equal(blankInput.type, 'text');
    assert.equal(blankInput.placeholder, 'Noun');
    assert.equal(blankInput.value, '');

    assert.equal(input.nodeName, 'input');
    assert.equal(input.type, 'text');
    assert.equal(input.placeholder, 'Verb');
    assert.equal(input.value, 'hey');
    done();
  });
});
