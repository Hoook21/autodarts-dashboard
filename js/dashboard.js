/**
 * Autodarts Dashboard — UI logic
 */

(function () {
    'use strict';

    function getParams() {
        return new URLSearchParams(window.location.search);
    }

    function resolveLayout() {
        const params = getParams();
        const fromUrl = params.get('layout');
        if (fromUrl && CONFIG.availableLayouts.includes(fromUrl)) {
            return fromUrl;
        }
        return CONFIG.layout || 'balanced';
    }

    function applyRuntimeParams() {
        const params = getParams();
        CONFIG.layout = resolveLayout();

        if (['1', 'true', 'yes'].includes((params.get('mock') || '').toLowerCase())) {
            CONFIG.useMockData = true;
        }

        if (['0', 'false', 'no'].includes((params.get('mock') || '').toLowerCase())) {
            CONFIG.useMockData = false;
        }

        const bridgeUrl = params.get('bridge');
        if (bridgeUrl) CONFIG.liveAdapterBridgeUrl = bridgeUrl;
    }

    applyRuntimeParams();

    const api = new AutodartsAPI(CONFIG);

    function applyLayout() {
        const grid = document.querySelector('.main-grid');
        if (!grid) return;
        grid.classList.remove('layout-balanced', 'layout-score-first', 'layout-webview-sidepanel', 'layout-big-type', 'layout-webview-big-readable');
        const layout = CONFIG.layout || 'balanced';
        grid.classList.add(`layout-${layout}`);
        document.documentElement.dataset.layout = layout;
    }

    function calculateCheckout(score) {
        if (score <= 170 && score > 1) {
            // Bekannte einfache Checkout-Map; Platz für echte Logik.
            const simple = {
                170: 'T20 T20 Bull',
                167: 'T20 T19 Bull',
                164: 'T20 T18 Bull',
                161: 'T20 T17 Bull',
                160: 'T20 T20 D20',
                158: 'T20 T20 D19',
                157: 'T20 T19 D20',
                156: 'T20 T20 D18',
                155: 'T20 T19 D19',
                154: 'T20 T18 D20',
                153: 'T20 T19 D18',
                152: 'T20 T20 D16',
                151: 'T20 T17 D20',
                150: 'T20 T18 D18',
                149: 'T20 T19 D16',
                148: 'T20 T16 D20',
                147: 'T20 T17 D18',
                146: 'T20 T18 D16',
                145: 'T20 T15 D20',
                144: 'T20 T20 D12',
                143: 'T20 T17 D16',
                142: 'T20 T14 D20',
                141: 'T20 T19 D12',
                140: 'T20 T20 D10',
                139: 'T19 T14 D20',
                138: 'T20 T18 D12',
                137: 'T20 T15 D16',
                136: 'T20 T20 D8',
                135: 'T20 T13 D18',
                134: 'T20 T14 D16',
                133: 'T20 T19 D8',
                132: 'T20 T16 D12',
                131: 'T20 T13 D16',
                130: 'T20 T20 D5',
                129: 'T20 T19 D6',
                128: 'T20 T20 D4',
                127: 'T20 T17 D8',
                126: 'T20 T16 D9',
                125: 'T20 T19 D4',
                124: 'T20 T16 D8',
                123: 'T20 T13 D12',
                122: 'T20 T12 D13',
                121: 'T20 T11 D14',
                120: 'T20 20 D20',
                119: 'T19 T20 D1',
                118: 'T20 18 D20',
                117: 'T20 17 D20',
                116: 'T20 16 D20',
                115: 'T20 15 D20',
                114: 'T20 14 D20',
                113: 'T20 13 D20',
                112: 'T20 12 D20',
                111: 'T19 Bull D2',
                110: 'T20 10 D20',
                109: 'T20 9 D20',
                108: 'T18 Bull D2',
                107: 'T20 15 D16',
                106: 'T20 14 D16',
                105: 'T17 Bull D2',
                104: 'T18 18 D16',
                103: 'T20 3 D20',
                102: 'T20 10 D16',
                101: 'T20 1 D20',
                100: 'T20 D20',
                99: 'T19 10 D16',
                98: 'T20 D19',
                97: 'T19 D20',
                96: 'T20 D18',
                95: 'T19 D19',
                94: 'T18 D20',
                93: 'D17 T19 D1',
                92: 'T20 D16',
                91: 'T17 D20',
                90: 'T20 D15',
                89: 'T19 D16',
                88: 'T20 D14',
                87: 'T17 D18',
                86: 'T18 D16',
                85: 'T15 D20',
                84: 'T20 D12',
                83: 'T17 D16',
                82: 'T14 D20',
                81: 'T19 D12',
                80: 'T20 D10',
                79: 'T13 D20',
                78: 'T18 D12',
                77: 'T19 D10',
                76: 'T20 D8',
                75: 'T17 D12',
                74: 'T14 D16',
                73: 'T19 D8',
                72: 'T12 D18',
                71: 'T13 D16',
                70: 'T20 D5',
                69: 'T19 D6',
                68: 'T18 D7',
                67: 'T17 D8',
                66: 'T16 D9',
                65: 'T15 D10',
                64: 'T16 D8',
                63: 'T13 D12',
                62: 'T10 D16',
                61: 'T15 D8',
                60: '20 D20',
                59: '19 D20',
                58: '18 D20',
                57: '17 D20',
                56: '16 D20',
                55: '15 D20',
                54: '14 D20',
                53: '13 D20',
                52: '12 D20',
                51: '11 D20',
                50: 'Bull',
                49: '9 D20',
                48: '16 D16',
                47: '15 D16',
                46: '6 D20',
                45: '13 D16',
                44: '12 D16',
                43: '11 D16',
                42: '10 D16',
                41: '9 D16',
                40: 'D20',
                39: '7 D16',
                38: 'D19',
                37: '5 D16',
                36: 'D18',
                35: '3 D16',
                34: 'D17',
                33: '1 D16',
                32: 'D16',
                31: '7 D12',
                30: 'D15',
                29: '13 D8',
                28: 'D14',
                27: '11 D8',
                26: 'D13',
                25: '9 D8',
                24: 'D12',
                23: '7 D8',
                22: 'D11',
                21: '5 D8',
                20: 'D10',
                19: '3 D8',
                18: 'D9',
                17: '1 D8',
                16: 'D8',
                15: '7 D4',
                14: 'D7',
                13: '5 D4',
                12: 'D6',
                11: '3 D4',
                10: 'D5',
                9: '1 D4',
                8: 'D4',
                7: '3 D2',
                6: 'D3',
                5: '1 D2',
                4: 'D2',
                3: '1 D1',
                2: 'D1',
            };
            if (simple[score]) return simple[score];
        }
        return '—';
    }

    const els = {
        status: document.getElementById('match-status'),
        checkout: document.getElementById('checkout-display'),
        score1: document.getElementById('score-1'),
        score2: document.getElementById('score-2'),
        avg1: document.getElementById('avg-1'),
        avg2: document.getElementById('avg-2'),
        last1: document.getElementById('last-1'),
        last2: document.getElementById('last-2'),
        p1: document.getElementById('player-1'),
        p2: document.getElementById('player-2'),
        throwsList: document.getElementById('last-throws'),
    };

    function updateCard(index, player) {
        const scoreEl = index === 0 ? els.score1 : els.score2;
        const avgEl = index === 0 ? els.avg1 : els.avg2;
        const lastEl = index === 0 ? els.last1 : els.last2;
        const card = index === 0 ? els.p1 : els.p2;

        if (!scoreEl || !avgEl || !lastEl || !card) return;

        scoreEl.textContent = player.score ?? '—';
        avgEl.textContent = player.avg ?? '—';
        lastEl.textContent = Array.isArray(player.last) && player.last.length ? player.last.join(' · ') : '—';

        card.querySelector('.player-name').textContent = player.name || `Spieler ${index + 1}`;
        card.classList.toggle('active', index === window.__activePlayer);
    }

    function setWaitingState(message = 'Warte auf Autodarts-Daten') {
        updateCard(0, { name: 'Autodarts', score: '—', avg: '—', last: [] });
        updateCard(1, { name: 'Live-Daten', score: '—', avg: '—', last: [] });
        els.p1.classList.add('active');
        els.p2.classList.remove('active');
        if (els.checkout) els.checkout.textContent = '—';
        if (els.throwsList) {
            els.throwsList.replaceChildren();
            const li = document.createElement('li');
            li.textContent = 'Keine Mock-Würfe aktiv';
            els.throwsList.appendChild(li);
        }
        els.status.textContent = message;
    }

    function updateCheckout(activePlayer) {
        if (!els.checkout) return;
        const score = Number(activePlayer?.score);
        els.checkout.textContent = Number.isFinite(score) ? calculateCheckout(score) : '—';
    }

    function updateThrows(players, activeIndex) {
        const active = players[activeIndex];
        const items = active.last.length
            ? active.last.map((s) => `P${activeIndex + 1}: ${s}`).reverse()
            : ['—'];

        // DOM-Nodes mit textContent verwenden, damit WebSocket-Payloads
        // keine HTML-Injection in die Letzte-Würfe-Liste bringen können.
        els.throwsList.replaceChildren();
        items.forEach((t) => {
            const li = document.createElement('li');
            li.textContent = t;
            els.throwsList.appendChild(li);
        });
    }

    api.onMessage((data) => {
        if (!data) return;

        if (data.type === 'status' && !Array.isArray(data.players)) {
            setWaitingState(data.message);
            return;
        }

        if (!Array.isArray(data.players) || data.players.length === 0) {
            setWaitingState(data.message);
            return;
        }

        window.__activePlayer = data.activePlayer ?? 0;

        data.players.slice(0, 2).forEach((p, i) => updateCard(i, p));
        updateThrows(data.players, window.__activePlayer);
        updateCheckout(data.players[window.__activePlayer]);

        els.status.textContent = CONFIG.useMockData
            ? `Mock: ${data.players[window.__activePlayer].name}`
            : `Am Zug: ${data.players[window.__activePlayer].name}`;
    });

    document.addEventListener('DOMContentLoaded', () => {
        applyLayout();
        els.status.textContent = CONFIG.useMockData ? 'Mock-Daten aktiv' : 'Warte auf Autodarts-Daten';
        if (!CONFIG.useMockData) setWaitingState();
        api.connect();
    });
})();
