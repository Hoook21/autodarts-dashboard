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
    // Verfügbare Layouts: 'balanced', 'score-first', 'webview-sidepanel'
    layout: 'webview-sidepanel',
    showBoard: true,
    showStats: true,

    // Debug / offline development
    useMockData: true,
    mockUpdateIntervalMs: 3000,
};
