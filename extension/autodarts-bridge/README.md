# Autodarts Dashboard Bridge Extension

Proof-of-concept WebExtension for the local Autodarts dashboard bridge.

It uses a Safari-compatible Manifest V2 shape, runs on `https://play.autodarts.io/*`, injects `page-bridge-sender.js` at
`document_start`, and forwards only redacted `autodarts.matches` payloads for
these topic suffixes to the local bridge at `ws://localhost:9876`:

- `.state`
- `.events`
- `.game-events`
- `.corrections`

For debugging, the content script sets `data-autodarts-dashboard-bridge-content-script="loaded"` on `<html>` and logs whether the page sender loaded.

The extension stores no tokens, cookies, tickets, WebSocket codes or payloads.
It does not modify Autodarts and does not send control commands back to
Autodarts.

## Local test flow

1. Start the dashboard server:
   ```bash
   python3 -m http.server 8080
   ```
2. Start the bridge:
   ```bash
   . .venv/bin/activate
   python3 scripts/bridge_poc.py
   ```
3. Open the dashboard:
   ```text
   http://localhost:8080/?layout=webview-big-readable&bridge=ws://localhost:9876
   ```
4. Load this folder as an unpacked extension in Chrome/Chromium, or use it as
   the source folder for a Safari Web Extension wrapper.
5. Open or reload `https://play.autodarts.io` after the extension is enabled.
6. Start a local match. The bridge should show two clients: dashboard + sender.

## Safari note

Safari blocks `javascript:` bookmarklets in the Smart Search field and late
console injection is unreliable for this use case. For Safari we need a real
Safari Web Extension wrapper around this WebExtension source so the script runs
before Autodarts opens its WebSocket.


Safari note: the page-context sender posts redacted payloads to the content script; `background.js` owns the local `ws://localhost:9876` bridge connection to avoid mixed-content blocking from `https://play.autodarts.io`.
