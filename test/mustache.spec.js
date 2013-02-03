var fs = require('fs');
var path = require('path');
var glob = require('glob');
var Mustachepp = require('../mustachepp');

// These are the known tests that Mustache.js 0.7.2 fails.
var knownToFailInMustacheJS = {
  "~lambdas.json": "any",
  "comments.json": ["Standalone Without Newline"],
  "delimiters.json": ["Standalone Without Newline"],
  "inverted.json": ["Standalone Without Newline"],
  "partials.json": ["Failed Lookup", "Standalone Without Previous Line", "Standalone Without Newline", "Standalone Indentation"],  
  "sections.json": ["Standalone Without Newline"]
};

describe('Mustache specification', function () {
  var globOptions = {cwd: __dirname}
  var files = glob.sync('./mustache-spec/specs/*.json', globOptions);
  
  files.forEach(function (file) {
    var basename = path.basename(file);

    if (knownToFailInMustacheJS[basename] !== 'any') {
      var text = fs.readFileSync(path.join(globOptions.cwd, file), 'utf8');
      var spec = JSON.parse(text);
      
      spec.tests.forEach(function (test) {
        if (knownToFailInMustacheJS[basename] && knownToFailInMustacheJS[basename].indexOf(test.name) < 0) {
          it(basename + ':' + test.name + ':' + test.desc, function () {
            var result = Mustachepp.render(test.template, test.data, test.partials || {});
            expect(result).toBe(test.expected);
          });        
        }
      });
    }
  });
});