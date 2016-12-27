const assert = require('assert');
const {splitArray, applyCombine} = require('../src/higher_order_functions.js');
const R = require('ramda');

describe('splitArray test', () => {
  let testArray = [1,2,3,4,5];
  let even = (x) => x % 2 === 0;
  it('should split an array between matching and non matching', (done) => {
    let split = splitArray(even, testArray);
    assert.equal(split.length, 2);
    assert.equal(split[0].length, 2);
    assert.equal(split[1].length, 3);
    assert.equal(split[0][0], 2);
    assert.equal(split[1][0], 1);
    done();
  })
});

describe('applyCombine test', () => {
  it('should only apply a function to the first element', (done) => {
    let mapDouble = R.map((x) => x * 2);
    let split = [[2,4], [1,3,5]];
    let applied = applyCombine(mapDouble, split);
    assert.equal(applied.length, 2);
    assert.equal(applied[0].length, 2);
    assert.equal(applied[1].length, 3);
    assert.equal(applied[0][0], 4);
    assert.equal(applied[1][0], 1);
    done();
  });
});
