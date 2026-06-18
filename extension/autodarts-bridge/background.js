/**
 * Autodarts Dashboard Bridge — WebExtension background bridge.
 *
 * Receives redacted match payloads from the content script and forwards them to
 * the local dashboard bridge. Keeping the localhost WebSocket here avoids
 * Safari mixed-content blocking in the https://play.autodarts.io page context.
 */
(function () {
    'use strict';

    const BRIDGE_URL = 'ws://localhost:9876';
    const MESSAGE_TYPE = 'autodarts-dashboard-bridge:payload';

    const state = {
        ws: null,
        opened: false,
        queue: [],
    };

    function ensureBridge() {
        if (state.ws && (state.ws.readyState === WebSocket.CONNECTING || state.ws.readyState === WebSocket.OPEN)) {
            return;
        }

        try {
            state.ws = new WebSocket(BRIDGE_URL);
            state.opened = false;

            state.ws.addEventListener('open', function () {
                state.opened = true;
                console.info('[autodarts-dashboard-bridge] background bridge connected');
                while (state.queue.length) {
                    state.ws.send(JSON.stringify(state.queue.shift()));
                }
            });

            state.ws.addEventListener('close', function () {
                state.opened = false;
                state.ws = null;
                console.warn('[autodarts-dashboard-bridge] background bridge disconnected');
            });

            state.ws.addEventListener('error', function (err) {
                console.warn('[autodarts-dashboard-bridge] background bridge error', err);
            });
        } catch (err) {
            console.error('[autodarts-dashboard-bridge] background bridge connection failed', err);
        }
    }

    function sendToBridge(payload) {
        ensureBridge();
        if (state.opened && state.ws && state.ws.readyState === WebSocket.OPEN) {
            state.ws.send(JSON.stringify(payload));
        } else {
            state.queue.push(payload);
            if (state.queue.length > 50) state.queue.shift();
        }
    }

    const runtime = (typeof browser !== 'undefined' && browser.runtime) || (typeof chrome !== 'undefined' && chrome.runtime);
    if (runtime && runtime.onMessage) {
        runtime.onMessage.addListener(function (message) {
            if (!message || message.type !== MESSAGE_TYPE || !message.payload) return;
            sendToBridge(message.payload);
        });
    }

    ensureBridge();
})();
