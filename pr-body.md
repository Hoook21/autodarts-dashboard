## Motivation

Die aktuelle RC1-Version zeigt rechts die Score-Anzeige gut lesbar, links aber weiterhin nur einen Platzhalter "Autodarts Webansicht". Die Integration der echten Autodarts-Ansicht ist damit der nächste harte Blocker (siehe #8 und #18).

Dieser PR bereitet den Einbettungstest vor: er macht die linke Fläche zu einem echten iframe, dessen URL per Config oder URL-Parameter gesteuert werden kann. So kann auf Haukes iMac schnell getestet werden, ob die aktive Autodarts-Session geladen wird oder ob CSP / X-Frame-Options / Auth dazwischen greifen.

## Änderungen

- `js/config.js`: neues `webviewUrl: null` mit Hinweis auf Frame-Blocker.
- `js/webview.js` (neu): Ersetzt `.webview-placeholder` durch ein `<iframe>` sobald `webviewUrl` oder `?webview=URL` gesetzt ist.
  - Erlaubt nur `http:`/`https:` als Protokoll.
  - Setzt `sandbox` auf `allow-scripts allow-same-origin allow-forms allow-popups`.
  - Protokolliert CSP-Verletzungen und iframe-Ladefehler in die Konsole.
- `index.html`: `webview.js` vor `api.js`/`dashboard.js` laden.
- `css/dashboard.css`: Styles für `.webview-iframe` (100% × 100%, keine Border, schwarzer Hintergrund).

## Testen

```bash
python3 -m http.server 8080
open http://localhost:8080/?layout=webview-big-readable&webview=https://example.com
```

Für den echten Integrationstest auf dem iMac:

```
http://localhost:8080/?layout=webview-big-readable&webview=SAFARI_URL_AUS_DER_AKTIVEN_SESSION
```

> ⚠️ Account-Tokens, Cookies oder private lokale URLs bitte nicht in den Screenshot oder GitHub kopieren.

## Was absichtlich noch offen bleibt

- Die tatsächliche Autodarts-URL muss noch aus Safari/Headless herausgefunden werden (Issue #18).
- Sollte die Einbettung blockiert werden, dokumentieren wir die Fehlerursache und entscheiden, ob ein lokaler Proxy / Browser-Wrapper / WebSocket-Adapter nötig ist.
- Live-Daten für die rechte Anzeige bleiben weiterhin Mock-Daten bis Issue #3 gelöst ist.

## Verknüpfte Issues

- Epic #17: RC1 in bestehendes Autodarts-System auf Haukes iMac einbinden
- Issue #18: Safari vs. Headless Autodarts-Session untersuchen
- Issue #8: Autodarts-Webansicht einbetten und Grenzen dokumentieren
- Issue #3: Datenquelle klären
