const R = require('ramda');
const IO = require('monet').IO;

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
