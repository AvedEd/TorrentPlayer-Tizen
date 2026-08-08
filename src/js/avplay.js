```javascript
(function () {
    "use strict";

    /*
     * TorrentPlayer AVPlay wrapper
     *
     * Samsung Tizen TV 2024+
     * Основной движок воспроизведения.
     */

    function AVPlayer() {

        this.avplay = null;

        this.url = null;

        this.duration = 0;

        this.currentTime = 0;

        this.volume = 100;

        this.events = {};
    }


    /*
     * Инициализация
     */

    AVPlayer.prototype.init = function () {

        try {

            this.avplay = webapis.avplay;

            console.log(
                "[AVPlay] initialized"
            );

            return true;

        } catch (error) {

            console.error(
                "[AVPlay] initialization error",
                error
            );

            return false;
        }
    };


    /*
     * Подписка на события
     */

    AVPlayer.prototype.setEvents = function (events) {

        this.events = events || {};
    };


    /*
     * Открытие потока
     */

    AVPlayer.prototype.open = function (
        url,
        callback
    ) {

        var self = this;

        self.url = url;


        if (!self.avplay) {

            if (!self.init()) {

                callback &&
                callback(
                    new Error(
                        "AVPlay недоступен"
                    )
                );

                return;
            }
        }


        try {

            /*
             * Останавливаем предыдущий поток
             */

            try {

                self.avplay.stop();

            } catch (e) {}


            /*
             * Закрываем предыдущий URL
             */

            try {

                self.avplay.close();

            } catch (e) {}


            /*
             * Открываем новый поток
             */

            self.avplay.open(url);


            /*
             * Listener Samsung AVPlay
             */

            self.avplay.setListener({

                onbufferingstart: function () {

                    console.log(
                        "[AVPlay] buffering start"
                    );

                    if (
                        self.events.onBufferingStart
                    ) {

                        self.events.onBufferingStart();
                    }
                },


                onbufferingprogress: function (
                    percent
                ) {

                    if (
                        self.events.onBufferingProgress
                    ) {

                        self.events.onBufferingProgress(
                            percent
                        );
                    }
                },


                onbufferingcomplete: function () {

                    console.log(
                        "[AVPlay] buffering complete"
                    );

                    if (
                        self.events.onBufferingComplete
                    ) {

                        self.events.onBufferingComplete();
                    }
                },


                oncurrentplaytime: function (
                    milliseconds
                ) {

                    self.currentTime =
                        milliseconds;

                    if (
                        self.events.onTime
                    ) {

                        self.events.onTime(
                            milliseconds
                        );
                    }
                },


                onstreamcompleted: function () {

                    console.log(
                        "[AVPlay] stream completed"
                    );

                    if (
                        self.events.onComplete
                    ) {

                        self.events.onComplete();
                    }
                },


                onerror: function (
                    error
                ) {

                    console.error(
                        "[AVPlay] error",
                        error
                    );

                    if (
                        self.events.onError
                    ) {

                        self.events.onError(
                            error
                        );
                    }
                },


                ondrminfo: function (
                    drmInfo
                ) {

                    if (
                        self.events.onDRMInfo
                    ) {

                        self.events.onDRMInfo(
                            drmInfo
                        );
                    }
                },


                onsubtitlechange: function (
                    duration,
                    text,
                    data3,
                    data4
                ) {

                    if (
                        self.events.onSubtitle
                    ) {

                        self.events.onSubtitle(
                            duration,
                            text,
                            data3,
                            data4
                        );
                    }
                }

            });


            /*
             * Полноэкранный вывод.
             *
             * 1920x1080 используется как
             * логическая область TV.
             */

            self.avplay.setDisplayRect(
                0,
                0,
                1920,
                1080
            );


            /*
             * Подготавливаем поток.
             */

            self.avplay.prepareAsync(

                function () {

                    try {

                        self.duration =
                            self.avplay
                                .getDuration();

                    } catch (e) {

                        self.duration = 0;
                    }


                    console.log(
                        "[AVPlay] prepared:",
                        self.duration
                    );


                    if (
                        self.events.onReady
                    ) {

                        self.events.onReady(
                            self.duration
                        );
                    }


                    if (callback) {

                        callback(null);
                    }

                },


                function (error) {

                    console.error(
                        "[AVPlay] prepare error",
                        error
                    );


                    if (callback) {

                        callback(error);
                    }

                }
            );


        } catch (error) {

            console.error(
                "[AVPlay] open error",
                error
            );


            if (callback) {

                callback(error);
            }
        }
    };


    /*
     * Воспроизведение
     */

    AVPlayer.prototype.play = function () {

        try {

            this.avplay.play();

            return true;

        } catch (error) {

            console.error(
                "[AVPlay] play error",
                error
            );

            return false;
        }
    };


    /*
     * Пауза
     */

    AVPlayer.prototype.pause = function () {

        try {

            this.avplay.pause();

            return true;

        } catch (error) {

            console.error(
                "[AVPlay] pause error",
                error
            );

            return false;
        }
    };


    /*
     * Остановка
     */

    AVPlayer.prototype.stop = function () {

        try {

            this.avplay.stop();

        } catch (e) {}


        try {

            this.avplay.close();

        } catch (e) {}


        this.currentTime = 0;
    };


    /*
     * Перемотка
     */

    AVPlayer.prototype.seekTo = function (
        milliseconds
    ) {

        try {

            this.avplay.seekTo(
                milliseconds
            );

            return true;

        } catch (error) {

            console.error(
                "[AVPlay] seek error",
                error
            );

            return false;
        }
    };


    /*
     * Текущее время
     */

    AVPlayer.prototype.getCurrentTime =
        function () {

            try {

                return this.avplay
                    .getCurrentTime();

            } catch (error) {

                return this.currentTime || 0;
            }
        };


    /*
     * Длительность
     */

    AVPlayer.prototype.getDuration =
        function () {

            try {

                return this.avplay
                    .getDuration();

            } catch (error) {

                return this.duration || 0;
            }
        };


    /*
     * Громкость
     */

    AVPlayer.prototype.setVolume =
        function (volume) {

            volume = Math.max(
                0,
                Math.min(
                    100,
                    volume
                )
            );

            try {

                this.avplay.setVolume(
                    volume
                );

                this.volume = volume;

                return true;

            } catch (error) {

                console.error(
                    "[AVPlay] volume error",
                    error
                );

                return false;
            }
        };


    /*
     * Получить громкость
     */

    AVPlayer.prototype.getVolume =
        function () {

            try {

                return this.avplay
                    .getVolume();

            } catch (error) {

                return this.volume;
            }
        };


    /*
     * Уничтожение
     */

    AVPlayer.prototype.destroy =
        function () {

            this.stop();

            this.events = {};

            this.url = null;
        };


    /*
     * Экспорт
     */

    window.TorrentAVPlayer =
        AVPlayer;

})();
```
