```javascript
(function () {
    "use strict";

    /*
     * TorrentPlayer Storage
     *
     * Хранит локальные настройки приложения:
     *
     * - последний URL
     * - позицию фильма
     * - громкость
     * - mute
     * - настройки TorServe
     *
     * Используем localStorage, который доступен
     * внутри Tizen Web Application.
     */


    var PREFIX = "torrentplayer.";


    function makeKey(key) {

        return PREFIX + key;
    }


    var Storage = {


        /*
         * Сохранить значение
         */

        set: function (
            key,
            value
        ) {

            try {

                localStorage.setItem(
                    makeKey(key),
                    JSON.stringify(value)
                );

                return true;

            } catch (error) {

                console.error(
                    "[Storage] save error:",
                    error
                );

                return false;
            }
        },


        /*
         * Получить значение
         */

        get: function (
            key,
            defaultValue
        ) {

            try {

                var value =
                    localStorage.getItem(
                        makeKey(key)
                    );


                if (
                    value === null ||
                    value === undefined
                ) {

                    return defaultValue;
                }


                return JSON.parse(value);

            } catch (error) {

                console.error(
                    "[Storage] read error:",
                    error
                );

                return defaultValue;
            }
        },


        /*
         * Удалить значение
         */

        remove: function (
            key
        ) {

            try {

                localStorage.removeItem(
                    makeKey(key)
                );

                return true;

            } catch (error) {

                console.error(
                    "[Storage] remove error:",
                    error
                );

                return false;
            }
        },


        /*
         * Очистить все данные TorrentPlayer
         */

        clear: function () {

            try {

                var keys = [];

                for (
                    var i = 0;
                    i < localStorage.length;
                    i++
                ) {

                    var key =
                        localStorage.key(i);


                    if (
                        key &&
                        key.indexOf(PREFIX) === 0
                    ) {

                        keys.push(key);
                    }
                }


                for (
                    var j = 0;
                    j < keys.length;
                    j++
                ) {

                    localStorage.removeItem(
                        keys[j]
                    );
                }


                return true;

            } catch (error) {

                console.error(
                    "[Storage] clear error:",
                    error
                );

                return false;
            }
        },


        /*
         * Последний URL
         */

        setLastUrl: function (
            url
        ) {

            return this.set(
                "lastUrl",
                url
            );
        },


        getLastUrl: function () {

            return this.get(
                "lastUrl",
                ""
            );
        },


        /*
         * Позиция просмотра
         *
         * Ключ строится на основе URL.
         */

        setPosition: function (
            url,
            position
        ) {

            if (!url) {

                return false;
            }


            return this.set(
                "position." + this.hash(url),
                {
                    url: url,
                    position: position,
                    updated: Date.now()
                }
            );
        },


        getPosition: function (
            url
        ) {

            if (!url) {

                return 0;
            }


            var data =
                this.get(
                    "position." + this.hash(url),
                    null
                );


            if (
                !data ||
                typeof data.position !== "number"
            ) {

                return 0;
            }


            return data.position;
        },


        /*
         * Удалить сохранённую позицию
         */

        removePosition: function (
            url
        ) {

            if (!url) {

                return false;
            }


            return this.remove(
                "position." + this.hash(url)
            );
        },


        /*
         * Громкость
         */

        setVolume: function (
            volume
        ) {

            return this.set(
                "volume",
                volume
            );
        },


        getVolume: function () {

            return this.get(
                "volume",
                100
            );
        },


        /*
         * Mute
         */

        setMuted: function (
            muted
        ) {

            return this.set(
                "muted",
                muted
            );
        },


        getMuted: function () {

            return this.get(
                "muted",
                false
            );
        },


        /*
         * TorServe
         */

        setTorServe: function (
            url
        ) {

            return this.set(
                "torserve",
                url
            );
        },


        getTorServe: function () {

            return this.get(
                "torserve",
                ""
            );
        },


        /*
         * Версия приложения
         */

        setLastUpdateCheck: function () {

            return this.set(
                "lastUpdateCheck",
                Date.now()
            );
        },


        getLastUpdateCheck: function () {

            return this.get(
                "lastUpdateCheck",
                0
            );
        },


        /*
         * Простой hash URL.
         *
         * Не нужен криптографический hash.
         * Он используется только как безопасный
         * идентификатор записи localStorage.
         */

        hash: function (
            text
        ) {

            var hash = 0;


            if (!text) {

                return "0";
            }


            for (
                var i = 0;
                i < text.length;
                i++
            ) {

                hash =
                    (
                        (
                            hash << 5
                        ) -
                        hash
                    ) +
                    text.charCodeAt(i);


                hash |= 0;
            }


            return String(
                Math.abs(hash)
            );
        }

    };


    /*
     * Экспорт
     */

    window.TorrentStorage =
        Storage;

})();
```
