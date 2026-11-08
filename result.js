// Final Review page extras:
//  - an "Inspect the Area" button on every zone of the review (opens a pop-up with the lit scene,
//    the hazard marked, the correct answer and why it is correct)
//  - a "mood" on the page (win / mid / retry) that the styles and the music use
//  - little pixel sparks when each earned star pops in
(function () {
    const resultScreen = document.getElementById('resultScreen');
    const resultCard = resultScreen.querySelector('.result-card');
    const review = document.getElementById('answerReview');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- Mood: high score = win, low score = retry ---------- */
    function setMood() {
        const correct = parseInt(resultCard.dataset.tier, 10);
        resultScreen.dataset.tier = String(correct);
        resultScreen.dataset.mood = correct >= 4 ? 'win' : correct <= 2 ? 'retry' : 'mid';
    }

    /* ---------- Inspect the Area pop-up ---------- */
    const dialog = document.createElement('dialog');
    dialog.id = 'inspectDialog';
    dialog.className = 'how-to inspect-dialog';
    dialog.setAttribute('aria-labelledby', 'insTitle');
    dialog.innerHTML =
        '<button id="insX" class="dialog-close" type="button" aria-label="Close">X</button>' +
        '<div class="dialog-head">' +
            '<img class="px-icon px-lg" src="assets/icons/search.svg" alt="">' +
            '<div><small id="insZone"></small><h2 id="insTitle"></h2></div>' +
        '</div>' +
        '<div class="ins-verdict" id="insVerdict"><span id="insVerdictIcon"></span><span id="insVerdictText"></span></div>' +
        '<div class="ins-scene">' +
            '<div class="ins-photo" id="insPhoto"></div>' +
            '<div class="ins-hot" id="insHot"><span class="ins-check" id="insCheck"></span><em>HAZARD</em></div>' +
        '</div>' +
        '<p class="ins-evidence" id="insEvidence"></p>' +
        '<div class="ins-answers">' +
            '<div class="ins-box bad" id="insYoursBox"><small id="insYoursLabel">YOUR ANSWER</small><p id="insYours"></p></div>' +
            '<div class="ins-box good"><small id="insAnswerLabel">CORRECT ANSWER</small><p id="insAnswer"></p></div>' +
        '</div>' +
        '<div class="ins-box why"><small>WHY IT IS CORRECT</small><p id="insWhy"></p></div>' +
        '<button id="insClose" class="pixel-btn pixel-green" type="button">' +
            '<img class="px-icon" src="assets/icons/arrow.svg" alt=""> Back to Report</button>';
    document.querySelector('main').appendChild(dialog);

    const $ = id => document.getElementById(id);
    const insAnswers = dialog.querySelector('.ins-answers');
    if (typeof REPORT_CHECK !== 'undefined') {
        $('insCheck').innerHTML = REPORT_CHECK;
        $('insAnswerLabel').innerHTML = REPORT_CHECK + ' CORRECT ANSWER';
    }
    if (typeof REPORT_X !== 'undefined') $('insYoursLabel').innerHTML = REPORT_X + ' YOUR ANSWER';

    function openInspect(index) {
        const level = levels[index];
        if (!level) return;
        const entry = gameState.answerHistory[index];
        const ok = !!(entry && entry.correct);
        const yours = entry && entry.selected !== null && entry.selected !== undefined
            ? level.answers[entry.selected] : 'No answer';

        $('insZone').textContent = 'ZONE ' + String(index + 1).padStart(2, '0');
        $('insTitle').textContent = level.name;
        $('insPhoto').style.backgroundImage = "url('assets/" + level.image + "')";

        const verdict = $('insVerdict');
        verdict.classList.toggle('ok', ok);
        verdict.classList.toggle('bad', !ok);
        if (typeof REPORT_CHECK !== 'undefined' && typeof REPORT_X !== 'undefined') {
            $('insVerdictIcon').innerHTML = ok ? REPORT_CHECK : REPORT_X;
        }
        $('insVerdictText').textContent = ok ? 'Zone Cleared' : 'Not Cleared';
        insAnswers.classList.toggle('single', ok);   // no "your answer" box to show when the zone was cleared

        // The marker sits exactly where it sits in the mission (hotspot = centre, hotspotSize = width / height in %).
        const zone = level.hotspotSize || [18, 26];
        const hot = $('insHot');
        hot.style.left = level.hotspot[0] + '%';
        hot.style.top = level.hotspot[1] + '%';
        hot.style.width = zone[0] + '%';
        hot.style.height = zone[1] + '%';

        $('insEvidence').textContent = level.evidence || '';
        $('insYoursBox').hidden = ok;                       // only shown after a wrong answer
        $('insYours').textContent = yours;
        $('insAnswer').textContent = level.answers[level.correct];
        $('insWhy').textContent = (level.explanations && level.explanations[level.correct]) || level.feedback;

        dialog.classList.remove('replay');
        void dialog.offsetWidth;                            // restart the marker animation
        dialog.classList.add('replay');
        dialog.showModal();
        dialog.scrollTop = 0;
        $('insClose').focus();
        if (window.labSfx) window.labSfx.play('found');
    }

    $('insClose').addEventListener('click', () => dialog.close());
    $('insX').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });   // click outside

    /* ---------- The button on every zone of the review ---------- */
    function addButtons() {
        review.querySelectorAll('.review-item').forEach(function (item) {
            if (item.querySelector('.ri-inspect')) return;
            const zone = item.querySelector('.ri-zone');
            const index = zone ? parseInt(zone.textContent.replace(/\D/g, ''), 10) - 1 : -1;
            if (!(index >= 0)) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pixel-btn pixel-blue ri-inspect';
            btn.dataset.inspect = String(index);
            btn.innerHTML = '<img class="px-icon" src="assets/icons/search.svg" alt=""> Inspect the Area';
            item.querySelector('.ri-body').appendChild(btn);
        });
    }
    new MutationObserver(addButtons).observe(review, { childList: true });
    addButtons();

    review.addEventListener('click', function (e) {
        const btn = e.target.closest('.ri-inspect');
        if (btn) openInspect(parseInt(btn.dataset.inspect, 10));
    });

    /* ---------- Sparks when a star pops in ---------- */
    function starSparks() {
        if (reduce) return;
        resultScreen.querySelectorAll('.rs-star.on').forEach(function (star) {
            const delay = (parseFloat(getComputedStyle(star).animationDelay) || 0) + 0.08;
            setTimeout(function () {
                if (!star.isConnected || !resultScreen.classList.contains('active')) return;
                const box = star.parentNode.getBoundingClientRect();
                const r = star.getBoundingClientRect();
                const cx = r.left - box.left + r.width / 2, cy = r.top - box.top + r.height / 2;
                for (let i = 0; i < 8; i++) {
                    const sp = document.createElement('b');
                    sp.className = 'star-spark';
                    const a = (i / 8) * Math.PI * 2, d = 26 + Math.random() * 22;
                    sp.style.left = cx + 'px';
                    sp.style.top = cy + 'px';
                    sp.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
                    sp.style.setProperty('--dy', Math.round(Math.sin(a) * d) + 'px');
                    star.parentNode.appendChild(sp);
                    setTimeout(() => sp.remove(), 700);
                }
            }, delay * 1000);
        });
    }

    /* ---------- Whenever the page is shown ---------- */
    let wasActive = resultScreen.classList.contains('active');
    new MutationObserver(function () {
        const on = resultScreen.classList.contains('active');
        if (on && !wasActive) { setMood(); starSparks(); }
        wasActive = on;
    }).observe(resultScreen, { attributes: true, attributeFilter: ['class'] });
    // renderFinalReview() rewrites data-tier every time the report is built
    new MutationObserver(setMood).observe(resultCard, { attributes: true, attributeFilter: ['data-tier'] });
    setMood();
})();
