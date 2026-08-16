(function () {
    "use strict";

    /*
     * TorrentPlayer Tracks Manager
     *
     * Работа с:
     *
     * - аудиодорожками
     * - субтитрами
     * - выбором языка
     * - интеграцией с TorServe API
     *
     * Важно:
     * фактические возможности зависят от потока
     * и конкретной модели Samsung TV.
     */

    var Tracks = {

        audioTracks: [],

        subtitleTracks: [],

        currentAudio: -1,

        currentSubtitle: -1,


        /*
         * Сброс информации
         */

        reset: function () {

            this.audioTracks = [];

            this.subtitleTracks = [];

            this.currentAudio = -1;

            this.currentSubtitle = -1;
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
         * Добавить аудиодорожку
         */

        addAudioTrack: function (
            track
        ) {

            if (!track) {
                return;
            }


            var item = {

                id:
                    track.id !== undefined
                        ? track.id
                        : this.audioTracks.length,

                language:
                    track.language ||
                    "",

                title:
                    track.title ||
                    "",

                codec:
                    track.codec ||
                    "",

                channels:
                    track.channels ||
                    0

            };


            item.languageName =
                this.languageName(
                    item.language
                );


            this.audioTracks.push(
                item
            );
        },


        /*
         * Добавить субтитры
         */

        addSubtitleTrack: function (
            track
        ) {

            if (!track) {
                return;
            }


            var item = {

                id:
                    track.id !== undefined
                        ? track.id
                        : this.subtitleTracks.length,

                language:
                    track.language ||
                    "",

                title:
                    track.title ||
                    "",

                format:
                    track.format ||
                    ""

            };


            item.languageName =
                this.languageName(
                    item.language
                );


            this.subtitleTracks.push(
                item
            );
        },


        /*
         * Получить аудиодорожки
         */

        getAudioTracks: function () {

            return this.audioTracks.slice();
        },


        /*
         * Получить субтитры
         */

        getSubtitleTracks: function () {

            return this.subtitleTracks.slice();
        },


        /*
         * Найти русскую дорожку
         */

        findRussianAudio: function () {

            for (
                var i = 0;
                i < this.audioTracks.length;
                i++
            ) {

                var lang =
                    this.normalizeLanguage(
                        this.audioTracks[i]
                            .language
                    );


                if (
                    lang === "ru" ||
                    lang.indexOf("ru-") === 0
                ) {

                    return this.audioTracks[i];
                }
            }


            return null;
        },


        /*
         * Найти английскую дорожку
         */

        findEnglishAudio: function () {

            for (
                var i = 0;
                i < this.audioTracks.length;
                i++
            ) {

                var lang =
                    this.normalizeLanguage(
                        this.audioTracks[i]
                            .language
                    );


                if (
                    lang === "en" ||
                    lang.indexOf("en-") === 0
                ) {

                    return this.audioTracks[i];
                }
            }


            return null;
        },


        /*
         * Автоматический выбор языка
         *
         * Приоритет:
         * 1. Русский
         * 2. Английский
         * 3. Первая дорожка
         */

        choosePreferredAudio: function () {

            var russian =
                this.findRussianAudio();


            if (russian) {

                return russian;
            }


            var english =
                this.findEnglishAudio();


            if (english) {

                return english;
            }


            if (
                this.audioTracks.length > 0
            ) {

                return this.audioTracks[0];
            }


            return null;
        },


        /*
         * Выбрать аудиодорожку
         *
         * Реальное переключение передаётся
         * AVPlay-слою приложения.
         */

        selectAudio: function (
            id
        ) {

            for (
                var i = 0;
                i < this.audioTracks.length;
                i++
            ) {

                if (
                    this.audioTracks[i].id === id
                ) {

                    this.currentAudio =
                        id;

                    return (
                        this.audioTracks[i]
                    );
                }
            }


            return null;
        },


        /*
         * Выбрать субтитры
         */

        selectSubtitle: function (
            id
        ) {

            for (
                var i = 0;
                i < this.subtitleTracks.length;
                i++
            ) {

                if (
                    this.subtitleTracks[i].id === id
                ) {

                    this.currentSubtitle =
                        id;

                    return (
                        this.subtitleTracks[i]
                    );
                }
            }


            return null;
        },


        /*
         * Сформировать информацию
         * для интерфейса.
         */

        getSummary: function () {

            return {

                audioCount:
                    this.audioTracks.length,

                subtitleCount:
                    this.subtitleTracks.length,

                currentAudio:
                    this.currentAudio,

                currentSubtitle:
                    this.currentSubtitle

            };
        },


        /*
         * Загрузка треков напрямую из API TorServe
         */

        loadFromTorServe: function (
            torServeUrl,
            torrentHash,
            fileIndex,
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


                        var currentFile =
                            data.files[fileIndex];


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

                                    self.addAudioTrack(t);

                                } else if (t.type === "subtitle") {

                                    self.addSubtitleTrack(t);
                                }
                            }
                        }

                    } catch (e) {

                        console.error("TorServe tracks parse error:", e);
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
