const R = require('ramda');

//event filter functions
module.exports.onlyClass = (filterFn, className) => {
  return R.compose(
    R.any(R.equals(className)),
    R.flatten,
    R.map(R.prop('classList')),
    R.filter(filterFn)
  );
}

module.exports.onlyThese = (classArray) => {
  return R.compose(
    R.lt(0),
    R.prop('length'),
    R.intersection(classArray),
    R.prop('classList')
 );
}
