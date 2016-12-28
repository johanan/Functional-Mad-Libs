const assert = require('assert');
const {createRenderElements, enterRenderElements, doneRenderElements} = require('../src/render_functions.js');

let text = "Somebody once told me the world is gonna roll me. I ain't the sharpest tool in the shed.";

describe('createRenderElements test', () => {
  it('should should have MadLib on the indexed', (done) => {
    let create = createRenderElements([], text);
    let icreate = createRenderElements([1,3,5], text);

    assert.equal(create.length, 19);
    assert.equal(create[0].text, 'Somebody');
    assert.equal(icreate.length, 19);
    assert.equal(icreate[0].text, 'Somebody');
    assert.equal(icreate[0].MadLib, undefined);
    assert.equal(icreate[1].MadLib, true);
    assert.equal(icreate[3].MadLib, true);
    assert.equal(icreate[5].MadLib, true);
    done();
  });
})

describe('enterRenderElements test', () => {
  let enter = enterRenderElements([], [], text);
  let ienter = enterRenderElements([1,3,5], ['one','','five'], text);
  it('should return an array of arrays that match the type', (done) => {
    assert.equal(enter.length, 0);

    assert.equal(ienter.length, 3);
    assert.equal(ienter[0][0], 'one');
    assert.equal(ienter[0][1], 'Adverb');
    assert.equal(ienter[1][0], '');
    assert.equal(ienter[1][1], 'Verb');
    assert.equal(ienter[2][0], 'five');
    assert.equal(ienter[2][1], 'Noun');
    done();
  });
})

describe('doneRenderElements test', () => {
  it('should replace the text', (done) => {
    let doneEl = doneRenderElements([], [], text);
    let idoneEl = doneRenderElements([1,3,5], ['one','three','five'], text);
    assert.equal(doneEl.length, 19);

    assert.equal(idoneEl.length, 19);
    assert.equal(idoneEl[0].text, 'Somebody');
    assert.equal(idoneEl[1].text, 'one');
    assert.equal(idoneEl[3].text, 'three');
    assert.equal(idoneEl[5].text, 'five');
    done();
  });
})
