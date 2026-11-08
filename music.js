// Background music, composed in code with the Web Audio API (no audio files needed).
// Chiptune loops: a calm one for the home page, a brighter, bouncier one for the zone selection page,
// a faster, tenser one while a mission is running, and two for the Final Review that depend on the score:
// a victory theme for a high score (4 or 5 correct) and a gentle "you can do it, try again" loop for a
// low score (0 to 2 correct). A middle score (3) keeps the calm home loop.
// A note button in the header turns it on / off. The choice is remembered.
(function () {
    const AC = window.AudioContext || window.webkitAudioContext;
    const missionScreen = document.getElementById('missionScreen');
    const mapScreen = document.getElementById('mapScreen');
    const resultScreen = document.getElementById('resultScreen');
    const resultCard = resultScreen ? resultScreen.querySelector('.result-card') : null;
    const toggle = document.getElementById('musicToggle');

    let enabled = true;
    try { enabled = localStorage.getItem('labview.music') !== 'off'; } catch (e) { /* storage blocked */ }

    const LEVEL = 0.2;                 // music volume (the sound effects are louder, so they stay clear)
    const DUCK = 0.3;                  // how much of that volume is left while the loading screen is up
    const vol = () => (window.labVolume ? window.labVolume.get() : 1);   // master volume slider (volume.js)
    let ctx = null, master = null, volNode = null, noiseBuf = null;
    let playing = false, timer = null, step = 0, nextTime = 0;
    let ducking = false;               // true while the loading screen (loader.js) is showing
    const targetLevel = () => LEVEL * (ducking ? DUCK : 1);

    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

    /* ---------- The songs: 4 bars, 8 eighth-note steps per bar (32 steps), null = rest ---------- */

    // HOME + MISSION: Am - F - C - G
    const BASS = [45, 41, 48, 43];                               // A2 F2 C3 G2
    const CHORDS = [[69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]];   // arpeggio notes
    const ARP = [0, 1, 2, 1, 0, 1, 2, 1];
    const MELODY = [
        81, null, 84, null, 88, null, 84, null,
        81, null, 84, null, 89, null, 84, null,
        79, null, 84, null, 88, null, 84, null,
        83, null, 86, null, 83, null, 79, null
    ];

    // ZONE SELECTION: C - G - Am - F, major key, kick + snare groove, bouncing bass, lively square lead
    const Z_BASS = [48, 43, 45, 41];                             // C3 G2 A2 F2
    const Z_CHORDS = [[72, 76, 79], [71, 74, 79], [72, 76, 81], [72, 77, 81]];
    const Z_ARP = [0, 1, 2, 1, 2, 1, 0, 1];
    const Z_MELODY = [
        84, null, 79, null, 76, 79, 84, null,
        83, null, 79, null, 74, 79, 83, null,
        81, null, 84, null, 88, 84, 81, null,
        89, null, 84, null, 81, 84, 86, null
    ];

    // FINAL REVIEW, HIGH SCORE ("winner"): C - F - G - C, fast, four-on-the-floor kick, pumping bass, heroic lead
    const W_BASS = [48, 53, 55, 48];                             // C3 F3 G3 C3
    const W_CHORDS = [[72, 76, 79], [72, 77, 81], [71, 74, 79], [72, 76, 79]];
    const W_ARP = [0, 1, 2, 1, 0, 1, 2, 1];
    const W_MELODY = [
        84, null, 84, 79, 84, null, 88, null,
        89, null, 88, 84, 81, null, 84, null,
        86, null, 86, 83, 79, null, 83, null,
        88, 91, 96, 91, 96, null, null, null
    ];

    // FINAL REVIEW, LOW SCORE ("try again"): Dm - Bb - F - C, slow and soft, warm pad, a gentle march,
    // and a little rising tune that ends on a question and leads back to the start, as if saying "once more!"
    const R_BASS = [50, 46, 53, 48];                             // D3 Bb2 F3 C3
    const R_CHORDS = [[62, 65, 69], [58, 62, 65], [65, 69, 72], [60, 64, 67]];
    const R_ARP = [0, 1, 2, 1, 0, 1, 2, 1];
    const R_MELODY = [
        74, null, null, 77, 81, null, null, null,
        82, null, null, 81, 77, null, null, null,
        77, null, 81, null, 84, null, 81, null,
        76, null, 79, null, 81, null, 79, null
    ];

    const SONGS = {
        win: {
            play: function (i, t, len) {
                const bar = Math.floor(i / 8) % 4, s = i % 8;
                if (s % 2 === 0) kick(t, 0.26);                           // kick on every beat
                if (s === 2 || s === 6) snare(t, 0.08);                   // backbeat
                hat(t, i === 0 ? 0.09 : (s % 2 ? 0.045 : 0.03));         // a crash on the first step of the loop
                tone(mtof(W_BASS[bar] + (s % 2 ? 12 : 0)), t, len * 0.9, 'triangle', s % 2 ? 0.1 : 0.17);
                tone(mtof(W_CHORDS[bar][W_ARP[s]]), t, len * 0.7, 'square', 0.03);
                const m = W_MELODY[i];
                if (m) {
                    tone(mtof(m), t, len * 1.6, 'square', 0.055);          // lead
                    tone(mtof(m - 12), t, len * 1.6, 'triangle', 0.05);    // doubled an octave lower: big and proud
                }
            }
        },
        retry: {
            play: function (i, t, len) {
                const bar = Math.floor(i / 8) % 4, s = i % 8;
                if (s === 0) R_CHORDS[bar].forEach(n => tone(mtof(n), t, len * 7.6, 'sine', 0.035));   // warm pad
                if (s === 0 || s === 4) kick(t, 0.17);                    // soft march
                if (s === 6) snare(t, 0.035);
                if (s % 2) hat(t, 0.018);
                if (s === 0 || s === 4) tone(mtof(R_BASS[bar]), t, len * 3.4, 'triangle', 0.14);
                tone(mtof(R_CHORDS[bar][R_ARP[s]] + 12), t, len * 0.8, 'triangle', 0.035);
                const m = R_MELODY[i];
                if (m) tone(mtof(m), t, len * 2.4, 'triangle', 0.1);
            }
        }
    };

    // which song fits the screen the player is on
    function currentTrack() {
        if (missionScreen.classList.contains('active')) return 'mission';
        if (mapScreen && mapScreen.classList.contains('active')) return 'zones';
        if (resultScreen && resultScreen.classList.contains('active') && resultCard) {
            const correct = parseInt(resultCard.dataset.tier, 10);      // number of correct answers, set by script.js
            if (correct >= 4) return 'win';
            if (correct <= 2) return 'retry';
        }
        return 'home';
    }

    function tone(freq, t, dur, type, vol) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.03);
    }

    function hat(t, vol) {
        const src = ctx.createBufferSource();
        const hp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        src.buffer = noiseBuf;
        hp.type = 'highpass';
        hp.frequency.value = 7000;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        src.connect(hp);
        hp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 0.06);
    }

    function kick(t, vol) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    function snare(t, vol) {
        const src = ctx.createBufferSource();
        const bp = ctx.createBiquadFilter();
        const g = ctx.createGain();
        src.buffer = noiseBuf;
        bp.type = 'bandpass';
        bp.frequency.value = 1800;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 0.1);
    }

    let track = currentTrack();
    const inMission = () => track === 'mission';
    const BPM = { home: 98, zones: 108, mission: 120, win: 132, retry: 84 };
    const stepLen = () => (60 / BPM[track]) / 2;   // length of one eighth note

    function playZones(i, t) {
        const bar = Math.floor(i / 8) % 4;
        const s = i % 8;
        const len = stepLen();

        // groove: kick on beats 1 and 3, snare on beats 2 and 4, hi-hat on every eighth (accented off-beats)
        if (s === 0 || s === 4) kick(t, 0.28);
        if (s === 2 || s === 6) snare(t, 0.07);
        hat(t, s % 2 ? 0.04 : 0.025);

        // bouncing octave bass
        tone(mtof(Z_BASS[bar] + (s % 2 ? 12 : 0)), t, len * 0.9, 'triangle', s % 2 ? 0.1 : 0.18);

        // bright arpeggio
        tone(mtof(Z_CHORDS[bar][Z_ARP[s]]), t, len * 0.7, 'square', 0.03);

        // lead melody
        const m = Z_MELODY[i];
        if (m) tone(mtof(m), t, len * 1.5, 'square', 0.05);
    }

    function playStep(i, t) {
        if (track === 'zones') { playZones(i, t); return; }
        if (SONGS[track]) { SONGS[track].play(i, t, stepLen()); return; }
        const bar = Math.floor(i / 8) % 4;
        const s = i % 8;
        const len = stepLen();
        const tense = inMission();

        // bass: root on beats 1 and 3, a jump up before the next bar (every eighth in a mission)
        if (tense || s === 0 || s === 4) tone(mtof(BASS[bar]), t, len * 1.8, 'triangle', 0.2);
        if (!tense && s === 6) tone(mtof(BASS[bar] + 12), t, len * 0.9, 'triangle', 0.12);

        // soft arpeggio under everything
        tone(mtof(CHORDS[bar][ARP[s]]), t, len * 0.8, 'square', tense ? 0.035 : 0.028);

        // melody only in the calm version
        const m = MELODY[i];
        if (!tense && m) tone(mtof(m), t, len * 1.6, 'triangle', 0.09);

        // light hi-hat: off-beats (every step in a mission)
        if (tense || s % 2 === 1) hat(t, tense ? 0.05 : 0.035);
    }

    function schedule() {
        while (nextTime < ctx.currentTime + 0.3) {
            playStep(step, nextTime);
            nextTime += stepLen();
            step = (step + 1) % 32;
        }
    }

    /* ---------- Start / stop (with a short fade) ---------- */
    function start() {
        if (!AC || playing) return;
        if (!ctx) {
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0;
            volNode = ctx.createGain();
            volNode.gain.value = vol();
            master.connect(volNode);
            volNode.connect(ctx.destination);
            noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
        }
        if (ctx.state === 'suspended') ctx.resume();
        playing = true;
        nextTime = ctx.currentTime + 0.1;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(targetLevel(), ctx.currentTime + 1.2);
        timer = setInterval(schedule, 50);
    }

    // Duck the music under the loading screen's own beeps and "ready" chime, then bring it back up.
    function setDucking(on) {
        ducking = on;
        if (!ctx || !master || !playing) return;      // nothing audible to duck right now
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.setTargetAtTime(targetLevel(), ctx.currentTime, 0.25);
    }
    const loadingScreenEl = document.getElementById('loadingScreen');
    if (loadingScreenEl) {
        let wasLoading = loadingScreenEl.classList.contains('show');
        new MutationObserver(function () {
            const on = loadingScreenEl.classList.contains('show');
            if (on !== wasLoading) setDucking(on);
            wasLoading = on;
        }).observe(loadingScreenEl, { attributes: true, attributeFilter: ['class'] });
    }

    function stop() {
        if (!playing) return;
        playing = false;
        clearInterval(timer);
        timer = null;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    }

    // Browsers only allow audio after a click or key press: start on the first one.
    function firstGesture() {
        document.removeEventListener('pointerdown', firstGesture, true);
        document.removeEventListener('keydown', firstGesture, true);
        if (enabled) start();
    }
    document.addEventListener('pointerdown', firstGesture, true);
    document.addEventListener('keydown', firstGesture, true);

    // Pause while the tab is hidden.
    document.addEventListener('visibilitychange', function () {
        if (!ctx) return;
        if (document.hidden) ctx.suspend();
        else if (playing) ctx.resume();
    });

    /* ---------- Switch song when the screen changes ---------- */
    function syncTrack() {
        const next = currentTrack();
        if (next === track) return;
        track = next;
        step = 0;                                   // new song starts from its first bar
        if (ctx && playing) nextTime = Math.max(nextTime, ctx.currentTime + 0.05);
    }
    const screenObserver = new MutationObserver(syncTrack);
    document.querySelectorAll('.screen').forEach(sc =>
        screenObserver.observe(sc, { attributes: true, attributeFilter: ['class'] }));

    // the score decides which Final Review song plays, so follow it if it changes while the page is showing
    if (resultCard) new MutationObserver(syncTrack).observe(resultCard, { attributes: true, attributeFilter: ['data-tier'] });

    /* ---------- Master volume ---------- */
    window.addEventListener('labvolume', function () {
        if (volNode) volNode.gain.setTargetAtTime(vol(), ctx.currentTime, 0.02);
    });

    /* ---------- Header button ---------- */
    function paint() {
        if (!toggle) return;
        toggle.setAttribute('aria-pressed', String(enabled));
        toggle.setAttribute('aria-label', enabled ? 'Background music on' : 'Background music off');
        toggle.classList.toggle('off', !enabled);
    }
    if (toggle) {
        toggle.addEventListener('click', function () {
            enabled = !enabled;
            try { localStorage.setItem('labview.music', enabled ? 'on' : 'off'); } catch (e) { /* storage blocked */ }
            paint();
            if (enabled) start(); else stop();
        });
        paint();
    }

    window.labMusic = { start: start, stop: stop };
})();
