#!/usr/bin/env python3
"""Generate 1920x1080 screenshots for all dashboard layouts."""
import subprocess
import time
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
SCREENSHOTS = REPO / "screenshots"
SERVER_PORT = 8765
LAYOUTS = ["webview-sidepanel", "balanced", "score-first", "big-type"]


def main():
    SCREENSHOTS.mkdir(exist_ok=True)

    server = subprocess.Popen(
        ["python3", "-m", "http.server", str(SERVER_PORT)],
        cwd=REPO,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        time.sleep(0.5)
        base = f"http://127.0.0.1:{SERVER_PORT}/index.html"

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1920, "height": 1080})
            page = context.new_page()

            for layout in LAYOUTS:
                url = f"{base}?layout={layout}"
                print(f"Rendering {layout} ...", file=sys.stderr)
                page.goto(url, wait_until="networkidle")
                # Wait for mock stream to populate a bit.
                time.sleep(1.2)
                out = SCREENSHOTS / f"autodarts-layout-{layout}.png"
                page.screenshot(path=str(out), full_page=False)
                print(f"Saved {out}", file=sys.stderr)

            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    main()
