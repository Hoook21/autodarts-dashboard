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

    const state = {
        ws: null,
        queue: [],
        opened: false,
        closed: false,
        seenEvents: new WeakSet(),
    };

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

    function ensureBridge() {
        if (state.ws && (state.ws.readyState === WebSocket.CONNECTING || state.ws.readyState === WebSocket.OPEN)) {
            return;
        }
        if (state.closed) return;

        try {
            state.ws = new WebSocket(BRIDGE_URL);
            state.opened = false;

            state.ws.addEventListener('open', () => {
                state.opened = true;
                console.log('[autodarts-bridge-sender] Bridge verbunden');
                while (state.queue.length) {
                    const item = state.queue.shift();
                    try {
                        state.ws.send(JSON.stringify(item));
                    } catch (err) {
                        console.error('[autodarts-bridge-sender] Sendefehler (flush):', err);
                    }
                }
            });

            state.ws.addEventListener('close', () => {
                state.opened = false;
                state.ws = null;
                console.warn('[autodarts-bridge-sender] Bridge getrennt');
            });

            state.ws.addEventListener('error', (err) => {
                console.warn('[autodarts-bridge-sender] Bridge-Fehler:', err);
            });
        } catch (err) {
            console.error('[autodarts-bridge-sender] Verbindungsfehler:', err);
        }
    }

    function sendToBridge(payload) {
        if (state.closed) return;
        ensureBridge();
        if (state.opened && state.ws && state.ws.readyState === WebSocket.OPEN) {
            try {
                state.ws.send(JSON.stringify(payload));
            } catch (err) {
                console.error('[autodarts-bridge-sender] Sendefehler:', err);
                state.queue.push(payload);
            }
        } else {
            state.queue.push(payload);
            if (state.queue.length > 50) state.queue.shift();
        }
    }

    function handlePayload(payload, source) {
        if (!payload || typeof payload !== 'object') return;
        if (payload.channel !== CHANNEL) return;
        if (!isAllowedTopic(payload.topic)) return;

        const redacted = redact(payload);
        console.log('[autodarts-bridge-sender] weitergeleitet (' + source + '):', redacted.topic);
        sendToBridge(redacted);
    }

    function interceptWebSocket() {
        const OriginalWebSocket = window.WebSocket;
        if (!OriginalWebSocket) return;

        window.WebSocket = function (...args) {
            const ws = new OriginalWebSocket(...args);
            ws.addEventListener('message', (event) => {
                if (state.seenEvents.has(event)) return;
                state.seenEvents.add(event);
                let payload;
                try {
                    payload = JSON.parse(event.data);
                } catch {
                    return;
                }
                handlePayload(payload, 'WebSocket');
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
                if (state.seenEvents.has(this)) return value;
                state.seenEvents.add(this);
                try {
                    const payload = JSON.parse(value);
                    handlePayload(payload, 'MessageEvent');
                } catch {
                    // Nicht-JSON-Nachrichten ignorieren
                }
                return value;
            },
        });
    }

    function teardown() {
        state.closed = true;
        if (state.ws) {
            try {
                state.ws.close();
            } catch (err) {
                // ignore
            }
        }
    }

    interceptWebSocket();
    interceptMessageEvent();
    ensureBridge();

    window.__autodartsBridgeSender = {
        active: true,
        teardown,
        stats: () => ({ queueLength: state.queue.length, connected: state.opened }),
    };

    console.log('[autodarts-bridge-sender] Aktiv. Leitet erlaubte autodarts.matches-Topics an', BRIDGE_URL, 'weiter.');
})();
