var LastFmNode = require('./lib/lastfm').LastFmNode,
    repl = require('repl'),
    config = require('./config'),
    _ = require('underscore');

var echoHandler = function() {
    _(arguments).each(function(arg) {
        console.log(arg);
    });
};

var errorHandler = function(error) {
    console.log('Error: ' + error.message);
};

var _echoHandlers = {
    error: errorHandler,
    success: echoHandler,
    lastPlayed: echoHandler,
    nowPlaying: echoHandler,
    scrobbled: echoHandler,
    stoppedPlaying: echoHandler
};

var lastfm = new LastFmNode({
    api_key: config.api_key,
    secret: config.secret
});

var context = repl.start().context;
context.lastfm = lastfm;
context._echoHandlers = _echoHandlers;
