# Inventar: Standardfrontend-Funktionen von Autodarts

Diese Datei fängt alle Funktionen ein, die das neue Dashboard perspektivisch abbilden soll — aber ohne Original-Autodarts zu ersetzen. Sie wird parallel zur Live-Datenarbeit in Issue #32 gepflegt.

## Entscheidung / Grundregel

Original-Autodarts bleibt führend für:

- Kameraerkennung / Pfeilerkennung
- Spiel- und Matchlogik
- Sound-Plugins / MP3-Events
- manuelle Korrekturen, Undo, Next
- Bust / Game Shot / No Score
- lokale Lobbys / lokale Spieler
- Einstellungen, Boards, Konfiguration

Das Dashboard ist nur eine zusätzliche Präsentationsschicht. Es zeigt Zustände, die Autodarts ohnehin anzeigt, größer oder übersichtlicher.

## Funktionsinventar

### Während eines Spiels sichtbar / relevant

| Bereich | Original-Autodarts | Dashboard-Abbildung |
|---------|--------------------|--------------------|
| Spielername | Ja | groß lesbar |
| Restscore | Ja | groß lesbar |
| Aktiver Spieler | Ja | visuell hervorheben |
| Letzte Aufnahme / Wurfserie | Ja | groß + kontrastreich |
| Average / Stats | Ja | groß + kontrastreich |
| Checkout-Hinweis | Ja | prominent |
| Leg / Set / Round | Ja | klar sichtbar |
| Bust / Game Shot / No Score | Ja | Statuszustand zeigen |
| Wurfhistorie | Ja | letzte Würfe pro Spieler |

### Bedienaktionen (nur über Original-Autodarts)

| Aktion | Wo ausgeführt | Dashboard-Status |
|--------|---------------|------------------|
| Manuelle Korrektur | Original-Frontend / App | read-only anzeigen |
| Undo | Original-Frontend / App | read-only anzeigen |
| Next | Original-Frontend / App | read-only anzeigen |
| Lobby / lokale Spieler | Original-Frontend / App | read-only anzeigen |
| Sounds / MP3-Events | Original-Frontend / App | nicht neu bauen |
| Memes / Event-Anzeigen | Original-Frontend / App | perspektivisch anzeigen |

### Nicht im ersten Dashboard-Release

- Eigene Eingabe / Steuerung der Autodarts-Logik
- Soundwiedergabe im Dashboard statt in Autodarts
- Ersetzen der Kameraerkennung
- Patchen der Original-Autodarts-App
- Cloud-Account-Verwaltung

## Offene Punkte

- Genaues Mapping der Standardfrontend-Elemente auf Dashboard-Zonen.
- Identifikation aller Events (Game Shot, Bust, No Score, Winner) in echten `autodarts.matches`-Payloads.
- Klärung, welche Statistiken neben Average noch relevant sind (Checkout %, 180er, etc.).

## Bezug

- Issue #32: Task: Standardfrontend-Funktionen inventarisieren
- Epic #29: Dashboard-Parität mit Autodarts-Standardfrontend
