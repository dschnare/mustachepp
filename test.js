var mustachepp = require('./mustachepp');

var tpl = '{{#with numbers}}The result: {{.}}{{/with}}';
var view = {
  numbers: [1, 2, 3, 4, 5]
};
console.log('result:', mustachepp.render(tpl, view));