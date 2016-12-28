const assert = require('assert');
const {render, setAttribute} = require('../src/io_functions.js');
const document = require('./document_mock.js');

describe('render test', () => {
  it('should remove all current elements', (done) => {
    let root = document.createElement('root');
    root.children = [1,2,3,4,5];
    render(root, []).run();
    assert.equal(root.children.length, 0);
    done();
  });

  it('should add new elements in', (done) => {
    let root = document.createElement('root');
    root.children = [1,2,3,4,5];
    render(root, [1,2,3]).run();
    assert.equal(root.children.length, 3);
    assert.equal(root.children[0], 1);
    assert.equal(root.children[1], 2);
    assert.equal(root.children[2], 3);
    done();
  });
})

describe('setAttribute test', () => {
  it('should set an attribute', (done) => {
    let a = {};
    setAttribute('b', a, 'value').run();
    assert.equal(a.b, 'value');
    done();
  })
})
