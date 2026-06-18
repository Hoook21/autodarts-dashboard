/**
 * Autodarts Dashboard Bridge — WebExtension content script.
 *
 * Runs at document_start on play.autodarts.io and injects the page-context
 * bridge sender before Autodarts opens its own WebSocket. A normal content
 * script cannot monkey-patch the page's WebSocket constructor because it runs
 * in an isolated world, so this tiny loader appends a web-accessible script
 * into the page context.
 */
(function () {
    'use strict';

    const SCRIPT_ID = 'autodarts-dashboard-bridge-page-sender';

    const MESSAGE_TYPE = 'autodarts-dashboard-bridge:payload';

    function sendToBackground(payload) {
        const runtime = (typeof browser !== 'undefined' && browser.runtime) || (typeof chrome !== 'undefined' && chrome.runtime);
        if (!runtime || !runtime.sendMessage) {
            const target = document.documentElement || document.head || document.body;
            if (target) target.setAttribute('data-autodarts-dashboard-bridge-content-bridge', 'no-runtime');
            return;
        }
        try {
            runtime.sendMessage({ type: MESSAGE_TYPE, payload });
            const target = document.documentElement || document.head || document.body;
            if (target) {
                target.setAttribute('data-autodarts-dashboard-bridge-content-bridge', 'background');
                target.setAttribute('data-autodarts-dashboard-bridge-content-queue', '0');
            }
        } catch (err) {
            const target = document.documentElement || document.head || document.body;
            if (target) target.setAttribute('data-autodarts-dashboard-bridge-content-bridge', 'send-error');
            console.warn('[autodarts-dashboard-bridge] sendMessage failed', err);
        }
    }

    window.addEventListener('message', function (event) {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.type !== MESSAGE_TYPE || !data.payload) return;
        sendToBackground(data.payload);
    });

    function runtimeUrl(path) {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            return chrome.runtime.getURL(path);
        }
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getURL) {
            return browser.runtime.getURL(path);
        }
        throw new Error('No WebExtension runtime API available');
    }

    function inject() {
        if (document.getElementById(SCRIPT_ID)) return true;

        const target = document.documentElement || document.head || document.body;
        if (!target) return false;

        target.setAttribute('data-autodarts-dashboard-bridge-content-script', 'loaded');
        console.info('[autodarts-dashboard-bridge] content script loaded');

        try {
            const originalTitle = document.title;
            document.title = '[ADB EXT LOADED] ' + originalTitle;
            setTimeout(function () {
                if (document.title.indexOf('[ADB EXT LOADED] ') === 0) {
                    document.title = document.title.slice('[ADB EXT LOADED] '.length);
                }
            }, 4000);
        } catch (err) {
            // Best-effort visible diagnostic only.
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = runtimeUrl('page-bridge-sender.js');
        script.async = false;
        script.dataset.autodartsDashboardBridge = 'true';
        script.onload = function () { console.info('[autodarts-dashboard-bridge] page sender loaded'); };
        script.onerror = function (err) { console.error('[autodarts-dashboard-bridge] page sender failed to load', err); };

        target.appendChild(script);
        return true;
    }

    function injectWhenReady(attempt) {
        try {
            if (inject()) return;
        } catch (err) {
            console.error('[autodarts-dashboard-bridge] injection failed:', err);
            return;
        }

        if (attempt < 50) {
            setTimeout(function () { injectWhenReady(attempt + 1); }, 10);
        } else {
            console.error('[autodarts-dashboard-bridge] injection failed: no document target available');
        }
    }

    injectWhenReady(0);
})();
