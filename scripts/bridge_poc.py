#!/usr/bin/env python3
"""
Bridge-POC: Autodarts Play -> lokaler WebSocket-Proxy

Dieses Script dient als Ausgangspunkt für eine lokale Bridge.
Es wird NICHT automatisch geladen und enthält KEINE Secrets.

Laufzeit (Beispiel):
    python3 scripts/bridge_poc.py

Anschließend kann eine Browser-Extension oder ein Bookmarklet gezielte
Nachrichten an ws://localhost:9876 senden.
"""

import asyncio
import json
import os
import websockets

PORT = int(os.environ.get("BRIDGE_PORT", 9876))
ALLOWED_TOPICS = {"state", "events", "game-events", "corrections"}


def is_allowed(payload: dict) -> bool:
    if not isinstance(payload, dict):
        return False
    if payload.get("channel") != "autodarts.matches":
        return False
    topic = payload.get("topic", "")
    suffix = topic.split(".")[-1] if "." in topic else ""
    return suffix in ALLOWED_TOPICS


async def handler(websocket):
    print(f"[bridge] client connected from {websocket.remote_address}")
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                continue

            if not is_allowed(payload):
                continue

            # Weiterleiten an alle verbundenen Dashboard-Clients
            disconnected = []
            for client in connected_clients:
                if client is websocket:
                    continue
                try:
                    await client.send(json.dumps(payload))
                except websockets.ConnectionClosed:
                    disconnected.append(client)

            for client in disconnected:
                connected_clients.discard(client)
    finally:
        connected_clients.discard(websocket)
        print(f"[bridge] client disconnected")


async def register(websocket):
    """Legacy hook, wird nicht mehr benötigt; Clients werden in handler() registriert."""
    connected_clients.add(websocket)


connected_clients = set()


async def register(websocket):
    connected_clients.add(websocket)


async def main():
    async with websockets.serve(handler, "localhost", PORT):
        print(f"[bridge] listening on ws://localhost:{PORT}")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
