# OpenSter

> ⚠️ **WIP / Work in Progress** - Diese App wird wahrscheinlich nicht wie erwartet funktionieren. Use at your own risk!

OpenSter ist eine Open-Source-Musik-Quiz-App für YouTube Playlists. Erstelle Spielkarten mit QR-Codes aus beliebigen YouTube Videos und spiele mit Freunden!

## ✨ Features

- 🎵 **YouTube Playlist Import** - Importiere öffentliche YouTube Playlists ohne API-Key
- 🔍 **YouTube Suche** - Suche direkt nach Videos in der App
- 📱 **QR-Code Scanner** - Scanne Karten um Musik abzuspielen
- 🖨️ **PDF Generator** - Erstelle druckbare Spielkarten mit QR-Codes
- 🎨 **Unsichtbarer Player** - Musik spielt im Hintergrund ohne störende UI
- 🌙 **Dark/Light Mode** - Wähle dein bevorzugtes Theme
- 📴 **Offline-fähig** - Einmal importierte Playlists bleiben lokal gespeichert

## 🚀 Schnellstart

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- [Expo Go App](https://expo.dev/go) (für mobiles Testen)

### Installation

```bash
# Repository klonen
git clone https://github.com/dein-username/OpenSter.git
cd OpenSter

# Dependencies installieren
npm install

# App starten
npx expo start
```

Scanne den QR-Code mit der Expo Go App oder drücke:
- `i` für iOS Simulator
- `a` für Android Emulator
- `w` für Web

## 🎮 Spielanleitung

1. **Playlist importieren**
   - Gehe zu "Spielkarten" → "Import"
   - Füge eine YouTube Playlist URL ein (z.B. `youtube.com/playlist?list=PL...`)
   - Oder suche direkt nach Videos

2. **Karten erstellen**
   - Überprüfe und editiere die importierten Videos
   - Generiere ein PDF mit Vorder- und Rückseiten
   - Drucke die Karten (empfohlen: doppelseitig)

3. **Spielen!**
   - Öffne die Jukebox
   - Scanne einen QR-Code mit der Kamera
   - Rate das Jahr!

## 📱 Screenshots

*(Hier Screenshots einfügen)*

## 🛠️ Technologien

- **React Native** mit **Expo SDK 52**
- **YouTube iFrame Player** (unsichtbar)
- **Invidious API** (für Playlist-Daten, kein API-Key nötig!)
- **NativeWind** (Tailwind für React Native)
- **QRCode** (für PDF-Generierung)

## 📦 Projektstruktur

```
openster/
├── assets/                  # Icons, Bilder
├── components/              # Wiederverwendbare Komponenten
│   ├── YouTubeAudioPlayer.js   # Unsichtbarer Player
│   └── PDFGenerator.js         # PDF-Erstellung
├── screens/                 # App Screens
│   ├── JukeboxScreen.js        # Hauptspieler
│   ├── ImportScreen.js         # Playlist Import
│   ├── ReviewScreen.js         # Track-Überprüfung
│   ├── PrintScreen.js          # PDF-Vorschau
│   └── SettingsScreen.js       # Einstellungen
├── services/                # API Services
│   └── YouTubeService.js       # YouTube/Invidious API
├── theme/                   # Theming
│   └── ThemeProvider.js
├── App.js                   # Haupt-App
├── app.json                 # Expo Konfiguration
└── package.json
```

## 🔧 Entwicklung

### Nützliche Befehle

```bash
# Expo Doctor - Prüft auf Probleme
npm run doctor

# Dependencies reparieren
npm run fix

# Versions-Check
npm run check
```

### Neue YouTube-Playlist finden

1. Öffne YouTube
2. Suche nach einer öffentlichen Playlist (keine "Mix"-Playlists!)
3. Kopiere die URL: `https://www.youtube.com/playlist?list=PL...`
4. Füge sie in OpenSter ein

### Eigene Playlist erstellen

1. Erstelle eine YouTube Playlist
2. Füge Videos hinzu
3. Mache die Playlist öffentlich
4. Importiere sie in OpenSter

## 🤝 Mitmachen

Dies ist ein Open-Source-Projekt! Beiträge sind willkommen:

1. Forke das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- [Expo](https://expo.dev) für das großartige Framework
- [Invidious](https://invidious.io) für die Open-Source YouTube-API
- [Lucide](https://lucide.dev) für die Icons
- Alle Contributors!

---

**Made with ❤️ for music quiz enthusiasts**
