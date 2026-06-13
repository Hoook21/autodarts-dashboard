/**
 * Autodarts Dashboard — API / WebSocket layer
 * Handles live connection to Autodarts or falls back to mock data.
 */

(function (global) {
    'use strict';

    class AutodartsAPI {
        constructor(config) {
            this.config = config;
            this.ws = null;
            this.adapter = null;
            this.listeners = new Set();
        }

        onMessage(callback) {
            this.listeners.add(callback);
            return () => this.listeners.delete(callback);
        }

        emit(data) {
            this.listeners.forEach((cb) => {
                try {
                    cb(data);
                } catch (err) {
                    console.error('Listener error:', err);
                }
            });
        }

        connect() {
            // 1) Live-Adapter/Bridge bevorzugt nutzen, wenn konfiguriert
            if (this.config.liveAdapterBridgeUrl || typeof window.AutodartsLiveAdapter !== 'undefined') {
                this.connectLiveAdapter();
                return;
            }

            if (this.config.useMockData) {
                this.startMockStream();
                return;
            }

            if (!this.config.boardId) {
                console.warn('No boardId set — live Autodarts data not connected.');
                this.emit({
                    type: 'status',
                    status: 'not-connected',
                    message: 'Warte auf Autodarts-Daten',
                    players: this.config.initialPlayers || [],
                });
                return;
            }

            const url = this.config.wsUrl.replace('{boardId}', this.config.boardId);
            this.ws = new WebSocket(url);

            this.ws.addEventListener('open', () => {
                console.log('Autodarts WS connected');
            });

            this.ws.addEventListener('message', (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch {
                    data = { raw: event.data };
                }
                this.emit(data);
            });

            this.ws.addEventListener('close', () => {
                console.warn('Autodarts WS closed — retrying in 3s');
                setTimeout(() => this.connect(), 3000);
            });

            this.ws.addEventListener('error', (err) => {
                console.error('Autodarts WS error:', err);
            });
        }

        startMockStream() {
            console.log('Using mock data stream');
            if (this.mockTimer) clearInterval(this.mockTimer);

            const players = [
                { name: 'Spieler 1', score: 501, last: [], avg: 0 },
                { name: 'Spieler 2', score: 501, last: [], avg: 0 },
            ];

            const throws = [60, 57, 26, 100, 45, 83, 20, 140, 12, 81];

            this.mockTimer = setInterval(() => {
                const activeIndex = Math.floor(Date.now() / 3000) % 2;
                const player = players[activeIndex];
                const score = throws[Math.floor(Math.random() * throws.length)];

                player.last.push(score);
                if (player.last.length > 3) player.last.shift();
                player.score = Math.max(0, player.score - score);
                player.avg = (player.last.reduce((a, b) => a + b, 0) / player.last.length).toFixed(1);

                this.emit({
                    type: 'throw',
                    activePlayer: activeIndex,
                    players: players.map((p) => ({ ...p })),
                });
            }, this.config.mockUpdateIntervalMs);
        }

        connectLiveAdapter() {
            if (!window.AutodartsLiveAdapter) {
                console.warn('AutodartsLiveAdapter nicht geladen.');
                return;
            }

            this.adapter = new window.AutodartsLiveAdapter(this.config);
            this.adapter.onUpdate((data) => this.emit(data));

            if (this.config.liveAdapterBridgeUrl) {
                this.adapter.connectBridge(this.config.liveAdapterBridgeUrl);
                console.log('Live-Adapter Bridge verbunden:', this.config.liveAdapterBridgeUrl);
            } else {
                this.adapter.listenPostMessage();
            }
        }
    }

    global.AutodartsAPI = AutodartsAPI;
})(window);
