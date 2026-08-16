(function () {
    "use strict";
    var Remote = {
        KEY: { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, PLAY_PAUSE: 10252 },
        handler: null,
        setHandler: function (cb) { this.handler = cb; },
        init: function () {
            var self = this;
            document.addEventListener("keydown", function (e) {
                var code = e.keyCode;
                if (self.handleMenuNav(code, e)) return;
                if (code === self.KEY.UP) {
                    var m = document.getElementById("bottomSettingsMenu"); var w = document.getElementById("topBufferInfo");
                    if (m && m.className.indexOf("hidden") !== -1 && w) { 
                        w.className = "top-buffer-widget"; 
                        if (window.TorrentApp && typeof window.TorrentApp.startStatTimer === "function") window.TorrentApp.startStatTimer();
                        e.preventDefault(); return; 
                    }
                }
                if (code === self.KEY.DOWN) {
                    var scr = document.getElementById("playerScreen"); var menu = document.getElementById("bottomSettingsMenu");
                    if (scr && menu && menu.className.indexOf("hidden") !== -1 && scr.className.indexOf("hidden") === -1) { self.openMenu(); e.preventDefault(); return; }
                }
                if (code === self.KEY.BACK) e.preventDefault();
                if (self.handler) self.handler(code, e);
            }, false);
        },
        openMenu: function () {
            var m = document.getElementById("bottomSettingsMenu"); if (!m) return; m.className = "bottom-menu-panel";
            if (window.TorrentTracks && typeof window.TorrentTracks.renderMegaMenu === "function") window.TorrentTracks.renderMegaMenu();
            var first = document.querySelector("#menuAudioTracks .track-item"); if (first) first.focus();
        },
        handleMenuNav: function (code, e) {
            var m = document.getElementById("bottomSettingsMenu"); var sb = document.getElementById("playlistSidebar"); var w = document.getElementById("topBufferInfo");
            if (code === this.KEY.BACK && w && w.className.indexOf("hidden") === -1) { 
                w.className = "top-buffer-widget hidden"; 
                if (window.TorrentApp && typeof window.TorrentApp.stopStatTimer === "function") window.TorrentApp.stopStatTimer();
                e.preventDefault(); return true; 
            }
            if (!m || m.className.indexOf("hidden") !== -1) return false;
            var act = document.activeElement;
            if (code === this.KEY.BACK) {
                if (sb && sb.className.indexOf("hidden") === -1) { sb.className = "playlist-sidebar hidden"; var btn = document.getElementById("openPlaylistBtn"); if (btn) btn.focus(); }
                else { m.className = "bottom-menu-panel hidden"; }
                e.preventDefault(); return true;
            }
            if (sb && sb.className.indexOf("hidden") === -1) {
                if (code === this.KEY.UP || code === this.KEY.DOWN) {
                    var n = (code === this.KEY.DOWN) ? act.nextElementSibling : act.previousElementSibling;
                    if (n && n.className.indexOf("track-item") !== -1) n.focus(); e.preventDefault(); return true;
                }
                if (code === this.KEY.ENTER) { if (act) act.click(); e.preventDefault(); return true; }
                return true;
            }
            if (code === this.KEY.LEFT || code === this.KEY.RIGHT) {
                if (act && act.className.indexOf("track-item") !== -1) {
                    var s = (code === this.KEY.RIGHT) ? act.nextElementSibling : act.previousElementSibling;
                    if (s) { s.focus(); s.parentNode.scrollLeft = s.offsetLeft - 50; }
                }
                e.preventDefault(); return true;
            }
            if (code === this.KEY.UP || code === this.KEY.DOWN) {
                if (act) {
                    var curSec = act.parentNode.parentNode;
                    var tarSec = (code === this.KEY.DOWN) ? curSec.nextElementSibling : curSec.previousElementSibling;
                    if (tarSec && !tarSec.querySelector(".track-item")) tarSec = (code === this.KEY.DOWN) ? tarSec.nextElementSibling : tarSec.previousElementSibling;
                    if (tarSec) { var tarBtn = tarSec.querySelector(".track-item"); if (tarBtn) tarBtn.focus(); }
                }
                e.preventDefault(); return true;
            }
            if (code === this.KEY.ENTER) {
                if (act) {
                    if (act.id === "openPlaylistBtn") { if (sb) { sb.className = "playlist-sidebar"; var fEp = document.querySelector("#seriesListContainer .track-item"); if (fEp) fEp.focus(); } }
                    else { act.click(); }
                }
                e.preventDefault(); return true;
            }
            return false;
        }
    };
    Remote.init(); window.TorrentRemote = Remote;
})();
