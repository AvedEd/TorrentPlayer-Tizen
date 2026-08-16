        initRemote: function () {
            var self = this;
            if (window.TorrentRemote) {
                window.TorrentRemote.setHandler(function (keyCode) {
                    if (self.currentScreen === "player") {
                        // Проверяем, закрыто ли нижнее меню настроек
                        var menu = document.getElementById("bottomSettingsMenu");
                        var isMenuHidden = !menu || menu.className.indexOf("hidden") !== -1;

                        if (isMenuHidden) {
                            // Кнопка ВПРАВО — мотаем вперед на 15 секунд
                            if (keyCode === window.TorrentRemote.KEY.RIGHT) {
                                self.seekRelative(15000);
                            }
                            // Кнопка ВЛЕВО — мотаем назад на 15 секунд
                            else if (keyCode === window.TorrentRemote.KEY.LEFT) {
                                self.seekRelative(-15000);
                            }
                        }

                        // Кнопка BACK — останавливаем видео и выходим на главный экран
                        if (keyCode === window.TorrentRemote.KEY.BACK) { 
                            self.stop(); 
                            self.showHome(); 
                        }
                        // Кнопка PLAY_PAUSE — ставим на паузу или запускаем
                        else if (keyCode === window.TorrentRemote.KEY.PLAY_PAUSE) { 
                            self.togglePlay(); 
                        }
                    }
                });
            }
        },
