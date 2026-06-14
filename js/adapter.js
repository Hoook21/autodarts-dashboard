/**
 * Autodarts Dashboard — Read-only Live-Adapter
 *
 * Empfängt Live-Daten aus der Autodarts-Umgebung (z. B. per postMessage
 * oder lokalem WebSocket) und mappt sie auf das interne Dashboard-Modell.
 *
 * Dieser Adapter ist bewusst passiv/read-only:
 * - Er schreibt nicht in Autodarts.
 * - Er ersetzt keine Original-Funktionen.
 * - Er verarbeitet nur Daten, die bereits im Browser/Frontend vorliegen.
 *
 * Siehe docs/autodarts-tools-research.md für die Datenquellen-Recherche.
 */

(function (global) {
    'use strict';

    const CHANNEL = 'autodarts.matches';
    const MATCH_TOPICS = ['state', 'events', 'game-events', 'corrections'];

    class AutodartsLiveAdapter {
        constructor(config = {}) {
            this.config = config;
            this.listeners = new Set();
            this.boundReceiveMessage = this.receiveMessage.bind(this);
        }

        onUpdate(callback) {
            this.listeners.add(callback);
            return () => this.listeners.delete(callback);
        }

        emit(data) {
            this.listeners.forEach((cb) => {
                try {
                    cb(data);
                } catch (err) {
                    console.error('Live-Adapter listener error:', err);
                }
            });
        }

        /**
         * Versucht, eine eingehende Nachricht als Autodarts-Match-Event zu parsen.
         * Akzeptiert u. a. diese Formen:
         *   { channel: 'autodarts.matches', data: IMatch }
         *   { type: 'autodarts.matches', payload: IMatch }
         *   { channel: 'autodarts.matches', topic: '<matchId>.state', data: IMatch }
         *   { channel: 'autodarts.matches', topic: '<matchId>.events', data: { match: IMatch } }
         */
        receiveMessage(event) {
            const payload = this.parsePayload(event?.data);
            if (!payload || typeof payload !== 'object') return;

            const channel = payload.channel || payload.type;
            const topic = payload.topic || payload.subject || payload.event;
            const rawData = payload.data || payload.payload || payload.match || payload.state;

            if (!this.isMatchEnvelope(channel, topic) || !rawData || typeof rawData !== 'object') return;

            const match = this.extractMatch(rawData);
            if (!match) return;

            const mapped = this.mapMatchToDashboard(match);
            if (mapped) {
                this.emit(mapped);
            }
        }

        parsePayload(payload) {
            if (typeof payload !== 'string') return payload;
            try {
                return JSON.parse(payload);
            } catch {
                return null;
            }
        }

        isMatchEnvelope(channel, topic) {
            if (channel === CHANNEL) return true;
            if (typeof topic !== 'string') return false;
            if (topic.startsWith(`${CHANNEL}.`)) return true;

            // Autodarts Play nutzt nach aktuellem Capture-Befund Topics wie
            // <matchId>.state / <matchId>.events unter dem Channel
            // autodarts.matches. Falls eine Bridge nur das Topic weitergibt,
            // akzeptieren wir die bekannten Match-Endungen ebenfalls.
            return MATCH_TOPICS.some((suffix) => topic.endsWith(`.${suffix}`));
        }

        extractMatch(data) {
            if (Array.isArray(data?.players)) return data;
            if (Array.isArray(data?.match?.players)) return data.match;
            if (Array.isArray(data?.state?.players)) return data.state;
            if (Array.isArray(data?.payload?.players)) return data.payload;
            return null;
        }

        /**
         * Mappt ein Autodarts-IMatch-Objekt auf das Dashboard-Datenmodell.
         */
        mapMatchToDashboard(match) {
            if (!match || !Array.isArray(match.players)) {
                console.warn('Live-Adapter: unerwartetes Match-Payload', match);
                return null;
            }

            const activeIndex = typeof match.player === 'number' ? match.player : 0;

            const players = match.players.map((p, i) => {
                const name = p?.name || p?.user?.name || `Spieler ${i + 1}`;
                const stats = Array.isArray(match.stats) ? match.stats[i] : null;
                const avg = stats?.average ?? stats?.dartsAverage ?? null;

                return {
                    name,
                    score: this.extractScore(match, p, i),
                    last: this.extractLastTurn(match, i),
                    avg,
                    busted: i === activeIndex ? match.turnBusted ?? false : false,
                };
            });

            return {
                type: 'throw',
                activePlayer: activeIndex,
                players,
                raw: match,
                gameFinished: !!match.gameFinished,
                gameWinner: typeof match.gameWinner === 'number' ? match.gameWinner : null,
            };
        }

        extractScore(match, player, index) {
            if (Array.isArray(match.scores) && typeof match.scores[index] === 'number') {
                return match.scores[index];
            }
            if (Array.isArray(match.gameScores)) {
                const gameScore = match.gameScores[index];
                if (typeof gameScore === 'number') return gameScore;
                if (typeof gameScore?.score === 'number') return gameScore.score;
                if (typeof gameScore?.points === 'number') return gameScore.points;
            }
            return player?.score ?? player?.points ?? null;
        }

        /**
         * Extrahiert die letzte vollständige Aufnahme eines Spielers.
         */
        extractLastTurn(match, playerIndex) {
            const turns = Array.isArray(match.turns) ? match.turns : [];
            const playerTurns = turns.filter((t) => t?.player === playerIndex);
            const last = playerTurns[playerTurns.length - 1];
            if (!last) return [];
            if (Array.isArray(last.throws)) {
                return last.throws.map((t) => t?.score ?? t).filter((s) => typeof s === 'number');
            }
            return typeof last.score === 'number' ? [last.score] : [];
        }

        /**
         * Startet den Empfang per postMessage.
         * Sinnvoll, wenn eine Browser-Extension die Daten an das Dashboard-Parent weiterleitet.
         */
        listenPostMessage() {
            window.addEventListener('message', this.boundReceiveMessage);
            console.log('Live-Adapter: listening for postMessage on', CHANNEL);
        }

        stopPostMessage() {
            window.removeEventListener('message', this.boundReceiveMessage);
        }

        /**
         * Minimaler lokaler WebSocket-Client für eine Bridge/Proxy-Lösung.
         */
        connectBridge(url) {
            if (!url || typeof WebSocket === 'undefined') return;
            this.ws = new WebSocket(url);

            this.ws.addEventListener('message', (event) => {
                let data;
                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }
                this.receiveMessage({ data });
            });

            this.ws.addEventListener('close', () => {
                console.warn('Live-Adapter Bridge geschlossen — reconnect in 3s');
                setTimeout(() => this.connectBridge(url), 3000);
            });
        }
    }

    global.AutodartsLiveAdapter = AutodartsLiveAdapter;
})(window);
