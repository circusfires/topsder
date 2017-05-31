(function(exports) {
    
var SongCache = function() {
    this.cachedsongs = [];
    this.queue = [];
    this.data = JSON.parse(localStorage.getItem('songcache') || '{}');
    this.listeners = [];
}

SongCache.prototype.pop = function() {
    if (this.queue.length == 0) {
        return null;
    }
    
    var item = this.queue[0];
    this.queue.splice(0, 1);
    return item;
}
    
SongCache.prototype.saveCache = function() {
    localStorage.setItem('songcache', JSON.stringify(this.data));
}

SongCache.prototype.store = function(song, data) {
	console.log('store', song, data);
	if (this.cachedsongs.indexOf(song) == -1) {
		this.cachedsongs.push(song);
	}
	var idx = this.queue.indexOf(song);
	if (idx != -1) {
		this.queue.splice(idx, 1);
	}
	this.data[song] = data;
	this.callFulfilledListeners();
	this.saveCache();
}

SongCache.prototype.callFulfilledListeners = function() {
	console.log('callFulfilledListeners', this.listeners);
	var _this = this;
	this.listeners.forEach(function(item) {
		console.log('check listener', item);

		var anymissing = false;
		var result = [];
		for(var i=0; i<item.songs.length; i++) {
			var song = item.songs[i];
			var songdata = _this.data[song];
			result[i] = songdata;
			if (typeof(songdata) == 'undefined') {
				anymissing = true;
			}
		}

		if (!anymissing) {
			if (!item.fulfilled) {
				console.log('we can fire', item, result);
				item.fulfilled = true;
				item.callback(result);
			}
		}
	});

	this.listeners = this.listeners.filter(function(item) {
		return !item.fulfilled;
	});
}

SongCache.prototype.lookupSongs = function(songs, callback) {
	var _this = this;
	songs.forEach(function(song) {
		if (_this.queue.indexOf(song) == -1 &&
			_this.cachedsongs.indexOf(song) == -1 &&
			typeof(_this.data[song]) == 'undefined') {
			_this.queue.push(song);
		}
	});
	this.listeners.push({
		songs: songs,
		fulfilled: false,
		callback: callback
	});
	this.callFulfilledListeners();
}

exports.SongCache = SongCache;

})(window);