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

        // Настройки логики автоматического переподключения
        reconnectAttempts: 0,

        maxReconnectAttempts: 5,

        reconnectTimer: null,

        isReconnecting: false,


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
                
