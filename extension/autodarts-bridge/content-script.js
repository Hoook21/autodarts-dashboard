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
        if (document.getElementById(SCRIPT_ID)) return;

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = runtimeUrl('page-bridge-sender.js');
        script.async = false;
        script.dataset.autodartsDashboardBridge = 'true';

        const target = document.documentElement || document.head || document.body;
        if (target) {
            target.appendChild(script);
        }
    }

    try {
        inject();
    } catch (err) {
        console.error('[autodarts-dashboard-bridge] injection failed:', err);
    }
})();
