// Sound effects, generated with the Web Audio API (no audio files needed):
// button click, correct answer, incorrect answer. A speaker button in the header turns them on / off.
(function () {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    let master = null;
    let enabled = true;
    const vol = () => (window.labVolume ? window.labVolume.get() : 1);   // master volume slider (volume.js)
    try { enabled = localStorage.getItem('labview.sfx') !== 'off'; } catch (e) { /* storage blocked */ }

    // Browsers only allow audio after a click or key press, so the audio engine starts lazily.
    function ready() {
        if (!AC || !enabled) return false;
        if (!ctx) {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0.5 * vol();
            master.connect(ctx.destination);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return true;
    }

    // One pixel-style note: oscillator + quick fade-out.
    function tone(freq, start, dur, type, vol, slideTo) {
        const t = ctx.currentTime + start;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.02);
    }

    const sounds = {
        // short two-step blip
        click: function () {
            tone(520, 0, 0.05, 'square', 0.09);
            tone(780, 0.04, 0.07, 'square', 0.09);
        },
        // bright rising arpeggio with a sparkle on top
        correct: function () {
            [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.09, 0.14, 'square', 0.1); });
            tone(1568, 0.36, 0.3, 'triangle', 0.08);
            tone(2093, 0.42, 0.25, 'triangle', 0.05);
        },
        // low falling buzz, two beats
        incorrect: function () {
            tone(220, 0, 0.22, 'sawtooth', 0.12, 140);
            tone(165, 0.24, 0.36, 'sawtooth', 0.12, 80);
        },
        // HAZARD FOUND: radar "beep-beep" then a bright lock-on chime (sine / triangle, so it sounds
        // different from the square-wave "correct answer" arpeggio)
        found: function () {
            tone(1318, 0, 0.09, 'sine', 0.16);
            tone(1318, 0.13, 0.09, 'sine', 0.16);
            tone(880, 0.27, 0.5, 'triangle', 0.1, 1760);
            tone(1976, 0.27, 0.55, 'sine', 0.09);
            tone(2637, 0.33, 0.5, 'sine', 0.05);
        },
        // clicked the wrong spot in the lit lab: short dull "nope"
        miss: function () {
            tone(300, 0, 0.12, 'square', 0.08, 190);
        },
        // clicked while the flashlight is off: soft low thunk
        dark: function () {
            tone(170, 0, 0.12, 'triangle', 0.12, 110);
        },
        // flashlight switch ON: mechanical "ka-chunk", then the bulb warming up
        lightOn: function () {
            tone(140, 0, 0.04, 'square', 0.14, 90);
            tone(95, 0.06, 0.05, 'square', 0.11, 70);
            tone(300, 0.12, 0.28, 'sine', 0.07, 1300);
            tone(1300, 0.34, 0.12, 'triangle', 0.04);
        },
        // flashlight switch OFF: "click", then the bulb dying away
        lightOff: function () {
            tone(120, 0, 0.04, 'square', 0.13, 80);
            tone(1100, 0.05, 0.2, 'sine', 0.06, 180);
        },
        // one star appearing on the Final Review. o = { i: star number, on: earned?, delay: seconds from now }
        star: function (o) {
            if (o.on) {
                const notes = [523, 659, 784, 1047, 1319];            // C E G C E: climbs with every star
                const f = notes[Math.min(o.i, notes.length - 1)];
                tone(f, o.delay, 0.2, 'triangle', 0.13);
                tone(f * 2, o.delay + 0.02, 0.14, 'sine', 0.05);
            } else {
                tone(180, o.delay, 0.14, 'triangle', 0.05, 130);     // soft dull tap for an empty star
            }
        },
        // 5/5 on the Final Review: victory chord with a sparkle, after the last star (d = seconds from now)
        perfect: function (d) {
            const t = d || 0.3;
            [523, 659, 784, 1047].forEach(function (f) { tone(f, t, 0.95, 'square', 0.06); });
            tone(262, t, 0.95, 'triangle', 0.14);
            tone(392, t + 0.2, 0.75, 'triangle', 0.1);
            [1568, 1976, 2349, 2637, 3136].forEach(function (f, i) {
                tone(f, t + 0.1 + i * 0.09, 0.22, 'sine', 0.05);
            });
        },
        // zone unlock (timed to the animation in fx.js): rattle, pop open, chains snap, sparkle
        unlock: function () {
            [0.45, 0.55, 0.65, 0.75].forEach(function (t, i) {         // padlock rattles
                tone(i % 2 ? 130 : 160, t, 0.05, 'square', 0.1, 95);
            });
            tone(110, 1.0, 0.07, 'square', 0.15, 70);                  // click: the lock opens
            tone(784, 1.02, 0.2, 'triangle', 0.1);
            tone(1175, 1.1, 0.3, 'triangle', 0.1);
            [1800, 1400, 1100, 900, 700].forEach(function (f, i) {     // chains snap
                tone(f, 1.25 + i * 0.05, 0.06, 'square', 0.05);
            });
            tone(200, 1.25, 0.4, 'sawtooth', 0.06, 60);                // chains fall
            [1047, 1319, 1568, 2093].forEach(function (f, i) {         // shine
                tone(f, 1.45 + i * 0.07, 0.14, 'triangle', 0.07);
            });
            tone(2637, 1.8, 0.4, 'sine', 0.06);
        },
        // loading screen: rising scan ticks, a beep at each status line, and a "ready" chime at the end.
        // ms = how long the loading screen stays up (same as loader.js).
        loading: function (ms) {
            const total = ms / 1000;
            const ticks = Math.max(4, Math.floor(total / 0.09));
            for (let i = 0; i < ticks; i++) {
                const p = i / ticks;
                tone(300 * Math.pow(3, p), p * (total - 0.35), 0.03, 'square', 0.035);
            }
            [0, 0.3, 0.6, 0.85].forEach(function (mark, i) {       // matches the four status lines
                tone(660 + i * 110, mark * total, 0.08, 'triangle', 0.09);
            });
            tone(660, total - 0.3, 0.12, 'square', 0.09);           // ready
            tone(990, total - 0.17, 0.22, 'square', 0.09);
        }
    };

    function play(name, arg) {
        if (!ready()) return;
        try { sounds[name](arg); } catch (e) { /* never let a sound break the game */ }
    }
    window.labSfx = { play: play };

    /* ---------- Button clicks ---------- */
    const isButton = el => el && el.closest && el.closest('button, [role="button"]');

    // pointerdown (not click) so other handlers that stop the click cannot silence the sound
    document.addEventListener('pointerdown', function (e) {
        const b = isButton(e.target);
        if (!b || b.disabled || b.id === 'sfxToggle' || b.id === 'hazardMarker' || b.id === 'bigFlashlight') return;
        play('click');
    }, true);

    // keyboard activation (Enter / Space on a focused button)
    document.addEventListener('keydown', function (e) {
        if ((e.key !== 'Enter' && e.key !== ' ') || e.repeat) return;
        const b = isButton(document.activeElement);
        if (!b || b.disabled || b.id === 'sfxToggle' || b.id === 'hazardMarker' || b.id === 'bigFlashlight') return;
        play('click');
    }, true);

    /* ---------- Correct / incorrect ---------- */
    const phaseLabel = document.getElementById('phaseLabel');
    new MutationObserver(function () {
        const t = phaseLabel.textContent || '';
        if (/INCORRECT/i.test(t)) play('incorrect');
        else if (/CORRECT/i.test(t)) play('correct');
    }).observe(phaseLabel, { childList: true, characterData: true, subtree: true });

    /* ---------- Hazard identified / missed / too dark (mission.js) ---------- */
    const missionScreen = document.getElementById('missionScreen');
    const sceneViewport = document.getElementById('sceneViewport');
    let wasFound = false;
    new MutationObserver(function () {
        const f = missionScreen.classList.contains('hazard-found');
        if (f && !wasFound) play('found');
        wasFound = f;
    }).observe(missionScreen, { attributes: true, attributeFilter: ['class'] });

    // mission.js adds a small tag to the scene for a wrong click or a click with the lights off
    new MutationObserver(function (list) {
        list.forEach(function (m) {
            m.addedNodes.forEach(function (n) {
                if (!n.classList) return;
                if (n.classList.contains('wrong-tag')) play('miss');
                else if (n.classList.contains('dark-tag')) play('dark');
            });
        });
    }).observe(sceneViewport, { childList: true });

    /* ---------- Flashlight switch (mission.js toggles the "lit" class on the scene) ---------- */
    let wasLit = false;
    new MutationObserver(function () {
        const lit = sceneViewport.classList.contains('lit');
        if (lit !== wasLit && missionScreen.classList.contains('active')) play(lit ? 'lightOn' : 'lightOff');
        wasLit = lit;
    }).observe(sceneViewport, { attributes: true, attributeFilter: ['class'] });

    /* ---------- Final Review: a sound for every star, then a fanfare for a perfect score ---------- */
    const resultScreen = document.getElementById('resultScreen');
    const resultCard = resultScreen.querySelector('.result-card');
    let wasResult = false;
    new MutationObserver(function () {
        const on = resultScreen.classList.contains('active');
        if (on && !wasResult) {
            // script.js writes the number of correct answers into data-tier before showing the screen.
            // Each star plays when its own pop-in animation starts (the delay comes from the CSS).
            let last = 0;
            resultScreen.querySelectorAll('.rs-star').forEach(function (star, i) {
                const d = parseFloat(getComputedStyle(star).animationDelay) || 0;
                last = Math.max(last, d);
                play('star', { i: i, on: star.classList.contains('on'), delay: d + 0.08 });
            });
            if (resultCard.dataset.tier === '5') play('perfect', last + 0.55);
        }
        wasResult = on;
    }).observe(resultScreen, { attributes: true, attributeFilter: ['class'] });

    /* ---------- Loading screen (loader.js adds the "show" class) ---------- */
    const loadingScreen = document.getElementById('loadingScreen');
    let wasLoading = false;
    new MutationObserver(function () {
        const on = loadingScreen.classList.contains('show');
        if (on && !wasLoading) {
            const bar = loadingScreen.querySelector('.load-bar i');
            const ms = (bar && parseFloat(bar.style.getPropertyValue('--load-ms'))) || 2200;
            play('loading', ms);
        }
        wasLoading = on;
    }).observe(loadingScreen, { attributes: true, attributeFilter: ['class'] });

    /* ---------- Master volume ---------- */
    window.addEventListener('labvolume', function () {
        if (master) master.gain.setTargetAtTime(0.5 * vol(), ctx.currentTime, 0.02);
    });
    const volSlider = document.getElementById('volumeSlider');
    // a little blip when you let go of the slider, so you can hear the new level
    if (volSlider) volSlider.addEventListener('change', function () { play('click'); });

    /* ---------- On / off button in the header ---------- */
    const toggle = document.getElementById('sfxToggle');
    function paint() {
        toggle.setAttribute('aria-pressed', String(enabled));
        toggle.setAttribute('aria-label', enabled ? 'Sound effects on' : 'Sound effects off');
        toggle.classList.toggle('off', !enabled);
    }
    if (toggle) {
        toggle.addEventListener('click', function () {
            enabled = !enabled;
            try { localStorage.setItem('labview.sfx', enabled ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
            paint();
            if (enabled) play('click');
        });
        paint();
    }
})();
