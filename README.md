# TorrentPlayer for Samsung Tizen

Modern video player for Samsung Smart TV based on Tizen OS.

## Features

- Samsung AVPlay
- HTTP / HTTPS streams
- TorServe integration
- Lampa integration
- Play / Pause
- Fast forward / rewind
- Resume playback
- Volume and mute
- Audio track selection
- Subtitle support
- Buffering and reconnect handling
- Stream information
- Manual update system
- Samsung TV remote control support

## Target

Samsung Smart TV with Tizen OS 2024+.

## Project status

🚧 Development

Current version: `v0.1.0`

## Architecture

```text
Lampa
   ↓
TorServe
   ↓
TorrentPlayer
   ↓
Samsung AVPlay
   ↓
Samsung TV
