var LastFmBase = require("./lastfm-base");

var RecentTracksStream = module.exports = function(lastfm, user, options) {
  var that = this;
  LastFmBase.call(this);
  options = options || {};

  var rate = 5
    , minRate = 5
    , maxRate = 15
    , isStreaming = false
    , timeout
    , lastPlay = null
    , nowPlaying = null;

  registerEventHandlers(options);

  if (options.autostart) {
    start();
  }

  this.start = function() {
    start();
  }

  this.stop = function() {
    stop();
  }

  this.isStreaming = function() {
    return isStreaming;
  }

  function registerEventHandlers(options) {
    that.registerHandlers(options.handlers);
  }

  function start() {
    isStreaming = true;
    check();

    function check() {
      var request = lastfm.request("user.getrecenttracks", {
        user: user,
        limit: 1
      });
      request.on("success", handleSuccess);
      request.on("error", bubbleError);
      if (isStreaming) {
        timeout = that.scheduleCallback(check, rate * 1000);
      }
    }

    function handleSuccess(data) {
      if (!data || !data.recenttracks || !data.recenttracks.track) {
        rate = Math.min(rateMax, rate + 2);
        that.emit("error", new Error("Unexpected response"));
        return;
      }

      rate = minRate;

      var tracks = data.recenttracks.track;
      if (tracks instanceof Array) {
        if(tracks.length > 0) {
          processNowPlaying(tracks[0]);
        }
        if(tracks.length > 1) {
          processLastPlay(tracks[1]);
        }
        return;
      }

      var track = tracks;
      if (track["@attr"] && track["@attr"]["nowplaying"]) {
        processNowPlaying(track);
        return;
      }
    
      processLastPlay(track);
      if (nowPlaying) {
        that.emit("stoppedPlaying", nowPlaying);
        nowPlaying = null;
      }
    }

    function bubbleError(error) {
      rate = Math.min(rateMax, rate + 2);
      that.emit("error", error);
    }
  }

  function processNowPlaying(track) {
    var sameTrack = (nowPlaying && nowPlaying.name == track.name);
    if (!sameTrack) {
      nowPlaying = track;
      that.emit("nowPlaying", track);
    }
  }

  function processLastPlay(track) {
    if (!lastPlay) {
      lastPlay = track;
      that.emit("lastPlayed", track);
      return;
    }

    var sameTrack = (lastPlay.name == track.name);
    if (!sameTrack) {
      lastPlay = track;
      that.emit("scrobbled", track);
    }
  }

  function stop() {
    that.cancelCallback(timeout);
    isStreaming = false;
  }
};

RecentTracksStream.prototype = Object.create(LastFmBase.prototype);
