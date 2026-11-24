# Blockhausen – Video-Vorlage

Vorlage für die Kurzvideo-Serie **@blockhausen.tv**: absurde Ich-Geschichten aus einer
Klötzchen-3D-Stadt, jede mit Plottwist. Format 1080×1920, 30 fps, rund 1 Minute.
Folge 1 („In dieser Stadt lieben alle Lena“) ist das Referenzbeispiel.

## Feste Markenregeln (in jeder Folge gleich)

| Element       | Festlegung                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Wasserzeichen | `@blockhausen.tv`, klein (28 px), 45 % Deckkraft, oben links (`#wm` in `tools/build_index.py`)                             |
| Stimme        | ElevenLabs „Kevin – Happy & Friendly“, `voice_id` `Tdw3mwY0G0cBmz5tx5Nn`, Modell `eleven_v4`, Ton `[deadpan]`              |
| Untertitel    | ein Wort zur Zeit, kleingeschrieben, Schrift Lilita One, weiß mit schwarzer Kontur, Bildmitte                              |
| Story-Aufbau  | Einstieg „In dieser Stadt … Nur ich nicht.“ → übertriebene Beispiele → Running Gag → Krise → Twist → zweiter Twist am Ende |
| Stammfiguren  | Timo (Ich-Erzähler), Kevin, Bürgermeister, Nachbar, Mama                                                                   |

## Dateien

- `world.js` – die 3D-Stadt, Figuren und Kameraeinstellungen. Die Liste `shots(t)` und die
  Zeitpunkte in `renderAt(t)` gehören zur jeweiligen Folge.
- `tools/build_index.py` – erzeugt `index.html` (Untertitel, Overlays, Wasserzeichen, Audio)
  aus `words.json`.
- `tools/make_audio.py` – erzeugt Musik (`assets/music.wav`) und Soundeffekte (`assets/sfx.wav`).
  Die Zeitpunkte der Effekte gehören zur jeweiligen Folge.
- `words.json` – Wort-Zeitstempel der Sprachaufnahme (ElevenLabs Scribe).
- `assets/voice.mp3` – Sprachaufnahme der aktuellen Folge.

## Neue Folge machen

1. Skript schreiben (etwa 160 Wörter für 1 Minute).
2. Sprache mit der Stimme oben erzeugen → `assets/voice.mp3`.
3. Wort-Zeitstempel holen → `words.json`.
4. Szenen in `world.js` (`shots`, `renderAt`) und Effekt-Zeiten in `tools/make_audio.py`
   an die neue Geschichte anpassen; `DUR` in beiden Python-Skripten auf die neue Länge setzen.
5. Bauen und rendern:

```bash
./tools/setup.sh                 # einmalig: Three.js und GSAP nach lib/ laden
python3 tools/make_audio.py assets
python3 tools/build_index.py
npx hyperframes lint
npx hyperframes check
npx hyperframes render --quality delivery -o renders/folge.mp4
```
