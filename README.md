# Autodarts Dashboard

Dashboard für Autodarts im Querformat — optimiert für einen Landscape-Monitor am Dartboard.

## Ziel

Eine klare, scrollfreie Anzeige für Live-Dart-Spiele. Alles auf einen Blick:

- Links: Dartscheibe / Board-Ansicht
- Mitte: Spieler-Scores, Durchschnitt, letzte Wurf-Serie
- Rechts: Historie der letzten Würfe und zusätzliche Statistiken

## Projektstruktur

```
autodarts-dashboard/
├── index.html          # Haupt-Dashboard
├── css/
│   └── dashboard.css   # Landscape-Layout
├── js/
│   ├── config.js       # Board-ID, API-URL, Mock-Modus
│   ├── api.js          # WebSocket / API / Mock-Daten
│   ├── dashboard.js    # UI-Logik
│   └── webview.js      # iframe / Kamera-Fallback-Einbettung
├── mock/
│   └── autodarts-mock.json  # (optional) statische Testdaten
└── README.md
```

## Lokale Entwicklung

```bash
# Repo klonen
git clone https://github.com/Hoook21/autodarts-dashboard.git
cd autodarts-dashboard

# Einfacher HTTP-Server (z. B. Python)
python3 -m http.server 8080

# Im Browser öffnen
open http://localhost:8080
```

Standardmäßig läuft das Dashboard mit **Mock-Daten**, damit man ohne live Board entwickeln kann.

### Layout-Varianten vergleichen

Das Layout kann per URL-Parameter gewechselt werden:

| Variante | URL |
| --- | --- |
| Webview + Große Scores (Standard) | `http://localhost:8080/?layout=webview-big-readable` |
| Webview + Sidepanel | `http://localhost:8080/?layout=webview-sidepanel` |
| Balanced 3-Column | `http://localhost:8080/?layout=balanced` |
| Score-first | `http://localhost:8080/?layout=score-first` |
| Big-Type / Distance-Readable | `http://localhost:8080/?layout=big-type` |

Ungültige Werte fallen automatisch auf `webview-big-readable` zurück.

## RC1 lokal testen

Der aktuelle Release Candidate (`webview-big-readable`) ist in `main` integriert und kann ohne Autodarts-Hardware oder Live-Datenanbindung getestet werden:

```bash
# Repo klonen bzw. aktualisieren
git clone https://github.com/Hoook21/autodarts-dashboard.git
cd autodarts-dashboard

# Lokaler Server starten
python3 -m http.server 8080

# Im Browser öffnen
open http://localhost:8080/?layout=webview-big-readable
```

> ⚠️ **Aktuell handelt es sich um einen Frontend-/Integrationstest.**
> Die Anzeige läuft mit Mock-Daten. Eine finale Live-Datenbindung an Autodarts ist noch in Arbeit (siehe [Issue #3](https://github.com/Hoook21/autodarts-dashboard/issues/3) und [Epic #17](https://github.com/Hoook21/autodarts-dashboard/issues/17)).

## iframe-Steuerung / Webview-Parameter

```
http://localhost:8080/?layout=webview-big-readable&webview=http://127.0.0.1:3180/calibration?cam=3
```

Wenn die Autodarts-Seite Gerätezugriff braucht, versucht das Dashboard automatisch
folgende Permissions im iframe freizuschalten: `camera`, `microphone`, `usb`,
`hid`, `bluetooth`, `fullscreen`. Ob der Browser sie tatsächlich erlaubt, hängt
vom jeweiligen Host und Browser ab.

## Kamera-Bild-Fallback

Falls die Autodarts-Webview im iframe nicht verbindet, kann ein statisches
Kamerabild links angezeigt werden:

```
http://localhost:8080/?layout=webview-big-readable&cameraImage=http://127.0.0.1:8080/board.jpg
```

Das Bild wird `object-fit: contain` im linken Panel skaliert, damit es auch
bei unterschiedlichen Auflösungen brauchbar bleibt.

Mehr Details und Preview zum RC1 gibt es unter [`docs/release-candidates/rc1-webview-big-readable/README.md`](docs/release-candidates/rc1-webview-big-readable/README.md).

## Autodarts-API anbinden

In `js/config.js`:

```js
CONFIG.useMockData = false;
CONFIG.boardId = 'DEINE_BOARD_ID';
```

> ⚠️ **API / WebSocket URLs sind Platzhalter.**
> Die genaue Schnittstelle von Autodarts ist noch in [Issue #3](https://github.com/Hoook21/autodarts-dashboard/issues/3) zu klären.
> Bis dahin läuft das Dashboard sicher mit **Mock-Daten**.

## Nächste Schritte

Siehe [GitHub Issues](https://github.com/Hoook21/autodarts-dashboard/issues).

## Mitmachen

- Ideen, Layout-Skizzen und technische Hinweise in Issues oder Discussions posten
- Änderungen als Pull Request einreichen
