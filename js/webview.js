/**
 * Autodarts Dashboard — Webview / camera fallback embedding
 */
(function () {
    'use strict';

    function getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    function isAllowedUrl(value) {
        if (!value) return false;
        try {
            const url = new URL(value, window.location.href);
            return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:';
        } catch {
            return false;
        }
    }

    function resolveWebviewUrl() {
        const fromUrl = getUrlParam('webview');
        if (fromUrl) {
            if (isAllowedUrl(fromUrl)) return fromUrl;
            console.warn('Ungültiger webview-URL-Parameter:', fromUrl);
        }
        return CONFIG.webviewUrl || null;
    }

    function resolveCameraImageUrl() {
        const fromUrl = getUrlParam('cameraImage') || getUrlParam('camera');
        if (fromUrl) {
            if (isAllowedUrl(fromUrl)) return fromUrl;
            console.warn('Ungültiger cameraImage-URL-Parameter:', fromUrl);
        }
        return CONFIG.cameraImageUrl || null;
    }

    function getPanel() {
        const panel = document.querySelector('.webview-panel');
        const placeholder = panel && panel.querySelector('.webview-placeholder');
        if (!panel || !placeholder) {
            console.warn('Keine .webview-panel/.webview-placeholder gefunden.');
            return null;
        }
        return { panel, placeholder };
    }

    function embedCameraImage(imageUrl) {
        const target = getPanel();
        if (!target) return;

        const stage = document.createElement('div');
        stage.className = 'camera-stage';

        const img = document.createElement('img');
        img.className = 'camera-image';
        img.src = imageUrl;
        img.alt = 'Autodarts Kamerabild';

        const label = document.createElement('div');
        label.className = 'camera-label';
        label.textContent = 'Autodarts Kamera';

        stage.append(img, label);
        target.placeholder.replaceWith(stage);
    }

    function embedWebview(webviewUrl) {
        const target = getPanel();
        if (!target) return;

        const iframe = document.createElement('iframe');
        iframe.className = 'webview-iframe';
        iframe.src = webviewUrl;
        iframe.title = 'Autodarts Webansicht';
        iframe.setAttribute('allow', 'autoplay; camera; fullscreen');
        iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
        iframe.loading = 'eager';
        iframe.referrerPolicy = 'no-referrer';

        iframe.addEventListener('error', () => {
            console.error('Webview iframe konnte nicht geladen werden:', webviewUrl);
        });

        target.placeholder.replaceWith(iframe);
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

    document.addEventListener('DOMContentLoaded', () => {
        logFrameBlocker();
        const cameraImageUrl = resolveCameraImageUrl();
        if (cameraImageUrl) {
            embedCameraImage(cameraImageUrl);
            return;
        }

        const webviewUrl = resolveWebviewUrl();
        if (webviewUrl) embedWebview(webviewUrl);
    });
})();
