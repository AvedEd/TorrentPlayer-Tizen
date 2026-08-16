(function () {
    "use strict";

    /*
     * TorrentPlayer Tracks & Playlist Manager
     *
     * Мощный модуль для работы с:
     * - Горизонтальными аудиодорожками (озвучками)
     * - Горизонтальными субтитрами
     * - Плейлистом серий для сериалов (боковая шторка)
     * - Синхронизацией таймлайна в меню
     */

    var Tracks = {

        audioTracks: [],

        subtitleTracks: [],

        episodes: [],

        currentAudio: -1,

        currentSubtitle: -1,

        currentEpisodeIndex: -1,


        /*
         * Сброс информации
         */

        reset: function () {

            this.audioTracks = [];

            this.subtitleTracks = [];

            this.episodes = [];

            this.currentAudio = -1;

            this.currentSubtitle = -1;

            this.currentEpisodeIndex = -1;
        },


        /*
         * Нормализация языка
         */

        normalizeLanguage: function (
            language
        ) {

            if (!language) {
                return "";
            }

            return String(language)
                .toLowerCase()
                .replace("_", "-")
                .trim();
        },


        /*
         * Понятное название языка
         */

        languageName: function (
            language
        ) {

            var lang =
                this.normalizeLanguage(
                    language
                );


            var names = {

                "ru": "Русский",
                "ru-ru": "Русский",

                "en": "English",
                "en-us": "English",
                "en-gb": "English",

                "uk": "Українська",

                "de": "Deutsch",

                "fr": "Français",

                "es": "Español",

                "it": "Italiano",

                "pl": "Polski",

                "nl": "Nederlands",

                "pt": "Português",

                "tr": "Türkçe",

                "ja": "日本語",

                "ko": "한국어",

                "zh": "中文"

            };


            return names[lang] || language || "Неизвестный";
        },


        /*
         * Загрузка ВСЕХ треков и плейлиста серий из TorServe
         */

        loadTorrentData: function (
            torServeUrl,
            torrentHash,
            currentFileIndex,
            callback
        ) {

            var self = this;

            self.reset();


            var xhr = new XMLHttpRequest();

            xhr.open(
                "POST",
                torServeUrl + "/torrent/info",
                true
            );

            xhr.setRequestHeader(
                "Content-Type",
                "application/json"
            );


            xhr.onreadystatechange = function () {

                if (
                    xhr.readyState === 4 &&
                    xhr.status === 200
                ) {

                    try {

                        var data =
                            JSON.parse(
                                xhr.responseText
                            );


                        /*
                         * 1. Парсим плейлист (все медиа-файлы раздачи)
                         */

                        if (
                            data.files &&
                            data.files.length > 0
                        ) {

                            for (
                                var f = 0;
                                f < data.files.length;
                                f++
                            ) {
                                
                                var file = data.files[f];

                                // Добавляем файл в список серий
                                self.episodes.push({

                                    index: f,

                                    name: file.name,

                                    size: file.size,

                                    link: torServeUrl + file.link

                                });
                            }

                            self.currentEpisodeIndex = currentFileIndex;
                        }


                        /*
                         * 2. Достаем дорожки и субтитры для текущего файла
                         */

                        var currentFile =
                            data.files[currentFileIndex];


                        if (
                            currentFile &&
                            currentFile.tracks
                        ) {

                            for (
                                var i = 0;
                                i < currentFile.tracks.length;
                                i++
                            ) {

                                var t =
                                    currentFile.tracks[i];


                                if (t.type === "audio") {

                                    self.audioTracks.push({
                                        id: t.id !== undefined ? t.id : self.audioTracks.length,
                                        title: t.title || "",
                                        languageName: self.languageName(t.language)
                                    });

                                } else if (t.type === "subtitle") {

                                    self.subtitleTracks.push({
                                        id: t.id !== undefined ? t.id : self.subtitleTracks.length,
                                        title: t.title || "",
                                        languageName: self.languageName(t.language)
                                    });
                                }
                            }
                        }

                    } catch (e) {

                        console.error("TorServe data parse error:", e);
                    }


                    if (typeof callback === "function") {

                        callback();
                    }
                }
            };


            xhr.send(
                JSON.stringify({
                    hash: torrentHash
                })
            );
        },


        /*
         * Отрисовка всего Мега-Меню
         */

        renderMegaMenu: function () {

            var self = this;


            /*
             * 1. Рендерим горизонтальный ряд Озвучек
             */

            var audioContainer =
                document.getElementById(
                    "menuAudioTracks"
                );


            if (audioContainer) {

                audioContainer.innerHTML = "";

                for (
                    var a = 0;
                    a < self.audioTracks.length;
                    a++
                ) {

                    (function (idx) {

                        var track = self.audioTracks[idx];

                        var btn = document.createElement("button");

                        btn.type = "button";

                        btn.className = "track-item";

                        btn.setAttribute("tabindex", "0");

                        btn.innerText =
                            track.title ||
                            track.languageName ||
                            ("Озвучка " + (idx + 1));


                        if (track.id === self.currentAudio) {

                            btn.className += " active-track";
                        }


                        btn.onclick = function () {

                            self.currentAudio = track.id;

                            if (
                                window.TorrentAVPlay &&
                                typeof window.TorrentAVPlay.setAudioTrack === "function"
                            ) {
                                window.TorrentAVPlay.setAudioTrack(track.id);
                            }

                            self.renderMegaMenu();
                        };

                        audioContainer.appendChild(btn);

                    })(a);
                }
            }


            /*
             * 2. Рендерим горизонтальный ряд Субтитров
             */

            var subContainer =
                document.getElementById(
                    "menuSubtitles"
                );


            if (subContainer) {

                subContainer.innerHTML = "";

                for (
                    var s = 0;
                    s < self.subtitleTracks.length;
                    s++
                ) {

                    (function (idx) {

                        var sub = self.subtitleTracks[idx];

                        var btn = document.createElement("button");

                        btn.type = "button";

                        btn.className = "track-item";

                        btn.setAttribute("tabindex", "0");

                        btn.innerText =
                            sub.title ||
                            sub.languageName ||
                            ("Субтитры " + (idx + 1));


                        if (sub.id === self.currentSubtitle) {

                            btn.className += " active-track";
                        }


                        btn.onclick = function () {

                            self.currentSubtitle = sub.id;

                            // Здесь будет вызов переключения сабов в AVPlay, когда дойдем до них
                            console.log("Subtitles selected:", sub.id);

                            self.renderMegaMenu();
                        };

                        subContainer.appendChild(btn);

                    })(s);
                }
            }


            /*
             * 3. Рендерим правый боковой список Серий
             */

            var seriesContainer =
                document.getElementById(
                    "seriesListContainer"
                );


            if (seriesContainer) {

                seriesContainer.innerHTML = "";

                for (
