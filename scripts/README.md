# scripts/

Hilfsskripte für Entwicklung, Test und lokale Integration.

## `bridge_poc.py`

Lokaler WebSocket-Proxy/Bridge für das Dashboard. Dient als Proof-of-Concept, um redigierte Autodarts-Match-Daten von einem Browser-Tab (z. B. via Extension/Bookmarklet) an das Dashboard weiterzureichen.

### Abhängigkeiten

```bash
pip3 install websockets
```

Oder auf Debian/Ubuntu alternativ:

```bash
sudo apt-get install python3-websockets
```

### Start

```bash
python3 scripts/bridge_poc.py
```

Optional mit anderem Port:

```bash
BRIDGE_PORT=9999 python3 scripts/bridge_poc.py
```

### Verbindung

Dashboard und Sender verbinden sich beide mit:

```text
ws://localhost:9876
```

## `autodarts-bridge-sender.js`

Bookmarklet/Injected-Script für `https://play.autodarts.io`. Es lauscht auf WebSocket-Nachrichten im Channel `autodarts.matches`, filtert erlaubte Topics und leitet redigierte Payloads persistent an die lokale Bridge (`ws://localhost:9876`) weiter.

### Verwendung

1. Bridge starten:
   ```bash
   python3 scripts/bridge_poc.py
   ```
2. Diesen Code als Lesezeichen im Browser speichern oder in die DevTools-Konsole auf `play.autodarts.io` einfügen.
3. Dashboard in anderem Tab öffnen, z. B. mit:
   ```text
   http://localhost:8080/?layout=webview-big-readable&bridge=ws://localhost:9876
   ```

```javascript
javascript:(function(){var script=document.createElement('script');script.src='http://localhost:8080/scripts/autodarts-bridge-sender.js';document.head.appendChild(script);})()
```

Achtung: Das ist ein Proof-of-Concept. Es filtert Topics, redigiert `code`/`token`/`ticket`/`authorization`/`cookie`/`session` und persistiert keine Auth-Daten. Die Verbindung zur Bridge wird wiederverwendet; ausstehende Nachrichten werden in einer kurzen Queue gepuffert.

## Weitere Skripte

Die Bridge leitet Nachrichten im Channel `autodarts.matches` mit Topics endend auf `.state`, `.events`, `.game-events` oder `.corrections` an alle anderen verbundenen Clients weiter. Sie persistiert keine Auth-Daten und filtert alles andere heraus.
