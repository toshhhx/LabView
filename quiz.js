// Multiple-choice pop-up, clean answer text (no A/B/C/D) and confetti for correct answers.
(function () {
    const missionScreen = document.getElementById('missionScreen');
    const tag = document.getElementById('missionTag');
    const answerList = document.getElementById('answerList');
    const phaseLabel = document.getElementById('phaseLabel');
    const timerValue = document.getElementById('timerValue');
    const scoreValue = document.getElementById('scoreValue');

    const popup = document.getElementById('answerPopup');
    const popupTimer = document.getElementById('popupTimer');
    const popupTimerValue = document.getElementById('popupTimerValue');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const levelNumber = () => parseInt((tag.textContent || '').replace(/\D/g, ''), 10);

    /* ---------- 1. Remove the A / B / C / D from the answers ---------- */
    const LETTER_ONLY = /^\s*[A-Da-d]\s*[.)\]:\-]?\s*$/;
    const LETTER_PREFIX = /^(\s*)[A-Da-d]\s*[.)\]:\-]\s+/;

    function cleanAnswers() {
        answerList.querySelectorAll('button, .answer-button').forEach(function (btn) {
            // Little badge elements that hold only a letter
            btn.querySelectorAll('*').forEach(function (el) {
                if (!el.children.length && LETTER_ONLY.test(el.textContent)) el.remove();
            });
            // A letter written in front of the text, like "A. " or "B) "
            const walker = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT);
            let node;
            while ((node = walker.nextNode())) {
                if (!node.nodeValue.trim()) continue;
                if (LETTER_ONLY.test(node.nodeValue)) { node.nodeValue = ''; continue; }
                // Only write when something actually changes. Writing the same text still fires
                // the MutationObserver, which would call evaluate() again and loop forever.
                const cleaned = node.nodeValue.replace(LETTER_PREFIX, '$1');
                if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
                break;                                   // only the first piece of real text
            }
        });
    }

    /* ---------- 2. Answers in a pop-up ---------- */
    // The question panel itself turns into the pop-up card (CSS class "quiz-open") and a dim backdrop
    // appears behind it. Nothing is moved or rebuilt, so the game's own selection logic is untouched.
    let popupOpen = false;
    let openTimer = null;

    // After an answer is submitted the game shows the result (CORRECT / INCORRECT RESPONSE) and the
    // "Next Level" button. Keep the pop-up open for that step, on every level.
    const isResult = () => /CORRECT|INCORRECT/i.test(phaseLabel.textContent || '');

    function updateResult() {
        const r = isResult() ? (/INCORRECT/i.test(phaseLabel.textContent) ? 'incorrect' : 'correct') : '';
        if (r) { missionScreen.dataset.result = r; popup.dataset.result = r; }
        else { delete missionScreen.dataset.result; delete popup.dataset.result; }

        // The inspect-mode bar repeats the same label on its own "Next" button.
        const btn = document.getElementById('actionButton');
        if (r && btn) {
            const t = btn.textContent.trim();
            if (inspectNext.textContent !== t) inspectNext.textContent = t;
        }

        // Leaving the result step also leaves inspect mode and forgets that the area was inspected.
        if (!r && inspecting) {
            inspecting = false;
            missionScreen.classList.remove('inspecting');
        }
        if (!r && missionScreen.classList.contains('inspected')) missionScreen.classList.remove('inspected');

        // Wrong answer: prepare the "correct answer + reason" box that the Inspect the Area view shows.
        if (r === 'incorrect') fillCorrectBox();
        const inspectLabel = (r === 'incorrect' && !missionScreen.classList.contains('inspected'))
            ? 'Inspect the Area to see the answer' : 'Inspect the Area';
        if (inspectButton.textContent !== inspectLabel) inspectButton.textContent = inspectLabel;
    }

    /* ---------- Inspect the Area: hide the pop-up, light the lab, show the checked hazard ---------- */
    const inspectButton = document.getElementById('inspectButton');
    const inspectBack = document.getElementById('inspectBack');
    const inspectNext = document.getElementById('inspectNext');
    let inspecting = false;

    function setInspecting(on) {
        inspecting = on;
        missionScreen.classList.toggle('inspecting', on);
        if (on) missionScreen.classList.add('inspected');   // after a wrong answer this unlocks "Return to Zones"
        evaluate();                       // closes the pop-up (on) or brings it back (off)
    }
    inspectButton.addEventListener('click', function () { setInspecting(true); });
    inspectBack.addEventListener('click', function () { setInspecting(false); });
    inspectNext.addEventListener('click', function () { document.getElementById('actionButton').click(); });

    /* ---------- Timer inside the pop-up card (shown during the multiple choice part) ---------- */
    const panel = document.querySelector('.mission-panel');
    const cardTimer = document.createElement('span');
    cardTimer.className = 'card-timer';
    cardTimer.dataset.state = 'ok';
    cardTimer.innerHTML = '<img class="px-icon" src="assets/icons/clock.svg" alt=""><b>60</b>s';
    panel.insertBefore(cardTimer, panel.firstChild);
    const cardTimerValue = cardTimer.querySelector('b');

    /* ---------- Wrong answer: the correct answer and the reason, shown in the Inspect the Area view ---------- */
    const correctBox = document.createElement('div');
    correctBox.className = 'correct-box';
    correctBox.innerHTML =
        '<small>CORRECT ANSWER</small><p class="cb-answer"></p>' +
        '<small>WHY IT IS CORRECT</small><p class="cb-why"></p>';
    panel.insertBefore(correctBox, panel.querySelector('.evidence-panel'));

    function fillCorrectBox() {
        const lv = currentLevel();
        if (!lv || correctBox.dataset.level === String(gameState.levelIndex)) return;
        correctBox.querySelector('.cb-answer').textContent = lv.answers[lv.correct];
        correctBox.querySelector('.cb-why').textContent = (lv.explanations && lv.explanations[lv.correct]) || lv.feedback;
        correctBox.dataset.level = String(gameState.levelIndex);
    }

    /* ---------- Hazard briefing step: its own pop-up (definition + potential risks) ---------- */
    // Levels with an `info` entry in script.js show this pop-up right after the hazard is identified.
    // The side panel (with the Identify Hazard button) stays where it is; only this card floats on top.
    const infoCard = document.createElement('div');
    infoCard.className = 'info-card';
    infoCard.setAttribute('role', 'dialog');
    infoCard.setAttribute('aria-modal', 'true');
    infoCard.setAttribute('aria-labelledby', 'infoCardTitle');
    popup.appendChild(infoCard);

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const currentLevel = () => (typeof levels !== 'undefined' && typeof gameState !== 'undefined')
        ? levels[gameState.levelIndex] : null;

    function fillInfo(level) {
        const d = level.info;
        const banner = level.image ? " style=\"background-image:url('assets/" + esc(level.image) + "')\"" : '';
        infoCard.innerHTML =
            '<div class="ic-banner"' + banner + '>' +
                '<span class="ic-tag">HAZARD BRIEFING</span>' +
                '<h2 id="infoCardTitle" class="ic-title">' + esc(d.title) + '</h2>' +
                '<span class="ic-pause">Timer paused</span>' +
            '</div>' +
            '<div class="ic-body">' +
                '<div class="ic-why"><i aria-hidden="true">&#10003;</i><div><b>Why this is the hazard</b><span>' + esc(d.why || level.evidence || '') + '</span></div></div>' +
                '<h3 class="ic-h"><img class="px-icon" src="assets/icons/book.svg" alt="">Definition</h3>' +
                '<div class="ic-def">' + d.definition.map(p => '<p>' + esc(p) + '</p>').join('') + '</div>' +
                (d.source ? '<p class="ic-src">Source: ' + esc(d.source) +
                    (d.sourceUrl ? ' <a href="' + esc(d.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open link</a>' : '') + '</p>' : '') +
                '<h3 class="ic-h ic-h-risk"><img class="px-icon" src="assets/icons/shield.svg" alt="">Potential risks</h3>' +
                '<ul class="ic-risks">' +
                    d.risks.map((r, i) =>
                        '<li><i>' + String(i + 1).padStart(2, '0') + '</i><div><b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span></div></li>').join('') +
                '</ul>' +
            '</div>' +
            '<div class="ic-foot">' +
                '<button id="infoNext" class="pixel-btn pixel-green" type="button">Next <img class="px-icon" src="assets/icons/arrow.svg" alt=""></button>' +
            '</div>';
        infoCard.querySelector('#infoNext').addEventListener('click', function () {
            // The game's own button moves from the inspection to the question.
            infoAck = true;
            document.getElementById('actionButton').click();
        });
        infoCard.dataset.level = String(gameState.levelIndex);
    }

    // Becomes true once the player has pressed "Next" on the briefing; reset for every new level.
    let infoAck = false;

    // The side "Identify Hazard" button must never skip the briefing: until "Next" is pressed on the
    // briefing, a click on it is swallowed (the briefing is already opening / open).
    document.getElementById('actionButton').addEventListener('click', function (e) {
        const lv = currentLevel();
        if (!lv || !lv.info || infoAck) return;
        if (gameState.stage !== 0 || !missionScreen.classList.contains('hazard-found')) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        evaluate();
    }, true);

    // Browser-independent guard: the game moves to the question by calling showQuestion(). Wrap it so the
    // question cannot start before the briefing has been read, whichever click handler runs first.
    if (typeof window.showQuestion === 'function') {
        const originalShowQuestion = window.showQuestion;
        window.showQuestion = function () {
            const lv = currentLevel();
            if (lv && lv.info && !infoAck && missionScreen.classList.contains('hazard-found')) {
                evaluate();                    // opens the briefing instead
                return;
            }
            return originalShowQuestion.apply(this, arguments);
        };
    }

    // True while the briefing should be on screen: hazard found, question not yet asked.
    function infoStep() {
        const lv = currentLevel();
        return !!(lv && lv.info && !infoAck &&
            missionScreen.classList.contains('active') &&
            !missionScreen.classList.contains('timeup') &&
            missionScreen.classList.contains('hazard-found') &&
            /INSPECT|SEARCH|SCAN/i.test(phaseLabel.textContent || '') &&
            !isResult());
    }

    function updateStep() {
        // New level (the hazard is not found yet): the briefing is due again.
        if (!missionScreen.classList.contains('hazard-found')) infoAck = false;
        const step = isResult() ? 'result' : infoStep() ? 'info' : '';
        if (step === 'info') {
            if (infoCard.dataset.level !== String(gameState.levelIndex)) fillInfo(currentLevel());
        }
        if ((missionScreen.dataset.step || '') !== step) {
            if (step) missionScreen.dataset.step = step; else delete missionScreen.dataset.step;
        }
        // The clock waits while the player reads the briefing.
        if (typeof gameState !== 'undefined') gameState.paused = (step === 'info');
    }

    // Decides which card is showing: the briefing card, or the side panel turned into the question card.
    // Only touches classes that actually change, so the observers never loop.
    function syncMode() {
        const info = (missionScreen.dataset.step || '') === 'info';
        const wantQuiz = popupOpen && !info;
        const wantInfo = popupOpen && info;
        if (missionScreen.classList.contains('quiz-open') !== wantQuiz) missionScreen.classList.toggle('quiz-open', wantQuiz);
        if (infoCard.classList.contains('show') !== wantInfo) {
            infoCard.classList.toggle('show', wantInfo);
            if (wantInfo) { const n = infoCard.querySelector('#infoNext'); if (n) n.focus({ preventScroll: true }); }
        }
    }

    function shouldShow() {
        if (!missionScreen.classList.contains('active')) return false;
        if (missionScreen.classList.contains('timeup')) return false;
        if (isResult()) return !inspecting;
        if (infoStep()) return true;
        if (!answerList.querySelector('button, .answer-button')) return false;
        // Every level: the hazard must have been found with the flashlight first.
        return missionScreen.classList.contains('hazard-found');
    }

    function openNow() {
        missionScreen.classList.remove('quiz-pending');
        popup.classList.add('show');
        popup.setAttribute('aria-hidden', 'false');
        popupOpen = true;
        syncMode();
    }

    function closeNow() {
        clearTimeout(openTimer);
        openTimer = null;
        missionScreen.classList.remove('quiz-open', 'quiz-pending');
        popup.classList.remove('show');
        popup.setAttribute('aria-hidden', 'true');
        popupOpen = false;
        syncMode();
    }

    function evaluate() {
        cleanAnswers();
        updateResult();
        updateStep();
        const want = shouldShow();
        if (want && !popupOpen && !openTimer) {
            if (!isResult()) {
                // Every level: let the player enjoy the glowing check mark for a moment first.
                missionScreen.classList.add('quiz-pending');
                openTimer = setTimeout(function () {
                    openTimer = null;
                    if (shouldShow()) openNow(); else missionScreen.classList.remove('quiz-pending');
                }, 1100);
            } else {
                openNow();
            }
        } else if (!want && (popupOpen || openTimer)) {
            closeNow();
        }
        syncMode();
    }

    new MutationObserver(evaluate).observe(answerList, { childList: true, subtree: true, characterData: true });
    new MutationObserver(evaluate).observe(missionScreen, { attributes: true, attributeFilter: ['class'] });
    [phaseLabel, tag].forEach(el =>
        new MutationObserver(evaluate).observe(el, { childList: true, characterData: true, subtree: true }));
    evaluate();

    // Small timer inside the pop-up so the player still sees the clock.
    new MutationObserver(function () {
        const s = parseInt(timerValue.textContent, 10);
        if (isNaN(s)) return;
        const state = s <= 5 ? 'crit' : s <= 15 ? 'danger' : s <= 30 ? 'warn' : 'ok';
        popupTimerValue.textContent = s;
        popupTimer.dataset.state = state;
        cardTimerValue.textContent = s;
        cardTimer.dataset.state = state;
    }).observe(timerValue, { childList: true, characterData: true, subtree: true });
    popupTimerValue.textContent = parseInt(timerValue.textContent, 10) || 60;
    cardTimerValue.textContent = parseInt(timerValue.textContent, 10) || 60;

    /* ---------- 3. Confetti for a correct answer ---------- */
    const COLORS = ['#28d3f5', '#48e2a2', '#ffd23f', '#ff6171', '#ffffff', '#a3f3ff', '#ff9f1c'];
    let lastBurst = 0;

    // opts.scale  : multiplies the number of pieces (default 1)
    // opts.force  : skip the "no double bursts" guard (used for the Final Review waves)
    function confetti(opts) {
        if (reduce) return;
        opts = opts || {};
        const scale = opts.scale || 1;
        const now = Date.now();
        if (!opts.force && now - lastBurst < 1500) return;   // avoid double bursts
        lastBurst = now;

        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;

        const pieces = [];
        const add = (x, y, vx, vy) => pieces.push({
            x: x, y: y, vx: vx, vy: vy,
            size: 6 + Math.floor(Math.random() * 3) * 2,           // 6, 8 or 10 px squares
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            life: 110 + Math.random() * 60
        });
        for (let i = 0, n = Math.round(70 * scale); i < n; i++) {   // two cannons from the bottom corners
            const a = (Math.random() * 40 + 50) * Math.PI / 180;
            const sp = 12 + Math.random() * 12;
            add(0, H, Math.cos(a) * sp, -Math.sin(a) * sp);
            add(W, H, -Math.cos(a) * sp, -Math.sin(a) * sp);
        }
        for (let i = 0, n = Math.round(60 * scale); i < n; i++) {   // plus a shower from the top
            add(Math.random() * W, -20 - Math.random() * H * 0.4, (Math.random() - 0.5) * 3, 2 + Math.random() * 3);
        }

        let frame = 0;
        (function tick() {
            ctx.clearRect(0, 0, W, H);
            let alive = 0;
            pieces.forEach(function (p) {
                p.life--;
                if (p.life <= 0) return;
                alive++;
                p.vy += 0.38;                                       // gravity
                p.vx *= 0.985;
                p.x += p.vx;
                p.y += p.vy;
                ctx.globalAlpha = Math.min(1, p.life / 30);
                ctx.fillStyle = p.color;
                ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);   // crisp pixel squares
            });
            ctx.globalAlpha = 1;
            frame++;
            if (alive && frame < 260) requestAnimationFrame(tick);
            else canvas.remove();
        })();
    }
    window.labConfetti = confetti;

    // Final Review: several big waves, so a good score really feels like a celebration.
    //   level 5 (perfect): 7 waves, up to 3x the pieces, over ~5 seconds
    //   level 4          : 4 waves, 2x the pieces
    window.labFinalConfetti = function (correct) {
        if (reduce || correct < 4) return;
        const waves = correct >= 5 ? 7 : 4;
        const scale = correct >= 5 ? 2.6 : 1.8;
        for (let w = 0; w < waves; w++) {
            setTimeout(function () { confetti({ scale: scale, force: true }); }, w * 750);
        }
    };

    // Correct answers earn points, so a rising score means the answer was right.
    let lastScore = parseInt(scoreValue.textContent, 10) || 0;
    new MutationObserver(function () {
        const now = parseInt(scoreValue.textContent, 10);
        if (isNaN(now)) return;
        if (now > lastScore) confetti();
        lastScore = now;
    }).observe(scoreValue, { childList: true, characterData: true, subtree: true });

    // Backup: the game marks the picked answer as correct.
    new MutationObserver(function (list) {
        list.forEach(function (m) {
            const el = m.target;
            if (el.classList && el.classList.contains('selected') &&
                (el.classList.contains('correct') || el.classList.contains('right'))) confetti();
        });
    }).observe(answerList, { attributes: true, attributeFilter: ['class'], subtree: true });
})();
