const assert = require('assert');
const {filterFunc, addField, filterMadLib} = require('../src/basic_functions.js');

describe('filterFunc test for pos', () => {
  let verb = {pos: {Verb: true}};
  let noun = {pos: {Noun: true}};
  let adjective = {pos: {Adjective: true}};
  let adverb = {pos: {Adverb: true}};
  it('should match each word type', (done) => {
    assert.equal(filterFunc('Verb', verb), true);
    assert.equal(filterFunc('Noun', noun), true);
    assert.equal(filterFunc('Adjective', adjective), true);
    assert.equal(filterFunc('Adverb', adverb), true);
    done();
  });
  it('should not match different word types', (done) => {
    assert.equal(filterFunc('Verb', noun), false);
    assert.equal(filterFunc('Verb', adjective), false);
    assert.equal(filterFunc('Verb', adverb), false);

    assert.equal(filterFunc('Noun', verb), false);
    assert.equal(filterFunc('Noun', adjective), false);
    assert.equal(filterFunc('Noun', adverb), false);

    assert.equal(filterFunc('Adjective', noun), false);
    assert.equal(filterFunc('Adjective', verb), false);
    assert.equal(filterFunc('Adjective', adverb), false);

    assert.equal(filterFunc('Adverb', noun), false);
    assert.equal(filterFunc('Adverb', adjective), false);
    assert.equal(filterFunc('Adverb', verb), false);
    done();
  });
});

describe('addField test', () => {
  it('should add a field to an object', (done) => {
    let a = {a: 'a'};
    assert.equal(JSON.stringify(addField('b', a, 'b')), JSON.stringify({a: 'a', b: 'b'}));
    assert.notDeepEqual(addField('b', a, 'b'), a);
    done();
  });

  it('should not return the same object', (done) => {
    let a = {a: 'a'};
    assert.notDeepEqual(addField('b', a, 'b'), a);
    done();
  })
});

describe('filterMadLib should filter objects', () => {
  let madlib = {MadLib: true};
  let nonMadlib = {};
  it('should filter on the Madlib property', (done) => {
    assert.equal(filterMadLib(madlib), true);
    assert.equal(filterMadLib(nonMadlib), undefined);
    assert.equal([madlib, nonMadlib].filter(filterMadLib).length, 1);
    done();
  });
});
