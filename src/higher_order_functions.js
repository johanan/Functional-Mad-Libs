const R = require('ramda');

module.exports.splitArray = R.curry((func, a) => {
  return [R.filter(func, a), R.filter(R.complement(func), a) ];
});
module.exports.applyCombine = R.curry((func, a) => {
  return [func(a[0]), a[1]];
});
