'use strict';

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config.js');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(cookieParser());

app.set('port', process.env.PORT || 8888);

var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + server.address().port);
});

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname+"/index.html");
});

//instantiate reddit wrapper
const snoowrap = require('snoowrap');

const r = new snoowrap({
    userAgent: 'playlist making application by u/turtletuxedo',
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    username: config.username,
    password: config.password
});

//instantiate spotify wrapper
var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
  clientId : '7194583055244e608d51f41eaa2a8920',
  clientSecret : config.spot_secretId,
  redirectUri : 'http://localhost:8888/callback'
});

spotifyApi.clientCredentialsGrant()
  .then(function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  }, function(err) {
    console.log('Something went wrong when retrieving an access token', err.message);
  });

var search_spot = function(str) {
    var fields = str.split(/-/);
    var art = fields[0].trim();
    var tr = fields[1].trim();
    var query='artist:'+ art + ' track:' + tr;
    console.log('Search for ' + tr + ' by ' + art);
    spotifyApi.searchTracks(query)
        .then(function(data) {
            var song_data;
            if(data.body.tracks.items[0] != undefined){
                song_data = data.body.tracks.items[0];
                console.log('Found a match for ' + song_data.name);
                var ret = {
                    name: song_data.name,
                    artist: 'Unknown',
                    artist_uri: '',
                    album: song_data.album.name,
                    album_uri: song_data.album.uri,
                    cover_url: '',
                    uri: song_data.uri
                }
                if(song_data.artists.length > 0) {
                    ret.artist = song_data.artists[0].name;
                    ret.artist_uri = song_data.artists[0].uri;
                }
                if(song_data.album.images.length > 0) {
                    ret.cover_url = song_data.album.images[song_data.album.images.length - 1].url;
                }
                track_listing.push(ret);
            }
            else {
                console.log('Could not find a match for ' + tr);
            }
    }, function(err) {
        console.log('Something went wrong!', err);
    });
}

var rm_brack_par = function(str) {
    return str.replace(/\[.*?\]/g, "")
              .replace(/\(.*?\)/g, "");
}

var parse_titles = function(title, domain) {
    var domains = ["youtu.be", "youtube.com", "soundcloud.com", "itunes.apple.com", "spotify.com", "itun.es"];
    var rx = new RegExp(domains.join('|'));
    //if on list of domains
    if( rx.test(domain) ) {
        var str = rm_brack_par(title);
        //ARTIST - TITLE
        var tex = /\w+\s-\s\w+/;
        if( tex.test(str) ){
            if(str != '') {
                return str.trim();
            }
        }
    }
    return null;
}

var track_listing = [];

app.post('/getsongs', function(req, res) {
    var sr = req.body.subreddit;
    var tf = req.body.timeframe;
    console.log('Retrieving songs from the past ' + tf +' on subreddit: ' + sr);
    r.getTop(sr, {time: tf})
        .then(posts => {
            var song_titles = [];
            posts.forEach(function(post) {
                if( parse_titles(post.title, post.domain) != null ) {
                    song_titles.push(parse_titles(post.title, post.domain));
                }
            });
            song_titles.forEach( function(title) {
                search_spot(title);
            });
            //wait for all track_listing to be populated
            setTimeout(function() {
                console.log('Sending client found tracks.')
                res.send(track_listing); 
                track_listing = [];
            }, 2000);
        });
});

module.exports = app;