```javascript
(function () {
    "use strict";

    /*
     * TorrentPlayer Remote Controller
     *
     * Управление Samsung TV Remote.
     *
     * Основная задача этого модуля —
     * превратить физический пульт телевизора
     * в полноценный контроллер приложения.
     */


    var Remote = {

        /*
         * Коды клавиш Samsung / Tizen
         */

        KEY: {

            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,

            ENTER: 13,

            BACK: 10009,

            RETURN: 10009,

            PLAY: 415,

            PAUSE: 19,

            PLAY_PAUSE: 10252,

            STOP: 413,

            REWIND: 412,

            FAST_FORWARD: 417,

            INFO: 457,

            EXIT: 10182,

            RED: 403,

            GREEN: 404,

            YELLOW: 405,

            BLUE: 406,

            CHANNEL_UP: 427,

            CHANNEL_DOWN: 428,

            VOLUME_UP: 447,

            VOLUME_DOWN: 448,

            MUTE: 449

        },


        /*
         * Текущий обработчик приложения
         */

        handler: null,


        /*
         * Установить обработчик
         */

        setHandler: function (
            callback
        ) {

            this.handler =
                callback;
        },


        /*
         * Запустить обработку пульта
         */

        init: function () {

            var self = this;


            document.addEventListener(
                "keydown",
                function (event) {

                    var keyCode =
                        event.keyCode;


                    /*
                     * Не позволяем браузеру
                     * обрабатывать стандартные
                     * действия клавиш.
                     */

                    if (
                        keyCode ===
                        self.KEY.BACK
                    ) {

                        event.preventDefault();
                    }


                    if (
                        self.handler
                    ) {

                        self.handler(
                            keyCode,
                            event
                        );
                    }

                },
                false
            );


            console.log(
                "[Remote] initialized"
            );
        },


        /*
         * Проверка навигационной клавиши
         */

        isNavigationKey: function (
            keyCode
        ) {

            return (
                keyCode === this.KEY.LEFT ||
                keyCode === this.KEY.RIGHT ||
                keyCode === this.KEY.UP ||
                keyCode === this.KEY.DOWN
            );
        },


        /*
         * Проверка BACK
         */

        isBack: function (
            keyCode
        ) {

            return (
                keyCode ===
                this.KEY.BACK
            );
        },


        /*
         * Проверка Play/Pause
         */

        isPlayPause: function (
            keyCode
        ) {

            return (
                keyCode ===
                this.KEY.PLAY_PAUSE
            );
        },


        /*
         * Проверка Play
         */

        isPlay: function (
            keyCode
        ) {

            return (
                keyCode ===
                this.KEY.PLAY
            );
        },


        /*
         * Проверка Pause
         */

        isPause: function (
            keyCode
        ) {

            return (
                keyCode ===
                this.KEY.PAUSE
            );
        },


        /*
         * Проверка Enter
         */

        isEnter: function (
            keyCode
        ) {

            return (
                keyCode ===
                this.KEY.ENTER
            );
        }

    };


    /*
     * Инициализируем обработчик
     */

    Remote.init();


    /*
     * Экспорт
     */

    window.TorrentRemote =
        Remote;

})();
```
