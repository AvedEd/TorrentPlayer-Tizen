(function () {
    "use strict";

    /*
     * TorrentPlayer Remote Controller
     *
     * Управление Samsung TV Remote.
     *
     * Основная задача этого модуля —
     * превратить физический пульт телевизора
     * в полноценный контроллер приложения с поддержкой
     * горизонтального и вертикального мега-меню.
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
                     * Если открыто нижнее мега-меню или шторка серий,
                     * пульт перехватывает управление на себя.
                     */

                    if (
                        self.handleMegaMenuNavigation(
                            keyCode,
                            event
                        )
                    ) {
                        return;
                    }


                    /*
                     * При нажатии кнопки ВНИЗ во время воспроизведения
                     * открывается наше мега-меню настроек.
                     */

                    if (
                        keyCode ===
                        self.KEY.DOWN
                    ) {

                        // Проверяем, что мы на экране плеера и HUD не скрыт
                        var playerScreen = document.getElementById("playerScreen");

                        if (
                            playerScreen && 
                            menu.className.indexOf("hidden") !== -1
                        ) {

                            self.openMegaMenu();

                            event.preventDefault();

                            return;
                        }
                    }


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
         * Открытие мега-меню
         */

        openMegaMenu: function () {

            var menu =
                document.getElementById(
                    "bottomSettingsMenu"
                );


            if (!menu) {
                return;
            }


            menu.className =
                "bottom-menu-panel";


            if (
                window.TorrentTracks &&
                typeof window.TorrentTracks.renderMegaMenu === "function"
            ) {

                window.TorrentTracks.renderMegaMenu();
            }


            // Фокусируемся на первой аудиодорожке (первая плитка первого ряда)
            var firstAudio =
                document.querySelector(
                    "#menuAudioTracks .track-item"
                );


            if (firstAudio) {

                firstAudio.focus();
            }
        },


        /*
         * Логика навигации внутри сложного мега-меню
         */

        handleMegaMenuNavigation: function (
            keyCode,
            event
        ) {

            var menu =
                document.getElementById(
                    "bottomSettingsMenu"
                );


            var sidebar =
                document.getElementById(
                    "playlistSidebar"
                );


            if (
                !menu ||
                menu.className.indexOf("hidden") !== -1
            ) {
                return false;
            }


            var activeEl =
                document.activeElement;


            /*
             * Кнопка BACK закрывает меню послойно
             */

            if (
                keyCode === this.KEY.BACK
            ) {

                // Если открыта шторка серий — закрываем только её
                if (
                    sidebar && 
                    sidebar.className.indexOf("hidden") === -1
                ) {

                    sidebar.className = "playlist-sidebar hidden";

                    // Возвращаем фокус на кнопку плейлиста в меню
                    var playlistBtn = document.getElementById("openPlaylistBtn");

                    if (playlistBtn) { playlistBtn.focus(); }

                } else {

                    // Если шторка закрыта — закрываем всё нижнее меню
                    menu.className = "bottom-menu-panel hidden";
                }


                event.preventDefault();

                return true;
            }


            /*
             * ЕСЛИ ОТКРЫТА ШТОРКА СЕРИЙ (Вертикальный список)
             */

            if (
                sidebar &&
                sidebar.className.indexOf("hidden") === -1
            ) {

                if (
                    keyCode === this.KEY.UP ||
                    keyCode === this.KEY.DOWN
                ) {

                    var nextNode =
                        keyCode === this.KEY.DOWN
                            ? activeEl.nextElementSibling
                            : activeEl.previousElementSibling;


                    if (
                        nextNode &&
                        nextNode.className.indexOf("track-item") !== -1
                    ) {

                        nextNode.focus();
                    }


                    event.preventDefault();

                    return true;
                }


                if (
                    keyCode === this.KEY.ENTER
                ) {

                    if (activeEl) { activeEl.click(); }

                    event.preventDefault();

                    return true;
                }


                return true; // Блокируем остальные кнопки для плеера, пока шторка открыта
            }


            /*
             * НАВИГАЦИЯ ВНУТРИ НИЖНЕЙ ПАНЕЛИ (Горизонтальные ряды)
             */

            // Перемещение ВЛЕВО / ВПРАВО по плиткам в текущем ряду
            if (
                keyCode === this.KEY.LEFT ||
                keyCode === this.KEY.RIGHT
            ) {

                if (
                    activeEl &&
                    activeEl.className.indexOf("track-item") !== -1
                ) {

                    var siblingNode =
                        keyCode === this.KEY.RIGHT
                            ? activeEl.nextElementSibling
                            : activeEl.previousElementSibling;


                    if (siblingNode) {

                        siblingNode.focus();

                        // Плавный автоматический скролл горизонтального ряда под фокус пульта
                        siblingNode.parentNode.scrollLeft = siblingNode.offsetLeft - 50;
                    }
                }


                event.preventDefault();

                return true;
            }


            // Перемещение ВВЕРХ / ВНИЗ между рядами настроек
            if (
                keyCode === this.KEY.UP ||
                keyCode === this.KEY.DOWN
            ) {

                if (activeEl) {

                    var currentSection = activeEl.parentNode.parentNode; 

                    var targetSection =
                        keyCode === this.KEY.DOWN
                            ? currentSection.nextElementSibling
                            : currentSection.previousElementSibling;


                    // Если перескакиваем через декоративные элементы (например, прогресс-бар)
                    if (
                        targetSection && 
                        !targetSection.querySelector(".track-item")
                    ) {
                        targetSection =
                            keyCode === this.KEY.DOWN
                                ? targetSection.nextElementSibling
                                : targetSection.previousElementSibling;
                    }


                    if (targetSection) {

                        var targetBtn = targetSection.querySelector(".track-item");

                        if (targetBtn) { targetBtn.focus(); }
                    }
                }


                event.preventDefault();

                return true;
            }


            /*
             * Нажатие ENTER на элементах меню
             */

            if (
                keyCode === this.KEY.ENTER
            ) {

                if (activeEl) {

