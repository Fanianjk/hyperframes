"""Generate index.html: 3D stage, overlays, word-by-word captions and audio."""
import json
import re
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DUR = 63.5
words = [w for w in json.load(open(f"{ROOT}/words.json"))["words"] if w.get("type", "word") == "word"]
words = [w for w in words if not w["text"].startswith("[")]

# ---- caption styling (series-wide) ----
# Names always get their character colour.
NAME_COLORS = {
    "lena": "#ff5fa8", "lenas": "#ff5fa8", "lenastadt": "#ff5fa8",
    "timo": "#5cd6ff", "kevin": "#ffa53d", "mama": "#c58bff", "bürgermeister": "#ffd23d",
}
# Sound words (running gags) pop big and wobble.
SOUND_WORDS = {"ding", "huss", "chrrr", "boom", "k", "bam", "zack"}
SOUND_COLOR = "#7dffcf"
# Per-episode punch words: yellow, bigger, a short shake.
EMPHASIS = {
    "hundert", "woche", "mond", "spiel", "npcs", "programmiert", "einzige", "spieler",
    "admin", "offline", "geld", "schwarz", "stimme", "drei",
}
EMPH_COLOR = "#ffe14d"

caps = []
for i, w in enumerate(words):
    raw = w["text"]
    txt = re.sub(r"[.,:;!?]", "", raw).lower()
    start = w["start"]
    nxt = words[i + 1]["start"] if i + 1 < len(words) else DUR
    end = min(nxt, w["end"] + 0.55)
    end = max(end, start + 0.12)
    if txt in SOUND_WORDS:
        kind, color = "sound", SOUND_COLOR
    elif txt in NAME_COLORS:
        kind, color = "name", NAME_COLORS[txt]
    elif txt in EMPHASIS or raw.endswith(("!", "?")):
        kind, color = "emph", EMPH_COLOR
    else:
        kind, color = "plain", "#ffffff"
    caps.append((i, txt, round(start, 3), round(end - start, 3), kind, color))

cap_html = "\n".join(
    f'      <div id="w{i}" class="clip cap" data-start="{s}" data-duration="{d}" data-track-index="1">'
    f'<span class="word {k}" style="color:{c}">{t}</span></div>'
    for i, t, s, d, k, c in caps
)
cap_js = json.dumps([[i, s, d, k] for i, t, s, d, k, c in caps])


def heart_svg(size, color="#ff2d6f"):
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 32 32"><path fill="{color}" '
        'd="M16 29 C6 21 1 15 1 9.5 C1 5 4.5 2 8.5 2 C11.6 2 14.4 3.8 16 6.4 C17.6 3.8 20.4 2 23.5 2 '
        'C27.5 2 31 5 31 9.5 C31 15 26 21 16 29Z"/></svg>'
    )


H = heart_svg(34)
html = f"""<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="lib/gsap.min.js"></script>
    <style>
      @font-face {{
        font-family: "Fredoka";
        src: url("assets/fonts/fredoka-700.woff2") format("woff2");
        font-weight: 700;
        font-display: block;
      }}
      @font-face {{
        font-family: "Lilita";
        src: url("assets/fonts/lilita.woff2") format("woff2");
        font-display: block;
      }}
      :root {{
        --ink: #ffffff;
        --outline: #121212;
        --pink: #ff3d8a;
        --font-display: "Lilita", sans-serif;
      }}
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #000; }}
      #root {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: var(--font-display); background: #000; }}
      #stage {{ position: absolute; inset: 0; width: 1080px; height: 1920px; }}
      .cap {{ position: absolute; left: 0; top: 940px; width: 1010px; height: 200px; display: flex; align-items: center; justify-content: center; z-index: 50; pointer-events: none; }}
      .cap .word {{
        display: inline-block; font-family: "Fredoka", sans-serif; font-weight: 700;
        font-size: 92px; line-height: 1; letter-spacing: 0.005em;
        -webkit-text-stroke: 13px #1b0f2e; paint-order: stroke fill;
        text-shadow: 0 7px 0 #1b0f2e, 0 14px 22px rgba(0,0,0,.35);
      }}
      .cap .word.sound {{ font-size: 110px; }}
      #phone {{ position: absolute; left: 250px; top: 300px; width: 580px; height: 760px; z-index: 20; }}
      #phoneBody {{ position: absolute; inset: 0; border-radius: 64px; background: #111; border: 14px solid #2a2a2a; box-shadow: 0 30px 80px rgba(0,0,0,.5); overflow: hidden; }}
      #phoneHead {{ height: 120px; background: linear-gradient(90deg, #d81b60, #e0336f); display: flex; align-items: center; gap: 20px; padding: 0 30px; color: #fff; font-size: 46px; }}
      .avatar {{ width: 70px; height: 70px; border-radius: 50%; background: #ffd94a; border: 5px solid #fff; display:flex; align-items:center; justify-content:center; }}
      #badge {{ margin-left: auto; background: #e0102a; color: #fff; border-radius: 30px; padding: 6px 16px; font-size: 34px; }}
      #chat {{ position: absolute; top: 120px; left: 0; right: 0; bottom: 0; background: #fdf1f6; padding: 26px; }}
      .msg {{ position: relative; max-width: 420px; margin-bottom: 18px; padding: 16px 24px; border-radius: 30px; font-size: 38px; color: #fff; background: var(--pink); width: fit-content; display: flex; align-items: center; gap: 8px; }}
      .msg.me {{ margin-left: auto; background: #2f80ed; font-size: 54px; padding: 12px 34px; }}
      #meter {{ position: absolute; left: 170px; top: 330px; width: 700px; height: 170px; z-index: 20; }}
      #meterBox {{ position: absolute; inset: 0; background: rgba(20,20,30,.82); border-radius: 40px; border: 6px solid var(--pink); padding: 20px 34px; color: #fff; }}
      #meterLabel {{ font-size: 40px; display:flex; align-items:center; gap: 12px; }}
      #meterTrack {{ margin-top: 14px; height: 46px; background: #3a3a4a; border-radius: 23px; overflow: hidden; }}
      #meterFill {{ height: 100%; width: 100%; background: linear-gradient(90deg, #ff3d8a, #ffd23d); transform-origin: left center; }}
      #meterNum {{ position: absolute; right: 34px; top: 16px; font-size: 54px; color: #ffd23d; }}
      #kick {{ position: absolute; left: 110px; top: 560px; width: 860px; height: 560px; z-index: 30; }}
      #kickBox {{ position: absolute; inset: 0; background: #23252b; border-radius: 26px; border: 4px solid #3b3e46; color: #fff; padding: 40px 50px; box-shadow: 0 30px 90px rgba(0,0,0,.7); }}
      #kickTitle {{ font-size: 60px; text-align: center; padding-bottom: 22px; border-bottom: 3px solid #3b3e46; }}
      #kickText {{ font-family: sans-serif; font-weight: 700; font-size: 38px; line-height: 1.35; text-align: center; margin-top: 30px; color: #d9dbe0; }}
      #kickBtn {{ margin: 34px auto 0; width: 320px; height: 92px; border-radius: 16px; background: #ffffff; color: #23252b; font-size: 46px; display: flex; align-items: center; justify-content: center; }}
      #dim {{ position: absolute; inset: 0; background: rgba(0,0,0,.55); z-index: 25; }}
      #black {{ position: absolute; inset: 0; z-index: 40; }}
      #flash {{ position: absolute; inset: 0; background: #fff; z-index: 41; }}
      .gbar {{ position: absolute; left: 0; width: 1080px; z-index: 35; mix-blend-mode: screen; }}
      #wm {{ position: absolute; left: 0; top: 0; z-index: 45; pointer-events: none; }}
      #wmIn {{ display: flex; align-items: center; gap: 8px; opacity: 0.45; }}
      .brick {{ width: 24px; height: 24px; border-radius: 4px; background: #ff6a2b; border: 3px solid #fff;
        box-shadow: inset 0 -5px 0 rgba(0,0,0,.25), 0 2px 0 rgba(0,0,0,.45); position: relative; }}
      .brick::before, .brick::after {{ content: ""; position: absolute; top: -7px; width: 7px; height: 5px; background: #ff6a2b; border: 2px solid #fff; border-bottom: 0; border-radius: 3px 3px 0 0; }}
      .brick::before {{ left: 1px; }} .brick::after {{ right: 1px; }}
      #wmText {{ font-size: 28px; color: #fff; -webkit-text-stroke: 5px rgba(0,0,0,.6); paint-order: stroke fill; letter-spacing: 0.01em; }}
      #vignette {{ position: absolute; inset: 0; z-index: 15; background: radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,.45) 100%); pointer-events:none; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="1080" data-height="1920" data-layout-allow-overflow data-layout-allow-overlap>
      <canvas id="stage" width="720" height="1280"></canvas>
      <div id="vignette"></div>

      <div id="phone" class="clip" data-start="16.85" data-duration="5.6" data-track-index="2" data-track-kind="graphics">
        <div id="phoneIn">
          <div id="phoneBody" style="width:580px;height:760px;position:relative;">
            <div id="phoneHead"><div class="avatar">{heart_svg(40)}</div>Lena<div id="badge">99+</div></div>
            <div id="chat">
              <div id="m1" class="msg">hiii timo {heart_svg(30, "#fff")}</div>
              <div id="m2" class="msg">timo??</div>
              <div id="m3" class="msg">ich hab dir ein gedicht geschrieben</div>
              <div id="m4" class="msg">{heart_svg(34, "#fff")}</div>
              <div id="m5" class="msg">{heart_svg(34, "#fff")}{heart_svg(34, "#fff")}</div>
              <div id="m6" class="msg">{heart_svg(34, "#fff")}{heart_svg(34, "#fff")}{heart_svg(34, "#fff")}</div>
              <div id="m7" class="msg me">k</div>
            </div>
          </div>
        </div>
      </div>

      <div id="meter" class="clip" data-start="22.45" data-duration="3.15" data-track-index="3" data-track-kind="graphics">
        <div id="meterIn" style="position:absolute;inset:0;">
          <div id="meterBox">
            <div id="meterLabel">{H} Lenas Liebe</div>
            <div id="meterTrack"><div id="meterFill"></div></div>
          </div>
          <div id="meterNum">100%</div>
        </div>
      </div>

      <div id="dim" class="clip" data-start="48.85" data-duration="2.87" data-track-index="4"></div>
      <div id="kick" class="clip" data-start="48.85" data-duration="2.87" data-track-index="5" data-track-kind="graphics">
        <div id="kickIn" style="position:absolute;inset:0;">
          <div id="kickBox">
            <div id="kickTitle">Verbindung getrennt</div>
            <div id="kickText">Du wurdest vom Server entfernt.<br/>Grund: 3 Jahre nicht offline.<br/>Server kosten Geld.<br/><span style="color:#8a8f9c;font-size:30px">(Fehlercode: LENA-404)</span></div>
            <div id="kickBtn">Verlassen</div>
          </div>
        </div>
      </div>

      <div id="black" class="clip" data-start="51.72" data-duration="4.1" data-track-index="6"><div id="blackIn" style="position:absolute;inset:0;background:#000;opacity:0"></div></div>
      <div id="g1" class="gbar" style="top:420px;height:70px;background:rgba(255,0,80,.55)"></div>
      <div id="g2" class="gbar" style="top:930px;height:40px;background:rgba(0,220,255,.55)"></div>
      <div id="g3" class="gbar" style="top:1420px;height:110px;background:rgba(120,255,120,.35)"></div>

      <div id="wm" class="clip" data-start="0" data-duration="{DUR}" data-track-index="7" data-track-kind="graphics">
        <div id="wmIn"><div class="brick"></div><div id="wmText" data-var-text="handle">@blockhausen.tv</div></div>
      </div>

      <div id="captions" data-track-kind="captions">
{cap_html}
      </div>

      <audio id="voice" src="assets/voice.mp3" data-start="0" data-duration="62.4" data-track-index="10" data-volume="1"></audio>
      <audio id="music" src="assets/music.wav" data-start="0" data-duration="{DUR}" data-track-index="11" data-volume="0.32"></audio>
      <audio id="sfx" src="assets/sfx.wav" data-start="0" data-duration="{DUR}" data-track-index="12" data-volume="0.55"></audio>
    </div>
    <script type="module" src="world.js"></script>
    <script>
      const tl = gsap.timeline({{ paused: true }});
      // word pop-in
      const caps = {cap_js};
      // each word: pop + tilt in, then a small settle; names/punch words bigger, punch words shake,
      // sound words bounce in from zero and wobble
      caps.forEach(([i, s, d, kind]) => {{
        const el = "#w" + i + " .word";
        const tilt = ((i * 37) % 11) - 5;
        if (kind === "sound") {{
          tl.fromTo(el, {{ scale: 0, rotation: -18 }}, {{ scale: 1.15, rotation: 8, duration: 0.22, ease: "back.out(4)" }}, s);
          tl.to(el, {{ rotation: -6, duration: 0.08, yoyo: true, repeat: 3, ease: "sine.inOut" }}, s + 0.22);
          return;
        }}
        const big = kind === "emph" ? 1.22 : kind === "name" ? 1.12 : 1;
        tl.fromTo(el, {{ scale: 0.35, rotation: tilt * 2, y: 46, opacity: 0 }},
          {{ scale: big * 1.08, rotation: tilt * 0.4, y: 0, opacity: 1, duration: 0.15, ease: "back.out(3.2)" }}, s);
        tl.to(el, {{ scale: big, duration: Math.min(0.3, Math.max(0.08, d - 0.16)), ease: "power2.out" }}, s + 0.15);
        if (kind === "emph") {{
          tl.fromTo(el, {{ x: -7 }}, {{ x: 7, duration: 0.035, yoyo: true, repeat: 5, ease: "none" }}, s + 0.15);
        }}
      }});
      // phone
      tl.fromTo("#phoneIn", {{ y: 900, rotation: -6 }}, {{ y: 0, rotation: 0, duration: 0.35, ease: "back.out(1.4)" }}, 16.85);
      const msgT = [17.3, 17.9, 18.45, 19.0, 19.44, 19.88, 21.68];
      msgT.forEach((s, k) => {{
        tl.fromTo("#m" + (k + 1), {{ opacity: 0, scale: 0.4, y: 30 }}, {{ opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "back.out(2.5)" }}, s);
      }});
      tl.fromTo("#badge", {{ scale: 1 }}, {{ scale: 1.35, duration: 0.1, yoyo: true, repeat: 5 }}, 19.0);
      tl.to("#phoneIn", {{ y: 900, duration: 0.25, ease: "power2.in" }}, 22.15);
      // love meter: the less he answers, the more she loves him
      tl.fromTo("#meterIn", {{ y: -300 }}, {{ y: 0, duration: 0.3, ease: "back.out(1.6)" }}, 22.45);
      tl.fromTo("#meterFill", {{ scaleX: 0.25 }}, {{ scaleX: 1, duration: 2.4, ease: "power2.in" }}, 22.6);
      const num = {{ v: 100 }};
      tl.fromTo(num, {{ v: 100 }}, {{ v: 9999, duration: 2.4, ease: "power3.in", onUpdate: () => {{
        document.getElementById("meterNum").textContent = Math.round(num.v) + "%";
      }} }}, 22.6);
      tl.fromTo("#meterIn", {{ x: 0 }}, {{ x: 10, duration: 0.05, yoyo: true, repeat: 9 }}, 24.6);
      tl.to("#meterIn", {{ y: -320, duration: 0.25, ease: "power2.in" }}, 25.3);
      // kick dialog
      tl.fromTo("#dim", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2 }}, 48.85);
      tl.fromTo("#kickIn", {{ scale: 0.6, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" }}, 48.85);
      // black, then eyes open into the bedroom
      tl.set("#blackIn", {{ opacity: 1 }}, 51.72);
      tl.fromTo("#blackIn", {{ opacity: 1 }}, {{ opacity: 0, duration: 0.6, ease: "power1.inOut", immediateRender: false }}, 55.0);
      // glitch bars (deterministic)
      function rnd(n) {{ let a = n * 9973 + 11; a = Math.imul(a ^ (a >>> 15), 1 | a); a ^= a + Math.imul(a ^ (a >>> 7), 61 | a); return ((a ^ (a >>> 14)) >>> 0) / 4294967296; }}
      tl.set(".gbar", {{ opacity: 0 }}, 0);
      [[35.32, 35.95], [37.84, 38.25], [48.08, 48.6], [62.45, 63.1]].forEach(([a, b], bi) => {{
        for (let f = 0, t = a; t < b; f++, t += 1 / 15) {{
          ["#g1", "#g2", "#g3"].forEach((g, gi) => {{
            const r = rnd(bi * 1000 + f * 10 + gi);
            tl.set(g, {{ opacity: r > 0.4 ? 1 : 0, y: (rnd(bi * 777 + f * 13 + gi) - 0.5) * 500, scaleY: 0.4 + r * 1.6 }}, t);
          }});
        }}
        tl.set(".gbar", {{ opacity: 0 }}, b);
      }});
      // watermark: small, see-through, fixed in the top-left corner
      tl.set("#wmIn", {{ x: 40, y: 250 }}, 0);
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
open(f"{ROOT}/index.html", "w").write(html)
print(len(caps), "caption words")
