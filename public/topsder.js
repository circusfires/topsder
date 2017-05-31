(function(exports) {
    var g_name = '';
    var g_tracks = [];

    function setStatus(text) {
        if (text != '') {
            $('#status').html(
                '<div class="progress progress-striped active">' +
                '<div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%">' +
                text +
                '</div>' +
                '</div>'
            );
        } else {
            $('#status').html('');
        }
    }

    var refreshSongs = function() {
        setStatus('Updating songs...');

        var timeframe = $('input[name="tmfrmradio"]:checked').val();
        var subreddit = $('#alltext').val().trim();
        g_name = 'r/' + $('#alltext').val().trim();
        
        //retrieve songs
        $.ajax({
            url: '/getsongs',
            data: {
                subreddit: subreddit,
                timeframe: timeframe
            },
            type: 'POST'
        }).done(function(data) {
            setStatus('');
            
            var songs = data;
            var txt = '';
        
            console.log(data);
            //new stuff
            songs.forEach(function(data) {
               
                var found = null;
                var title = '';

                found = data;

                console.log('found', found);
                if (found) {
                    g_tracks.push(found.uri);
                    txt += '<div class="media">' +
                        '<a class="pull-left" href="#"><img class="media-object" src="' + found.cover_url + '" /></a>' +
                        '<div class="media-body">' +
                        '<h4 class="media-heading"><a href="' + found.uri + '">' + found.name + '</a></h4>' +
                        'Album: <a href="' + found.album_uri + '">' + found.album +
                        '</a><br/>Artist: <a href="' + found.artist_uri + '">' + found.artist+'</a>' +
                        '</div>' +
                        '</div>\n';
                    } else {
                        txt += '<div class="media">No match found for the song "' + '"</div>\n'
                    }
                
                
            });
            
            $('#tracklist').html(txt);
        });
    }

    var client_id = '7194583055244e608d51f41eaa2a8920';
    var redirect_uri = 'http://localhost:8888/callback.html';

    var doLogin = function(callback) {
        var url = 'https://accounts.spotify.com/authorize?client_id=' + client_id +
            '&response_type=token' +
            '&scope=playlist-read-private%20playlist-modify%20playlist-modify-private' +
            '&redirect_uri=' + encodeURIComponent(redirect_uri);
        localStorage.setItem('createplaylist-tracks', JSON.stringify(g_tracks));
        localStorage.setItem('createplaylist-name', g_name);
        var w = window.open(url, 'asdf', 'WIDTH=400,HEIGHT=500');
    }


    var refreshtimer = 0;
    var queueRefreshSongs = function() {
        if (refreshtimer) {
            clearTimeout(refreshtimer);
        }
        refreshtimer = setTimeout(function() {
            refreshSongs();
        }, 1000);
    }

    exports.startApp = function() {
        setStatus('');
        console.log('start app.');
        //lookup songs upon subreddit change
        $('#alltext').keyup(function() {
            queueRefreshSongs();
        });
        $('alltext').change(function() {
            queueRefreshSongs();
        });
        //lookup songs upon timeframe change
        $('input[name="tmfrmradio"]').change(function() {
            queueRefreshSongs();
        });
        //other
        $('#start').click(function() {
            doLogin(function() {});
        });
        $('#alltext').text('music');
        refreshSongs();
    }
})(window);