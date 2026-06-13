# Architektur — Autodarts Dashboard

Dieses Dokument beschreibt die technische Ausrichtung des Projekts. Es gilt als Entscheidungsrahmen für alle zukünftigen Änderungen.

## Grundprinzip: Overlay/Wrapper, kein Ersatz

Das Dashboard ist eine **zusätzliche Präsentationsschicht** für eine bereits laufende Autodarts-Installation. Es erweitert oder ersetzt niemals Autodarts selbst.

Autodarts bleibt für alle Kernfunktionen verantwortlich:

- Kameraerkennung / Pfeilerkennung
- Spiel- und Matchlogik
- Sound-Plugins / MP3-Events
- konfigurierte Events und Automationen
- manuelle Eingabe über die Original-Oberfläche

Das Dashboard zeigt diese Informationen nur anders, größer oder übersichtlicher an.

## Komponenten

```
┌─────────────────────────────────────────────────────────────┐
│  Autodarts (Original-Installation)                          │
│  - Kamera / Board-Verbindung                                │
│  - Spiel-Logik                                              │
│  - Sounds                                                   │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │  Webview / iframe / lokale URL
                   │  (nur lesend/anzeigend)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Autodarts Dashboard                                        │
│  - statische HTML/CSS/JS-Anzeige                            │
│  - Layout-Varianten per URL-Parameter                       │
│  - optionale API/WebSocket-Daten nur für Anzeige (Fallback)  │
└─────────────────────────────────────────────────────────────┘
```

## Was das Dashboard darf

- eine URL in einem iframe laden (`webview=...`)
- ein lokales Kamerabild/Boardbild anzeigen (`cameraImage=...`)
- Mock-Daten oder eine dokumentierte, lesende Autodarts-API nutzen
- Layout, Schriftgrößen, Kontrast und Statistiken anpassen
- lokal als statischer HTTP-Server laufen

## Was das Dashboard nicht darf

- Autodarts-Dateien patchen
- Autodarts-Prozesse neu starten oder umkonfigurieren
- in Autodarts schreiben oder Spiele simulieren
- Sound-/Kamera-/Trackinglogik nachbauen, wenn dabei Original-Autodarts-Funktionen ersetzt werden
- private Session-URLs, Tokens oder Cookies in öffentliche Repos posten

## Datenfluss

1. Autodarts läuft wie gewohnt auf dem lokalen Rechner.
2. Das Dashboard öffnet entweder die Autodarts-Webansicht im iframe oder zeigt ein lokales Kamerabild.
3. Falls die Webansicht keine genügenden Daten liefert, kann eine separate, lesende Datenquelle (API/WebSocket) als Fallback dienen — ausschließlich für die Anzeige.

## Sicherheitsgrenzen

- iframe-URLs werden auf `http:`, `https:` oder `file:` validiert.
- `allow`- und `sandbox`-Attribute des iframe sind so gewählt, dass Gerätezugriffe (Kamera, Mikrofon, USB, HID, Bluetooth) nur explizit freigegeben werden.
- Session-URLs und Authentifizierungsdaten bleiben lokal und werden nicht versioniert.

## Akzeptanzkriterium für neue Funktionen

Jede neue Funktion muss diesen Test bestehen:

> Kann eine normale Autodarts-Runde weiterhin wie gewohnt gestartet und gespielt werden? Bleiben Kameraerkennung, Sound-Events und Original-Autodarts-Verhalten unverändert aktiv?

Wenn die Antwort nein ist, gehört die Idee nicht in den Hauptzweig, sondern in einen separaten Experimentier-Branch.
