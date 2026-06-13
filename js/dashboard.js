/**
 * Autodarts Dashboard — UI logic
 */

(function () {
    'use strict';

    const api = new AutodartsAPI(CONFIG);

    const els = {
        status: document.getElementById('match-status'),
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

    function updateThrows(players, activeIndex) {
        const active = players[activeIndex];
        const items = active.last.length
            ? active.last.map((s) => `P${activeIndex + 1}: ${s}`).reverse()
            : ['—'];

        els.throwsList.innerHTML = items.map((t) => `\u003cli\u003e${t}\u003c/li\u003e`).join('');
    }

    api.onMessage((data) => {
        if (!data || !Array.isArray(data.players)) return;

        window.__activePlayer = data.activePlayer ?? 0;

        data.players.forEach((p, i) => updateCard(i, p));
        updateThrows(data.players, window.__activePlayer);

        els.status.textContent = `Am Zug: ${data.players[window.__activePlayer].name}`;
    });

    document.addEventListener('DOMContentLoaded', () => {
        els.status.textContent = CONFIG.useMockData ? 'Mock-Daten aktiv' : 'Verbinde…';
        api.connect();
    });
})();
