# Live-Bridge-Plan: Dashboard ← Autodarts Play

Status: **Architekturentscheidung / Plan** für Issue #31.

Ziel: Das Dashboard soll echte Autodarts-Live-Daten anzeigen, ohne Autodarts zu patchen, Secrets zu persistieren oder zu viel Logik zu duplizieren.

---

## 1. Ausgangslage

- Autodarts Play nutzt `wss://play.ws.autodarts.io/ms/v0/subscribe?...` mit Channel `autodarts.matches`.
- Relevante Topics: `<matchId>.state`, `<matchId>.events`, `<matchId>.game-events`, `<matchId>.corrections`.
- `js/adapter.js` kann die Payloads bereits mappen (siehe PR #37).
- Was noch fehlt: ein sicherer Transport vom Play-Tab oder -Prozess ins Dashboard.

## 2. Zielbilder

### Kurzfristig (POC)

Schnell lokal testen, ob der gemappte Payload live ankommt.

### Mittelfristig (darts-hub-kompatibel)

Dashboard läuft als `custom-url` in `lbormann/darts-hub`, also getrennt vom Play-Tab. Transport muss daher auch über Prozess-/Fenstergrenzen funktionieren.

## 3. Mögliche Transportwege

| Variante | Machbarkeit | Sicherheit | darts-hub-tauglich | Komplexität |
|---|---|---|---|---|
| `postMessage` aus Play-Tab an Dashboard-Tab | hoch | mittel | nein | niedrig |
| `BroadcastChannel` | hoch | mittel | nein | niedrig |
| Lokaler WebSocket-Proxy / Bridge | hoch | hoch | ja | mittel |
| Browser-Extension + lokaler Port | hoch | hoch | ja | mittel |
| Dashboard im iframe von Play | fraglich | niedrig | nein | hoch |

Empfehlung:

- **POC:** `BroadcastChannel` oder `postMessage` bzw. Bookmarklet, um schnell Daten zu sehen.
- **Ziel-Architektur:** Browser-Extension oder kleines lokales Script leitet selektierte Nachrichten an einen lokalen WebSocket-Proxy weiter; Dashboard verbindet sich mit diesem Proxy.

## 4. Sicherheitsgrenzen (hart)

- Keine Tokens, Cookies, Tickets, `code=…`, Session-IDs oder Auth-Header ins Repo.
- Keine Screenshots mit sichtbarem Code/Token einchecken.
- Bridge filtert vor Weitergabe: nur erlaubte Topics, nur für das aktive Match.
- Bridge persistiert nichts, logged keine sensiblen URLs mit.

## 5. Whitelist für weiterzuleitende Topics

```
autodarts.matches/<matchId>.state
autodarts.matches/<matchId>.events
autodarts.matches/<matchId>.game-events
autodarts.matches/<matchId>.corrections
```

Optional später:

```
autodarts.matches/<matchId>.referee
autodarts.matches/<matchId>.challenge
```

## 6. Matchwechsel

- Wenn die Bridge eine Nachricht für eine neue `matchId` sieht, aktualisiert sie automatisch den aktiven Match-Kontext.
- Dashboard reagiert auf `matchId`-Wechsel, indem es internen Zustand zurücksetzt und neuen Spielern/Scores lauscht.
- Keine manuelle Eingabe der Match-ID im Dashboard notwendig.

## 7. Empfohlene nächste Schritte

1. Bookmarklet/Extension-Entwurf, der `autodarts.matches`-Nachrichten aus dem Play-Tab filtert.
2. Lokaler Mini-Bridge-Server (Node.js oder Python), der per WebSocket lauscht und gefilterte Payloads an das Dashboard weitergibt.
3. Dashboard-Integration so erweitern, dass es neben `postMessage` auch eine lokale Bridge-URL nutzen kann.
4. Test mit echter lokaler Runde und Redaktion der Daten vor dem Weiterleiten.

## 8. Offene Fragen

- Nutzen wir zuerst ein Bookmarklet oder eine temporäre Browser-Extension?
- Soll die Bridge in Python (leicht) oder Node.js (gleicher Stack wie Dashboard) gebaut werden?
- Soll das Dashboard mehrere Match-IDs gleichzeitig unterstützen oder immer nur das aktuell aktive Match?
