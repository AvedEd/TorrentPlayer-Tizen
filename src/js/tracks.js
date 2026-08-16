(function () {
    "use strict";
    var Tracks = {
        audioTracks: [], subtitleTracks: [], episodes: [], currentAudio: -1, currentSubtitle: -1, currentEpisodeIndex: -1,
        reset: function () { this.audioTracks = []; this.subtitleTracks = []; this.episodes = []; this.currentAudio = -1; this.currentSubtitle = -1; this.currentEpisodeIndex = -1; },
        languageName: function (lang) {
            if (!lang) return "Неизвестный"; var l = String(lang).toLowerCase().replace("_", "-").trim();
            var names = {"ru": "Русский", "ru-ru": "Русский", "en": "English", "en-us": "English", "uk": "Українська", "de": "Deutsch", "fr": "Français", "es": "Español"};
            return names[l] || lang;
        },
        loadTorrentData: function (tsUrl, hash, curIdx, callback) {
            var self = this; self.reset(); var xhr = new XMLHttpRequest();
            xhr.open("POST", tsUrl + "/torrent/info", true); xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        if (data.files && data.files.length > 0) {
                            for (var f = 0; f < data.files.length; f++) {
                                var file = data.files[f];
                                self.episodes.push({index: f, name: file.name, size: file.size, link: tsUrl + file.link});
                            }
                            self.currentEpisodeIndex = curIdx;
                        }
                        var curFile = data.files[curIdx];
                        if (curFile && curFile.tracks) {
                            for (var i = 0; i < curFile.tracks.length; i++) {
                                var t = curFile.tracks[i];
                                if (t.type === "audio") {
                                    self.audioTracks.push({id: t.id !== undefined ? t.id : self.audioTracks.length, title: t.title || "", languageName: self.languageName(t.language)});
                                } else if (t.type === "subtitle") {
                                    self.subtitleTracks.push({id: t.id !== undefined ? t.id : self.subtitleTracks.length, title: t.title || "", languageName: self.languageName(t.language)});
                                }
                            }
                        }
                    } catch (e) { console.error(e); }
                    if (typeof callback === "function") callback();
                }
            };
            xhr.send(JSON.stringify({hash: hash}));
        },
        renderMegaMenu: function () {
            var self = this; var auCont = document.getElementById("menuAudioTracks");
            if (auCont) {
                auCont.innerHTML = "";
                for (var a = 0; a < self.audioTracks.length; a++) {
                    (function (idx) {
                        var t = self.audioTracks[idx]; var btn = document.createElement("button");
                        btn.type = "button"; btn.className = "track-item" + (t.id === self.currentAudio ? " active-track" : "");
                        btn.setAttribute("tabindex", "0"); btn.innerText = t.title || t.languageName || ("Озвучка " + (idx + 1));
                        btn.onclick = function () {
                            self.currentAudio = t.id;
                            if (window.TorrentAVPlay && typeof window.TorrentAVPlay.setAudioTrack === "function") window.TorrentAVPlay.setAudioTrack(t.id);
                            self.renderMegaMenu();
                        };
                        auCont.appendChild(btn);
                    })(a);
                }
            }
            var subCont = document.getElementById("menuSubtitles");
            if (subCont) {
                subCont.innerHTML = "";
                for (var s = 0; s < self.subtitleTracks.length; s++) {
                    (function (idx) {
                        var t = self.subtitleTracks[idx]; var btn = document.createElement("button");
                        btn.type = "button"; btn.className = "track-item" + (t.id === self.currentSubtitle ? " active-track" : "");
                        btn.setAttribute("tabindex", "0"); btn.innerText = t.title || t.languageName || ("Субтитры " + (idx + 1));
                        btn.onclick = function () { self.currentSubtitle = t.id; self.renderMegaMenu(); };
                        subCont.appendChild(btn);
                    })(s);
                }
            }
            var serCont = document.getElementById("seriesListContainer");
            if (serCont) {
                serCont.innerHTML = "";
                for (var e = 0; e < self.episodes.length; e++) {
                    (function (idx) {
                        var ep = self.episodes[idx]; var btn = document.createElement("button");
                        btn.type = "button"; btn.className = "track-item" + (ep.index === self.currentEpisodeIndex ? " active-track" : "");
                        btn.setAttribute("tabindex", "0"); btn.style.textAlign = "left"; btn.innerText = ep.name;
                        btn.onclick = function () {
                            if (window.TorrentApp && typeof window.TorrentApp.playFile === "function") window.TorrentApp.playFile(ep.index, ep.link);
                            document.getElementById("playlistSidebar").className = "playlist-sidebar hidden";
                            document.getElementById("bottomSettingsMenu").className = "bottom-menu-panel hidden";
                        };
                        serCont.appendChild(btn);
                    })(e);
                }
            }
        },
        updateMenuTimeline: function (curMs, durMs) {
            var prg = document.getElementById("menuProgress"); var curT = document.getElementById("menuCurrentTime"); var durT = document.getElementById("menuDuration");
            if (!prg || !curT || !durT || !durMs) return; prg.style.width = ((curMs / durMs) * 100) + "%";
            function fmt(ms) {
                var s = Math.floor(ms / 1000); var h = Math.floor(s / 3600); var m = Math.floor((s - (h * 3600)) / 60); s = s % 60;
                if (m < 10) m = "0" + m; if (s < 10) s = "0" + s; return h > 0 ? (h + ":" + m + ":" + s) : (m + ":" + s);
            }
            curT.innerText = fmt(curMs); durT.innerText = fmt(durMs);
        }
    };
    window.TorrentTracks = Tracks;
})();
