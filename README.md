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
│   └── dashboard.js    # UI-Logik
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

## Autodarts-API anbinden

In `js/config.js`:

```js
CONFIG.useMockData = false;
CONFIG.boardId = 'DEINE_BOARD_ID';
```

Die genaue API/Websocket-Dokumentation von Autodarts ist noch in Issue #3 zu klären.

## Nächste Schritte

Siehe [GitHub Issues](https://github.com/Hoook21/autodarts-dashboard/issues).

## Mitmachen

- Ideen, Layout-Skizzen und technische Hinweise in Issues oder Discussions posten
- Änderungen als Pull Request einreichen
