/**
 * Autodarts Dashboard — Configuration
 */
const CONFIG = {
    // Autodarts board ID or API endpoint
    boardId: null,
    apiBase: 'https://api.autodarts.io',
    wsUrl: 'wss://api.autodarts.io/v0/boards/{boardId}/events',

    // Default match settings
    startScore: 501,

    // Layout toggles
    showBoard: true,
    showStats: true,

    // Debug / offline development
    useMockData: true,
    mockUpdateIntervalMs: 3000,
};
