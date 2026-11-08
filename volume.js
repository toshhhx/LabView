// Master volume for the music and the sound effects, controlled by the slider in the header.
// The value (0-100) is remembered. sfx.js and music.js read window.labVolume.get() and listen
// for the "labvolume" event, so the slider changes both live.
(function () {
    const KEY = 'labview.volume';
    let level = 100;
    try {
        const saved = localStorage.getItem(KEY);
        if (saved !== null && !isNaN(+saved)) level = Math.min(100, Math.max(0, +saved));
    } catch (e) { /* storage blocked */ }

    const slider = document.getElementById('volumeSlider');

    // Squared curve: the slider feels even to the ear (a straight line sounds too loud too early).
    const gain = () => Math.pow(level / 100, 2);

    function paint() {
        if (!slider) return;
        slider.value = level;
        slider.style.setProperty('--fill', level + '%');
        slider.setAttribute('aria-valuetext', level + ' percent');
    }

    window.labVolume = {
        get: gain,
        level: () => level,
        set: function (v) {
            level = Math.min(100, Math.max(0, Math.round(v)));
            try { localStorage.setItem(KEY, String(level)); } catch (e) { /* storage blocked */ }
            paint();
            window.dispatchEvent(new Event('labvolume'));
        }
    };

    if (slider) {
        slider.addEventListener('input', () => window.labVolume.set(+slider.value));
        paint();
    }
})();
