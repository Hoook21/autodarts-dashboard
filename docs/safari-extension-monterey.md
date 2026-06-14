# Safari Extension on macOS Monterey 12.7.x

Hauke's iMac currently runs macOS 12.7.6 with Safari 17.6. The Mac App Store may refuse to install the current Xcode because newer Xcode releases require a newer macOS version. The Safari Web Extension itself is still the right target, but the wrapper must be built with a Monterey-compatible Xcode.

## Current finding

```text
macOS: 12.7.6
Safari: 17.6
Developer tools: Command Line Tools only
Missing: xcrun safari-web-extension-converter
```

The converter is part of full Xcode, not the Command Line Tools.

## Recommended route

1. Use a Monterey-compatible Xcode release, likely Xcode 14.x.
2. Install it as `/Applications/Xcode.app` or select it explicitly:

   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   xcrun --find safari-web-extension-converter
   ```

3. Convert the WebExtension source:

   ```bash
   xcrun safari-web-extension-converter \
     --macos-only \
     --project-location build/safari-extension \
     --app-name "Autodarts Dashboard Bridge" \
     --bundle-identifier "local.hook.autodarts-dashboard-bridge" \
     extension/autodarts-bridge
   ```

4. Build/run the generated app in Xcode once.
5. In Safari, enable Develop settings for unsigned/local extensions if needed, then enable the extension in Safari Settings → Extensions.
6. Reload `https://play.autodarts.io` after the extension is enabled.

## Why this still fits darts-hub

- darts-hub can later launch/show the dashboard as `custom-url`.
- Safari/Autodarts Play remains the original engine/session.
- The Safari extension runs in the Play browser context and forwards only redacted match payloads to the local bridge.
- The dashboard receives data via `ws://localhost:9876`, so it does not need to share a tab/window with Autodarts Play.

## Immediate functional fallback

If building the Safari wrapper is blocked by Xcode availability, test the same extension source first in Chrome/Chromium as an unpacked extension. That validates the bridge/dashboard/data path before spending time on Apple tooling.

Chrome test:

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Load unpacked: `extension/autodarts-bridge/`.
4. Start local bridge and dashboard.
5. Reload `https://play.autodarts.io` and start a local match.

If Chrome receives live payloads, only the Safari wrapper remains; the dashboard/bridge/adapter path is proven.
