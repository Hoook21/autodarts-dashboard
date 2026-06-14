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

Die Bridge leitet Nachrichten im Channel `autodarts.matches` mit Topics endend auf `.state`, `.events`, `.game-events` oder `.corrections` an alle anderen verbundenen Clients weiter. Sie persistiert keine Auth-Daten und filtert alles andere heraus.
