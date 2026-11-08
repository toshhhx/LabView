// Zone flow: choose a zone -> briefing pop-up -> loading screen -> mission starts.
(function () {
    /* ---------- Elements ---------- */
    const levelCards = document.getElementById('levelCards');

    const brief = document.getElementById('briefingDialog');
    const briefBanner = document.getElementById('briefBanner');
    const briefZone = document.getElementById('briefZone');
    const briefTitle = document.getElementById('briefTitle');
    const briefIntro = document.getElementById('briefIntro');
    const briefTime = document.getElementById('briefTime');
    const briefPoints = document.getElementById('briefPoints');
    const briefObjectives = document.getElementById('briefObjectives');
    const briefGoal = document.getElementById('briefGoal');
    const briefAfter = document.getElementById('briefAfter');

    const loader = document.getElementById('loadingScreen');
    const zoneLabel = document.getElementById('loadZone');
    const titleEl = document.getElementById('loadTitle');
    const statusEl = document.getElementById('loadStatus');
    const tipEl = document.getElementById('loadTip');

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LOAD_MS = reduce ? 600 : 2200;      // how long the loading screen stays up

    /* ---------- Briefing content ---------- */
    const TIME_LIMIT = 60;    // seconds per mission
    const POINTS = 100;       // points for a correct answer

    // Used for every zone unless you add a custom briefing below. {zone} becomes the zone's name.
    function defaultBriefing(zone) {
        return {
            objectives: [
                'Look around the ' + zone + ' and use the flashlight to check dark corners.',
                'Find the one hazard that does not belong and click its marker.',
                'Finish before the ' + TIME_LIMIT + '-second timer runs out.'
            ],
            goal: 'Locate the exact hazard in the ' + zone + ' and choose the safest response to earn ' + POINTS + ' points.',
            after: [
                'Review the evidence collected from the scene.',
                'Pick the safest response from the answer list.',
                'Confirm it. A correct answer earns ' + POINTS + ' points.'
            ]
        };
    }

    // Optional: write your own text for a zone by its number (1 to 5). Example:
    // 1: { objectives: ['...', '...', '...'], goal: '...', after: ['...', '...', '...'] },
    const customBriefings = {};

    /* ---------- Loading screen ---------- */
    const statuses = [
        [0,    'Checking equipment…'],
        [0.3,  'Calibrating instruments…'],
        [0.6,  'Scanning for hazards…'],
        [0.85, 'Entering the lab…']
    ];
    const tips = [
        'Read the label before you touch anything.',
        'Goggles on before the experiment starts.',
        'Know where the eyewash station is.',
        'Spills and broken glass: report them right away.',
        'Slow down. Look closely. Stay safe.'
    ];
    const timers = [];

    function showLoading(zoneNumber, zoneName) {
        zoneLabel.textContent = 'ZONE ' + String(zoneNumber).padStart(2, '0');
        titleEl.textContent = zoneName;
        tipEl.textContent = 'TIP: ' + tips[Math.floor(Math.random() * tips.length)];

        const bar = loader.querySelector('.load-bar i');     // restart the bar animation
        bar.style.animation = 'none';
        void bar.offsetWidth;
        bar.style.animation = '';
        bar.style.setProperty('--load-ms', LOAD_MS + 'ms');

        statusEl.textContent = statuses[0][1];
        statuses.slice(1).forEach(function (st) {
            timers.push(setTimeout(function () { statusEl.textContent = st[1]; }, LOAD_MS * st[0]));
        });

        loader.classList.add('show');
        loader.setAttribute('aria-hidden', 'false');
    }

    function hideLoading() {
        loader.classList.remove('show');
        loader.setAttribute('aria-hidden', 'true');
        timers.forEach(clearTimeout);
        timers.length = 0;
    }

    /* ---------- State ---------- */
    let busy = false;         // a briefing or loading screen is currently up
    let passThrough = false;  // true only while the click is handed back to script.js
    let pending = null;       // { card, target, number, name }

    function zoneInfo(card) {
        const number = Math.max(Array.prototype.indexOf.call(levelCards.children, card) + 1, 1);
        const nameEl = card.querySelector('h1, h2, h3, h4, strong');
        const name = nameEl ? nameEl.textContent.trim() : 'Laboratory zone ' + number;
        return { number: number, name: name };
    }

    /* ---------- Briefing pop-up ---------- */
    function fillList(listEl, items) {
        listEl.innerHTML = '';
        items.forEach(function (text) {
            const li = document.createElement('li');
            li.textContent = text;
            listEl.appendChild(li);
        });
    }

    function openBriefing(card, target) {
        const info = zoneInfo(card);
        pending = { card: card, target: target, number: info.number, name: info.name };

        const data = customBriefings[info.number] || defaultBriefing(info.name);

        // Reuse the card's picture as the banner, and its description as the intro line.
        const picture = card.querySelector('.level-image');
        const bg = picture ? getComputedStyle(picture).backgroundImage : 'none';
        briefBanner.style.backgroundImage = bg && bg !== 'none' ? bg : '';
        const desc = card.querySelector('p');
        briefIntro.textContent = desc ? desc.textContent.trim() : '';
        briefIntro.style.display = briefIntro.textContent ? '' : 'none';

        briefZone.textContent = 'ZONE ' + String(info.number).padStart(2, '0');
        briefTitle.textContent = info.name;
        briefTime.textContent = TIME_LIMIT;
        briefPoints.textContent = POINTS;
        fillList(briefObjectives, data.objectives);
        briefGoal.textContent = data.goal;
        fillList(briefAfter, data.after);

        brief.scrollTop = 0;
        brief.showModal();
        document.getElementById('briefStart').focus();
    }

    function cancelBriefing() {
        if (brief.open) brief.close();
        pending = null;
        busy = false;
    }

    function startMission() {
        if (!pending) return;
        const job = pending;
        brief.close();
        showLoading(job.number, job.name);

        // When loading finishes, give the click back to script.js so the mission starts
        // underneath the loading screen, then fade the loading screen away.
        timers.push(setTimeout(function () {
            passThrough = true;
            (job.target.isConnected ? job.target : job.card).click();
            passThrough = false;
            setTimeout(function () { hideLoading(); busy = false; pending = null; }, 150);
        }, LOAD_MS));
    }

    document.getElementById('briefStart').addEventListener('click', startMission);
    document.getElementById('briefBack').addEventListener('click', cancelBriefing);
    document.getElementById('briefClose').addEventListener('click', cancelBriefing);
    brief.addEventListener('cancel', function () { pending = null; busy = false; });   // Esc key

    /* ---------- Intercept zone clicks (capture phase: runs before script.js) ---------- */
    document.addEventListener('click', function (e) {
        if (passThrough) return;
        // Only the "Enter Zone" / "Review Level" button opens the briefing, not the rest of the card.
        const button = e.target.closest && e.target.closest('[data-level-index]');
        const card = button && button.closest('.level-card');
        if (!card || !levelCards.contains(card) || card.classList.contains('locked') || card.classList.contains('missed')) return;

        e.stopImmediatePropagation();
        e.preventDefault();
        if (busy) return;
        busy = true;
        openBriefing(card, e.target);
    }, true);
})();
