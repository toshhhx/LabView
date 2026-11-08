// Single contextual tab: shows "Home" on the main page, "Mission" everywhere else.
(function () {
    const tab = document.getElementById('currentTab');
    const label = document.getElementById('currentTabLabel');
    const icon = tab.querySelector('img');
    const screens = document.querySelectorAll('.screen');

    function update() {
        const onHome = document.getElementById('homeScreen').classList.contains('active');
        label.textContent = onHome ? 'Home' : 'Mission';
        icon.src = onHome ? 'assets/icons/home.svg' : 'assets/icons/book.svg';
    }

    // Watch for screen changes made by script.js, so no edits to it are needed.
    const observer = new MutationObserver(update);
    screens.forEach(s => observer.observe(s, { attributes: true, attributeFilter: ['class'] }));
    update();
})();

// ---------- Refresh warning ----------
// Progress is not saved, so warn the player before a refresh sends them back to the start.
(function () {
    const home = document.getElementById('homeScreen');
    const dialog = document.getElementById('leaveDialog');
    let allowReload = false;

    // True whenever the player is anywhere except the home page.
    const inProgress = () => !home.classList.contains('active');

    // 1) Browser refresh button, closing the tab, back button, etc.
    //    Browsers only allow their own generic message here.
    window.addEventListener('beforeunload', function (e) {
        if (allowReload || !inProgress()) return;
        e.preventDefault();
        e.returnValue = '';
    });

    // 2) Keyboard refresh (F5, Ctrl+R, Cmd+R) gets the custom LabView message.
    document.addEventListener('keydown', function (e) {
        const key = e.key.toLowerCase();
        const isRefresh = key === 'f5' || ((e.ctrlKey || e.metaKey) && key === 'r');
        if (isRefresh && inProgress() && !dialog.open) {
            e.preventDefault();
            dialog.showModal();
        }
    });

    document.getElementById('leaveStay').addEventListener('click', () => dialog.close());
    document.getElementById('leaveReload').addEventListener('click', () => {
        allowReload = true;
        location.reload();
    });
})();

// ---------- Back button (zone selection -> start page) ----------
(function () {
    const back = document.getElementById('backButton');
    back.addEventListener('click', () => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('homeScreen').classList.add('active');
        window.scrollTo(0, 0);
    });
})();

// ---------- Enter Laboratory -> How to Play pop-up -> Zone selection ----------
(function () {
    const dialog = document.getElementById('howToDialog');
    const startBtn = document.getElementById('startButton');
    let passThrough = false;   // true only while we hand the click back to script.js

    const nameDialog = document.getElementById('nameDialog');
    const nameInput = document.getElementById('scientistInput');
    const nameError = document.getElementById('nameError');

    // Capture phase: runs before script.js. The first click only opens the "scientist name" pop-up,
    // which then leads to the How to Play pop-up.
    document.addEventListener('click', function (e) {
        if (passThrough || !e.target.closest('#startButton')) return;
        e.stopImmediatePropagation();
        e.preventDefault();
        if (dialog.open || nameDialog.open) return;
        // The name is saved in the system (script.js keeps it on this device), so coming back to the main
        // page with the LabView button never asks for it again: go straight to How to Play.
        if (scientistName && scientistGender) { dialog.showModal(); return; }
        openNameDialog(false);
    }, true);

    // renameOnly = true: opened from "Not you?" on the zone page, so it only saves the new name.
    let renameOnly = false;

    // Girl / Boy choice (both avatars are drawn by script.js).
    const genderBtns = nameDialog.querySelectorAll('.gp-btn');
    let pickedGender = '';
    genderBtns.forEach(function (b) {
        b.querySelector('.gp-av').innerHTML = playerAvatarSvg(b.dataset.gender);
        b.addEventListener('click', function () { pickGender(b.dataset.gender); nameError.hidden = true; });
    });
    function pickGender(g) {
        pickedGender = g;
        genderBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.gender === g)));
    }

    function openNameDialog(rename) {
        renameOnly = rename;
        nameInput.value = scientistName || '';
        pickGender(scientistGender || '');
        nameError.hidden = true;
        nameDialog.showModal();
        nameInput.focus();
        nameInput.select();
    }
    const changeBtn = document.getElementById('changeName');
    if (changeBtn) changeBtn.addEventListener('click', () => openNameDialog(true));

    // Name pop-up: a name is required, then the How to Play pop-up opens.
    function submitName() {
        const name = nameInput.value.replace(/\s+/g, ' ').trim();
        if (!name || !pickedGender) {
            nameError.hidden = false;
            (name ? genderBtns[0] : nameInput).focus();
            return;
        }
        setScientistName(name);                         // defined in script.js
        setScientistGender(pickedGender);
        nameDialog.close();
        if (renameOnly) { renderLevelMap(); return; }   // just refresh the greeting on the zone page
        dialog.showModal();
    }
    document.getElementById('nameContinue').addEventListener('click', submitName);
    nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); submitName(); }
    });
    nameInput.addEventListener('input', function () { nameError.hidden = true; });
    document.getElementById('nameX').addEventListener('click', () => nameDialog.close());   // stays on the main page

    // "Enter the Training": close the pop-up, then let script.js's own start logic run,
    // so it builds the zone cards and opens the selection page exactly as before.
    document.getElementById('howToClose').addEventListener('click', function () {
        dialog.close();
        passThrough = true;
        startBtn.click();
        passThrough = false;

        // Safety net: make sure the selection page is the one showing.
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('mapScreen').classList.add('active');
        window.scrollTo(0, 0);
    });
})();

// ---------- X button on the How to Play pop-up ----------
document.getElementById('howToX').addEventListener('click', () => {
    document.getElementById('howToDialog').close();   // stays on the main page
});

// ---------- Play Again (Final Review): forget the scientist so the next run asks for the name again ----------
// script.js resets the game and returns to the home page; clearing the saved name and gender here means
// "Enter Laboratory" shows the name pop-up (empty, with no gender picked) instead of skipping it.
document.getElementById('restartButton').addEventListener('click', function () {
    setScientistName('');      // defined in script.js
    setScientistGender('');
});
