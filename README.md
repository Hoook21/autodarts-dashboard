# Autodarts Dashboard

Dashboard für Autodarts im Querformat - optimiert für einen Landscape-Monitor am Dartboard.

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

## Architektur- und Entscheidungsrahmen

Das Dashboard ist bewusst nur eine **zusätzliche Präsentationsschicht** — es
ersetzt Autodarts nicht, patcht keine Original-Dateien und schreibt nicht in
Autodarts hinein. Die technische Richtung steht in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## iframe/Webview funktioniert nicht?

Wenn Autodarts im Dashboard-iframe nur „Connecting to Board“ anzeigt, hilft `scripts/diagnose-iframe-environment.html`:

```bash
# Einfachen Server starten
python3 -m http.server 8080

# Diagnose im problematischen Browser öffnen
open http://localhost:8080/scripts/diagnose-iframe-environment.html
```

Die Seite zeigt, welche Browser-APIs (`navigator.usb`, `navigator.hid`, `navigator.bluetooth`, `navigator.mediaDevices`) im aktuellen Browser/Profil verfügbar sind. Damit lässt sich in [Issue #18](https://github.com/Hoook21/autodarts-dashboard/issues/18) gezielt prüfen, ob es am iframe oder am Headless-Browser-Profil liegt.

## Live-Bridge / Browser-Extension POC

Für echte Autodarts-Play-Livedaten ist der bevorzugte lokale POC jetzt:

1. Dashboard-Server starten: `python3 -m http.server 8080`
2. Bridge starten: `. .venv/bin/activate && python3 scripts/bridge_poc.py`
3. Dashboard öffnen: `http://localhost:8080/?layout=webview-big-readable&bridge=ws://localhost:9876`
4. Extension aus `extension/autodarts-bridge/` als unpacked Extension laden bzw. später als Safari Web Extension verpacken. Auf macOS 12.7.x siehe [`docs/safari-extension-monterey.md`](docs/safari-extension-monterey.md).
5. `https://play.autodarts.io` nach Aktivierung der Extension neu laden und lokales Match starten.

Der alte Bookmarklet-Weg ist nur noch Debug/Legacy, weil Safari `javascript:` in der Adresszeile blockt und späte Injection den Autodarts-WebSocket verpassen kann.

### Safari-Testnotiz vom 2026-06-18

Der lokale Safari-Pfad wurde mit dieser Kette erfolgreich verifiziert:

```text
https://play.autodarts.io
  -> Safari Web Extension content script
  -> extension background bridge
  -> ws://localhost:9876
  -> Dashboard mit ?bridge=ws://localhost:9876
```

Im Test war der Extension-Marker auf `play.autodarts.io` sichtbar:

```text
data-autodarts-dashboard-bridge-content-script="loaded"
```

Ein simulierter Autodarts-Match-Payload aus dem Play-Tab wurde im Dashboard
angezeigt. Erwartete Anzeige im Dashboard-Test:

```text
Status: Am Zug: Screen Test
Score: 261
Letzter Wurf: 60
```

Falls Safari einen alten `localhost:8080`-Tab nicht mehr sauber lädt, kann der
Dashboard-Server testweise auf einem anderen Port laufen:

```bash
python3 -m http.server 8765
```

Dashboard-URL:

```text
http://localhost:8765/?layout=webview-big-readable&bridge=ws%3A%2F%2Flocalhost%3A9876
```

Für längere lokale Board-Tests kann man Server und Bridge in `screen` laufen
lassen:

```bash
screen -dmS autodarts-dashboard-http zsh -lc 'cd /path/to/autodarts-dashboard && python3 -u -m http.server 8765'
screen -dmS autodarts-dashboard-bridge zsh -lc 'cd /path/to/autodarts-dashboard && .venv/bin/python -u scripts/bridge_poc.py'
screen -ls
```

## Autodarts-API anbinden

In `js/config.js`:

```js
CONFIG.useMockData = false;
CONFIG.boardId = 'DEINE_BOARD_ID';
```

> ⚠️ **API / WebSocket URLs sind Platzhalter.**  
> Die genaue Schnittstelle von Autodarts ist noch in [Issue #3](https://github.com/Hoook21/autodarts-dashboard/issues/3) zu klären.  
> Bis dahin läuft das Dashboard sicher mit **Mock-Daten**.

## Standardfrontend-Funktionen inventarisieren

Eine laufende Liste der Autodarts-Standardfrontend-Funktionen, die das Dashboard langfristig abbilden soll, liegt in
[`docs/inventory-autodarts-frontend.md`](docs/inventory-autodarts-frontend.md).

Ziel: Klare Trennung zwischen "Original-Autodarts macht" und "Dashboard zeigt nur an".

## Nächste Schritte

Siehe [GitHub Issues](https://github.com/Hoook21/autodarts-dashboard/issues).

## Mitmachen

- Ideen, Layout-Skizzen und technische Hinweise in Issues oder Discussions posten
- Änderungen als Pull Request einreichen
