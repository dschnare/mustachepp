mustachepp.min.js: mustachepp.js
	node_modules/.bin/uglifyjs mustachepp.js -o mustachepp.min.js

test:	
	node_modules/.bin/jasmine-node test/

.PHONY: test