(function () {
    "use strict";
    var App = {
        currentScreen: "home",
        currentUrl: "",
        isPlaying: false,
        streamReady: false,
        torServeUrl: "http://127.0.0.1:8090",
        currentHash: "",
        currentFileIndex: 0,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        reconnectTimer: null,
        isReconnecting: false,
        lastPosition: 0,
        statTimer: null,
        iptvChannels: [],
        isIptvMode: false,

        init: function () {
            this.bindUI();
            this.initPlayer();
            this.showHome();
        },

        initPlayer: function () {
            var self = this;
            if (!window.TorrentAVPlay) return;
            window.TorrentAVPlay.setEvents({
                onBufferingStart: function () {
                    self.showLoading("Буферизация...");
                },
                onBufferingComplete: function () {
                    self.hideLoading();
                },
                onReady: function (duration) {
                    self.streamReady = true;
                    self.hideLoading();
                    if (self.isReconnecting) {
                        self.isReconnecting = false;
                        self.reconnectAttempts = 0;
                        if (self.lastPosition > 0) {
                            window.TorrentAVPlay.seekTo(self.lastPosition);
                        }
                    } else {
                        if (!self.isIptvMode && window.TorrentStorage) {
                            var pos = TorrentStorage.getPosition(self.currentUrl);
                            if (pos > 0 && pos < duration - 10000) {
                                window.TorrentAVPlay.seekTo(pos);
                            }
                        }
                    }
                    if (window.TorrentAVPlay) {
                        window.TorrentAVPlay.play();
                        self.isPlaying = true;
                    }
                    if (!self.isIptvMode && window.TorrentTracks && self.currentHash) {
                        window.TorrentTracks.loadTorrentData(
                            self.torServeUrl,
                            self.currentHash,
                            self.currentFileIndex
                        );
                    }
                },
                onTime: function (ms) {
                    self.lastPosition = ms;
                    var prg = document.getElementById("progress");
                    var dur = window.TorrentAVPlay ? window.TorrentAVPlay.duration : 0;
                    if (dur > 0 && prg) {
                        prg.style.width = ((ms / dur) * 100) + "%";
                    }
                    if (!self.isIptvMode && window.TorrentTracks && 
                        typeof window.TorrentTracks.updateMenuTimeline === "function") {
                        window.TorrentTracks.updateMenuTimeline(ms, dur);
                    }
                },
                onComplete: function () {
                    self.stop();
                    self.showScreen("home");
                },
                onError: function (err) {
                    self.stop();
                    if (self.isIptvMode) {
                        alert("Ошибка канала IPTV");
                    } else {
                        self.handleStreamRetry(err);
                    }
                }
            });
        },
        loadIptvPlaylist: function (url) {
            var self = this;
            if (!url) return;
            self.showLoading("Загрузка IPTV...");
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    self.hideLoading();
                    if (xhr.status === 200) {
                        self.parseM3u(xhr.responseText);
                    } else {
                        alert("Ошибка загрузки плейлиста!");
                    }
                }
            };
            xhr.send();
        },

        parseM3u: function (text) {
            this.iptvChannels = [];
            var lines = text.split("\n");
            var currentName = "Без названия";
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line.indexOf("#EXTINF:") === 0) {
                    var comma = line.lastIndexOf(",");
                    if (comma !== -1) {
                        currentName = line.substring(comma + 1);
                    }
                } else if (line.indexOf("http") === 0) {
                    this.iptvChannels.push({
                        name: currentName,
                        url: line
                    });
                    currentName = "Без названия";
                }
            }
            if (this.iptvChannels.length > 0) {
                this.renderIptvSidebar();
                this.playIptvChannel(0);
            } else {
                alert("Каналы не найдены!");
            }
        },

        renderIptvSidebar: function () {
            var self = this;
            var cont = document.getElementById("iptvListContainer");
            if (!cont) return;
            cont.innerHTML = "";
            for (var i = 0; i < self.iptvChannels.length; i++) {
                (function (idx) {
                    var ch = self.iptvChannels[idx];
                    var btn = document.createElement("button");
                    btn.type = "button";
                    btn.className = "track-item";
                    btn.setAttribute("tabindex", "0");
                    btn.style.textAlign = "left";
                    btn.innerText = (idx + 1) + ". " + ch.name;
                    btn.onclick = function () {
                        self.playIptvChannel(idx);
                        document.getElementById("iptvSidebar").className = "iptv-sidebar hidden";
                    };
                    cont.appendChild(btn);
                })(i);
            }
        },

        playIptvChannel: function (idx) {
            var ch = this.iptvChannels[idx];
            if (!ch) return;
            this.isIptvMode = true;
            this.currentUrl = ch.url;
            this.currentHash = "";
            this.showScreen("player");
            this.showLoading("Запуск канала...");
            if (window.TorrentAVPlay) {
                window.TorrentAVPlay.open(ch.url);
            }
        },
        startStatTimer: function () {
            var self = this;
            self.stopStatTimer();
            if (!self.currentHash) return;
            self.statTimer = setInterval(function () {
                var xhr = new XMLHttpRequest();
                xhr.open("POST", self.torServeUrl + "/torrent/stat", true);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            var elLoaded = document.getElementById("bufferMegaBytes");
                            var elSpeed = document.getElementById("bufferSpeed");
                            if (elLoaded) {
                                elLoaded.innerText = "Буфер: " + (data.Loaded / 1024 / 1024).toFixed(1) + " МБ";
                            }
                            if (elSpeed) {
                                elSpeed.innerText = "Скорость: " + (data.DownloadSpeed / 1024 / 1024).toFixed(2) + " МБ/с";
                            }
                        } catch (e) {}
                    }
                };
                xhr.send(JSON.stringify({ hash: self.currentHash }));
            }, 1500);
        },

        stopStatTimer: function () {
            if (this.statTimer) {
                clearInterval(this.statTimer);
                this.statTimer = null;
            }
        },

        handleStreamRetry: function (err) {
            var self = this;
            if (self.reconnectAttempts < self.maxReconnectAttempts) {
                self.reconnectAttempts++;
                self.isReconnecting = true;
                self.showLoading("Переподключение (" + self.reconnectAttempts + " из 5)...");
                if (self.reconnectTimer) clearTimeout(self.reconnectTimer);
                self.reconnectTimer = setTimeout(function () {
                    if (window.TorrentAVPlay) window.TorrentAVPlay.open(self.currentUrl);
                }, 3000);
            } else {
                self.isReconnecting = false;
                self.reconnectAttempts = 0;
                alert("Ошибка потока: " + err);
            }
        },

        parseTorServeParams: function (url) {
            try {
                if (!url) return;
                var matchUrl = url.match(/^(https?:\/\/[^\/]+)/);
                if (matchUrl) this.torServeUrl = matchUrl[1];
                var matchHash = url.match(/[?&](link|play)=([^&]+)/);
                if (matchHash) this.currentHash = matchHash[2];
                var matchIndex = url.match(/[?&]index=(\d+)/);
                this.currentFileIndex = matchIndex ? parseInt(matchIndex[1], 10) : 0;
            } catch (e) {}
        },

        playFile: function (idx, url) {
            this.currentFileIndex = idx;
            this.playUrl(url);
        },

        playUrl: function (url) {
            if (!url) return;
            this.isIptvMode = false;
            this.currentUrl = url;
            if (window.TorrentStorage) TorrentStorage.setLastUrl(url);
            this.parseTorServeParams(url);
            this.showScreen("player");
            this.showLoading("Запуск торрента...");
            if (window.TorrentAVPlay) window.TorrentAVPlay.open(url);
        },

        togglePlay: function () {
            if (!this.streamReady || !window.TorrentAVPlay) return;
            if (this.isPlaying) {
                window.TorrentAVPlay.pause();
                this.isPlaying = false;
            } else {
                window.TorrentAVPlay.play();
                this.isPlaying = true;
            }
        },

        seekRelative: function (ms) {
            if (this.isIptvMode || !this.streamReady || !window.TorrentAVPlay) return;
            var target = window.TorrentAVPlay.currentTime + ms;
            if (target < 0) target = 0;
            if (target > window.TorrentAVPlay.duration) target = window.TorrentAVPlay.duration;
            window.TorrentAVPlay.seekTo(target);
        },

        stop: function () {
            this.streamReady = false;
            this.stopStatTimer();
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.isReconnecting = false;
            this.reconnectAttempts = 0;
            if (window.TorrentAVPlay) window.TorrentAVPlay.stop();
        },

        showScreen: function (id) {
            this.currentScreen = id;
            var screens = ["homeScreen", "playerScreen"];
            for (var i = 0; i < screens.length; i++) {
                var el = document.getElementById(screens[i]);
                if (el) {
                    el.className = (screens[i].indexOf(id) === 0) ? 
                        el.className.replace(" hidden", "") : el.className + " hidden";
                }
            }
        },

        showHome: function () {
            this.showScreen("home");
            var input = document.getElementById("streamUrl");
            if (input && this.currentUrl) input.value = this.currentUrl;
        },

        showLoading: function (txt) {
            var box = document.getElementById("loading");
            var el = document.getElementById("loadingText");
            if (el) el.innerText = txt;
            if (box) box.className = "overlay";
        },

        hideLoading: function () {
            var box = document.getElementById("loading");
            if (box) box.className = "overlay hidden";
        },

        bindUI: function () {
            var self = this;
            var btnPlay = document.getElementById("playButton");
            if (btnPlay) {
                btnPlay.onclick = function () {
                    var input = document.getElementById("streamUrl");
                    if (input) self.playUrl(input.value);
                };
            }
            var btnIptv = document.getElementById("loadIptvBtn");
            if (btnIptv) {
                btnIptv.onclick = function () {
                    var input = document.getElementById("streamUrl");
                    if (input) self.loadIptvPlaylist(input.value);
                };
            }
            if (window.TorrentRemote) {
                window.TorrentRemote.setHandler(function (keyCode) {
                    var menu = document.getElementById("bottomSettingsMenu");
                    var isMenuHidden = !menu || menu.className.indexOf("hidden") !== -1;
                    if (self.currentScreen === "player") {
                        if (isMenuHidden) {
                            if (keyCode === window.TorrentRemote.KEY.RIGHT) self.seekRelative(15000);
                            else if (keyCode === window.TorrentRemote.KEY.LEFT) self.seekRelative(-15000);
                        }
                        if (keyCode === window.TorrentRemote.KEY.BACK) {
                            self.stop();
                            self.showScreen("home");
                        }
                        else if (keyCode === window.TorrentRemote.KEY.PLAY_PAUSE) {
                            self.togglePlay();
                        }
                    }
                });
            }
        }
    };

    window.onload = function () {
        if (window.TorrentStorage) App.currentUrl = TorrentStorage.getLastUrl();
        App.init();
    };

    window.AppInstance = App;
    window.TorrentApp = App;
})();
