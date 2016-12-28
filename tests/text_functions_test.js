const assert = require('assert');
const R = require('ramda');
const {getTerms, processText, replaceText} = require('../src/text_functions.js');
//starting to put these together
const filterMadLib = require('../src/basic_functions.js').filterMadLib;

let text = "Somebody once told me the world is gonna roll me. I ain't the sharpest tool in the shed.";
let terms = getTerms(text);

//these are more of integration tests
describe('getTerms test', () => {
  it('should get the words out of any text.', (done) => {
    assert.equal(terms.length, 19);
    assert.equal(terms[0].text, 'Somebody');
    assert.equal(terms[18].text, 'shed.');
    done();
  });
});

describe('processText test', () => {
  let noIndexes = processText([], terms);
  let indexes = processText([1,3,5], terms);
  it('should return in the same order and not same array', (done) => {
    assert.equal(noIndexes.length, 19);
    assert.equal(noIndexes[0].text, 'Somebody');
    assert.equal(noIndexes[18].text, 'shed.');
    assert.notDeepEqual(terms, noIndexes);

    assert.equal(indexes.length, 19);
    assert.equal(indexes[0].text, 'Somebody');
    assert.equal(indexes[18].text, 'shed.');
    assert.notDeepEqual(terms, indexes);
    done();
  });

  it('should add a Madlib property to matching indexes', (done) => {
    let madlibs = indexes.filter(filterMadLib);
    assert.equal(noIndexes.filter(filterMadLib).length, 0);
    assert.equal(madlibs.length, 3);
    assert.equal(madlibs[0].text, "once");
    assert.equal(madlibs[1].text, "me");
    assert.equal(madlibs[2].text, "world");

    //now out of range
    let oor = processText([1,3,25, 100], terms).filter(filterMadLib);
    assert.equal(oor.length, 2);
    assert.equal(oor[0].text, "once");
    assert.equal(oor[1].text, "me");
    done();
  });
});

describe('replaceText test', () => {
  let noWords = replaceText([], [], processText([], terms));
  let words = replaceText([1,3,5], ["one", "three", "five"], processText([1,3,5], terms));
  let oorWords = replaceText([1,3,25], ["one", "three", "twentyfive"], processText([1,3,25], terms));
  it('should return in correct order', (done) => {
    assert.equal(noWords.length, 19);
    assert.equal(words.length, 19);
    assert.equal(oorWords.length, 19);

    assert.equal(noWords[0].text, "Somebody");
    assert.equal(noWords[18].text, "shed.");
    assert.equal(words[0].text, "Somebody");
    assert.equal(words[18].text, "shed.");
    assert.equal(oorWords[0].text, "Somebody");
    assert.equal(oorWords[18].text, "shed.");
    done();
  });
  it('should change the text based on index', (done) => {
    assert.equal(words[1].text, "one");
    assert.equal(words[3].text, "three");
    assert.equal(words[5].text, "five");

    assert.equal(oorWords[3].text, "three");
    done();
  });
})
