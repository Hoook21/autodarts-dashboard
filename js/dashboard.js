/**
 * Autodarts Dashboard — UI logic
 */

(function () {
    'use strict';

    function resolveLayout() {
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('layout');
        if (fromUrl && CONFIG.availableLayouts.includes(fromUrl)) {
            return fromUrl;
        }
        return CONFIG.layout || 'balanced';
    }

    CONFIG.layout = resolveLayout();

    const api = new AutodartsAPI(CONFIG);

    function applyLayout() {
        const grid = document.querySelector('.main-grid');
        if (!grid) return;
        grid.classList.remove('layout-balanced', 'layout-score-first', 'layout-webview-sidepanel', 'layout-big-type');
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
                136: 'T20 T20 D8',
                121: 'T20 T11 D14',
                120: 'T20 20 D20',
                100: 'T20 D20',
                81: 'T19 D12',
                50: 'Bull',
                40: 'D20',
                32: 'D16',
                24: 'D12',
                16: 'D8',
                8: 'D4',
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

        scoreEl.textContent = player.score;
        avgEl.textContent = player.avg;
        lastEl.textContent = player.last.length ? player.last.join(' · ') : '—';

        card.querySelector('.player-name').textContent = player.name;
        card.classList.toggle('active', index === window.__activePlayer);
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
        if (!data || !Array.isArray(data.players)) return;

        window.__activePlayer = data.activePlayer ?? 0;

        data.players.forEach((p, i) => updateCard(i, p));
        updateThrows(data.players, window.__activePlayer);
        updateCheckout(data.players[window.__activePlayer]);

        els.status.textContent = `Am Zug: ${data.players[window.__activePlayer].name}`;
    });

    document.addEventListener('DOMContentLoaded', () => {
        applyLayout();
        els.status.textContent = CONFIG.useMockData ? 'Mock-Daten aktiv' : 'Verbinde…';
        api.connect();
    });
})();
