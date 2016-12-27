module.exports.filterFunc = (type, term) => term.pos[type] !== undefined;
module.exports.addField = (field, term, value) => {
  return Object.assign({}, term, {[field]: value})
};
module.exports.filterMadLib = (term) => term.MadLib;
