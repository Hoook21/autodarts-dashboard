const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'autodarts-bridge-sender.js'), 'utf8');

const sent = [];
const posted = [];
const openSockets = [];

class FakeWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = 0;
        this._listeners = {};
        openSockets.push(this);
        setTimeout(() => {
            this.readyState = 1;
            this._emit('open');
        }, 0);
    }

    addEventListener(type, fn) {
        (this._listeners[type] ||= []).push(fn);
        // Wenn bereits offen und open-Listener registriert, sofort feuern
        if (type === 'open' && this.readyState === 1) {
            setTimeout(() => fn(), 0);
        }
    }

    close() {
        this.readyState = 3;
    }

    send(data) {
        if (this.readyState !== 1) throw new Error('not open');
        sent.push(JSON.parse(data));
    }

    _emit(type, arg) {
        (this._listeners[type] || []).forEach((fn) => fn(arg));
    }
}

const sandbox = {
    window: { WebSocket: FakeWebSocket, postMessage: (payload, targetOrigin) => posted.push({ payload, targetOrigin }) },
    console,
    setTimeout,
    WebSocket: FakeWebSocket,
    MessageEvent: function () {},
};
sandbox.window = sandbox;
sandbox.postMessage = (payload, targetOrigin) => posted.push({ payload, targetOrigin });

// MessageEvent.prototype mocken
const proto = {};
Object.setPrototypeOf(sandbox.MessageEvent.prototype, proto);
const descriptor = { configurable: true, value: undefined };
Object.defineProperty(sandbox.MessageEvent.prototype, 'data', descriptor);

vm.runInNewContext(source, sandbox, { filename: 'autodarts-bridge-sender.js' });

function flush(ms = 50) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
    await flush();

    // Aktiven Socket ermitteln (der zuletzt verbundene)
    const ws = openSockets.filter((s) => s.readyState === 1).pop();
    assert.ok(ws, 'Bridge-Verbindung wurde aufgebaut');

    const event = { data: JSON.stringify({ channel: 'autodarts.matches', topic: 'match-1.state', data: { score: 301 } }) };
    ws._emit('message', event);
    await flush();

    assert.equal(sent.length, 1, 'Payload wurde weitergeleitet');
    assert.equal(posted.length, 1, 'Payload wurde per postMessage an Content-Script gemeldet');
    assert.equal(posted[0].payload.type, 'autodarts-dashboard-bridge:payload');
    assert.equal(posted[0].payload.payload.topic, 'match-1.state');
    assert.equal(sent[0].channel, 'autodarts.matches');
    assert.equal(sent[0].topic, 'match-1.state');
    assert.equal(sent[0].data.score, 301);

    // Redaction-Test
    const authEvent = {
        data: JSON.stringify({
            channel: 'autodarts.matches',
            topic: 'match-1.events',
            data: { score: 301, code: 'secret123', token: 'abc' },
        }),
    };
    ws._emit('message', authEvent);
    await flush();

    assert.equal(sent.length, 2);
    assert.equal(posted.length, 2);
    assert.equal(sent[1].data.code, '<redacted>');
    assert.equal(sent[1].data.token, '<redacted>');

    // Topic-Filter-Test: unerlaubtes Topic wird ignoriert
    const ignoredEvent = {
        data: JSON.stringify({ channel: 'autodarts.matches', topic: 'match-1.referee', data: {} }),
    };
    ws._emit('message', ignoredEvent);
    await flush();
    assert.equal(sent.length, 2, 'unerlaubtes Topic wurde nicht weitergeleitet');
    assert.equal(posted.length, 2, 'unerlaubtes Topic wurde nicht per postMessage gemeldet');

    // Channel-Filter-Test
    const lobbyEvent = {
        data: JSON.stringify({ channel: 'autodarts.lobbies', topic: 'lobby-1', data: {} }),
    };
    ws._emit('message', lobbyEvent);
    await flush();
    assert.equal(sent.length, 2, 'falscher Channel wurde nicht weitergeleitet');
    assert.equal(posted.length, 2, 'falscher Channel wurde nicht per postMessage gemeldet');

    // Duplikat-Schutz: identisches Event-Objekt nur einmal weiterleiten
    ws._emit('message', event);
    await flush();
    assert.equal(sent.length, 2, 'identisches Event wurde doppelt weitergeleitet');
    assert.equal(posted.length, 2, 'identisches Event wurde doppelt per postMessage gemeldet');

    console.log('bridge-sender-smoke-test: OK');
})();
