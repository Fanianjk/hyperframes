# Blockhausen – Video-Vorlage

Vorlage für die Kurzvideo-Serie **@blockhausen.tv**: absurde Ich-Geschichten aus einer
Klötzchen-3D-Stadt, jede mit Plottwist. Format 1080×1920, 30 fps, rund 1 Minute.
Folge 1 („In dieser Stadt lieben alle Lena“) ist das Referenzbeispiel.

## Feste Markenregeln (in jeder Folge gleich)

| Element       | Festlegung                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wasserzeichen | `@blockhausen.tv`, klein (28 px), 45 % Deckkraft, oben links (`#wm` in `tools/build_index.py`)                                                                                                                                                                                                                                                                                                             |
| Stimme        | **Helle Kinderstimme**, trocken erzählt (`[deadpan]`), Modell `eleven_v4`. Kandidaten aus der ElevenLabs-Bibliothek: „Bibi Blume“ `7Nj1UduP6iY6hWpEDibS`, „Tibble Tink“ `WaD1h0eeTE5KURpEatHq`, „Kunibert Cuddle“ `eRExbYUuATnn9e2um0J1`; alternativ eine eigene Stimme per Voice Design („deutscher Junge, ca. 10 Jahre, hell, trocken“). Die erwachsene Stimme „Kevin“ aus Folge 1 nicht mehr verwenden. |
| Untertitel    | ein Wort zur Zeit, kleingeschrieben, Schrift **Fredoka Bold**, weiß mit dunkler Kontur und Schatten. Effekte: Pop mit Neigung, Namen in Figurenfarbe, Schlüsselwörter gelb + größer + kurzes Wackeln, Geräusch-Wörter („ding“, „huss“) türkis, groß und schwingend. Konfiguration: `NAME_COLORS`, `SOUND_WORDS`, `EMPHASIS` in `tools/build_index.py` (`EMPHASIS` pro Folge neu setzen).                   |
| Stadt-Look    | angelehnt an das Vorbild-Video: weiche Sonnenschatten, Himmel mit Verlauf und Wolken, Berge mit Schneekappen, dichter Nadelwald rund um die Stadt, Strand mit Steg und Wasser, Gehwege, runde Pflastersteine, nachts leuchtende Lichterketten mit farbigem Licht auf dem Marktplatz                                                                                                                        |
| Story-Aufbau  | Einstieg „In dieser Stadt … Nur ich nicht.“ → übertriebene Beispiele → Running Gag mit Geräusch-Wort → Krise → Twist → zweiter Twist am Ende                                                                                                                                                                                                                                                               |
| Stammfiguren  | Timo (Ich-Erzähler), Kevin, Bürgermeister, Nachbar, Mama                                                                                                                                                                                                                                                                                                                                                   |

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
