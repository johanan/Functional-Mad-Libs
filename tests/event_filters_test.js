const assert = require('assert');
const {onlyClass, onlyThese} = require('../src/event_filters.js');

describe('onlyClass', () => {
  let match = [{classList: ['create']}, {classList: ['nope']}];
  let noMatch = [{classList: ['nope']}];
  it('should look through a list of elements for a certain class', (done) => {
    assert.equal(onlyClass(x => true, 'create')(match), true);
    assert.equal(onlyClass(x => true, 'create')(noMatch), false);
    done();
  })
})

describe('onlyThese', () => {
  it('should return if any of these classes are on the element', (done) => {
    assert.equal(onlyThese(['Noun', 'Verb'])({classList: ['Noun']}), true);
    assert.equal(onlyThese(['Noun', 'Verb'])({classList: ['Verb']}), true);
    assert.equal(onlyThese(['Noun', 'Verb'])({classList: ['nope']}), false);
    done();
  })
})
