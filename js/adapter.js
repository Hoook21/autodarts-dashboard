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
            if (this.looksLikeMatch(data)) return data;
            if (this.looksLikeMatch(data?.body)) return data.body;
            if (this.looksLikeMatch(data?.match)) return data.match;
            if (this.looksLikeMatch(data?.state)) return data.state;
            if (this.looksLikeMatch(data?.payload)) return data.payload;
            if (this.looksLikeMatch(data?.data?.body)) return data.data.body;
            return null;
        }

        looksLikeMatch(value) {
            return !!value && typeof value === 'object' && (
                Array.isArray(value.players) ||
                Array.isArray(value.turns) ||
                typeof value.score === 'number' ||
                typeof value.turnScore === 'number'
            );
        }

        /**
         * Mappt ein Autodarts-Match-Objekt auf das Dashboard-Datenmodell.
         * Unterstützt sowohl ältere IMatch-ähnliche Payloads als auch die in
         * Safari beobachtete Single-Player-Form unter data.body.
         */
        mapMatchToDashboard(match) {
            if (!match || typeof match !== 'object') {
                console.warn('Live-Adapter: unerwartetes Match-Payload', match);
                return null;
            }

            const sourcePlayers = this.extractPlayers(match);
            if (!sourcePlayers.length) {
                console.warn('Live-Adapter: Match-Payload ohne Spieler', match);
                return null;
            }

            const activeIndex = this.extractActivePlayerIndex(match, sourcePlayers);

            const players = sourcePlayers.map((p, i) => {
                const name = p?.name || p?.user?.name || match.host?.name || `Spieler ${i + 1}`;
                const stats = Array.isArray(match.stats) ? match.stats[i] : null;
                const avg = stats?.average ?? stats?.dartsAverage ?? p?.average ?? match.first9Average ?? null;

                return {
                    name,
                    score: this.extractScore(match, p, i),
                    last: this.extractLastTurn(match, p, i),
                    avg,
                    busted: i === activeIndex ? match.turnBusted ?? false : false,
                    turnScore: i === activeIndex && typeof match.turnScore === 'number' ? match.turnScore : null,
                };
            });

            return {
                type: 'throw',
                activePlayer: activeIndex,
                players,
                raw: match,
                gameFinished: !!match.gameFinished || this.hasWinner(match),
                gameWinner: this.extractWinner(match),
            };
        }

        extractPlayers(match) {
            if (Array.isArray(match.players) && match.players.length) return match.players;
            if (match.host) return [match.host];
            return [];
        }

        extractActivePlayerIndex(match, players) {
            if (typeof match.player === 'number') return match.player;
            if (typeof match.activePlayer === 'number') return match.activePlayer;
            const activePlayerId = match.activePlayerId || match.playerId;
            if (activePlayerId) {
                const index = players.findIndex((p) => p?.id === activePlayerId || p?.user?.id === activePlayerId);
                if (index >= 0) return index;
            }
            return 0;
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
            if (typeof player?.score === 'number') return player.score;
            if (typeof player?.points === 'number') return player.points;

            // Safari-Capture 2026-06-14: Single-Player-X01-Payload mit
            // Restscore direkt auf Match-Ebene.
            if (index === 0 && typeof match.score === 'number') return match.score;
            return null;
        }

        /**
         * Extrahiert die letzte vollständige Aufnahme eines Spielers.
         */
        extractLastTurn(match, player, playerIndex) {
            const turns = Array.isArray(match.turns) ? match.turns : [];
            const playerId = player?.id || player?.user?.id;
            const playerTurns = turns.filter((t) => {
                if (typeof t?.player === 'number') return t.player === playerIndex;
                if (t?.playerId && playerId) return t.playerId === playerId;
                return playerIndex === 0;
            });
            const last = playerTurns[playerTurns.length - 1];
            if (!last) return typeof match.turnScore === 'number' && playerIndex === 0 ? [match.turnScore] : [];
            if (Array.isArray(last.throws) && last.throws.length) {
                return last.throws.map((t) => this.formatThrow(t)).filter(Boolean);
            }
            if (typeof last.points === 'number') return [last.points];
            if (typeof last.score === 'number') return [last.score];
            return typeof match.turnScore === 'number' && playerIndex === 0 ? [match.turnScore] : [];
        }

        formatThrow(throwData) {
            if (typeof throwData === 'number') return throwData;
            if (typeof throwData?.score === 'number') return throwData.score;
            if (typeof throwData?.points === 'number') return throwData.points;
            if (typeof throwData?.segment?.name === 'string') return throwData.segment.name;
            if (typeof throwData?.segment?.number === 'number') {
                const multiplier = throwData.segment.multiplier || 1;
                const prefix = multiplier === 3 ? 'T' : multiplier === 2 ? 'D' : 'S';
                return `${prefix}${throwData.segment.number}`;
            }
            return null;
        }

        hasWinner(match) {
            const winner = this.extractWinner(match);
            return winner !== null && winner !== undefined && winner !== false;
        }

        extractWinner(match) {
            if (typeof match.gameWinner === 'number') return match.gameWinner;
            if (typeof match.winner === 'number') return match.winner;
            if (typeof match.winner === 'string') return match.winner;
            return null;
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
