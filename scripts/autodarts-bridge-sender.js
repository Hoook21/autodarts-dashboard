/**
 * Autodarts Bridge Sender — Bookmarklet / Injected-Script
 *
 * Dieses Script wird im Kontext von https://play.autodarts.io geladen.
 * Es lauscht auf WebSocket-Nachrichten, filtert den Channel
 * `autodarts.matches` auf erlaubte Topics und leitet redigierte Payloads
 * an einen lokalen WebSocket-Proxy weiter.
 *
 * Enthält KEINE Tickets, Cookies, Auth-Header oder Secrets.
 * Es wird NICHT automatisch ausgefuehrt; Hook/Kiba entscheiden, wann es
 * aktiviert wird.
 *
 * Lokal vorbereiten:
 *   1. Bridge starten: python3 scripts/bridge_poc.py
 *   2. Diesen Code als Lesezeichen in den Browser ziehen (Bookmarklet) oder
 *      in die DevTools-Konsole auf play.autodarts.io einfuegen.
 *   3. Dashboard in anderem Tab mit ?layout=webview-big-readable oeffnen.
 *
 * Achtung: Dies ist ein Proof-of-Concept, keine produktive Extension.
 */
(function () {
    'use strict';

    const BRIDGE_URL = 'ws://localhost:9876';
    const CHANNEL = 'autodarts.matches';
    const ALLOWED_TOPICS = ['state', 'events', 'game-events', 'corrections'];
    const REDACT_FIELDS = ['code', 'token', 'ticket', 'authorization', 'cookie', 'session'];

    function isAllowedTopic(topic) {
        if (typeof topic !== 'string') return false;
        const suffix = topic.split('.').pop();
        return ALLOWED_TOPICS.includes(suffix);
    }

    function redact(value) {
        if (value === null || value === undefined) return value;
        if (typeof value !== 'object') return value;
        if (Array.isArray(value)) return value.map(redact);
        const out = {};
        for (const key of Object.keys(value)) {
            const lower = key.toLowerCase();
            if (REDACT_FIELDS.includes(lower) || lower.includes('auth') || lower.includes('secret')) {
                out[key] = '<redacted>';
            } else {
                out[key] = redact(value[key]);
            }
        }
        return out;
    }

    function sendToBridge(payload) {
        try {
            const ws = new WebSocket(BRIDGE_URL);
            ws.addEventListener('open', () => {
                ws.send(JSON.stringify(payload));
                ws.close();
            });
            ws.addEventListener('error', (err) => {
                console.warn('[autodarts-bridge-sender] Bridge nicht erreichbar:', err);
            });
        } catch (err) {
            console.error('[autodarts-bridge-sender] Sendefehler:', err);
        }
    }

    function interceptWebSocket() {
        const OriginalWebSocket = window.WebSocket;
        window.WebSocket = function (...args) {
            const ws = new OriginalWebSocket(...args);
            ws.addEventListener('message', (event) => {
                let payload;
                try {
                    payload = JSON.parse(event.data);
                } catch {
                    return;
                }
                if (payload.channel !== CHANNEL) return;
                if (!isAllowedTopic(payload.topic)) return;
                const redacted = redact(payload);
                console.log('[autodarts-bridge-sender] weitergeleitet:', redacted.topic);
                sendToBridge(redacted);
            });
            return ws;
        };
        window.WebSocket.prototype = OriginalWebSocket.prototype;
        window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
        window.WebSocket.OPEN = OriginalWebSocket.OPEN;
        window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
        window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    }

    function interceptMessageEvent() {
        const original = MessageEvent.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(original, 'data');
        if (!descriptor || descriptor.configurable === false) return;

        const getData = descriptor.get || function () { return this._data || descriptor.value; };

        Object.defineProperty(original, 'data', {
            configurable: true,
            get: function () {
                const value = getData.call(this);
                try {
                    const payload = JSON.parse(value);
                    if (payload.channel === CHANNEL && isAllowedTopic(payload.topic)) {
                        const redacted = redact(payload);
                        console.log('[autodarts-bridge-sender] weitergeleitet (MessageEvent):', redacted.topic);
                        sendToBridge(redacted);
                    }
                } catch {
                    // Nicht-JSON-Nachrichten ignorieren
                }
                return value;
            },
        });
    }

    if (window.WebSocket) interceptWebSocket();
    interceptMessageEvent();
    console.log('[autodarts-bridge-sender] Aktiv. Leitet erlaubte autodarts.matches-Topics an', BRIDGE_URL, 'weiter.');
})();
