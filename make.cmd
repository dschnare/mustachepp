@ECHO off

IF "%1"=="test" GOTO TEST
GOTO BUILD

:BUILD
node_modules\.bin\uglifyjs mustachepp.js -o mustachepp.min.js
GOTO:eof

:TEST

GOTO:eof