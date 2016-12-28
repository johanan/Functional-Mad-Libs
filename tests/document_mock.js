function Element(node) {
  this.nodeName = node;
  this.dataset = {};
  this.children = [];
  this.appendChild = (el) => { this.children.push(el);},
  this.removeChild = (el) => { this.children.splice(this.children.indexOf(el), 1)},
  Object.defineProperties(this, {
    'firstChild': {
      'get': () => { return this.children[0]}
    }
  });
}

module.exports.createElement = (node) => {
  return new Element(node);
}
