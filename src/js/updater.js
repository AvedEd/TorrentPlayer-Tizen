```javascript
(function () {
    "use strict";

    /*
     * TorrentPlayer Update Manager
     *
     * Обновление только вручную.
     *
     * Приложение НЕ проверяет обновления
     * автоматически при запуске.
     *
     * Пользователь сам нажимает:
     *
     * Настройки
     *     ↓
     * Проверить обновления
     *
     */


    var Updater = {

        /*
         * Версия приложения.
         */

        currentVersion: "0.1.0",


        /*
         * GitHub repository.
         *
         * ВАЖНО:
         * позже заменим YOUR_USERNAME
         * на настоящий GitHub username.
         */

        repository:
            "YOUR_USERNAME/TorrentPlayer-Tizen",


        /*
         * GitHub API.
         */

        apiUrl:
            "https://api.github.com/repos/" +
            "YOUR_USERNAME/TorrentPlayer-Tizen/releases/latest",


        /*
         * Последний найденный Release.
         */

        latestRelease: null,


        /*
         * Проверить обновление.
         *
         * force = true
         * означает, что проверку запустил
         * пользователь кнопкой.
         */

        check: function (
            force
        ) {

            var self = this;


            console.log(
                "[Updater] checking..."
            );


            /*
             * На первом этапе разрешаем
             * проверку только по кнопке.
             */

            if (!force) {

                console.log(
                    "[Updater] automatic " +
                    "check disabled"
                );

                return;
            }


            /*
             * Показываем пользователю
             * состояние проверки.
             */

            this.showStatus(
                "Проверяем обновления..."
            );


            /*
             * Используем XMLHttpRequest,
             * потому что это максимально
             * совместимый вариант для
             * Tizen Web Application.
             */

            var request =
                new XMLHttpRequest();


            request.open(
                "GET",
                this.apiUrl,
                true
            );


            request.setRequestHeader(
                "Accept",
                "application/vnd.github+json"
            );


            request.setRequestHeader(
                "X-GitHub-Api-Version",
                "2022-11-28"
            );


            request.onreadystatechange =
                function () {

                    if (
                        request.readyState !==
                        4
                    ) {

                        return;
                    }


                    /*
                     * HTTP 200
                     */

                    if (
                        request.status === 200
                    ) {

                        self.handleResponse(
                            request.responseText
                        );

                        return;
                    }


                    /*
                     * 404 означает, что
                     * Release пока отсутствует.
                     */

                    if (
                        request.status === 404
                    ) {

                        self.showStatus(
                            "Релизы пока отсутствуют."
                        );

                        return;
                    }


                    /*
                     * Ошибка сети / GitHub.
                     */

                    self.showStatus(
                        "Не удалось проверить " +
                        "обновления."
                    );

                    console.error(
                        "[Updater] HTTP error:",
                        request.status
                    );
                };


            request.onerror =
                function () {

                    self.showStatus(
                        "Ошибка подключения к GitHub."
                    );
                };


            request.ontimeout =
                function () {

                    self.showStatus(
                        "Истекло время ожидания."
                    );
                };


            request.timeout =
                15000;


            try {

                request.send();

            } catch (error) {

                console.error(
                    "[Updater] request error:",
                    error
                );


                self.showStatus(
                    "Ошибка проверки обновлений."
                );
            }
        },


        /*
         * Обработка ответа GitHub.
         */

        handleResponse: function (
            responseText
        ) {

            var data;


            try {

                data =
                    JSON.parse(
                        responseText
                    );

            } catch (error) {

                console.error(
                    "[Updater] JSON error:",
                    error
                );


                this.showStatus(
                    "Некорректный ответ сервера."
                );

                return;
            }


            if (!data) {

                this.showStatus(
                    "GitHub не вернул данные."
                );

                return;
            }


            this.latestRelease =
                data;


            /*
             * GitHub Release tag.
             *
             * Например:
             *
             * v0.2.0
             */

            var version =
                data.tag_name ||
                data.name ||
                "";


            version =
                this.normalizeVersion(
                    version
                );


            console.log(
                "[Updater] current:",
                this.currentVersion
            );


            console.log(
                "[Updater] latest:",
                version
            );


            if (!version) {

                this.showStatus(
                    "Не удалось определить версию."
                );

                return;
            }


            /*
             * Сравниваем версии.
             */

            var comparison =
                this.compareVersions(
                    version,
                    this.currentVersion
                );


            /*
             * Новая версия.
             */

            if (
                comparison > 0
            ) {

                this.showUpdateAvailable(
                    data,
                    version
                );

                return;
            }


            /*
             * Уже последняя версия.
             */

            this.showStatus(
                "У вас установлена " +
                "последняя версия " +
                "v" +
                this.currentVersion
            );
        },


        /*
         * Убрать v из версии.
         */

        normalizeVersion: function (
            version
        ) {

            return String(
                version || ""
            )
            .trim()
            .replace(
                /^v/i,
                ""
            );
        },


        /*
         * Сравнение:
         *
         * 0.2.0 > 0.1.0
         */

        compareVersions: function (
            first,
            second
        ) {

            var a =
                this.normalizeVersion(
                    first
                )
                .split(".");


            var b =
                this.normalizeVersion(
                    second
                )
                .split(".");


            var length =
                Math.max(
                    a.length,
                    b.length
                );


            for (
                var i = 0;
                i < length;
                i++
            ) {

                var numberA =
                    parseInt(
                        a[i] || "0",
                        10
                    );


                var numberB =
                    parseInt(
                        b[i] || "0",
                        10
                    );


                if (
                    numberA >
                    numberB
                ) {

                    return 1;
                }


                if (
                    numberA <
                    numberB
                ) {

                    return -1;
                }
            }


            return 0;
        },


        /*
         * Показать новую версию.
         */

        showUpdateAvailable: function (
            release,
            version
        ) {

            var message =
                "Доступна новая версия v" +
                version;


            if (
                release &&
                release.body
            ) {

                message +=
                    "\n\n" +
                    this.cleanReleaseNotes(
                        release.body
                    );
            }


            /*
             * На первом этапе используем
             * обычное подтверждение.
             *
             * Позже заменим его на
             * красивое TV-диалоговое окно.
             */

            var shouldUpdate =
                window.confirm(
                    message +
                    "\n\nОткрыть страницу " +
                    "обновления?"
                );


            if (
                shouldUpdate
            ) {

                this.openReleasePage(
                    release
                );

            } else {

                this.showStatus(
                    "Обновление отложено."
                );
            }
        },


        /*
         * Очистка Markdown из Release Notes.
         */

        cleanReleaseNotes: function (
            text
        ) {

            return String(
                text || ""
            )
            .replace(
                /[#*_`]/g,
                ""
            )
            .substring(
                0,
                500
            );
        },


        /*
         * Открыть страницу Release.
         */

        openReleasePage: function (
            release
        ) {

            var url =
                release &&
                release.html_url;


            if (!url) {

                this.showStatus(
                    "Ссылка на обновление " +
                    "отсутствует."
                );

                return;
            }


            console.log(
                "[Updater] release:",
                url
            );


            /*
             * Пока только сохраняем URL.
             *
             * Механизм установки .wgt
             * подключим отдельно после
             * проверки возможностей
             * конкретного Tizen TV.
             */

            TorrentStorage.set(
                "pendingUpdateUrl",
                url
            );


            this.showStatus(
                "Новая версия доступна " +
                "на GitHub."
            );


            /*
             * В будущем здесь будет
             * запуск штатного механизма
             * обновления Tizen.
             */
        },


        /*
         * Сообщение в интерфейсе.
         */

        showStatus: function (
            message
        ) {

            console.log(
                "[Updater]",
                message
            );


            /*
             * Пока выводим через alert,
             * чтобы механизм можно было
             * протестировать до создания
             * полноценного окна обновлений.
             */

            try {

                window.alert(
                    message
                );

            } catch (error) {}
        }

    };


    /*
     * Экспорт.
     */

    window.TorrentUpdater =
        Updater;

})();
```
