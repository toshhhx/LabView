// Home page effects: ambient lab details, typing headline, gentle parallax, rotating safety tip.
(function () {
    const home = document.getElementById('homeScreen');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = (a, b) => a + Math.random() * (b - a);

    /* ---------- 1. Ambient lab details (bubbles + dust motes) ---------- */
    // Builds one ambient layer. Used on the home page and on the zone selection page.
    function makeAmbient(bubbleRange, bubbleCount, moteCount) {
        const ambient = document.createElement('div');
        ambient.className = 'ambient';
        ambient.setAttribute('aria-hidden', 'true');

        // Bubbles rise from the bottom like flasks bubbling in the lab.
        for (let i = 0; i < bubbleCount; i++) {
            const b = document.createElement('span');
            b.className = 'bubble';
            b.style.setProperty('--x', rand(bubbleRange[0], bubbleRange[1]).toFixed(1) + '%');
            b.style.setProperty('--s', (Math.round(rand(2, 5)) * 2) + 'px');
            b.style.setProperty('--d', rand(7, 13).toFixed(1) + 's');
            b.style.setProperty('--delay', '-' + rand(0, 12).toFixed(1) + 's');
            ambient.appendChild(b);
        }
        // Tiny dust motes twinkle in the light.
        for (let i = 0; i < moteCount; i++) {
            const m = document.createElement('span');
            m.className = 'mote';
            m.style.setProperty('--x', rand(bubbleRange[0] - 20, 98).toFixed(1) + '%');
            m.style.setProperty('--y', rand(8, 85).toFixed(1) + '%');
            m.style.setProperty('--d', rand(3, 7).toFixed(1) + 's');
            m.style.setProperty('--delay', '-' + rand(0, 7).toFixed(1) + 's');
            ambient.appendChild(m);
        }
        return ambient;
    }

    if (!reduce) {
        // Home page: bubbles rise from the lower right, where the flasks and test tubes are.
        home.insertBefore(makeAmbient([55, 95], 14, 16), home.querySelector('.hero-content'));

        // Final Review page: the same lab ambience behind the report card.
        const resultScreenAmb = document.getElementById('resultScreen');
        if (resultScreenAmb) {
            resultScreenAmb.insertBefore(makeAmbient([4, 96], 18, 22), resultScreenAmb.firstChild);
        }

        // Zone selection page: bubbles and motes across the whole width, behind the cards.
        const mapScreen = document.getElementById('mapScreen');
        if (mapScreen) {
            mapScreen.insertBefore(makeAmbient([4, 96], 16, 18), mapScreen.firstChild);
        }
    }

    /* ---------- 2. Typing effect on "Control the risk." ---------- */
    const h1 = home.querySelector('.hero-content h1');
    const em = h1.querySelector('em');
    const fullText = em.textContent.trim();
    h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());

    // The cursor lives inside the <em> but is absolutely positioned, so it never takes up
    // layout space and can never push the headline onto an extra line.
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    const textNode = document.createTextNode(fullText);
    em.textContent = '';
    em.appendChild(textNode);
    em.appendChild(caret);

    const ZWSP = '\u200B';   // invisible character keeps the second line's height reserved while empty

    let typeTimer, caretTimer;
    function typeHeadline() {
        clearTimeout(typeTimer);
        clearTimeout(caretTimer);
        if (reduce) { textNode.nodeValue = fullText; caret.style.display = 'none'; return; }
        textNode.nodeValue = ZWSP;
        caret.classList.remove('done');
        let i = 0;
        typeTimer = setTimeout(function step() {
            textNode.nodeValue = fullText.slice(0, ++i);
            if (i < fullText.length) {
                typeTimer = setTimeout(step, 65);
            } else {
                caretTimer = setTimeout(() => caret.classList.add('done'), 2200);
            }
        }, 950);   // wait for the load-in sequence to bring the headline on screen
    }

    /* ---------- 3. Gentle parallax (mouse only) ---------- */
    if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let frame = null, nx = 0, ny = 0;
        home.addEventListener('mousemove', function (e) {
            const r = home.getBoundingClientRect();
            nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
            ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
            if (!frame) {
                frame = requestAnimationFrame(function () {
                    home.style.setProperty('--px', (nx * -14).toFixed(1) + 'px');
                    home.style.setProperty('--py', (ny * -9).toFixed(1) + 'px');
                    frame = null;
                });
            }
        });
        home.addEventListener('mouseleave', function () {
            home.style.setProperty('--px', '0px');
            home.style.setProperty('--py', '0px');
        });
    }

    /* ---------- 4. Rotating safety tip ---------- */
    const tips = [
        'Always read the chemical label before you use or mix anything.',
        'Wear goggles, gloves and a lab coat before you start work.',
        'Know where the eyewash station and fire extinguisher are.',
        'Never taste, sniff or touch chemicals directly.',
        'Tie back long hair and keep loose sleeves away from flames.',
        'No food or drinks in the lab, ever.',
        'Report every spill or broken glass to your supervisor right away.',
        'Add acid to water, never water to acid.'
    ];
    const tipBox = document.getElementById('safetyTip');
    const tipText = document.getElementById('tipText');
    let tipIndex = Math.floor(Math.random() * tips.length);
    let tipPaused = false;

    function showTip() {
        tipText.classList.remove('swap');
        void tipText.offsetWidth;            // restart the CSS animation
        tipText.textContent = tips[tipIndex];
        tipText.classList.add('swap');
    }
    tipText.textContent = tips[tipIndex];

    tipBox.addEventListener('mouseenter', () => { tipPaused = true; });
    tipBox.addEventListener('mouseleave', () => { tipPaused = false; });
    setInterval(function () {
        if (tipPaused || document.hidden || !home.classList.contains('active')) return;
        tipIndex = (tipIndex + 1) % tips.length;
        showTip();
    }, 3000);

    /* ---------- 5. Locked zone frame: two crossed chains, a padlock and a "LOCKED" tag ---------- */
    const SVG_NS = 'http://www.w3.org/2000/svg';
    // Pixel padlock drawn inline, so it works without any image file.
    const LOCK_PAD_SVG = '<svg class="lock-pad" viewBox="0 0 12 12" shape-rendering="crispEdges"><rect x="4" y="0" width="4" height="1" fill="#0b1220"/><rect x="3" y="1" width="1" height="1" fill="#0b1220"/><rect x="4" y="1" width="4" height="1" fill="#9cb6c5"/><rect x="8" y="1" width="1" height="1" fill="#0b1220"/><rect x="2" y="2" width="1" height="1" fill="#0b1220"/><rect x="3" y="2" width="1" height="1" fill="#9cb6c5"/><rect x="8" y="2" width="1" height="1" fill="#9cb6c5"/><rect x="9" y="2" width="1" height="1" fill="#0b1220"/><rect x="2" y="3" width="1" height="1" fill="#0b1220"/><rect x="3" y="3" width="1" height="1" fill="#9cb6c5"/><rect x="8" y="3" width="1" height="1" fill="#9cb6c5"/><rect x="9" y="3" width="1" height="1" fill="#0b1220"/><rect x="1" y="4" width="10" height="1" fill="#0b1220"/><rect x="1" y="5" width="1" height="1" fill="#0b1220"/><rect x="2" y="5" width="8" height="1" fill="#ffd23f"/><rect x="10" y="5" width="1" height="1" fill="#0b1220"/><rect x="1" y="6" width="1" height="1" fill="#0b1220"/><rect x="2" y="6" width="8" height="1" fill="#ffd23f"/><rect x="10" y="6" width="1" height="1" fill="#0b1220"/><rect x="1" y="7" width="1" height="1" fill="#0b1220"/><rect x="2" y="7" width="3" height="1" fill="#ffd23f"/><rect x="5" y="7" width="2" height="1" fill="#0b1220"/><rect x="7" y="7" width="3" height="1" fill="#ffd23f"/><rect x="10" y="7" width="1" height="1" fill="#0b1220"/><rect x="1" y="8" width="1" height="1" fill="#0b1220"/><rect x="2" y="8" width="3" height="1" fill="#ffd23f"/><rect x="5" y="8" width="2" height="1" fill="#0b1220"/><rect x="7" y="8" width="3" height="1" fill="#ffd23f"/><rect x="10" y="8" width="1" height="1" fill="#0b1220"/><rect x="1" y="9" width="1" height="1" fill="#0b1220"/><rect x="2" y="9" width="8" height="1" fill="#ffd23f"/><rect x="10" y="9" width="1" height="1" fill="#0b1220"/><rect x="1" y="10" width="1" height="1" fill="#0b1220"/><rect x="2" y="10" width="8" height="1" fill="#ffd23f"/><rect x="10" y="10" width="1" height="1" fill="#0b1220"/><rect x="1" y="11" width="10" height="1" fill="#0b1220"/></svg>';

    // Builds the links of one chain running from (x1,y1) to (x2,y2).
    function chainLinks(x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const step = 15;
        let out = '';
        for (let i = 0; i * step <= len; i++) {
            const x = (x1 + dx * (i * step / len)).toFixed(1);
            const y = (y1 + dy * (i * step / len)).toFixed(1);
            const t = `transform="translate(${x} ${y}) rotate(${angle.toFixed(1)})"`;
            out += i % 2 === 0
                ? `<rect class="lk-face" x="-8" y="-5" width="16" height="10" rx="2" ${t}/>`   // link seen face-on
                : `<rect class="lk-side" x="-5" y="-2.5" width="10" height="5" rx="1" ${t}/>`; // link seen edge-on
        }
        // The loop can stop a few pixels short, so add one last link exactly on the end corner.
        const last = Math.floor(len / step);
        if (len - last * step > 1) {
            const t = `transform="translate(${x2.toFixed(1)} ${y2.toFixed(1)}) rotate(${angle.toFixed(1)})"`;
            out += (last + 1) % 2 === 0
                ? `<rect class="lk-face" x="-8" y="-5" width="16" height="10" rx="2" ${t}/>`
                : `<rect class="lk-side" x="-5" y="-2.5" width="10" height="5" rx="1" ${t}/>`;
        }
        return out;
    }

    function drawLockFrame(card, size) {
        const frame = card.querySelector(':scope > .lock-frame');
        if (!frame) return;
        // A precomputed [w, h] can be passed in so this never forces its own layout read (see
        // decorateAllCards below); falls back to reading it directly for the ResizeObserver case.
        const w = size ? size[0] : Math.round(card.clientWidth);
        const h = size ? size[1] : Math.round(card.clientHeight);
        if (!w || !h) return;                                   // card is hidden right now
        if (frame.dataset.w == w && frame.dataset.h == h) return;   // nothing changed
        frame.dataset.w = w; frame.dataset.h = h;
        const m = 0;                                            // chains start exactly in the card corners
        const svg = frame.querySelector('svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.innerHTML =                                         // no dotted frame, just the two crossed chains
            chainLinks(m, m, w - m, h - m) +
            chainLinks(w - m, m, m, h - m);
    }

    // Unlock animation state (section 6 below). Declared here because the first card pass runs before it.
    let prevLocked = null;        // which cards were locked the last time the cards were drawn
    const unlockQueue = [];       // card numbers that just opened and still need their animation
    let unlockBusy = false;

    const lockObserver = new ResizeObserver(entries => entries.forEach(e => drawLockFrame(e.target)));

    function decorateCard(card, size) {
        let frame = card.querySelector(':scope > .lock-frame');
        if (!card.classList.contains('locked')) {
            if (frame) { frame.remove(); lockObserver.unobserve(card); }
            return;
        }
        if (!frame) {
            frame = document.createElement('div');
            frame.className = 'lock-frame';
            frame.setAttribute('aria-hidden', 'true');
            frame.innerHTML =
                '<svg class="lock-chains" preserveAspectRatio="none"></svg>' +
                LOCK_PAD_SVG +
                '<span class="lock-tag">LOCKED</span>';
            card.appendChild(frame);
        }
        lockObserver.observe(card);
        drawLockFrame(card, size);
    }

    const mapScreenEl = document.getElementById('mapScreen');
    function decorateAllCards() {
        const cards = mapScreenEl.querySelectorAll('.level-card');
        // Read every locked card's size up front, THEN write all the frames. Reading a card's width,
        // writing its frame, reading the next card's width, ... forces the browser to recompute layout
        // once per card instead of once in total, which is another source of the stutter.
        const sizes = Array.prototype.map.call(cards, function (card) {
            return card.classList.contains('locked')
                ? [Math.round(card.clientWidth), Math.round(card.clientHeight)] : null;
        });
        cards.forEach(function (card, i) { decorateCard(card, sizes[i]); });
        trackUnlocks(cards);
        runUnlocks();
    }
    // The cards are built (and unlocked) by script.js, so watch for them instead of hooking into it.
    // While an unlock animation is actually playing, the ONLY class changes happening inside #mapScreen
    // are the ones this file adds on purpose (the fx overlay's shake/open/break/glow, the card's own
    // the card's own shake/pop); none of those mean a card's locked state changed. Reacting to them anyway
    // used to re-run decorateAllCards() (and its forced card.clientWidth reads) on every single one of
    // those mid-animation class toggles, which is exactly the kind of layout thrashing that shows up as
    // a stutter, so they're skipped here while unlockBusy is true.
    new MutationObserver(function () {
        if (unlockBusy) return;
        decorateAllCards();
    }).observe(mapScreenEl, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['class']
    });
    decorateAllCards();


    /* ---------- 6. Unlock animation ----------
       When the player comes back to the zone selection page and the next zone has just opened, the card
       shows its chains and padlock one more time: the padlock rattles, pops open, the chains break and fall,
       sparks fly and the card lights up. */
    // Same pixel padlock, but the shackle sits in its own group so it can lift up when the lock opens.
    const UNLOCK_PAD_SVG = (function () {
        const rects = LOCK_PAD_SVG.match(/<rect[^>]*\/>/g) || [];
        const yOf = r => +r.match(/ y="(\d+)"/)[1];
        const shackle = rects.filter(r => yOf(r) < 4).join('');
        const body = rects.filter(r => yOf(r) >= 4).join('');
        return '<svg class="lock-pad" viewBox="0 0 12 12" shape-rendering="crispEdges">' +
               '<g class="shackle">' + shackle + '</g>' + body + '</svg>';
    })();


    function trackUnlocks(cards) {
        if (!cards.length) return;
        const nowLocked = new Set();
        cards.forEach((c, i) => { if (c.classList.contains('locked')) nowLocked.add(i); });
        if (prevLocked) {
            prevLocked.forEach(function (i) {
                if (!nowLocked.has(i) && !unlockQueue.includes(i)) unlockQueue.push(i);
            });
        }
        prevLocked = nowLocked;
    }

    function runUnlocks() {
        if (unlockBusy || !unlockQueue.length) return;
        if (!mapScreenEl.classList.contains('active')) return;       // wait until the zone page is on screen
        unlockBusy = true;
        // let the page's own load-in animation finish first
        setTimeout(function () {
            const idx = unlockQueue.shift();
            const card = mapScreenEl.querySelectorAll('.level-card')[idx];
            if (!card || !mapScreenEl.classList.contains('active') || !card.clientWidth) {
                if (card && !mapScreenEl.classList.contains('active')) unlockQueue.unshift(idx);   // try again next visit
                unlockBusy = false;
                return;
            }
            playUnlock(card, function () { unlockBusy = false; runUnlocks(); });
        }, reduce ? 0 : 950);
    }

    function playUnlock(card, done) {
        if (reduce) {                                                // no motion: just a short glow
            card.classList.add('just-unlocked');
            setTimeout(() => card.classList.remove('just-unlocked'), 1200);
            done();
            return;
        }
        const w = Math.round(card.clientWidth), h = Math.round(card.clientHeight);
        const cx = w / 2, cy = h / 2;
        const fx = document.createElement('div');
        fx.className = 'unlock-fx';
        fx.setAttribute('aria-hidden', 'true');
        fx.innerHTML =
            // Each chain is split into two halves that meet at the card's centre, so the "break" step
            // can snap them apart from that point instead of sliding one rigid bar off the card.
            '<svg class="lock-chains unlock-chains" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
                '<g class="chain-a1">' + chainLinks(0, 0, cx, cy) + '</g>' +
                '<g class="chain-a2">' + chainLinks(cx, cy, w, h) + '</g>' +
                '<g class="chain-b1">' + chainLinks(w, 0, cx, cy) + '</g>' +
                '<g class="chain-b2">' + chainLinks(cx, cy, 0, h) + '</g>' +
            '</svg>' +
            '<i class="unlock-shock"></i>' +
            UNLOCK_PAD_SVG +
            '<span class="lock-tag">LOCKED</span>' +
            '<i class="unlock-flash"></i>';
        const tag = fx.querySelector('.lock-tag');

        card.classList.add('unlocking', 'spotlight-target');         // card looks locked again for a moment
        mapScreenEl.classList.add('unlock-spotlight');                // and the rest of the grid dims behind it
        card.appendChild(fx);
        // Scroll only if the card is not fully on screen, and instantly: a smooth scroll running while the
        // animation starts was another source of dropped frames.
        const rc = card.getBoundingClientRect();
        if (rc.top < 0 || rc.bottom > window.innerHeight) card.scrollIntoView({ behavior: 'auto', block: 'center' });
        if (window.labSfx) window.labSfx.play('unlock');

        const at = (ms, fn) => setTimeout(fn, ms);
        at(450, function () {                                        // padlock rattles, and the card itself jitters
            fx.classList.add('shake');
            // Web Animations API: leaves the card's CSS `animation` (the loadIn page animation) untouched.
            if (card.animate) card.animate([
                { transform: 'translate(0,0) rotate(0)' },
                { transform: 'translate(-3px,1px) rotate(-0.4deg)', offset: 0.1 },
                { transform: 'translate(3px,-1px) rotate(0.4deg)', offset: 0.2 },
                { transform: 'translate(-3px,0) rotate(-0.3deg)', offset: 0.3 },
                { transform: 'translate(3px,1px) rotate(0.3deg)', offset: 0.4 },
                { transform: 'translate(-2px,-1px) rotate(-0.2deg)', offset: 0.5 },
                { transform: 'translate(2px,1px) rotate(0.2deg)', offset: 0.6 },
                { transform: 'translate(-2px,0) rotate(-0.15deg)', offset: 0.7 },
                { transform: 'translate(1px,-1px) rotate(0.1deg)', offset: 0.8 },
                { transform: 'translate(-1px,0) rotate(0)', offset: 0.9 },
                { transform: 'translate(0,0) rotate(0)' }
            ], { duration: 550, easing: 'linear' });
        });
        at(1000, function () {                                       // padlock pops open: flash, shockwave, sparks
            fx.classList.add('open');
            tag.textContent = 'UNLOCKED!';
            for (let i = 0; i < 18; i++) {                           // bright pixel sparks, bursting outward
                const sp = document.createElement('b');
                sp.className = 'unlock-spark';
                const a = (i / 18) * Math.PI * 2 + rand(-0.2, 0.2), d = rand(55, 130);
                sp.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
                sp.style.setProperty('--dy', Math.round(Math.sin(a) * d) + 'px');
                sp.style.setProperty('--c', ['#ffd23f', '#48e2a2', '#28d3f5', '#ffffff'][i % 4]);
                fx.appendChild(sp);
            }
            for (let i = 0; i < 7; i++) {                            // a few broken chain-link fragments
                const db = document.createElement('b');
                db.className = 'unlock-debris';
                const a = rand(-0.5, Math.PI + 0.5), d = rand(60, 150);   // biased downward: gravity
                db.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
                db.style.setProperty('--dy', Math.round(Math.abs(Math.sin(a)) * d + 40) + 'px');
                db.style.setProperty('--r', Math.round(rand(140, 420)) + 'deg');
                db.style.setProperty('--delay', Math.round(rand(0, 120)) + 'ms');
                fx.appendChild(db);
            }
        });
        at(1250, function () {                                       // the chains snap apart at the centre and fall
            fx.classList.add('break');
        });
        at(1750, function () {                                       // the card lights up and gives a little "pop"
            card.classList.remove('unlocking');
            if (card.animate) card.animate([
                { transform: 'scale(1)', easing: 'ease-out' },
                { transform: 'scale(1.035)', offset: 0.35, easing: 'ease-in-out' },
                { transform: 'scale(0.985)', offset: 0.65, easing: 'ease-in-out' },
                { transform: 'scale(1)' }
            ], { duration: 650 });
            fx.classList.add('glow');
        });
        at(3300, function () {
            fx.remove();
            card.classList.remove('spotlight-target');
            mapScreenEl.classList.remove('unlock-spotlight');
            done();
        });
    }

    /* ---------- Start / restart whenever the home page is shown ---------- */
    let wasActive = home.classList.contains('active');
    new MutationObserver(function () {
        const isActive = home.classList.contains('active');
        if (isActive && !wasActive) {
            typeHeadline();
            tipIndex = (tipIndex + 1) % tips.length;
            showTip();
        }
        wasActive = isActive;
    }).observe(home, { attributes: true, attributeFilter: ['class'] });

    typeHeadline();
})();
