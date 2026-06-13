/**
 * Autodarts Dashboard — Configuration
 */
const CONFIG = {
    // Autodarts board ID or API endpoint
    boardId: null,

    // ⚠️ API / WebSocket URLs sind Platzhalter.
    // Die echte Autodarts-Schnittstelle ist noch in Issue #3 zu klären.
    // Solange bleibt useMockData = true der sichere Standard.
    apiBase: 'https://api.autodarts.io',
    wsUrl: 'wss://api.autodarts.io/v0/boards/{boardId}/events', // PLACEHOLDER

    // Default match settings
    startScore: 501,

    // Layout toggles
    // Verfügbare Layouts: 'balanced', 'score-first', 'webview-sidepanel', 'big-type', 'webview-big-readable'
    // Kann überschrieben werden per URL-Parameter, z.B. ?layout=score-first
    layout: 'webview-big-readable',
    availableLayouts: ['balanced', 'score-first', 'webview-sidepanel', 'big-type', 'webview-big-readable'],
    showBoard: true,
    showStats: true,

    // Webview embedding options
    // Wenn gesetzt, wird die URL statt des Platzhalters in einem iframe geladen.
    // Achtung: Kann CSP / X-Frame-Options / Auth blockieren. Siehe Issue #8 / #18.
    webviewUrl: null,

    // Camera/image fallback options
    // Wenn gesetzt, wird dieses Bild statt iframe/Platzhalter im linken Panel angezeigt.
    // Praktisch für lokale Autodarts-Kamera-Screenshots, bis die echte Webview-Session stabil eingebettet ist.
    cameraImageUrl: null,

    // Debug / offline development
    // Default: keine Fake-Würfe im echten Board-Test.
    // Mock-Daten nur explizit per ?mock=1 oder CONFIG.useMockData = true aktivieren.
    useMockData: false,
    allowMockFallback: false,
    mockUpdateIntervalMs: 3000,

    // Live-Adapter / Bridge
    // Wenn gesetzt, verbindet der Adapter sich mit diesem lokalen WebSocket.
    // Siehe docs/autodarts-tools-research.md und Issue #31.
    liveAdapterBridgeUrl: null,
};
