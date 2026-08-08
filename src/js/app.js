```javascript
(function () {
    "use strict";

    /*
     * TorrentPlayer Application
     *
     * Главный контроллер приложения.
     *
     * Соединяет:
     *
     * UI
     * Remote
     * AVPlay
     * Storage
     * Tracks
     *
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


            window.TorrentPlayer =
                new TorrentAVPlayer();


            TorrentPlayer.init();


            TorrentPlayer.setEvents({

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


            TorrentPlayer.setVolume(
                this.volume
            );
        },


        /*
         * Привязка UI
         */

        bindUI: function () {

            var self = this;


            var playButton =
                document.getElementById(
                    "playButton"
                );


            if (playButton) {

                playButton.addEventListener(
                    "click",
                    function () {

                        var input =
                            document.getElementById(
                                "streamUrl"
                            );


                        if (!input) {
                            return;
                        }


                        self.playUrl(
                            input.value
                        );
                    }
                );
            }


            var playPauseButton =
                document.getElementById(
                    "playPauseButton"
                );


            if (playPauseButton) {

                playPauseButton.addEventListener(
                    "click",
                    function () {

                        self.togglePlay();
                    }
                );
            }


            var rewindButton =
                document.getElementById(
                    "rewindButton"
                );


            if (rewindButton) {

                rewindButton.addEventListener(
                    "click",
                    function () {

                        self.seekRelative(
                            -10000
                        );
                    }
                );
            }


            var forwardButton =
                document.getElementById(
                    "forwardButton"
                );


            if (forwardButton) {

                forwardButton.addEventListener(
                    "click",
                    function () {

                        self.seekRelative(
                            10000
                        );
                    }
                );
            }


            var muteButton =
                document.getElementById(
                    "muteButton"
                );


            if (muteButton) {

                muteButton.addEventListener(
                    "click",
                    function () {

                        self.toggleMute();
                    }
                );
            }


            var retryButton =
                document.getElementById(
                    "retryButton"
                );


            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    function () {

                        self.hideError();


                        if (
                            self.currentUrl
                        ) {

                            self.playUrl(
                                self.currentUrl
                            );
                        }
                    }
                );
            }


            var backButton =
                document.getElementById(
                    "backButton"
                );


            if (backButton) {

                backButton.addEventListener(
                    "click",
                    function () {

                        self.hideError();

                        self.showHome();
                    }
                );
            }


            var updateButton =
                document.getElementById(
                    "updateButton"
                );


            if (updateButton) {

                updateButton.addEventListener(
                    "click",
                    function () {

                        if (
                            window.TorrentUpdater
                        ) {

                            TorrentUpdater.check(
                                true
                            );
                        }
                    }
                );
            }


            /*
             * URL из последнего запуска
             */

            var input =
                document.getElementById(
                    "streamUrl"
                );


            if (
                input &&
                this.currentUrl
            ) {

                input.value =
                    this.currentUrl;
            }
        },


        /*
         * Управление пультом
         */

        initRemote: function () {

            var self = this;


            TorrentRemote.setHandler(
                function (
                    keyCode
                ) {

                    self.handleRemote(
                        keyCode
                    );
                }
            );
        },


        /*
         * Обработка клавиш
         */

        handleRemote: function (
            keyCode
        ) {

            /*
             * BACK
             */

            if (
                TorrentRemote.isBack(
                    keyCode
                )
            ) {

                this.handleBack();

                return;
            }


            /*
             * PLAY/PAUSE
             */

            if (
                TorrentRemote.isPlayPause(
                    keyCode
                )
            ) {

                if (
                    this.currentScreen ===
                    "player"
                ) {

                    this.togglePlay();
                }

                return;
            }


            /*
             * PLAY
             */

            if (
                TorrentRemote.isPlay(
                    keyCode
                )
            ) {

                if (
                    this.currentScreen ===
                    "player"
                ) {

                    this.play();
                }

                return;
            }


            /*
             * PAUSE
             */

            if (
                TorrentRemote.isPause(
                    keyCode
                )
            ) {

                if (
                    this.currentScreen ===
                    "player"
                ) {

                    this.pause();
                }

                return;
            }


            /*
             * ENTER
             */

            if (
                TorrentRemote.isEnter(
                    keyCode
                )
            ) {

                this.handleEnter();

                return;
            }


            /*
             * LEFT
             */

            if (
                keyCode ===
                TorrentRemote.KEY.LEFT
            ) {

                if (
                    this.currentScreen ===
                    "player"
                ) {

                    this.seekRelative(
                        -10000
                    );
                }

                return;
            }


            /*
             * RIGHT
             */

            if (
                keyCode ===
                TorrentRemote.KEY.RIGHT
            ) {

                if (
                    this.currentScreen ===
                    "player"
                ) {

                    this.seekRelative(
                        10000
                    );
                }

                return;
            }


            /*
             * VOLUME UP
             */

            if (
                keyCode ===
                TorrentRemote.KEY.VOLUME_UP
            ) {

                this.changeVolume(
                    5
                );

                return;
            }


            /*
             * VOLUME DOWN
             */

            if (
                keyCode ===
                TorrentRemote.KEY.VOLUME_DOWN
            ) {

                this.changeVolume(
                    -5
                );

                return;
            }


            /*
             * MUTE
             */

            if (
                keyCode ===
                TorrentRemote.KEY.MUTE
            ) {

                this.toggleMute();

                return;
            }
        },


        /*
         * ENTER
         */

        handleEnter: function () {

            if (
                this.currentScreen ===
                "home"
            ) {

                var input =
                    document.getElementById(
                        "streamUrl"
                    );


                if (
                    input &&
                    input.value
                ) {

                    this.playUrl(
                        input.value
                    );
                }
            }
        },


        /*
         * BACK
         */

        handleBack: function () {

            if (
                this.currentScreen ===
                "player"
            ) {

                this.pause();

                this.savePosition();

                this.stopPositionSaving();

                TorrentPlayer.stop();

                this.showHome();

                return;
            }


            if (
                this.currentScreen ===
                "settings"
            ) {

                this.showHome();

                return;
            }
        },


        /*
         * Запуск URL
         */

        playUrl: function (
            url
        ) {

            var self = this;


            url =
                String(url || "")
                    .trim();


            if (!url) {

                this.showError(
                    "Введите URL потока."
                );

                return;
            }


            this.currentUrl =
                url;


            TorrentStorage.setLastUrl(
                url
            );


            this.streamReady =
                false;


            this.showPlayer();


            this.showLoading(
                "Подключение..."
            );


            TorrentTracks.reset();


            TorrentPlayer.open(
                url,
                function (
                    error
                ) {

                    if (error) {

                        self.showError(
                            "Не удалось открыть поток."
                        );

                        return;
                    }

                }
            );
        },


        /*
         * Play
         */

        play: function () {

            if (
                !this.streamReady
            ) {

                return;
            }


            if (
                TorrentPlayer.play()
            ) {

                this.isPlaying =
                    true;


                this.updatePlayButton();
            }
        },


        /*
         * Pause
         */

        pause: function () {

            if (
                !this.streamReady
            ) {

                return;
            }


            if (
                TorrentPlayer.pause()
            ) {

                this.isPlaying =
                    false;


                this.updatePlayButton();
            }


            this.savePosition();
        },


        /*
         * Play/Pause
         */

        togglePlay: function () {

            if (
                this.isPlaying
            ) {

                this.pause();

            } else {

                this.play();
            }
        },


        /*
         * Перемотка
         */

        seekRelative: function (
            milliseconds
        ) {

            if (
                !this.streamReady
            ) {

                return;
            }


            var current =
                TorrentPlayer
                    .getCurrentTime();


            var duration =
                TorrentPlayer
                    .getDuration();


            var target =
                current +
                milliseconds;


            target =
                Math.max(
                    0,
                    Math.min(
                        duration,
                        target
                    )
                );


            TorrentPlayer.seekTo(
                target
            );


            this.updateTime(
                target
            );


            this.savePosition();
        },


        /*
         * Восстановить позицию
         */

        restorePosition: function () {

            if (
                !this.currentUrl
            ) {

                return;
            }


            var position =
                TorrentStorage
                    .getPosition(
                        this.currentUrl
                    );


            var duration =
                TorrentPlayer
                    .getDuration();


            /*
             * Не восстанавливаем последние
             * несколько секунд фильма.
             */

            if (
                position > 10000 &&
                position <
                duration - 10000
            ) {

                this.lastPosition =
                    position;


                TorrentPlayer.seekTo(
                    position
                );
            }
        },


        /*
         * Сохранить позицию
         */

        savePosition: function () {

            if (
                !this.currentUrl ||
                !this.streamReady
            ) {

                return;
            }


            var position =
                TorrentPlayer
                    .getCurrentTime();


            if (
                position > 0
            ) {

                TorrentStorage
                    .setPosition(
                        this.currentUrl,
                        position
                    );
            }
        },


        /*
         * Автоматически сохраняем позицию
         */

        startPositionSaving: function () {

            var self = this;


            this.stopPositionSaving();


            this.positionSaveTimer =
                setInterval(
                    function () {

                        self.savePosition();

                    },
                    10000
                );
        },


        stopPositionSaving: function () {

            if (
                this.positionSaveTimer
            ) {

                clearInterval(
                    this.positionSaveTimer
                );


                this.positionSaveTimer =
                    null;
            }
        },


        /*
         * Громкость
         */

        changeVolume: function (
            amount
        ) {

            var newVolume =
                this.volume +
                amount;


            newVolume =
                Math.max(
                    0,
                    Math.min(
                        100,
                        newVolume
                    )
                );


            this.volume =
                newVolume;


            this.isMuted =
                false;


            TorrentPlayer.setVolume(
                newVolume
            );


            TorrentStorage.setVolume(
                newVolume
            );


            TorrentStorage.setMuted(
                false
            );


            this.updateVolumeButton();
        },


        /*
         * Mute
         */

        toggleMute: function () {

            this.isMuted =
                !this.isMuted;


            if (
                this.isMuted
            ) {

                TorrentPlayer.setVolume(
                    0
                );

            } else {

                TorrentPlayer.setVolume(
                    this.volume
                );
            }


            TorrentStorage.setMuted(
                this.isMuted
            );


            this.updateVolumeButton();
        },


        /*
         * Обновить кнопку Play/Pause
         */

        updatePlayButton: function () {

            var button =
                document.getElementById(
                    "playPauseButton"
                );


            if (!button) {
                return;
            }


            button.textContent =
                this.isPlaying
                    ? "❚❚"
                    : "▶";
        },


        /*
         * Обновить кнопку громкости
         */

        updateVolumeButton: function () {

            var button =
                document.getElementById(
                    "muteButton"
                );


            if (!button) {
                return;
            }


            button.textContent =
                this.isMuted
                    ? "🔇"
                    : "🔊";
        },


        /*
         * Обновить время
         */

        updateTime: function (
            milliseconds
        ) {

            var duration =
                TorrentPlayer
                    .getDuration();


            var current =
                milliseconds || 0;


            var progress =
                0;


            if (
                duration > 0
            ) {

                progress =
                    (
                        current /
                        duration
                    ) * 100;
            }


            var progressElement =
                document.getElementById(
                    "progress"
                );


            if (
                progressElement
            ) {

                progressElement.style.width =
                    progress + "%";
            }


            var currentElement =
                document.getElementById(
                    "currentTime"
                );


            if (
                currentElement
            ) {

                currentElement.textContent =
                    this.formatTime(
                        current
                    );
            }
        },


        /*
         * Обновить длительность
         */

        updateDuration: function (
            duration
        ) {

            var element =
                document.getElementById(
                    "duration"
                );


            if (
                element
            ) {

                element.textContent =
                    this.formatTime(
                        duration
                    );
            }
        },


        /*
         * Буфер
         */

        updateBuffer: function (
            percent
        ) {

            var element =
                document.getElementById(
                    "bufferStatus"
                );


            if (
                element
            ) {

                element.textContent =
                    "Буфер: " +
                    Math.round(
                        percent
                    ) +
                    "%";
            }
        },


        /*
         * Форматирование времени
         */

        formatTime: function (
            milliseconds
        ) {

            var totalSeconds =
                Math.floor(
                    milliseconds / 1000
                );


            var hours =
                Math.floor(
                    totalSeconds / 3600
                );


            var minutes =
                Math.floor(
                    (
                        totalSeconds % 3600
                    ) / 60
                );


            var seconds =
                totalSeconds % 60;


            if (
                hours > 0
            ) {

                return (
                    this.pad(hours) +
                    ":" +
                    this.pad(minutes) +
                    ":" +
                    this.pad(seconds)
                );
            }


            return (
                this.pad(minutes) +
                ":" +
                this.pad(seconds)
            );
        },


        pad: function (
            number
        ) {

            return number < 10
                ? "0" + number
                : String(number);
        },


        /*
         * Показать Home
         */

        showHome: function () {

            this.currentScreen =
                "home";


            this.hideElement(
                "playerScreen"
            );


            this.hideElement(
                "settingsScreen"
            );


            this.showElement(
                "homeScreen"
            );


            this.hideLoading();

            this.hideElement(
                "playerHud"
            );
        },


        /*
         * Показать Player
         */

        showPlayer: function () {

            this.currentScreen =
                "player";


            this.hideElement(
                "homeScreen"
            );


            this.hideElement(
                "settingsScreen"
            );


            this.showElement(
                "playerScreen"
            );


            this.showElement(
                "playerHud"
            );
        },


        /*
         * Loading
         */

        showLoading: function (
            text
        ) {

            var loading =
                document.getElementById(
                    "loading"
                );


            var label =
                document.getElementById(
                    "loadingText"
                );


            if (
                label &&
                text
            ) {

                label.textContent =
                    text;
            }


            if (loading) {

                loading.classList.remove(
                    "hidden"
                );
            }
        },


        hideLoading: function () {

            this.hideElement(
                "loading"
            );
        },


        /*
         * Error dialog
         */

        showError: function (
            message
        ) {

            var dialog =
                document.getElementById(
                    "errorDialog"
                );


            var text =
                document.getElementById(
                    "errorMessage"
                );


            if (
                text
            ) {

                text.textContent =
                    message ||
                    "Неизвестная ошибка.";
            }


            if (
                dialog
            ) {

                dialog.classList.remove(
                    "hidden"
                );
            }
        },


        hideError: function () {

            this.hideElement(
                "errorDialog"
            );
        },


        /*
         * Универсальное show
         */

        showElement: function (
            id
        ) {

            var element =
                document.getElementById(
                    id
                );


            if (
                element
            ) {

                element.classList.remove(
                    "hidden"
                );
            }
        },


        /*
         * Универсальное hide
         */

        hideElement: function (
            id
        ) {

            var element =
                document.getElementById(
                    id
                );


            if (
                element
            ) {

                element.classList.add(
                    "hidden"
                );
            }
        }

    };


    /*
     * Запускаем приложение после загрузки DOM
     */

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            App.init();

        },
        false
    );


    /*
     * Экспорт для отладки
     */

    window.TorrentApp =
        App;

})();
```
