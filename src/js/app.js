(function () {
    "use strict";
    var App = {
        currentScreen: "home", currentUrl: "", isPlaying: false, streamReady: false,
        torServeUrl: "http://127.0.0.1:8090", currentHash: "", currentFileIndex: 0,
        reconnectAttempts: 0, maxReconnectAttempts: 5, reconnectTimer: null, isReconnecting: false, lastPosition: 0,

        init: function () { this.bindUI(); this.initPlayer(); this.showHome(); },
        initPlayer: function () {
            var self = this;
            if (!window.TorrentAVPlay) return;
            window.TorrentAVPlay.setEvents({
                onBufferingStart: function () { self.showLoading("Буферизация..."); },
                onBufferingComplete: function () { self.hideLoading(); },
                onReady: function (duration) {
                    self.streamReady = true; self.hideLoading();
                    if (self.isReconnecting) {
                        self.isReconnecting = false; self.reconnectAttempts = 0;
                        if (self.lastPosition > 0) window.TorrentAVPlay.seekTo(self.lastPosition);
                    } else {
                        if (window.TorrentStorage) {
                            var pos = TorrentStorage.getPosition(self.currentUrl);
                            if (pos > 0 && pos < duration - 10000) window.TorrentAVPlay.seekTo(pos);
                        }
                    }
                    if (window.TorrentAVPlay) { window.TorrentAVPlay.play(); self.isPlaying = true; }
                    if (window.TorrentTracks && self.currentHash) {
                        window.TorrentTracks.loadTorrentData(self.torServeUrl, self.currentHash, self.currentFileIndex);
                    }
                },
                onTime: function (ms) {
                    self.lastPosition = ms;
                    var prg = document.getElementById("progress");
                    var dur = window.TorrentAVPlay ? window.TorrentAVPlay.duration : 0;
                    if (dur > 0 && prg) prg.style.width = ((ms / dur) * 100) + "%";
                    if (window.TorrentTracks && typeof window.TorrentTracks.updateMenuTimeline === "function") {
                        window.TorrentTracks.updateMenuTimeline(ms, dur);
                    }
                },
                onComplete: function () { self.stop(); self.showHome(); },
                onError: function (err) { self.stop(); self.handleStreamRetry(err); }
            });
        },
        handleStreamRetry: function (err) {
            var self = this;
            if (self.reconnectAttempts < self.maxReconnectAttempts) {
                self.reconnectAttempts++; self.isReconnecting = true;
                self.showLoading("Переподключение (" + self.reconnectAttempts + " из 5)...");
                if (self.reconnectTimer) clearTimeout(self.reconnectTimer);
                self.reconnectTimer = setTimeout(function () {
                    if (window.TorrentAVPlay) window.TorrentAVPlay.open(self.currentUrl);
                }, 3000);
            } else {
                self.isReconnecting = false; self.reconnectAttempts = 0;
                alert("Ошибка воспроизведения: " + err);
            }
        },
        parseTorServeParams: function (url) {
            try {
                if (!url) return;
                var matchUrl = url.match(/^(https?:\/\/[^\/]+)/); if (matchUrl) this.torServeUrl = matchUrl[1];
                var matchHash = url.match(/[?&](link|play)=([^&]+)/); if (matchHash) this.currentHash = matchHash[2];
                var matchIndex = url.match(/[?&]index=(\d+)/); this.currentFileIndex = matchIndex ? parseInt(matchIndex[1], 10) : 0;
            } catch (e) { console.error(e); }
        },
        playFile: function (idx, url) { this.currentFileIndex = idx; this.playUrl(url); },
        playUrl: function (url) {
            if (!url) return; this.currentUrl = url; if (window.TorrentStorage) TorrentStorage.setLastUrl(url);
            this.parseTorServeParams(url); this.showScreen("player"); this.showLoading("Запуск...");
            if (window.TorrentAVPlay) window.TorrentAVPlay.open(url);
        },
        stop: function () {
            this.streamReady = false; if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.isReconnecting = false; this.reconnectAttempts = 0;
            if (window.TorrentAVPlay) window.TorrentAVPlay.stop();
        },
        showScreen: function (id) {
            this.currentScreen = id; var screens = ["homeScreen", "playerScreen"];
            for (var i = 0; i < screens.length; i++) {
                var el = document.getElementById(screens[i]);
                if (el) el.className = (screens[i].indexOf(id) === 0) ? el.className.replace(" hidden", "") : el.className + " hidden";
            }
        },
        showHome: function () { this.showScreen("home"); var input = document.getElementById("streamUrl"); if (input && this.currentUrl) input.value = this.currentUrl; },
        showLoading: function (txt) { var box = document.getElementById("loading"); var el = document.getElementById("loadingText"); if (el) el.innerText = txt; if (box) box.className = "overlay"; },
        hideLoading: function () { var box = document.getElementById("loading"); if (box) box.className = "overlay hidden"; },
        bindUI: function () {
            var self = this;
            var btnPlay = document.getElementById("playButton"); if (btnPlay) { btnPlay.onclick = function () { var input = document.getElementById("streamUrl"); if (input) self.playUrl(input.value); }; }
            if (window.TorrentRemote) {
                window.TorrentRemote.setHandler(function (keyCode) {
                    if (self.currentScreen === "player" && keyCode === window.TorrentRemote.KEY.BACK) { self.stop(); self.showHome(); }
                });
            }
        }
    };
    window.onload = function () { if (window.TorrentStorage) App.currentUrl = TorrentStorage.getLastUrl(); App.init(); };
    window.TorrentApp = App;
})();
