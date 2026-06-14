const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const sandbox = {
  window: {},
  console,
  setTimeout,
  WebSocket: undefined,
};
sandbox.window = sandbox;

const adapterSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'adapter.js'), 'utf8');
vm.runInNewContext(adapterSource, sandbox, { filename: 'adapter.js' });

const Adapter = sandbox.window.AutodartsLiveAdapter;
assert.equal(typeof Adapter, 'function');

function capture(payload) {
  const adapter = new Adapter();
  let emitted = null;
  adapter.onUpdate((data) => { emitted = data; });
  adapter.receiveMessage({ data: payload });
  assert.ok(emitted, 'expected adapter to emit dashboard data');
  return emitted;
}

const realPayload = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'autodarts-real-safari-payload.json'), 'utf8'));
const mapped = capture(realPayload);

assert.equal(mapped.type, 'throw');
assert.equal(mapped.activePlayer, 0);
assert.equal(mapped.players.length, 1);
assert.equal(mapped.players[0].name, 'hook');
assert.equal(mapped.players[0].score, 301);
assert.equal(mapped.players[0].avg, 30.124191461837);
assert.deepEqual(mapped.players[0].last, ['S3']);
assert.equal(mapped.players[0].turnScore, 3);
assert.equal(mapped.players[0].busted, false);
assert.equal(mapped.gameFinished, true);
assert.equal(mapped.gameWinner, 0);
assert.equal(mapped.raw.id, 'match-1');

const stateEnvelope = {
  channel: 'autodarts.matches',
  topic: 'match-1.state',
  data: { state: realPayload.data.body },
};
assert.equal(capture(stateEnvelope).players[0].score, 301);

const legacyPayload = {
  channel: 'autodarts.matches',
  data: {
    players: [{ name: 'A', score: 501 }],
    player: 0,
    turns: [{ player: 0, score: 60, throws: [{ score: 20 }, { score: 20 }, { score: 20 }] }],
  },
};
assert.deepEqual(capture(legacyPayload).players[0].last, [20, 20, 20]);

console.log('adapter smoke test ok');
