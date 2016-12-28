const R = require('ramda');

//make this configurable
module.exports = R.curry((changeClass, changeDisabled, createRenderFn,
  enterRenderFn, doneRenderFn, state) => {
  changeClass(`${state.step} ${state.highlight}`).run();
  changeDisabled(state.disableDone).run();

  switch(state.step){
    case 'create':
      createRenderFn(state.madIndexes, state.text).run();
      break;
    case 'enter':
      enterRenderFn(state.madIndexes, state.madWords, state.text).run();
      break;
    case 'done':
      doneRenderFn(state.madIndexes, state.madWords, state.text).run();
      break;
  }
});
