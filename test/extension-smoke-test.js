const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const extensionDir = path.join(root, 'extension', 'autodarts-bridge');
const manifest = JSON.parse(fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf8'));

assert.equal(manifest.manifest_version, 2);
assert.equal(manifest.name, 'Autodarts Dashboard Bridge');
assert.ok(manifest.permissions.includes('https://play.autodarts.io/*'));
assert.ok(manifest.permissions.includes('ws://localhost/*'));
assert.ok(manifest.permissions.includes('ws://127.0.0.1/*'));
assert.equal(manifest.content_scripts[0].run_at, 'document_start');
assert.deepEqual(manifest.content_scripts[0].matches, ['https://play.autodarts.io/*']);
assert.ok(manifest.web_accessible_resources.includes('page-bridge-sender.js'));

const contentScript = fs.readFileSync(path.join(extensionDir, 'content-script.js'), 'utf8');
const appended = [];
const listeners = {};
const sandbox = {
    console,
    setTimeout,
    WebSocket: function FakeWebSocket() { this.readyState = 0; this.addEventListener = function () {}; },
    window: { addEventListener: (name, fn) => { listeners[name] = fn; }, location: { origin: 'https://play.autodarts.io' } },
    chrome: { runtime: { getURL: (file) => `chrome-extension://test/${file}` } },
    document: {
        getElementById: () => null,
        createElement: (tag) => ({ tag, dataset: {}, set id(value) { this._id = value; }, get id() { return this._id; } }),
        documentElement: { appendChild: (node) => appended.push(node), setAttribute: function (key, value) { this[key] = value; } },
        head: null,
        body: null,
    },
};
vm.runInNewContext(contentScript, sandbox, { filename: 'content-script.js' });
assert.equal(appended.length, 1);
assert.equal(appended[0].src, 'chrome-extension://test/page-bridge-sender.js');
assert.equal(appended[0].async, false);
assert.equal(appended[0].dataset.autodartsDashboardBridge, 'true');
assert.equal(sandbox.document.documentElement['data-autodarts-dashboard-bridge-content-script'], 'loaded');

const pageSender = fs.readFileSync(path.join(extensionDir, 'page-bridge-sender.js'), 'utf8');
new vm.Script(pageSender, { filename: 'page-bridge-sender.js' });
const scriptSender = fs.readFileSync(path.join(root, 'scripts', 'autodarts-bridge-sender.js'), 'utf8');
assert.equal(pageSender, scriptSender, 'extension page sender must stay in sync with scripts/autodarts-bridge-sender.js');

console.log('extension-smoke-test: OK');
