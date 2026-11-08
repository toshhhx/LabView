// Level 1 mission: dark lab you light with a flashlight, an invisible hazard to find,
// lively lab ambience, and a "time's up" pop-up that sends you back to the zone selection.
(function () {
    const missionScreen = document.getElementById('missionScreen');
    const mapScreen = document.getElementById('mapScreen');
    const viewport = document.getElementById('sceneViewport');
    const tag = document.getElementById('missionTag');
    const timerValue = document.getElementById('timerValue');
    const tip = viewport.querySelector('.scene-tip');
    const ambient = document.getElementById('sceneAmbient');
    const overlay = document.getElementById('darkOverlay');
    const bigFlashlight = document.getElementById('bigFlashlight');
    const hint = document.getElementById('flashlightHint');
    const timeoutDialog = document.getElementById('timeoutDialog');
    const foundCheck = document.getElementById('foundCheck');
    const bigTimer = document.getElementById('bigTimer');
    const bigTimerValue = document.getElementById('bigTimerValue');
    const timeVignette = document.getElementById('timeVignette');
    const toast = document.getElementById('timeToast');
    const hazardMarker = document.getElementById('hazardMarker');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = (a, b) => a + Math.random() * (b - a);

    const TIP_ORIGINAL = tip ? tip.textContent : '';
    const TIP_LEVEL1 = 'Turn on the flashlight, then search the dark lab for the hazard.';

    let inLevel1 = false;
    let lit = false;
    let armed = false;          // true once the timer has shown a positive value in this run
    let timeoutShown = false;
    let lastX = 0, lastY = 0;
    let found = false;          // the hazard has been identified
    let prevSeconds = null;     // last timer value seen, used to detect 30 / 15 / 5 second marks
    let toastTimer = null;

    const levelNumber = () => parseInt((tag.textContent || '').replace(/\D/g, ''), 10);

    /* ---------- Lab ambience (under the darkness, so it shows inside the beam) ---------- */
    function buildAmbience() {
        if (reduce || ambient.childElementCount) return;
        const light = document.createElement('div');
        light.className = 'scene-light';
        ambient.appendChild(light);
        for (let i = 0; i < 22; i++) {            // bubbles rising like flasks on a bench
            const b = document.createElement('span');
            b.className = 'bubble';
            b.style.setProperty('--x', rand(4, 96).toFixed(1) + '%');
            b.style.setProperty('--s', (Math.round(rand(2, 5)) * 2) + 'px');
            b.style.setProperty('--d', rand(7, 13).toFixed(1) + 's');
            b.style.setProperty('--delay', '-' + rand(0, 12).toFixed(1) + 's');
            ambient.appendChild(b);
        }
        for (let i = 0; i < 26; i++) {            // dust motes twinkling
            const m = document.createElement('span');
            m.className = 'mote';
            m.style.setProperty('--x', rand(2, 98).toFixed(1) + '%');
            m.style.setProperty('--y', rand(5, 90).toFixed(1) + '%');
            m.style.setProperty('--d', rand(3, 7).toFixed(1) + 's');
            m.style.setProperty('--delay', '-' + rand(0, 7).toFixed(1) + 's');
            ambient.appendChild(m);
        }
    }

    /* ---------- Flashlight ---------- */
    function moveBeam(x, y) {
        viewport.style.setProperty('--fx', x + 'px');
        viewport.style.setProperty('--fy', y + 'px');
    }
    function hideBeam() { moveBeam(-1000, -1000); }

    function setFlashlight(on) {
        lit = on;
        viewport.classList.toggle('lit', on);
        bigFlashlight.setAttribute('aria-pressed', String(on));
        bigFlashlight.setAttribute('aria-label', on ? 'Turn the flashlight off' : 'Turn the flashlight on');
        hint.textContent = on ? 'Flashlight ON' : 'Click to turn on';
        if (on) {
            const r = viewport.getBoundingClientRect();
            moveBeam(lastX || r.width / 2, lastY || r.height / 2);
        } else {
            hideBeam();
        }
    }

    bigFlashlight.addEventListener('click', function (e) {
        e.stopPropagation();                       // do not count as a click on the scene
        setFlashlight(!lit);
    });

    function followPointer(e) {
        if (!inLevel1) return;
        const r = viewport.getBoundingClientRect();
        lastX = e.clientX - r.left;
        lastY = e.clientY - r.top;
        if (lit) moveBeam(lastX, lastY);
    }
    viewport.addEventListener('pointermove', followPointer);
    viewport.addEventListener('pointerdown', followPointer);
    viewport.addEventListener('pointerleave', function () { if (inLevel1 && lit) hideBeam(); });
    viewport.addEventListener('pointerenter', function (e) { if (inLevel1 && lit) followPointer(e); });

    /* ---------- Hazard feedback: glowing check mark / "Incorrect" tag ---------- */
    function resetFeedback() {
        found = false;
        missionScreen.classList.remove('hazard-found');
        foundCheck.classList.remove('show');
        viewport.querySelectorAll('.wrong-tag').forEach(el => el.remove());
        toast.classList.remove('show');
        clearTimeout(toastTimer);
    }

    function showFound(x, y) {
        found = true;
        missionScreen.classList.add('hazard-found');   // lets quiz.js know the question can open
        foundCheck.style.left = x + 'px';
        foundCheck.style.top = y + 'px';
        foundCheck.classList.remove('show');
        void foundCheck.offsetWidth;                 // restart the pop-in animation
        foundCheck.classList.add('show');
    }

    function showDark(x, y) {
        const r = viewport.getBoundingClientRect();
        viewport.querySelectorAll('.dark-tag').forEach(el => el.remove());
        const tagEl = document.createElement('div');
        tagEl.className = 'dark-tag';
        tagEl.textContent = 'Too dark, space unidentified!';
        tagEl.style.left = Math.min(Math.max(x, 150), Math.max(r.width - 150, 150)) + 'px';
        tagEl.style.top = Math.max(y, 44) + 'px';
        viewport.appendChild(tagEl);
        setTimeout(() => tagEl.remove(), 1700);
    }

    function showWrong(x, y) {
        const r = viewport.getBoundingClientRect();
        const tagEl = document.createElement('div');
        tagEl.className = 'wrong-tag';
        tagEl.textContent = 'Incorrect';
        tagEl.style.left = Math.min(Math.max(x, 60), r.width - 60) + 'px';
        tagEl.style.top = Math.max(y, 40) + 'px';
        viewport.appendChild(tagEl);
        setTimeout(() => tagEl.remove(), 1300);
    }

    // Capture phase: runs before the game's own click handling, so the marker position is still readable.
    viewport.addEventListener('click', function (e) {
        if (!inLevel1 || found || timeoutShown) return;
        if (e.target.closest('.big-flashlight, .scene-tip, .big-timer, .time-toast, .wrong-tag, .dark-tag, .found-check')) return;
        const r = viewport.getBoundingClientRect();
        // Lights off: nothing in the scene can be identified, so the click never reaches the game.
        if (!lit) {
            e.stopImmediatePropagation();
            e.preventDefault();
            const keyboard = e.clientX === 0 && e.clientY === 0;
            showDark(keyboard ? r.width / 2 : e.clientX - r.left, keyboard ? r.height / 2 : e.clientY - r.top);
            return;
        }
        if (e.target.closest('#hazardMarker')) {
            const m = hazardMarker.getBoundingClientRect();
            const cx = m.width ? m.left + m.width / 2 : e.clientX;
            const cy = m.height ? m.top + m.height / 2 : e.clientY;
            showFound(cx - r.left, cy - r.top);
        } else {
            showWrong(e.clientX - r.left, e.clientY - r.top);
        }
    }, true);

    /* ---------- Big timer + 30 / 15 / 5 second alerts ---------- */
    const ALERTS = [
        { at: 30, text: '30 seconds left', state: 'warn' },
        { at: 15, text: '15 seconds left', state: 'danger' },
        { at: 5,  text: '5 seconds left!', state: 'crit' }
    ];

    function updateBigTimer(sec) {
        bigTimerValue.textContent = isNaN(sec) ? '--' : sec;
        const state = isNaN(sec) ? 'ok' : sec <= 5 ? 'crit' : sec <= 15 ? 'danger' : sec <= 30 ? 'warn' : 'ok';
        bigTimer.dataset.state = state;
        timeVignette.dataset.state = state;
    }

    function showToast(alert) {
        toast.textContent = alert.text;
        toast.dataset.state = alert.state;
        toast.classList.remove('show');
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
    }

    /* ---------- Entering / leaving level 1 ---------- */
    function enterLevel1() {
        inLevel1 = true;
        armed = false;
        timeoutShown = false;
        lastX = lastY = 0;
        viewport.classList.add('level1');
        // Keep the big flashlight away from the hazard: it sits in the bottom corner on the opposite
        // side of the hazard (hazards on the right half -> flashlight bottom-left, otherwise bottom-right).
        const lv = (typeof levels !== 'undefined' && typeof gameState !== 'undefined') ? levels[gameState.levelIndex] : null;
        viewport.classList.toggle('fl-left', !!(lv && lv.hotspot && lv.hotspot[0] > 50));
        buildAmbience();
        setFlashlight(false);
        if (tip) tip.textContent = TIP_LEVEL1;
        missionScreen.classList.remove('timeup');
        resetFeedback();
        prevSeconds = null;
        updateBigTimer(parseInt(timerValue.textContent, 10));
    }
    function leaveLevel1() {
        inLevel1 = false;
        viewport.classList.remove('level1', 'lit');
        lit = false;
        if (tip) tip.textContent = TIP_ORIGINAL;
        resetFeedback();
        missionScreen.classList.remove('timeup');
    }
    // The dark lab + flashlight now runs on EVERY level (1 to 5).
    function sync() {
        const active = missionScreen.classList.contains('active');
        if (active && !inLevel1) enterLevel1();
        else if (!active && inLevel1) leaveLevel1();
    }
    new MutationObserver(sync).observe(missionScreen, { attributes: true, attributeFilter: ['class'] });
    // script.js rewrites the level tag every time a level loads, so a tag change while the mission is
    // showing means a fresh level: switch the lights off and reset everything for it.
    new MutationObserver(function () {
        if (missionScreen.classList.contains('active')) enterLevel1(); else sync();
    }).observe(tag, { childList: true, characterData: true, subtree: true });
    sync();

    /* ---------- Time's up ---------- */
    function goToZones() {
        missionScreen.classList.remove('timeup');
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        mapScreen.classList.add('active');
        window.scrollTo(0, 0);
    }
    // For a short moment afterwards, make sure the game does not pull the player back into the mission.
    function guardZones(ms) {
        const until = Date.now() + ms;
        const guard = new MutationObserver(function () {
            if (Date.now() > until) { guard.disconnect(); return; }
            if (!mapScreen.classList.contains('active')) goToZones();
        });
        document.querySelectorAll('.screen').forEach(s =>
            guard.observe(s, { attributes: true, attributeFilter: ['class'] }));
        setTimeout(() => guard.disconnect(), ms + 50);
    }

    function showTimeout() {
        timeoutShown = true;
        missionScreen.classList.add('timeup');      // hides the big timer and the header timer
        setFlashlight(false);
        if (!timeoutDialog.open) timeoutDialog.showModal();
        document.getElementById('timeoutOk').focus();
    }
    document.getElementById('timeoutOk').addEventListener('click', () => timeoutDialog.close());
    // Runs for both the button and the Esc key.
    timeoutDialog.addEventListener('close', function () {
        goToZones();
        guardZones(2500);
    });

    // Watch the game's own countdown instead of replacing it.
    new MutationObserver(function () {
        if (!inLevel1 || timeoutShown) return;
        const seconds = parseInt(timerValue.textContent, 10);
        if (isNaN(seconds)) return;

        updateBigTimer(seconds);

        // Alert when a 30 / 15 / 5 second mark is crossed (only the most urgent one if several are skipped).
        if (prevSeconds !== null && seconds < prevSeconds) {
            let hit = null;
            ALERTS.forEach(a => { if (prevSeconds > a.at && seconds <= a.at) hit = a; });
            if (hit) showToast(hit);
        }
        prevSeconds = seconds;

        if (seconds > 0) armed = true;
        else if (armed) showTimeout();
    }).observe(timerValue, { childList: true, characterData: true, subtree: true });
})();
