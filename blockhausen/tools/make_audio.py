"""Synthesize the music bed and sound effects for the Lena video (deterministic)."""
import numpy as np
import wave
import sys

SR = 44100
DUR = 63.5
N = int(SR * DUR)
rng = np.random.default_rng(7)


def t_arr(sec):
    return np.arange(int(SR * sec)) / SR


def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[: j - i] * gain


def env(sec, attack=0.005, decay=0.3):
    t = t_arr(sec)
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def note(freq, sec, decay=0.25, harm=(1, 0.5, 0.25), attack=0.004):
    t = t_arr(sec)
    s = sum(h * np.sin(2 * np.pi * freq * (k + 1) * t) for k, h in enumerate(harm))
    return s * env(sec, attack, decay)


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def lowpass(x, a=0.05):
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc)
        y[i] = acc
    return y


def noise(sec):
    return rng.uniform(-1, 1, int(SR * sec))


def write(path, mono_l, mono_r=None):
    if mono_r is None:
        mono_r = mono_l
    st = np.stack([mono_l, mono_r], 1)
    peak = np.max(np.abs(st)) or 1
    st = st / peak * 0.89
    data = (st * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------- MUSIC ----------------
mus = np.zeros(N)
beat = 0.6  # 100 BPM
# Part A: playful bed 0 .. 35.3
chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]  # C Am F G
bassn = [36, 33, 29, 31]
mel = [72, 76, 79, 76, 74, 72, 69, 72, 77, 76, 74, 72, 71, 74, 79, 74]
endA = 35.3
b = 0
while b * beat < endA - 0.05:
    t0 = b * beat
    bar = (b // 4) % 4
    # kick on 1 and 3
    if b % 2 == 0:
        k = t_arr(0.25)
        kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-k * 30)) * k) * np.exp(-k * 14)
        add(mus, t0, kick, 0.55)
    # snare-ish clap on 2 and 4
    if b % 4 in (1, 3):
        add(mus, t0, noise(0.15) * env(0.15, 0.001, 0.04), 0.18)
    # hats on offbeats
    add(mus, t0 + beat / 2, noise(0.05) * env(0.05, 0.001, 0.012), 0.12)
    # bass
    if b % 2 == 0:
        add(mus, t0, note(midi(bassn[bar]), 0.55, 0.25, (1, 0.3)), 0.35)
    # marimba arpeggio in 8ths
    ch = chords[bar]
    for e in range(2):
        m = ch[(b * 2 + e) % 3] + 12
        add(mus, t0 + e * beat / 2, note(midi(m), 0.35, 0.12, (1, 0.15, 0.05)), 0.16)
    # lead pluck every beat, in the second half of each 8-bar phrase
    if (b // 16) % 2 == 1 or b >= 32:
        add(mus, t0, note(midi(mel[b % 16]), 0.5, 0.18, (1, 0.4, 0.1)), 0.13)
    b += 1
# fade A out
fa = int(34.6 * SR), int(endA * SR)
mus[fa[0]:fa[1]] *= np.linspace(1, 0, fa[1] - fa[0])

# Part B: tense drone 35.3 .. 51.7
tb = t_arr(51.7 - 35.3)
drone = (
    0.6 * np.sin(2 * np.pi * 55 * tb)
    + 0.3 * np.sin(2 * np.pi * 55.7 * tb)
    + 0.25 * np.sin(2 * np.pi * 110.4 * tb)
    + 0.12 * np.sin(2 * np.pi * 164.8 * tb)
)
pulse = 0.55 + 0.45 * (np.sin(2 * np.pi * 1.666 * tb) > 0.6)
rise = np.linspace(0.6, 1.0, len(tb))
fadein = np.clip(tb / 0.3, 0, 1)
add(mus, 35.3, drone * pulse * rise * fadein, 0.45)
# ticking clock
for i in range(int((51.7 - 35.6) / 0.6)):
    add(mus, 35.6 + i * 0.6, note(2000, 0.04, 0.008, (1,)), 0.08)
# hard stop at 51.7 with a boom
k = t_arr(1.6)
boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-k * 6)) * k) * np.exp(-k * 2.2)
add(mus, 51.72, boom, 0.9)
cut = int(51.7 * SR)
mus[cut : cut + 10] *= 0  # click-free enough under the boom

# Part C: eerie music box 55.2 .. end
box = [69, 72, 76, 74, 72, 71, 69, 68, 69, 72, 76, 81]
for i, m in enumerate(box):
    tt = 55.4 + i * 0.68
    if tt > 63.2:
        break
    s = note(midi(m + 12), 1.6, 0.6, (1, 0, 0.3, 0, 0.1))
    add(mus, tt, s, 0.16)
    add(mus, tt + 0.23, s, 0.06)  # echo
    add(mus, tt + 0.46, s, 0.03)
pad_t = t_arr(63.5 - 55.2)
pad = (np.sin(2 * np.pi * 110 * pad_t) + 0.6 * np.sin(2 * np.pi * 130.8 * pad_t) + 0.5 * np.sin(2 * np.pi * 164.8 * pad_t))
pad *= np.clip(pad_t / 2.0, 0, 1) * 0.07
add(mus, 55.2, pad)
# dissonant sting on "Lenas Stimme"
st_t = t_arr(2.2)
sting = (np.sin(2 * np.pi * 220 * st_t) + np.sin(2 * np.pi * 233.1 * st_t) + 0.7 * np.sin(2 * np.pi * 311.1 * st_t))
sting *= np.clip(st_t / 0.05, 0, 1) * np.exp(-st_t * 1.2)
add(mus, 61.36, sting, 0.18)

# ---------------- SFX ----------------
sfx = np.zeros(N)


def ding(t0, g=0.5):
    s = note(1568, 0.6, 0.18, (1, 0.2)) + note(2093, 0.6, 0.15, (1,)) * 0.7
    add(sfx, t0, s, g)


for t0 in (17.3, 17.9, 18.45):
    ding(t0, 0.25)
for t0 in (19.0, 19.44, 19.88):
    ding(t0, 0.45)
# send swoosh for "k"
sw = noise(0.3)
sw = lowpass(sw, 0.25) * np.sin(np.linspace(0, np.pi, len(sw)))
add(sfx, 21.62, sw, 0.6)
add(sfx, 21.7, note(880, 0.15, 0.05, (1,)), 0.2)
# hearts popping on "Lena? Lena will nur mich" and love meter
for i, t0 in enumerate([14.45, 15.4, 22.7, 23.1, 23.5, 23.9, 24.3, 24.7]):
    add(sfx, t0, note(midi(79 + (i % 5) * 2), 0.12, 0.04, (1, 0.3)), 0.25)
# hammer knocks while the house rises
for i in range(9):
    add(sfx, 5.95 + i * 0.19, lowpass(noise(0.08), 0.35) * env(0.08, 0.001, 0.02), 0.6)
add(sfx, 7.55, note(1046, 0.5, 0.2, (1, 0.5)), 0.3)  # ta-da ping
# whoosh cuts
for t0 in (8.38, 10.86, 14.1, 25.6):
    w = lowpass(noise(0.35), 0.12) * np.sin(np.linspace(0, np.pi, int(0.35 * SR)))
    add(sfx, t0 - 0.12, w, 0.5)
# sign flip
add(sfx, 12.95, lowpass(noise(0.25), 0.2) * env(0.25, 0.01, 0.08), 0.5)
# crowd gasp (filtered noise swell) on "Alle halten die Luft an"
g = lowpass(noise(0.9), 0.08) * np.sin(np.linspace(0, np.pi, int(0.9 * SR)))
add(sfx, 28.3, g, 0.6)
# glitch bursts
for t0, ln in ((35.32, 0.55), (37.84, 0.4), (48.08, 0.5), (62.45, 0.6)):
    n = int(ln * SR)
    gl = np.sign(np.sin(2 * np.pi * rng.uniform(80, 600) * np.arange(n) / SR)) * 0.5
    gl += noise(ln) * 0.5
    gl *= (np.floor(np.arange(n) / (SR * 0.03)) % 2 == 0)
    add(sfx, t0, gl, 0.35)
# disconnect error tone
add(sfx, 48.85, note(660, 0.25, 0.2, (1, 0.5)), 0.35)
add(sfx, 49.1, note(440, 0.45, 0.3, (1, 0.5)), 0.35)
# spotlight clunk
add(sfx, 32.35, lowpass(noise(0.2), 0.3) * env(0.2, 0.001, 0.05), 0.7)
# NPC tag pops
for i in range(10):
    add(sfx, 37.85 + i * 0.05, note(1200 + i * 60, 0.05, 0.02, (1,)), 0.12)

out = sys.argv[1]
write(f"{out}/music.wav", mus)
write(f"{out}/sfx.wav", sfx)
print("ok")
