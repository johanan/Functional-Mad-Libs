const assert = require('assert');
const processStateChange = require('../src/fake_redux/processStateChange.js');

describe('processStateChange test', () => {
  it('should set everything with init', (done) => {
    let s = processStateChange({}, {type: 'init', value: {a: 'a', b: 'b'}});
    assert.equal(s.a, 'a');
    assert.equal(s.b, 'b');
    done();
  });

  it('should change the text', (done) => {
    let s = processStateChange({text: 'text'}, {type: 'text', value: 'changed'});
    assert.equal(s.text, 'changed');
    done();
  });

  it('should update the indexes', (done) => {
    let current = {madIndexes: [1,2,4], madWords: ['one', 'two', 'three'], step: 'create', disableDone: false};
    let add = processStateChange(current, {type: 'indexes', value: '3'});
    let remove = processStateChange(current, {type: 'indexes', value: '1'});
    assert.equal(add.madIndexes.length, 4);
    assert.equal(add.madIndexes[2], 3);
    assert.equal(add.madWords.length, 4);
    assert.equal(add.madWords[0], '');
    assert.equal(add.disableDone, true);

    assert.equal(remove.madIndexes.length, 2);
    assert.equal(remove.madIndexes[0], 2);
    assert.equal(remove.madWords.length, 2);
    assert.equal(remove.madWords[0], '');
    assert.equal(remove.disableDone, true);
    done();
  })

  it('should update the words', (done) => {
    let current = {madWords: ['', ''], step: 'enter', disableDone: true};
    let one = processStateChange(current, {type: 'words', value: ['one', '']});
    let two = processStateChange(current, {type: 'words', value: ['one', 'two']});
    assert.equal(one.madWords[0], 'one');
    assert.equal(one.madWords[1], '');
    assert.equal(one.step, 'entering');
    assert.equal(one.disableDone, true);

    assert.equal(two.madWords[0], 'one');
    assert.equal(two.madWords[1], 'two');
    assert.equal(two.step, 'entering');
    assert.equal(two.disableDone, false);
    done();
  })

  it('should change the step', (done) => {
    assert.equal(processStateChange({step: 'create'}, {type: 'stepChange', value: 'done'}).step, 'done');
    done();
  })

  it('should flip highlight', (done) => {
    assert.equal(processStateChange({highlight: ''}, {type: 'highlightChange'}).highlight, 'Highlight');
    assert.equal(processStateChange({highlight: 'Highlight'}, {type: 'highlightChange'}).highlight, '');
    done();
  })

  it('should reset the object', (done) => {
    let reset = processStateChange({}, {type: 'reset'});
    assert.equal(reset.madIndexes.length, 0);
    assert.equal(reset.madWords.length, 0);
    assert.equal(reset.step, 'create');
    assert.equal(reset.disableDone, true);
    done();
  })

  it('should pass the state back on an unknown action', (done) => {
    let unknown = processStateChange({a: 'a'}, {type: 'unknown', value: {b: 'b'}});
    assert.equal(unknown.a, 'a');
    assert.equal(unknown.b, undefined);
    done();
  })
})
