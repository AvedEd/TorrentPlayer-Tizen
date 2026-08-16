(function () {
    "use strict";
    function AVPlayer() {
        this.avplay = null; this.url = null; this.duration = 0; this.currentTime = 0; this.volume = 100; this.events = {};
    }
    AVPlayer.prototype.init = function () {
        try {
            this.avplay = webapis.avplay; console.log("[AVPlay] initialized"); return true;
        } catch (e) { console.error("[AVPlay] init error", e); return false; }
    };
    AVPlayer.prototype.setEvents = function (ev) { this.events = ev || {}; };
    AVPlayer.prototype.open = function (url, cb) {
        var self = this; self.url = url;
        if (!self.avplay && !self.init()) { if (cb) cb(new Error("AVPlay недоступен")); return; }
        try {
            try { self.avplay.stop(); } catch (e) {}
            try { self.avplay.close(); } catch (e) {}
            self.avplay.open(url);
            self.avplay.setListener({
                onbufferingstart: function () { if (self.events.onBufferingStart) self.events.onBufferingStart(); },
                onbufferingprogress: function (pct) { if (self.events.onBufferingProgress) self.events.onBufferingProgress(pct); },
                onbufferingcomplete: function () { if (self.events.onBufferingComplete) self.events.onBufferingComplete(); },
                oncurrentplaytime: function (ms) { self.currentTime = ms; if (self.events.onTime) self.events.onTime(ms); },
                onstreamcompleted: function () { if (self.events.onComplete) self.events.onComplete(); },
                onerror: function (err) { if (self.events.onError) self.events.onError(err); }
            });
            // Страховка от отсутствия звука на телевизорах Samsung без поддержки DTS
            try {
                if (typeof self.avplay.setAudioMixMethod === "function") {
                    self.avplay.setAudioMixMethod("SAMSUNG_AUDIO_MIX_METHOD_DEFAULT");
                }
            } catch (ae) { console.error("[AVPlay] Audio mix error", ae); }
            self.avplay.setDisplayRect(0, 0, 1920, 1080);
            self.avplay.prepareAsync(function () {
                try { self.duration = self.avplay.getDuration(); } catch (e) { self.duration = 0; }
                if (self.events.onReady) self.events.onReady(self.duration); if (cb) cb(null);
            }, function (err) { console.error("[AVPlay] prepare error", err); if (cb) cb(err); });
        } catch (err) { console.error("[AVPlay] open error", err); if (cb) cb(err); }
    };
    AVPlayer.prototype.play = function () { try { this.avplay.play(); return true; } catch (e) { return false; } };
    AVPlayer.prototype.pause = function () { try { this.avplay.pause(); return true; } catch (e) { return false; } };
    AVPlayer.prototype.stop = function () { try { this.avplay.stop(); } catch (e) {} try { this.avplay.close(); } catch (e) {} this.currentTime = 0; };
    AVPlayer.prototype.seekTo = function (ms) { try { this.avplay.seekTo(ms); return true; } catch (e) { return false; } };
    AVPlayer.prototype.setAudioTrack = function (id) {
        try {
            if (this.avplay && typeof this.avplay.setSelectTrack === "function") {
                this.avplay.setSelectTrack("AUDIO", id); return true;
            }
        } catch (e) { console.error("[AVPlay] setAudioTrack error", e); }
        return false;
    };
    var playerInstance = new AVPlayer(); playerInstance.init(); window.TorrentAVPlay = playerInstance;
})();
