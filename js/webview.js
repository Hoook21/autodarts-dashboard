/**
 * Autodarts Dashboard — Webview embedding helper
 *
 * Lädt eine konfigurierte oder per URL-Parameter übergebene Webansicht
 * in den iframe der Webview-Fläche. Protokolliert Frame-Blocker, CSP- und
 * Ladefehler, damit Issue #8 / #18 reproduzierbar bleibt.
 */

(function () {
    'use strict';

    function resolveWebviewUrl() {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('webview');
        if (fromUrl) {
            // Einfache Sicherheit: Erlaube nur http/https-URLs, keine
            // javascript:- oder data:-Pseudo-Protokolle.
            if (/^https?:\/\//i.test(fromUrl)) {
                return fromUrl;
            }
            console.warn('Ungültiger webview-URL-Parameter (nur http/https erlaubt):', fromUrl);
        }
        return CONFIG.webviewUrl || null;
    }

    function replacePlaceholderWithIframe(url) {
        const panel = document.querySelector('.webview-panel');
        const placeholder = panel && panel.querySelector('.webview-placeholder');
        if (!panel || !placeholder) {
            console.warn('Keine .webview-panel/.webview-placeholder gefunden.');
            return;
        }

        const iframe = document.createElement('iframe');
        iframe.className = 'webview-iframe';
        iframe.src = url;
        iframe.title = 'Autodarts Webansicht';
        iframe.setAttribute('allow', 'autoplay; camera; fullscreen');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
        iframe.setAttribute('loading', 'eager');

        iframe.addEventListener('error', () => {
            console.error('Webview iframe konnte nicht geladen werden:', url);
        });

        iframe.addEventListener('load', () => {
            try {
                // Cross-origin: Inhalt der Seite ist nicht lesbar.
                // Nur erreichbar, wenn iframe same-origin läuft.
                const loc = iframe.contentWindow && iframe.contentWindow.location;
                console.log('Webview iframe geladen. Sichtbare URL:', loc ? loc.href : '(cross-origin)');
            } catch (err) {
                console.log('Webview iframe geladen (cross-origin, URL nicht lesbar).');
            }
        });

        placeholder.replaceWith(iframe);
    }

    function logFrameBlocker() {
        window.addEventListener('securitypolicyviolation', (event) => {
            console.warn('CSP-Verletzung erkannt:', {
                documentURI: event.documentURI,
                violatedDirective: event.violatedDirective,
                blockedURI: event.blockedURI,
            });
        });
    }

    function initWebview() {
        const url = resolveWebviewUrl();
        if (!url) return;
        logFrameBlocker();
        replacePlaceholderWithIframe(url);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWebview);
    } else {
        initWebview();
    }
})();
