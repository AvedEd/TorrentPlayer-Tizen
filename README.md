# TorrentPlayer & Lampa Integration Guide

[Русский перевод смотрите ниже](#russian-version)

---

## English Version

**TorrentPlayer** is a native, lightweight, and crash-resilient video player designed specifically for **Samsung Smart TV (Tizen OS)**. It is built for smooth, on-the-fly torrent streaming via a **TorServe** server.

### 🚀 Key Features
1. **Instant Streaming:** Watch heavy torrents instantly without pre-downloading files to the TV memory.
2. **Smart Auto Reconnect:** If Wi-Fi or server connection drops, the player makes up to 5 automated reconnection attempts, resuming playback from the exact millisecond.
3. **Advanced Cache Controls:** Choose your pre-buffering size (Auto, 100 MB, 200 MB, 500 MB) in the bottom menu with a single click.
4. **Status Monitoring (UP Button):** Displays a real-time download speed and buffer occupancy widget in the top-right corner. Closes with the `BACK` button.
5. **Bottom Mega-Menu (DOWN Button):** A convenient horizontal panel to switch audio tracks, subtitles, and cache sizes during playback.
6. **Right Series Sidebar:** A side panel with an episode list for multi-file torrents, supporting automatic transition to the next episode.
7. **Position Memory:** Automatically remembers the exact second where you left off.

### 🔊 Fix for DTS Audio on Samsung TVs
Since 2018, Samsung TVs **do not support DTS audio tracks** at the hardware level. Running a movie with such audio directly results in video without sound.
Our player handles this via Tizen audio mixer safety fallbacks, but for a 100% success rate, you must enable audio transcoding on your TorServe server:
1. Open your TorServe server settings in a browser via `http://YOUR_SERVER_IP:8090`.
2. Find the **Player/Torrent settings** section.
3. Enable **Audio Transcoding** and set the target format to **AAC** or **AC3 (Dolby Digital)**.
4. *Result:* The server transcodes unsupported DTS audio into Samsung-friendly format on the fly, and the player plays it perfectly.

### 🛠️ Building the .wgt File on a PC
The project compiles into a standalone widget installed directly into the TV memory:
1. Go to your GitHub repository on a PC, click the green **Code** -> **Download ZIP** button.
2. Extract the downloaded archive.
3. Open the extracted folder. **Crucial:** the root folder must immediately contain `index.html`, `config.xml`, and the `js`, `css`, `assets` folders.
4. Select **all internal files and folders together** (do not select the parent folder itself).
5. Right-click -> **Send to** -> **Compressed (zipped) folder** (or use WinRAR / 7-Zip).
6. Rename the resulting `Archive.zip` file: replace the `.zip` extension with **`.wgt`** (e.g., `TorrentPlayer.wgt`). Confirm the extension change.

### 📺 Installation Guide for Samsung Smart TV
#### Method 1: USB Flash Drive (For older TV models)
1. Format a USB drive to FAT32.
2. Create a folder in the root directory named exactly `userwidget`.
3. Copy your `TorrentPlayer.wgt` file into the `userwidget` folder.
4. Plug the USB drive into your turned-on TV. Installation will start automatically.
#### Method 2: Via PC and Developer Mode (For all modern Tizen models)
1. Open the TV apps menu (`Apps`).
2. Press `1, 2, 3, 4, 5` sequentially on a standard remote. The hidden **Developer Mode** window will open.
3. Switch the toggle to **ON**, enter your PC IP address, and reboot the TV (hold the power button on the remote until the screen restarts).
4. Run an installer program (Tizen Studio or a simple third-party Tizen App Installer) on your PC.
5. Connect to the TV via IP address and deploy the `TorrentPlayer.wgt` file.

### 🔗 Lampa Integration
The built-in `lampa-plugin.js` allows the Lampa catalog to automatically detect TorrentPlayer and forward torrent streams to it.
#### How to use:
1. Launch TorrentPlayer on the TV so it stays active in the background.
2. Open **Lampa**. Click "Watch" on any torrent from the built-in TorServe tab.
3. Lampa closes its default player and passes the direct link to our player. The screen shows "Launching...", and the movie starts with full remote and mega-menu support.
#### How to connect the plugin in Lampa:
1. Open your `lampa-plugin.js` file on GitHub from a smartphone or PC.
2. Click the **Raw** button to open the plain text.
3. Copy the URL from the browser address bar (it must start with `https://githubusercontent.com...`).
4. In the **Lampa** app on your TV, go to **Settings** -> **Plugins** -> **Add Plugin**.
5. Paste the copied Raw link and click **OK**.
6. Fully restart the Lampa application.
7. Go to Lampa settings -> **Player** -> **Player Type** and select the new **`TorrentPlayer (WGT)`** option.

---

<a name="russian-version"></a>
## Russian Version / Русская версия

**TorrentPlayer** — это нативный, легкий и защищенный от сбоев видеоплеер для телевизоров **Samsung Smart TV (OS Tizen)**. Он разработан специально для воспроизведения торрентов «на лету» через сервер **TorServe**.

### 🚀 Основные возможности плеера
1. **Мгновенный стриминг:** Просмотр тяжелых торрентов без предварительного скачивания файла в память телевизора.
2. **Умный Auto Reconnect:** При обрыве связи с Wi-Fi или сервером плеер делает 5 автоматических попыток переподключения, продолжая показ точно с той же секунды.
3. **Продвинутое управление кэшем:** В нижнем меню можно в один клик выбрать размер буфера предзагрузки (Авто, 100 МБ, 200 МБ, 500 МБ).
4. **Мониторинг статуса (Кнопка ВВЕРХ):** Выводит в правом верхнем углу экрана инфо-панель со скоростью загрузки и заполненностью буфера в мегабайтах. Скрывается кнопкой `BACK`.
5. **Нижнее Мега-Меню (Кнопка ВНИЗ):** Удобный горизонтальный интерфейс для переключения аудиодорожек (озвучек), субтитров и настроек кэша прямо во время фильма.
6. **Правая шторка серий:** Боковая панель со списком серий для многосерийных раздач с поддержкой автоматического перехода на следующий эпизод.
7. **Память позиций:** Автоматическое запоминание секунды, на которой вы остановили просмотр.

### 🔊 Важное: Решение проблемы со звуком DTS на Samsung
Начиная с 2018 года, телевизоры Samsung **аппаратно не поддерживают звуковые дорожки в формате DTS**. Если запустить фильм с таким звуком напрямую, видео будет идти без звука.
В коде `js/avplay.js` прописана автоматическая страховка аудиомикшера Tizen, но для 100% результата необходимо включить одну настройку на стороне вашего сервера TorServe:
1. Откройте настройки вашего сервера TorServe через браузер по адресу `http://IP_АДРЕС_СЕРВЕРА:8090`.
2. Найдите раздел **Настройки раздатчика / Настройки плеера** (Player settings).
3. Включите пункт **Транскодирование аудио** (Audio Transcoding) и выберите формат перекодирования **AAC** или **AC3 (Dolby Digital)**.
4. *Результат:* Сервер будет сам перекодировать неподдерживаемый звук DTS в понятный для Samsung формат «на лету», а наш плеер идеально воспроизведет его на телевизоре.

### 🛠️ Инструкция по сборке .wgt файла на компьютере
Проект собирается в классический автономный виджет, который устанавливается прямо в память телевизора:
1. Зайдите в свой репозиторий GitHub на компьютере, нажмите зеленую кнопку **Code** -> **Download ZIP**.
2. Распакуйте скачанный архив.
3. Зайдите внутрь распакованной папки. **Критически важно:** в корне этой папки должны сразу лежать файлы `index.html`, `config.xml` и папки `js`, `css`, `assets`.
4. Выделите **все внутренние файлы и папки** вместе (не выделяйте саму общую родительскую папку).
5. Кликните правой кнопкой мыши -> **Отправить** -> **Сжатая ZIP-папка** (или используйте программы WinRAR / 7-Zip).
6. Переименуйте получившийся файл `Archive.zip`: сотрите буквы `.zip` в конце названия и напишите вместо них **`.wgt`** (например, `TorrentPlayer.wgt`). Подтвердите изменение расширения файла.

### 📺 Инструкция по установке на Samsung Smart TV
#### Способ 1: Установка с флешки (Для старых моделей ТВ)
1. Отформатируйте флешку в файловую систему FAT32.
2. Создайте в корне флешки папку с точным именем `userwidget`.
3. Скопируйте ваш готовый файл `TorrentPlayer.wgt` внутрь созданной папки `userwidget`.
4. Вставьте флешку в USB-разъем включенного телевизора. Установка начнется автоматически.
#### Способ 2: Через ПК и Режим разработчика (Для всех современных моделей Tizen)
1. На телевизоре зайдите в меню приложений (`Apps`).
2. Нажмите на обычном пульте последовательно кнопки `1, 2, 3, 4, 5`. Откроется скрытое окно **Developer Mode** (Режим разработчика).
3. Переключите ползунок в положение **ON**, введите IP-адрес вашего компьютера и перезагрузите телевизор (удерживайте кнопку включения на пульте до полной перезагрузки экрана).
4. Запустите программу установщик (Tizen Studio или простой сторонний Tizen App Installer) на вашем компьютере.
5. Подключитесь по IP-адресу к телевизору и отправьте файл `TorrentPlayer.wgt` на установку.

### 🔗 Интеграция с каталогом Lampa
Наш встроенный плагин `lampa-plugin.js` позволяет приложению Lampa автоматически находить TorrentPlayer и перенаправлять в него торрент-потоки.
#### Как пользоваться интеграцией:
1. Запустите TorrentPlayer на телевизоре, чтобы он остался активен в фоне.
2. Откройте приложение **Lampa**. Нажмите «Смотреть» на любом торренте из встроенной вкладки раздач TorServe.
3. Lampa мгновенно свернет свой стандартный плеер и передаст прямую ссылку нашему плееру. На экране появится надпись «Запуск...», и фильм включится на весь экран со всеми функциями пульта и мега-меню.
#### Как подключить плагин внутри Lampa:
1. Откройте ваш файл `lampa-plugin.js` на GitHub со смартфона или ПК.
2. Нажмите кнопку **Raw** в верхней панели файла, чтобы открыть чистый текст.
3. Скопируйте получившуюся ссылку из адресной строки браузера (она должна начинаться с `https://githubusercontent.com...`).
4. В приложении **Lampa** на телевизоре зайдите в **Настройки** -> **Плагины** -> **Добавить плагин**.
5. Вставьте скопированную Raw-ссылку в поле ввода и нажмите **ОК**.
6. Полностью перезапустите приложение Lampa.
