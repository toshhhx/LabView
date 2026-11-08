/**
 * LABVIEW LABORATORY SAFETY GAME
 *
 * This file contains:
 * 1. Level content and hotspot positions
 * 2. Runtime game state
 * 3. Screen navigation
 * 4. Level loading and inspection
 * 5. Answer validation and scoring
 * 6. Final answer review
 * 7. Mouse and touch-based scene movement
 */

/* ============================================================
   1. LEVEL CONFIGURATION
   ------------------------------------------------------------
   hotspot[0] = horizontal position, measured from the left (%)
   hotspot[1] = vertical position, measured from the top (%)
   correct     = zero-based answer index: 0=A, 1=B, 2=C, 3=D
   ============================================================ */
const levels = [
    {
        name: "Chemical Spill",
        image: "spill.jpg",
        hotspot: [42, 61],
        hotspotSize: [22, 28],   // wide puddle spreading over the bench
        evidence: "Tipped chemical container with liquid spreading across the workbench.",
        question: "What should be done first?",
        answers: [
            "Wipe the spill immediately with a paper towel.",
            "Alert others, restrict access, and follow the approved spill-response procedure.",
            "Pour water over the spill.",
            "Ignore the spill if it appears small."
        ],
        correct: 1,
        feedback: "This action protects everyone in the laboratory by warning them about the hazard and preventing accidental exposure. Following the approved procedure ensures that the spill is assessed and handled by properly trained personnel using the appropriate protective equipment.",
        // Hazard briefing pop-up shown after the hazard is identified, before the question (optional per level).
        info: {
            title: "Chemical Spill",
            // Short note: why the object you identified really is the hazard (shown at the top of the briefing).
            why: "A chemical container has tipped over and the liquid is spreading across the workbench. That is an accidental, uncontrolled release of a hazardous substance, which is exactly what makes it a chemical spill.",
            definition: [
                "A chemical spill occurs when a chemical substance is accidentally released into the surrounding environment, such as on laboratory floors, tables, or equipment. It may pose risks to people's health and safety, as well as the environment.",
                "Chemical spills refer to the uncontrolled release of hazardous substances, including solids, liquids, and gases, often resulting from improper handling, storage, or accidents."
            ],
            source: "Chemical spills | Science | Research Starters | EBSCOhost. (n.d.-c). EBSCO.",
            sourceUrl: "https://share.google/Sk6sFTdS8zF08QUuL",
            risks: [
                ["Chemical burns", "Damage to the skin or eyes."],
                ["Poisoning", "Harm caused by exposure to toxic chemicals."],
                ["Respiratory irritation", "Difficulty breathing due to harmful fumes."],
                ["Fire or explosion", "Possible ignition of flammable chemicals."],
                ["Environmental contamination", "Pollution of surfaces, soil, or water."]
            ]
        },
        // Why each answer is correct / incorrect (same order as answers). Shown after Submit.
        explanations: [
            "Wiping an unknown chemical spill without proper training or protective equipment may expose the person to harmful substances. It may also spread the chemical or cause skin contact. Only trained and authorized personnel should handle the cleanup using the approved procedure.",
            "This action protects everyone in the laboratory by warning them about the hazard and preventing accidental exposure. Following the approved procedure ensures that the spill is assessed and handled by properly trained personnel using the appropriate protective equipment.",
            "Water can react dangerously with certain chemicals, spread the spill, or increase the risk of exposure.",
            "Even a small spill can release harmful fumes, cause chemical burns, or create other hazards. Ignoring it allows the danger to remain and puts laboratory personnel at risk."
        ]
    },
    {
        name: "Laboratory Fire",
        image: "fire.jpg",
        hotspot: [30, 47],
        hotspotSize: [18, 26],   // flame plus the equipment around it
        evidence: "An active flame is visible near laboratory equipment.",
        question: "What is the safest immediate response?",
        answers: [
            "Continue the experiment.",
            "Raise the alarm and follow emergency evacuation procedures.",
            "Use any extinguisher without checking suitability.",
            "Collect personal belongings first."
        ],
        correct: 1,
        feedback: "Raising the alarm warns others about the danger and allows them to respond quickly. Do not attempt to handle the fire if doing so would put you in danger.",
        info: {
            title: "Flame Hazard",
            why: "An active flame is burning right next to laboratory equipment. An open flame near equipment and chemicals is a source of ignition that can start or spread a fire, which is exactly what makes it a flame hazard.",
            definition: [
                "A flame hazard refers to the presence of an open flame or a potential source of ignition that may cause accidental fires in the laboratory. It can result in injuries, property damage, and harm to laboratory personnel.",
                "Fire hazards refer to anything that involves an open flame, increases the likelihood of combustion or increases the severity should fires already occur."
            ],
            source: "Web, Z. (2026, October 20). Fire Hazards in the Workplace: Definition, Prevention and more - Medlink Healthcare Group. Medlink Healthcare Group.",
            sourceUrl: "https://www.mhg.sg/blog/fire-hazards-in-workplace/",
            risks: [
                ["Burns", "Injuries to the skin caused by direct contact with flames."],
                ["Fire", "Ignition of flammable materials or chemicals."],
                ["Explosion", "Combustion of flammable gases or vapors."],
                ["Smoke inhalation", "Breathing in smoke and harmful gases."],
                ["Property damage", "Destruction of laboratory equipment and facilities."]
            ]
        },
        explanations: [
            "Continuing the experiment ignores the immediate fire hazard. The flame could ignite nearby chemicals or damage electrical equipment, putting everyone in the laboratory at risk. Work must stop when an unsafe condition is identified.",
            "Raising the alarm warns others about the danger and allows them to respond quickly. Do not attempt to handle the fire if doing so would put you in danger.",
            "Different fires require appropriate extinguishers. Using the wrong type can worsen the situation or create additional hazards, especially when electrical equipment or flammable chemicals are involved.",
            "Collecting belongings delays evacuation and exposes a person to unnecessary danger. Leave the area promptly and follow the designated evacuation route."
        ]
    },
    {
        name: "Chemical Waste",
        image: "waste.jpg",
        hotspot: [50, 52],
        hotspotSize: [26, 30],   // a whole group of waste containers
        evidence: "The highlighted group contains chemical-waste containers requiring correct segregation.",
        question: "How should the chemical waste be handled?",
        answers: [
            "Pour it into the sink.",
            "Mix different wastes together to conserve space.",
            "Use the designated compatible container and approved disposal procedure.",
            "Leave it on the workbench."
        ],
        correct: 2,
        feedback: "The proper container helps prevent leaks, corrosion, and unwanted chemical reactions. Correct labeling and segregation allow personnel to identify the waste and handle it safely.",
        info: {
            title: "Chemical Waste",
            why: "The highlighted containers hold leftover and discarded chemicals. Unwanted chemical substances from laboratory work are chemical waste, and they stay hazardous unless they are stored, separated, and disposed of properly.",
            definition: [
                "Chemical waste refers to unwanted or discarded chemical substances produced during laboratory activities that may be hazardous if not handled, stored, or disposed of properly.",
                "Chemical waste refers to any waste material that contains or has been contaminated by chemicals. It can be solid, liquid, or gaseous and may arise from various industries, including healthcare, manufacturing, and even retail."
            ],
            source: "Glover, J. (2025, July 15). What is Chemical Waste? – 10 Examples. Daniels Health UK.",
            sourceUrl: "https://www.sharpsmart.co.uk/knowledge-centre/what-is-chemical-waste",
            risks: [
                ["Chemical burns", "Damage to the skin and eyes."],
                ["Poisoning", "Harm caused by exposure to toxic substances."],
                ["Fire or explosion", "Reactions involving flammable or incompatible chemicals."],
                ["Environmental contamination", "Pollution of soil and water."],
                ["Respiratory irritation", "Breathing difficulties caused by harmful fumes."]
            ]
        },
        explanations: [
            "Disposing of chemical waste through the sink can contaminate water systems, damage plumbing, and expose people to hazardous substances.",
            "Different chemicals may react with one another, potentially producing toxic gases, excessive heat, fire, or pressure buildup.",
            "The proper container helps prevent leaks, corrosion, and unwanted chemical reactions. Correct labeling and segregation allow personnel to identify the waste and handle it safely.",
            "Leaving chemical waste unattended on a workbench can lead to accidental spills, exposure, confusion, or unintended mixing with other substances."
        ]
    },
    {
        name: "Hazard Labels",
        image: "labels.jpg",
        hotspot: [44, 43],
        hotspotSize: [16, 24],   // one reagent bottle and its label
        evidence: "A prominent hazard pictogram is visible on the front reagent bottle.",
        question: "What should happen before the chemical is used?",
        answers: [
            "Review the chemical identity, label, and safety data sheet.",
            "Assume a sealed bottle is safe.",
            "Smell the chemical to identify it.",
            "Proceed without checking the instructions."
        ],
        correct: 0,
        feedback: "The label identifies the chemical and displays important hazard warnings. Reviewing these details helps prevent accidents and chemical exposure.",
        info: {
            title: "Hazard Label",
            why: "A hazard pictogram is visible on the front reagent bottle. Hazard labels and pictograms warn about the dangers of a chemical, so they must be read and understood before the chemical is handled.",
            definition: [
                "A hazard label is a warning label placed on chemical containers, laboratory materials, or equipment to identify potential dangers and provide information on proper handling. Missing, damaged, or unreadable hazard labels may lead to improper use and accidental exposure to dangerous substances.",
                "Hazard pictograms, or hazard symbols, serve as a way to label chemical products to indicate specific types of dangers they may pose. Each pictogram is a warning symbol found on the packaging of various chemical products. Depending on how a chemical product is classified, it may carry multiple hazard symbols at the same time."
            ],
            source: "Hällström, I. A. (2026, March 23). Hazard symbols and labelling – what are hazard pictograms? | Intersolia. Intersolia.",
            sourceUrl: "https://intersolia.com/hazard-symbols-labelling-what-are-hazard-pictograms/",
            risks: [
                ["Chemical exposure", "Contact with hazardous substances due to unidentified chemicals."],
                ["Poisoning", "Accidental ingestion or inhalation of harmful substances."],
                ["Chemical burns", "Injuries caused by improper handling of chemicals."],
                ["Fire or explosion", "Mishandling of flammable or reactive substances."],
                ["Improper disposal", "Incorrect disposal of hazardous chemical waste."]
            ]
        },
        explanations: [
            "The label identifies the chemical and displays important hazard warnings. Reviewing these details helps prevent accidents and chemical exposure.",
            "A sealed container can still hold toxic, corrosive, flammable, or otherwise hazardous chemicals. The seal helps prevent leaks but does not eliminate the chemical's inherent dangers. Always check the label and safety information before handling it.",
            "Directly smelling a chemical can expose a person to harmful vapors that may irritate or damage the respiratory system or cause poisoning.",
            "Ignoring the instructions can result in improper handling, incompatible chemical mixing, accidental exposure, or other laboratory accidents."
        ]
    },
    {
        name: "Emergency Response",
        image: "eyewash.jpg",
        hotspot: [79, 42],
        hotspotSize: [16, 34],   // tall eyewash station
        evidence: "An emergency eyewash is available beside the affected work area.",
        question: "What is the appropriate immediate response to eye exposure?",
        answers: [
            "Rub the eyes.",
            "Wait to see if symptoms appear.",
            "Use the designated eyewash immediately and follow the emergency procedure.",
            "Apply an unapproved substance."
        ],
        correct: 2,
        feedback: "Immediate, continuous flushing with clean water from the eyewash station helps remove the chemical from the eyes. Remove contact lenses if easily possible while flushing.",
        info: {
            title: "Contact with Skin",
            why: "The emergency eyewash stands beside a work area where a hazardous substance may have touched the skin or eyes. Accidental contact with a hazardous substance is what makes this a skin contact hazard, and the eyewash is the immediate response.",
            definition: [
                "Skin contact occurs when a hazardous chemical or biological substance accidentally comes into contact with the skin, potentially causing irritation, burns, allergic reactions, or absorption of harmful substances into the body."
            ],
            risks: [
                ["Skin irritation", "Redness, itching, or inflammation."],
                ["Chemical burns", "Damage to the skin caused by corrosive substances."],
                ["Allergic reactions", "Skin rashes or swelling."],
                ["Toxic absorption", "Harmful substances entering the body through the skin."],
                ["Infection", "Exposure to infectious biological materials through broken skin."]
            ]
        },
        explanations: [
            "Rubbing the eyes can worsen irritation and may spread the chemical across the eye's surface. It can also cause additional injury.",
            "Some chemicals can cause damage even before noticeable symptoms develop. Delaying treatment may increase the severity of the injury.",
            "Immediate, continuous flushing with clean water from the eyewash station helps remove the chemical from the eyes. Remove contact lenses if easily possible while flushing.",
            "Applying creams, neutralizing agents, or other unapproved substances can worsen the injury or cause additional chemical reactions."
        ]
    }
];

/* ============================================================
   2. RUNTIME GAME STATE
   ============================================================ */
let gameState = {
    levelIndex: 0,
    score: 0,
    completedLevels: [],
    stage: 0, // 0=inspection, 1=decision, 2=feedback
    selectedAnswer: null,
    answerHistory: {},
    timerId: null,
    timeRemaining: 60,
    soundEnabled: true,
    paused: false       // true while the hazard briefing is open (the clock waits)
};

/* Short DOM helper: $("#id") returns one matching element. */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

/* The scientist's name is asked on the home page before entering the lab (see nav.js) and shown
   on the Final Review. It is remembered on this device so the pop-up can pre-fill it. */
let scientistName = "";
try { scientistName = localStorage.getItem("labview.scientistName") || ""; } catch (e) { /* storage blocked */ }
function setScientistName(name) {
    scientistName = name;
    try { localStorage.setItem("labview.scientistName", name); } catch (e) { /* storage blocked */ }
}

/* "girl" or "boy", asked together with the name. Used for the player's pixel avatar. */
let scientistGender = "";
try { scientistGender = localStorage.getItem("labview.scientistGender") || ""; } catch (e) { /* storage blocked */ }
function setScientistGender(gender) {
    scientistGender = gender;
    try { localStorage.setItem("labview.scientistGender", gender); } catch (e) { /* storage blocked */ }
}

/** Pixel-art scientist for the player (12 x 14 grid). rows = [y, [[x, width, color], ...]]. */
function playerAvatarSvg(gender) {
    const girl = gender === "girl";
    const HAIR = girl ? "#7a3b2e" : "#3b2a20", SKIN = "#f2c9a0", COAT = "#f1fbff", SHADE = "#cfe6f2", EYE = "#0b1220", TEAL = "#28d3f5";
    const rows = [
        [0, [[3, 6, HAIR]]],
        [1, [[2, 8, HAIR]]],
        [2, girl ? [[1, 2, HAIR], [3, 6, SKIN], [9, 2, HAIR]] : [[2, 1, HAIR], [3, 6, SKIN], [9, 1, HAIR]]],
        [3, girl ? [[1, 1, HAIR], [2, 8, SKIN], [10, 1, HAIR], [4, 1, EYE], [7, 1, EYE]] : [[2, 8, SKIN], [4, 1, EYE], [7, 1, EYE]]],
        [4, girl ? [[1, 1, HAIR], [2, 8, SKIN], [10, 1, HAIR]] : [[2, 8, SKIN]]],
        [5, girl ? [[1, 1, HAIR], [3, 6, SKIN], [10, 1, HAIR], [5, 2, "#b8434f"]] : [[3, 6, SKIN], [5, 2, "#b8434f"]]],
        [6, girl ? [[1, 1, HAIR], [5, 2, SKIN], [10, 1, HAIR]] : [[5, 2, SKIN]]],
        [7, [[2, 8, COAT], [5, 2, TEAL]]],
        [8, [[1, 10, COAT], [5, 2, TEAL]]],
        [9, [[0, 12, COAT], [5, 2, TEAL]]],
        [10, [[0, 12, COAT], [5, 2, SHADE]]],
        [11, [[0, 12, COAT], [5, 2, SHADE], [8, 2, "#9cb6c5"]]],
        [12, [[0, 12, COAT], [5, 2, SHADE]]],
        [13, [[0, 12, COAT], [5, 2, SHADE]]]
    ];
    return '<svg class="pa-svg" viewBox="0 0 12 14" shape-rendering="crispEdges" aria-hidden="true">' +
        rows.map(([y, runs]) => runs.map(([x, w, c]) => `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${c}"/>`).join("")).join("") +
        "</svg>";
}

/** Show one screen and hide all others. */
function showScreen(screenId) {
    $$(".screen").forEach((screen) => screen.classList.remove("active"));
    $(screenId).classList.add("active");
    window.scrollTo(0, 0);
}

/** Build the map cards and determine which levels are unlocked. */
/* ---------- Lab supervisor message on the zone selection page ---------- */
let callTypeTimer = null;
let callLastText = "";

/** Types the message out letter by letter (instantly when motion is reduced or the text is unchanged). */
function typeCall(el, text) {
    clearTimeout(callTypeTimer);
    if (text === callLastText) { el.textContent = text; return; }
    callLastText = text;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = text; return; }
    let i = 0;
    el.textContent = "";
    (function step() {
        i += 2;
        el.textContent = text.slice(0, i);
        if (i < text.length) callTypeTimer = setTimeout(step, 22);
    })();
}

/** Greeting that changes with the player's progress, so the lab feels alive. */
function updateLabCall() {
    const name = scientistName || "Scientist";
    const total = levels.length;
    const done = gameState.completedLevels.length;
    const correct = Object.values(gameState.answerHistory).filter((h) => h.correct).length;
    let greeting, text;

    if (done === 0) {
        greeting = `Hi, ${name}!`;
        text = `We need your help. Alarms are blinking in all ${total} laboratory zones and something is wrong in each one. ` +
               `Grab your flashlight, find the hazard, and choose the safest response. The whole lab is counting on you.`;
    } else if (done < total) {
        const next = levels.find((_, i) => !gameState.completedLevels.includes(i));
        greeting = `Good work, ${name}!`;
        text = `${done} of ${total} zones checked and ${correct} made safe. ` +
               `${total - done} more still need you. ${next ? "Head to " + next.name + " next. " : ""}Stay sharp, every hazard you find keeps someone safe.`;
    } else if (correct === total) {
        greeting = `Mission complete, ${name}!`;
        text = `Every hazard is under control and the whole lab is safe thanks to you. Open your safety report to see your results.`;
    } else {
        greeting = `All zones checked, ${name}!`;
        text = `You made ${correct} of ${total} zones safe. Open your safety report to see what to remember for next time.`;
    }

    $("#lcGreeting").textContent = greeting;   // textContent on purpose: the name is typed by the player
    $("#lcPlayerName").textContent = scientistName || "Scientist";
    $("#lcAvatar").innerHTML = scientistGender ? playerAvatarSvg(scientistGender) : "";
    typeCall($("#lcText"), text);
}

function renderLevelMap() {
    updateLabCall();
    const completionPercent = (gameState.completedLevels.length / levels.length) * 100;
    $("#overallText").textContent = `${completionPercent}% complete`;
    $("#overallBar").style.width = `${completionPercent}%`;
    // Once every zone is done, a button on this page leads back to the Final Review.
    $("#viewReportButton").hidden = gameState.completedLevels.length < levels.length;

    $("#levelCards").innerHTML = levels.map((level, index) => {
        const isLocked = index > 0 && !gameState.completedLevels.includes(index - 1);
        const history = gameState.answerHistory[index];
        const isMissed = !!history && !history.correct;          // answered wrong: locked for good, no retry
        const isCleared = !!history && history.correct;
        const buttonText = isMissed ? "Zone Closed" : gameState.completedLevels.includes(index) ? "Review Level" : "Enter Zone";

        return `
            <article class="level-card ${isLocked ? "locked" : ""} ${isMissed ? "missed" : ""} ${isCleared ? "cleared" : ""}">
                <span class="zone-status ${isCleared ? "ok" : isMissed ? "bad" : ""}" ${isCleared || isMissed ? "" : "hidden"}>${isCleared ? REPORT_CHECK + "Zone Cleared" : REPORT_X + "Not Cleared"}</span>
                <div class="level-image" style="background-image: url('assets/${level.image}')"></div>
                <div class="level-body">
                    <small>LEVEL ${String(index + 1).padStart(2, "0")}</small>
                    <h3>${level.name}</h3>
                    <p>Inspect the exact hazard object and make the safest response.</p>
                    <button class="button button-primary" data-level-index="${index}" ${isLocked || isMissed ? "disabled" : ""}>
                        ${buttonText}
                    </button>
                </div>
            </article>`;
    }).join("");

    $$('[data-level-index]').forEach((button) => {
        button.addEventListener("click", () => loadLevel(Number(button.dataset.levelIndex)));
    });
}

/** Load a level, its scene image, marker coordinates, and timer. */
function loadLevel(index) {
    clearInterval(gameState.timerId);

    gameState.levelIndex = index;
    gameState.stage = 0;
    gameState.selectedAnswer = null;
    gameState.timeRemaining = 60;
    gameState.paused = false;

    const level = levels[index];

    $("#levelValue").textContent = index + 1;
    $("#missionTag").textContent = `LEVEL ${String(index + 1).padStart(2, "0")}`;
    $("#missionTitle").textContent = level.name;
    $("#missionDescription").textContent = "Inspect the scene and select the marker positioned on the relevant hazard object.";
    $("#scenePhoto").style.backgroundImage = `url('assets/${level.image}')`;

    // Place the marker directly over the object specified by the level.
    $("#hazardMarker").style.left = `${level.hotspot[0]}%`;
    $("#hazardMarker").style.top = `${level.hotspot[1]}%`;
    // The clickable zone is centered on the hotspot; its width/height (% of the scene) come from
    // level.hotspotSize, so each hazard gets a zone that fits its size.
    const zone = level.hotspotSize || [18, 26];
    $("#hazardMarker").style.width = `${zone[0]}%`;
    $("#hazardMarker").style.height = `${zone[1]}%`;
    $("#hazardMarker").style.display = "block";

    $("#phaseLabel").textContent = "SITE INSPECTION";
    $("#evidenceText").textContent = "Nothing yet";
    $("#answerList").innerHTML = "";
    $("#actionButton").textContent = "Identify Hazard";
    $("#actionButton").disabled = true;
    $("#missionBar").style.width = "15%";
    $("#timerValue").textContent = "60";

    showScreen("#missionScreen");
    startTimer();
}

/** Count down from 60 seconds. Reaching zero does not auto-submit. */
function startTimer() {
    gameState.timerId = setInterval(() => {
        if (gameState.paused) return;   // the clock waits while the hazard briefing is being read
        gameState.timeRemaining = Math.max(0, gameState.timeRemaining - 1);
        $("#timerValue").textContent = gameState.timeRemaining;

        if (gameState.timeRemaining === 0) {
            clearInterval(gameState.timerId);
        }
    }, 1000);
}

/** Record that the player selected the highlighted hazard object. */
function identifyHazard() {
    const level = levels[gameState.levelIndex];
    $("#evidenceText").textContent = level.evidence;
    $("#actionButton").disabled = false;
    $("#missionBar").style.width = "45%";
}

/** Render answer choices for the current level. */
function showQuestion() {
    const level = levels[gameState.levelIndex];

    gameState.stage = 1;
    $("#phaseLabel").textContent = "RESPONSE DECISION";
    $("#missionTitle").textContent = level.question;
    $("#missionDescription").textContent = "Use the collected evidence and select the safest response.";

    $("#answerList").innerHTML = level.answers.map((answer, index) => `
        <button class="answer-button" data-answer-index="${index}">
            <strong>${String.fromCharCode(65 + index)}</strong>
            ${answer}
        </button>`).join("");

    $$('[data-answer-index]').forEach((button) => {
        button.addEventListener("click", () => {
            $$(".answer-button").forEach((item) => item.classList.remove("selected"));
            button.classList.add("selected");
            gameState.selectedAnswer = Number(button.dataset.answerIndex);
            $("#actionButton").disabled = false;
        });
    });

    $("#actionButton").textContent = "Submit Response";
    $("#actionButton").disabled = true;
    $("#missionBar").style.width = "70%";
}

/** Validate the selected answer, update score once, and show feedback. */
function submitAnswer() {
    clearInterval(gameState.timerId);

    const level = levels[gameState.levelIndex];
    const isCorrect = gameState.selectedAnswer === level.correct;
    const isFirstCompletion = !gameState.completedLevels.includes(gameState.levelIndex);

    // The first answer is final: a missed zone is closed and cannot be repeated.
    if (isFirstCompletion) {
        gameState.answerHistory[gameState.levelIndex] = {
            selected: gameState.selectedAnswer,
            correct: isCorrect,
            timeUsed: 60 - gameState.timeRemaining
        };
        if (isCorrect) {
            gameState.score += 100;
        }
        gameState.completedLevels.push(gameState.levelIndex);
    }

    gameState.stage = 2;
    $("#scoreValue").textContent = gameState.score;
    $("#phaseLabel").textContent = isCorrect ? "CORRECT RESPONSE" : "INCORRECT RESPONSE";
    $("#missionTitle").textContent = isCorrect ? "Zone Cleared · +100 points" : "Zone Not Cleared · 0 points";
    // Brief reason why the chosen answer is right or wrong (falls back to the general feedback).
    // For a wrong answer, the correct answer and why it is correct appear in the "Inspect the Area" view (quiz.js).
    if (level.explanations) {
        $("#missionDescription").textContent = level.explanations[gameState.selectedAnswer] || level.feedback;
    } else {
        $("#missionDescription").textContent = level.feedback;
    }
    $("#answerList").innerHTML = "";
    // No "Next Level" prompt: after each zone the player goes back to the zone selection.
    // Once every zone is done, the button leads to the Final Review instead.
    $("#actionButton").textContent = gameState.completedLevels.length >= levels.length ? "View Final Review" : "Return to Zones";
    $("#actionButton").disabled = false;
    $("#missionBar").style.width = "100%";
}

/** Control the three mission stages using one primary action button. */
function handleAction() {
    if (gameState.stage === 0) {
        showQuestion();
    } else if (gameState.stage === 1) {
        submitAnswer();
    } else if (gameState.completedLevels.length >= levels.length) {
        renderFinalReview();
        showScreen("#resultScreen");
    } else {
        renderLevelMap();
        showScreen("#mapScreen");
    }
}

/* ---------- Final Review page ---------- */

/** Small pixel-art SVG built from [x, y, width] rows (used for the check / X in the report). */
function pixelSvg(size, rows, fill) {
    return `<svg class="ri-icon" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" aria-hidden="true">` +
        rows.map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w || 1}" height="1" fill="${fill}"/>`).join("") +
        `</svg>`;
}
const REPORT_CHECK = pixelSvg(12, [[10,1,2],[9,2,3],[8,3,4],[0,4,2],[7,4,4],[0,5,3],[6,5,4],[1,6,3],[5,6,4],[2,7,6],[3,8,4],[4,9,2]], "#48e2a2");
const REPORT_X = pixelSvg(7, [[0,0,2],[5,0,2],[1,1,2],[4,1,2],[2,2,3],[3,3,1],[2,4,3],[1,5,2],[4,5,2],[0,6,2],[5,6,2]], "#ff6171");

/** Rank shown on the report, indexed by how many zones were answered correctly (0 to 5). */
const REPORT_RANKS = [
    { title: "Back to Training", message: "Take your time. Read each safety takeaway below, then play again." },
    { title: "Back to Training", message: "Take your time. Read each safety takeaway below, then play again." },
    { title: "Needs Practice", message: "A few key habits are still missing. Read the takeaways for the missed zones, then play again." },
    { title: "Safety Trainee", message: "Good start. Some responses were unsafe, so check the takeaways for those zones." },
    { title: "Safety Specialist", message: "Excellent work. Review the one zone you missed to reach a perfect report." },
    { title: "Lab Safety Master", message: "Perfect run! You found every hazard and chose the safest response every time." }
];

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

let finalScoreFrame = null;
/** Count the final score up from 0 (jumps straight to the number if motion is reduced). */
function animateFinalScore(target) {
    const el = $("#finalScore");
    cancelAnimationFrame(finalScoreFrame);
    if (target === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        el.textContent = target;
        return;
    }
    const start = performance.now();
    const duration = 1100;
    el.textContent = 0;
    (function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        el.textContent = t < 1 ? Math.round((target * t) / 5) * 5 : target;
        if (t < 1) finalScoreFrame = requestAnimationFrame(tick);
    })(start);
}

/** Build the final report: rank, stars, score, quick stats and a zone-by-zone review. */
function renderFinalReview() {
    const total = levels.length;
    const results = levels.map((level, index) => ({ level, index, entry: gameState.answerHistory[index] }));
    const correctCount = results.filter((r) => r.entry && r.entry.correct).length;
    const missedCount = total - correctCount;
    const totalTime = results.reduce((sum, r) => sum + ((r.entry && r.entry.timeUsed) || 0), 0);
    const rank = REPORT_RANKS[correctCount];

    $("#resultScreen .result-card").dataset.tier = String(correctCount);
    $("#resultRank").textContent = rank.title;
    $("#resultMsg").textContent = rank.message;
    $("#resultScientist").hidden = !scientistName;
    $("#resultScientistName").textContent = scientistName;   // textContent on purpose: it is typed by the player
    $("#resultAvatar").innerHTML = scientistGender ? playerAvatarSvg(scientistGender) : "";
    $("#resultStars").setAttribute("aria-label", `${correctCount} of ${total} stars`);
    $("#resultStars").innerHTML = results.map((r, i) =>
        `<img class="px-icon rs-star ${i < correctCount ? "on" : ""}" style="--i:${i}" src="assets/icons/star.svg" alt="">`
    ).join("");

    $("#maxScore").textContent = `/${total * 100}`;
    $("#statCorrect").textContent = `${correctCount}/${total}`;
    $("#statAccuracy").textContent = `${Math.round((correctCount / total) * 100)}%`;
    $("#statTime").textContent = formatDuration(totalTime);

    $("#answerReview").innerHTML = results.map(({ level, index, entry }) => {
        const ok = !!(entry && entry.correct);
        const yours = entry && entry.selected !== null && entry.selected !== undefined
            ? level.answers[entry.selected] : "No answer";
        const time = entry && entry.timeUsed !== undefined ? `${entry.timeUsed}s` : "";

        return `
            <article class="review-item ${ok ? "correct" : "wrong"}">
                <div class="ri-thumb" style="background-image: url('assets/${level.image}')"></div>
                <div class="ri-body">
                    <div class="ri-top">
                        <span class="ri-zone">ZONE ${String(index + 1).padStart(2, "0")}</span>
                        <span class="ri-verdict">${ok ? REPORT_CHECK + "Zone Cleared · +100" : REPORT_X + "Not Cleared · 0"}</span>
                        <span class="ri-time">${time}</span>
                    </div>
                    <h4 class="ri-name">${level.name}</h4>
                    ${ok ? "" : `
                    <p class="ri-line ri-bad"><b>Your answer</b>${yours}</p>
                    <p class="ri-line ri-good"><b>Correct answer</b>${level.answers[level.correct]}</p>`}
                    <p class="ri-tip"><b>Safety takeaway</b>${level.feedback}</p>
                </div>
            </article>`;
    }).join("");

    animateFinalScore(gameState.score);
    // Celebrate a strong result (labConfetti comes from quiz.js).
    if (correctCount >= 4) {
        if (typeof window.labFinalConfetti === "function") setTimeout(() => window.labFinalConfetti(correctCount), 400);
        else if (typeof window.labConfetti === "function") setTimeout(window.labConfetti, 400);
    }
}

/** Move the flashlight and apply a subtle first-person parallax effect. */
function moveScene(clientX, clientY) {
    const viewport = $("#sceneViewport");
    const bounds = viewport.getBoundingClientRect();
    const xPercent = ((clientX - bounds.left) / bounds.width) * 100;
    const yPercent = ((clientY - bounds.top) / bounds.height) * 100;

    $("#flashlightOverlay").style.setProperty("--mouse-x", `${xPercent}%`);
    $("#flashlightOverlay").style.setProperty("--mouse-y", `${yPercent}%`);
    $("#scenePhoto").style.translate = `${(50 - xPercent) * 0.05}px ${(50 - yPercent) * 0.05}px`;
}

/** Reset all progress and return to the home screen. */
function restartGame() {
    clearInterval(gameState.timerId);

    gameState = {
        levelIndex: 0,
        score: 0,
        completedLevels: [],
        stage: 0,
        selectedAnswer: null,
        answerHistory: {},
        timerId: null,
        timeRemaining: 60,
        soundEnabled: gameState.soundEnabled,
        paused: false
    };

    $("#scoreValue").textContent = "0";
    $("#levelValue").textContent = "1";
    showScreen("#homeScreen");
}

/* ============================================================
   3. EVENT LISTENERS
   ============================================================ */
$("#startButton").addEventListener("click", () => {
    renderLevelMap();
    showScreen("#mapScreen");
});

$("#homeButton").addEventListener("click", () => showScreen("#homeScreen"));
$("#hazardMarker").addEventListener("click", identifyHazard);
$("#actionButton").addEventListener("click", handleAction);
$("#restartButton").addEventListener("click", restartGame);

// Final Review buttons
$("#viewReportButton").addEventListener("click", () => {
    renderFinalReview();
    showScreen("#resultScreen");
});

$("#zonesButton").addEventListener("click", () => {
    renderLevelMap();
    showScreen("#mapScreen");
});

$("#printButton").addEventListener("click", () => {
    $("#printMeta").textContent = `Date: ${new Date().toLocaleDateString()}`;
    window.print();
});

$("#flashlightButton").addEventListener("click", () => {
    $("#flashlightOverlay").classList.toggle("active");
});

$("#zoomButton").addEventListener("click", () => {
    const scene = $("#scenePhoto");
    scene.style.transform = scene.style.transform.includes("1.15") ? "scale(1)" : "scale(1.15)";
});

$("#sceneViewport").addEventListener("mousemove", (event) => {
    moveScene(event.clientX, event.clientY);
});

// Touch support for iPhone and iPad Safari.
$("#sceneViewport").addEventListener("touchmove", (event) => {
    if (event.touches.length === 1) {
        moveScene(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: true });

// The sound button was removed from the header, so only wire it up if it exists.
if ($("#soundButton")) {
    $("#soundButton").addEventListener("click", () => {
        gameState.soundEnabled = !gameState.soundEnabled;
        $("#soundButton").textContent = gameState.soundEnabled ? "⚙ Settings 🔊" : "⚙ Settings 🔇";
    });
}

// Header navigation
$$(".nav-link[data-nav]").forEach((link) => {
    link.addEventListener("click", () => {
        if (link.dataset.nav === "#mapScreen") renderLevelMap();
        showScreen(link.dataset.nav);
        $$(".nav-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
    });
});

// How to Play dialog
$("#howToButton").addEventListener("click", () => $("#howToDialog").showModal());
$("#howToClose").addEventListener("click", () => $("#howToDialog").close());