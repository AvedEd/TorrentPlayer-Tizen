(function () {
    "use strict";

    /*
     * TorrentPlayer Application
     *
     * Главный контроллер приложения.
     *
     * Соединяет:
     * UI, Remote, AVPlay, Storage, Tracks
     */


    var APP_VERSION = "0.1.0";


    var App = {

        currentScreen: "home",

        currentUrl: "",

        isPlaying: false,

        isMuted: false,

        volume: 100,

        positionSaveTimer: null,

        lastPosition: 0,

        streamReady: false,

        // Переменные для интеграции с TorServe
        torServeUrl: "http://127.0.0.1:8090",

        currentHash: "",

        currentFileIndex: 0,


        /*
         * Инициализация приложения
         */

        init: function () {

            console.log(
                "[App] TorrentPlayer " +
                APP_VERSION
            );


            this.loadSettings();

            this.bindUI();

            this.initPlayer();

            this.initRemote();

            this.showHome();


            console.log(
                "[App] initialized"
            );
        },


        /*
         * Загрузка настроек
         */

        loadSettings: function () {

            this.volume =
                TorrentStorage.getVolume();


            this.isMuted =
                TorrentStorage.getMuted();


            this.currentUrl =
                TorrentStorage.getLastUrl();


            console.log(
                "[App] settings loaded"
            );
        },


        /*
         * Инициализация AVPlay
         */

        initPlayer: function () {

            var self = this;


            // Используем глобальный экземпляр, созданный в avplay.js
            if (!window.TorrentAVPlay) {
                console.error("[App] TorrentAVPlay module not found!");
                return;
            }


            window.TorrentAVPlay.setEvents({

                /*
                 * Поток начал буферизацию
                 */

                onBufferingStart:
                    function () {

                        self.showLoading(
                            "Буферизация..."
                        );
                    },


                /*
                 * Процесс буферизации
                 */

                onBufferingProgress:
                    function (
                        percent
                    ) {

                        self.updateBuffer(
                            percent
                        );
                    },


                /*
                 * Буферизация закончена
                 */

                onBufferingComplete:
                    function () {

                        self.hideLoading();
                    },


                /*
                 * Поток готов
                 */

                onReady:
                    function (
                        duration
                    ) {

                        self.streamReady =
                            true;


                        self.hideLoading();


                        self.updateDuration(
                            duration
                        );


                        self.restorePosition();


                        self.play();


                        self.startPositionSaving();


                        // Автоматически загружаем озвучки, сабы и серии из TorServe при старте
                        self.loadMediaTracksAndPlaylist();
                    },


                /*
                 * Текущее время
                 */

                onTime:
                    function (
                        milliseconds
                    ) {

                        self.updateTime(
                            milliseconds
                        );
                    },


                /*
                 * Поток завершён
                 */

                onComplete:
                    function () {

                        self.streamReady =
                            false;


                        self.stopPositionSaving();


                        if (
                            self.currentUrl
                        ) {

                            TorrentStorage
                                .removePosition(
                                    self.currentUrl
                                );
                        }


                        self.showHome();
                    },


                /*
                 * Ошибка
                 */

                onError:
                    function (
                        error
                    ) {

                        self.streamReady =
                            false;


                        self.stopPositionSaving();


                        self.showError(
                            "Ошибка воспроизведения: " +
                            error
                        );
                    }

            });
        },


        /*
         * Инициализация Remote пульта
         */

        initRemote: function () {

            var self = this;


            if (window.TorrentRemote) {

                window.TorrentRemote.setHandler(function (keyCode) {

                    // Стандартный обработчик кнопок пульта для экрана плеера
                    if (self.currentScreen === "player") {

                        if (keyCode === window.TorrentRemote.KEY.BACK) {

                            self.stop();

                            self.showHome();

                        } else if (keyCode === window.TorrentRemote.KEY.PLAY_PAUSE) {

                            self.togglePlay();
                        }
                    }
                });
            }
        },


        /*
         * Извлечение параметров TorServe из ссылки потока
         */

        parseTorServeParams: function (url) {

            try {

                if (!url) { return; }

                // Вытаскиваем базовый URL TorServe (например, http://192.168.1.100:8090)
                var matchUrl = url.match(/^(https?:\/\/[^\/]+)/);

                if (matchUrl) { this.torServeUrl = matchUrl[1]; }


                // Вытаскиваем хэш раздачи (параметр link или play)
                var matchHash = url.match(/[?&](link|play)=([^&]+)/);

                if (matchHash) { this.currentHash = matchHash[2]; }


                // Вытаскиваем индекс файла (index)
                var matchIndex = url.match(/[?&]index=(\d+)/);

                if (matchIndex) {

                    this.currentFileIndex = parseInt(matchIndex[2], 10);

                } else {

                    this.currentFileIndex = 0;
                }

                console.log("[App] TorServe parsed:", this.torServeUrl, this.currentHash, this.currentFileIndex);

            } catch (e) {

                console.error("[App] URL parse error:", e);
            }
        },


        /*
         * Загрузка дорожек и плейлиста через менеджер треков
         */

        loadMediaTracksAndPlaylist: function () {

            var self = this;


            if (
                window.TorrentTracks && 
                self.currentHash
            ) {

                window.TorrentTracks.loadTorrentData(
                    self.torServeUrl,
                    self.currentHash,
                    self.currentFileIndex,
                    function () {

                        console.log("[App] Tracks and playlist successfully loaded from TorServe");
                    }
                );
            }
        },


        /*
         * Метод переключения серии из боковой шторки плейлиста
         */

        playFile: function (fileIndex, fileUrl) {

            console.log("[App] Switching to episode index:", fileIndex);

            this.currentFileIndex = fileIndex;

            this.playUrl(fileUrl);
        },


        /*
         * Запуск воспроизведения ссылки
         */

        playUrl: function (url) {

            if (!url) { return; }


            this.currentUrl = url;

            TorrentStorage.setLastUrl(url);


            this.parseTorServeParams(url);


            this.showScreen("player");

            this.showLoading("Запуск потока...");


            if (window.TorrentAVPlay) {

                window.TorrentAVPlay.open(url);
            }
        },


        /*
         * Воспроизведение / Пауза
         */

        togglePlay: function () {

            if (!this.streamReady || !window.TorrentAVPlay) { return; }


            if (this.isPlaying) {

                window.TorrentAVPlay.pause();

                this.isPlaying = false;

            } else {

                window.TorrentAVPlay.play();

                this.isPlaying = true;
            }
        },


        play: function () {

            if (window.TorrentAVPlay) {

                window.TorrentAVPlay.play();

                this.isPlaying = true;
            }
        },


        stop: function () {

            this.streamReady = false;

            this.stopPositionSaving();


            if (window.TorrentAVPlay) {

                window.TorrentAVPlay.stop();
            }
        },


        /*
         * Относительная перемотка
         */

        seekRelative: function (ms) {

            if (!this.streamReady || !window.TorrentAVPlay) { return; }


            var target = window.TorrentAVPlay.currentTime + ms;

            if (target < 0) { target = 0; }

            if (target > window.TorrentAVPlay.duration) { target = window.TorrentAVPlay.duration; }


            window.TorrentAVPlay.seekTo(target);
        },


        /*
         * Mute звука
         */

        toggleMute: function () {

            // Логика управления звуком при необходимости
            this.isMuted = !this.isMuted;

            TorrentStorage.setMuted(this.isMuted);
        },


        /*
         * Запоминание и восстановление позиции
         */

        startPositionSaving: function () {

            var self = this;

