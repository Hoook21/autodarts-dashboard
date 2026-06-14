# Autodarts Live-Adapter — Recherche

Status: **Work in progress** — Zusammenfassung für Issue #30 / #31.
Quelle: [`creazy231/tools-for-autodarts`](https://github.com/creazy231/tools-for-autodarts) (Browser-Extension / macOS-App).

## Kernidee

`tools-for-autodarts` zeigt, wie Autodarts-Live-Daten aus dem Browser-Frontend ausgelesen werden können, ohne die Autodarts-Installation zu verändern:

- Content-/Injected-Script läuft auf `*://play.autodarts.io/*`.
- WebSocket-Nachrichten werden über `MessageEvent.prototype.data` oder `WebSocket.prototype.send` abgefangen.
- JSON-Payloads werden geparst und nach Channel gefiltert.
- Für unser Dashboard interessant ist vor allem Channel `autodarts.matches`.

## Relevante Channels

| Channel | Zweck |
|---------|-------|
| `autodarts.lobbies` | Lobby-Status, lokale Spieler |
| `autodarts.matches` | Aktives Match: Spieler, Scores, Turns, Stats |
| `autodarts.boards` | Board-Status, Erkennung |
| `autodarts.boards.images` | Kamerabild/Frames |
| `autodarts.tournaments` | Turnierinformationen |

## Live-Capture-Befund 2026-06-14

Der lokale Board-WebSocket `ws://127.0.0.1:3180/api/events` liefert nach aktuellem Test nur Board-/Kameraevents (z. B. `cam_stats`, `stats`), aber keine belastbaren Match-/Score-/Throw-Daten.

Für den Score-Sync ist stattdessen die Autodarts-Play Match-Verbindung relevant:

- API-Basis: `https://api.autodarts.io/...`
- Match-WebSocket: `wss://play.ws.autodarts.io/ms/v0/subscribe?code=...`
- Tickets/Codes werden offenbar vorher über `POST /tickets` geholt.

Wichtig: Tickets, Cookies, Codes und andere Auth-Daten dürfen nicht ins Repo.

Bekannte Match-Topics unter `autodarts.matches`:

- `<matchId>.state`
- `<matchId>.events`
- `<matchId>.game-events`
- `<matchId>.corrections`
- `<matchId>.viewers`
- `<matchId>.referee`
- `<matchId>.challenge`

Konsequenz für `js/adapter.js`: Der Adapter akzeptiert neben einfachen `{ channel: 'autodarts.matches', data }`-Payloads auch Topic-Envelopes wie `{ channel: 'autodarts.matches', topic: '<matchId>.state', data }`. Die eigentliche authentifizierte WebSocket-Anbindung bleibt Aufgabe einer separaten Extension/Bridge; das Dashboard selbst bleibt read-only.

## Match-Datenmodell (vereinfacht)

Das `IMatch`-Objekt aus `utils/websocket-helpers.ts` enthält mindestens:

```ts
interface IMatch {
  id: string;
  players: IPlayer[];
  player: number;           // Index des aktiven Spielers
  scores: number[];         // Restscores
  gameScores: number[];     // Leg/Set-Scores
  set: number;
  leg: number;
  round: number;
  turnScore: number;        // Punkte im aktuellen Turn
  turnBusted: boolean;      // Bust?
  gameFinished: boolean;
  gameWinner: number;
  stats: IStats[];
  turns: ITurn[];
  chalkboards?: IChalkboard[];
}
```

Relevantes Mapping für das Dashboard:

| Autodarts-Feld | Dashboard-Feld |
|----------------|----------------|
| `players[i].name` oder `players[i].user.name` | `player.name` |
| `scores[i]` | `player.score` |
| `player` (Index) | `activePlayer` |
| `turnScore` | aktuelle Aufnahme / `last` |
| `turnBusted` | `bust` Status |
| `stats[i].average` oder `stats[i].dartsAverage` | `player.avg` |
| `turns[]` | Historie der letzten Würfe |
| `gameFinished` + `gameWinner` | Spiel-/Leg-Beendet-Meldung |

## Adapter-Implementierung

Das Grundgerüst liegt in `js/adapter.js`:

- Empfängt postMessage- oder lokale WebSocket-Bridge-Payloads.
- Filtert auf Channel `autodarts.matches` bzw. bekannte Match-Topics (`<matchId>.state`, `.events`, `.game-events`, `.corrections`).
- Mappt Spieler, Scores, aktiven Spieler, letzte Aufnahme und Average.
- Gibt `gameFinished`, `gameWinner` und `turnBusted` weiter, damit das Dashboard später Bust/Game-Shot anzeigen kann.

Nutzung:

```html
<!-- Standard: postMessage von einer Extension / einem Script -->
<script src="js/adapter.js"></script>

<!-- Oder mit lokaler WebSocket-Bridge -->
http://localhost:8080/?bridge=ws://localhost:9001
```

## Sicherheits- und Architektur-Grenzen

- **read-only**: Wir empfangen nur Daten, die das Original-Frontend ohnehin anzeigt.
- **keine Secrets**: Keine Tokens, Cookies oder Session-URLs ins Repo schreiben.
- **kein Patch**: Keine Änderung an installierter Autodarts-App / `app.asar`.
- **Wrapper/Overlay**: Das Dashboard bleibt eine separate Anzeige.

## Mögliche Übertragungswege ins Dashboard

1. **Browser-Extension (Content-Script)**
   - Hört auf `autodarts.matches`.
   - Sendet gefilterte Daten per `postMessage` oder BroadcastChannel an das Dashboard.
   - Vorteil: funktioniert parallel zur offiziellen Webseite.

2. **Lokaler Mini-Proxy / WebSocket-Bridge**
   - Ein kleiner lokaler Dienst lauscht auf demselben Rechner.
   - Extension/Script leitet Daten an `ws://localhost:<port>` weiter.
   - Dashboard verbindet sich mit diesem lokalen Port.
   - Vorteil: Dashboard muss nicht denselben Origin wie Autodarts haben.

3. **postMessage direkt aus iframe**
   - Wenn Autodarts im Dashboard-iframe geladen wird, kann das Parent auf Nachrichten lauschen.
   - Unsicher, ob Autodarts ungefragte Nachrichten sendet; wahrscheinlich braucht es Extension-Hilfe.

## Nächste Schritte

- [x] Erste lokale Runde starten und Datenquelle eingrenzen: Board-Port reicht nicht; Match-WebSocket/Topics sind relevant.
- [ ] Tatsächliche `autodarts.matches`-Payloads aus `play.ws.autodarts.io/ms/v0/subscribe?...` mitschneiden.
- [ ] Mapping-Tabelle aus dieser Datei anhand echter Payloads verifizieren/korrigieren.
- [ ] Minimalen Proof-of-Concept für den Übertragungsweg bauen (siehe `js/adapter.js`).
- [ ] Issue #31 mit Ergebnissen aktualisieren.
