(() => {
  "use strict";

  const state = {
    person: null,
    action: null,      // 'cleaning' | 'trash'
    details: [],        // array of detail keys
    date: null,
  };

  const DETAIL_CONFIG = {
    cleaning: [
      { key: "bathroom", label: "Bathroom", emoji: "🛁", tone: "bathroom" },
      { key: "kitchen",  label: "Kitchen",  emoji: "🍳", tone: "kitchen" },
    ],
    trash: [
      { key: "bio",     label: "Bio",     emoji: "🥕", tone: "bio" },
      { key: "plastic", label: "Plastic", emoji: "♻️", tone: "plastic" },
      { key: "paper",   label: "Paper",   emoji: "📦", tone: "paper" },
    ],
  };

  const DETAIL_LOOKUP = {};
  Object.values(DETAIL_CONFIG).flat().forEach(d => DETAIL_LOOKUP[d.key] = d);

  // ---------- Funny message templates ----------
  const CLEAN_TEMPLATES = [
    p => `${p} went to war with the ${rooms()} and won. 🧼`,
    p => `${p} restored Ordnung to the ${rooms()}. The WG breathes again.`,
    p => `Breaking: ${p} touched a cleaning product. The ${rooms()} did not see it coming. ✨`,
    p => `${p} cleared the ${rooms()} boss level. Achievement unlocked: Sauberkeit.`,
    p => `${p} made the ${rooms()} presentable for exactly one visitor's worth of time.`,
    p => `${p} scrubbed the ${rooms()} like the Wohnungsübergabe depends on it.`,
    p => `${p} vs. the ${rooms()}: final score, ${p} 1 — Chaos 0.`,
    p => `Witnesses report ${p} was seen holding a sponge near the ${rooms()}. Miracles happen.`,
    p => `${p} has entered the ${rooms()} chat. Grime has left the ${rooms()} chat.`,
    p => `The ${rooms()} briefly considered filing a complaint. Then ${p} showed up.`,
    p => `${p} performed an emergency intervention on the ${rooms()}. Patient stable. 🩺`,
    p => `${p} channeled their inner Hausmeister and the ${rooms()} obeyed.`,
    p => `Local hero ${p} defends the ${rooms()} from certain WG-shame once again.`,
    p => `${p} did the thing nobody asked for out loud but everyone was thinking: cleaned the ${rooms()}.`,
    p => `${p} left the ${rooms()} cleaner than they found their own motivation to do it.`,
    p => `Sponsored by ${p}: today's episode of "The ${rooms()} Strikes Back... and Loses."`,
  ];

  const TRASH_TEMPLATES = [
    p => `${p} yeeted the ${bins()} down to the bins. Mutter Erde says danke. 🌍`,
    p => `${p} completed today's Mülltrennung like a true Ordnungsamt inspector.`,
    p => `${p} hauled the ${bins()} down — heroic multi-flight-of-stairs edition. 🚮`,
    p => `${p} sorted the ${bins()} with German-level precision.`,
    p => `${p} freed the kitchen from the ${bins()}. One small step for man, one giant step for Mülltrennung.`,
    p => `${p} took out the ${bins()} before anyone had to ask twice. Legend.`,
    p => `${p} has achieved perfect Mülltrennung karma with the ${bins()} run.`,
    p => `Somewhere, a German neighbor nodded in approval as ${p} sorted the ${bins()}.`,
    p => `${p} carried the ${bins()} past the door like it owed them money.`,
    p => `${p} single-handedly prevented a smell-based WG emergency: ${bins()}, taken out.`,
    p => `Plot twist: ${p} remembered bin day. The ${bins()} are gone.`,
    p => `${p} completed a stealth mission: get the ${bins()} out before Razim/Mahin/Jubayer notices it was full.`,
    p => `The ${bins()} have been evicted from the apartment, courtesy of ${p}.`,
    p => `${p} gave the ${bins()} a one-way ticket downstairs. No survivors.`,
    p => `Rumor has it ${p} can smell an overflowing bin from two rooms away. The ${bins()} confirm it.`,
    p => `${p} earned this week's Recycling Merit Badge for the ${bins()} run. 🏅`,
  ];

  const DONE_TEMPLATES = [
    (p, d) => `${p}'s report has been filed for ${d}. The Amt is pleased.`,
    (p, d) => `Stamped, sealed, delivered — ${p} is officially off the hook for ${d}.`,
    (p, d) => `${p}'s ${d} report now lives in the Aktenordner forever. History has been made.`,
    (p, d) => `Filed under "Reasons ${p} is a good roommate," dated ${d}.`,
    (p, d) => `${p}'s paperwork is in order. The Putzamt has no further questions about ${d}.`,
    (p, d) => `Officially logged: ${p} did a thing on ${d}. The bureaucracy thanks you.`,
  ];

  const EMPTY_LOG_TEMPLATES = [
    "No entries yet — be the first to earn your stamp.",
    "The Aktenordner is suspiciously empty. Someone fix that.",
    "Zero reports on file. The bins are judging you.",
    "This is awkward — nobody has filed anything yet.",
  ];

  let _detailWords = [];
  function rooms(){ return joinWords(_detailWords); }
  function bins(){ return joinWords(_detailWords); }

  function joinWords(arr){
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} & ${arr[1]}`;
    return `${arr.slice(0,-1).join(", ")} & ${arr[arr.length-1]}`;
  }

  function hashStr(str){
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
  }

  function funnyMessage(entry){
    const details = JSON.parse(entry.details);
    const labels = details.map(k => (DETAIL_LOOKUP[k] ? DETAIL_LOOKUP[k].label : k));
    _detailWords = labels;
    const templates = entry.action_type === "cleaning" ? CLEAN_TEMPLATES : TRASH_TEMPLATES;
    const idx = hashStr(`${entry.id}-${entry.person}-${entry.entry_date}`) % templates.length;
    return templates[idx](entry.person);
  }

  // ---------- DOM refs ----------
  const panels = document.querySelectorAll(".step-panel");
  const steps = document.querySelectorAll(".progress-steps .step");
  const personGrid = document.getElementById("personGrid");
  const whoName2 = document.getElementById("whoName2");
  const detailsGrid = document.getElementById("detailsGrid");
  const detailsQuestion = document.getElementById("detailsQuestion");
  const detailsContinueBtn = document.getElementById("detailsContinueBtn");
  const entryDate = document.getElementById("entryDate");
  const summaryBox = document.getElementById("summaryBox");
  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");
  const doneText = document.getElementById("doneText");
  const stampAnim = document.getElementById("stampAnim");
  const logFeed = document.getElementById("logFeed");
  const refreshBtn = document.getElementById("refreshBtn");

  function todayISO(){
    const d = new Date();
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0, 10);
  }

  function showPanel(step){
    panels.forEach(p => p.classList.toggle("active", p.dataset.panel === String(step)));
    steps.forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.toggle("active", n === step);
      s.classList.toggle("done", n < step);
    });
  }

  // ---------- Step 1: person ----------
  personGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".pick-card");
    if (!card) return;
    state.person = card.dataset.person;
    [...personGrid.children].forEach(c => c.classList.toggle("selected", c === card));
    whoName2.textContent = state.person;
    setTimeout(() => showPanel(2), 150);
  });

  // ---------- Step 2: action ----------
  document.querySelectorAll("[data-action]").forEach(card => {
    card.addEventListener("click", () => {
      state.action = card.dataset.action;
      state.details = [];
      buildDetailsGrid();
      setTimeout(() => showPanel(3), 150);
    });
  });

  // ---------- Step 3: details (multi-select) ----------
  function buildDetailsGrid(){
    detailsGrid.innerHTML = "";
    detailsQuestion.textContent = state.action === "cleaning"
      ? "Which room(s)?"
      : "Which bin(s)?";
    DETAIL_CONFIG[state.action].forEach(d => {
      const btn = document.createElement("button");
      btn.className = "pick-card";
      btn.dataset.tone = d.tone;
      btn.dataset.key = d.key;
      btn.innerHTML = `<span class="emoji">${d.emoji}</span><span class="name">${d.label}</span>`;
      detailsGrid.appendChild(btn);
    });
    detailsContinueBtn.disabled = true;
  }

  detailsGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".pick-card");
    if (!card) return;
    const key = card.dataset.key;
    card.classList.toggle("selected");
    if (state.details.includes(key)) {
      state.details = state.details.filter(k => k !== key);
    } else {
      state.details.push(key);
    }
    detailsContinueBtn.disabled = state.details.length === 0;
  });

  detailsContinueBtn.addEventListener("click", () => {
    entryDate.value = todayISO();
    state.date = entryDate.value;
    updateSummary();
    showPanel(4);
  });

  // ---------- Step 4: date + submit ----------
  entryDate.addEventListener("change", () => {
    state.date = entryDate.value || todayISO();
    updateSummary();
  });

  function updateSummary(){
    const labels = state.details.map(k => DETAIL_LOOKUP[k].label).join(", ");
    const taskWord = state.action === "cleaning" ? "Cleaning" : "Trash";
    summaryBox.innerHTML =
      `<b>${state.person}</b> — ${taskWord}: <b>${labels}</b><br>Date: <b>${formatDate(state.date)}</b>`;
  }

  function formatDate(iso){
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => showPanel(Number(btn.dataset.back)));
  });

  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "Filing...";
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: state.person,
          action_type: state.action,
          details: state.details,
          entry_date: state.date,
        }),
      });
      if (!res.ok) throw new Error("Request failed");

      const doneMsg = DONE_TEMPLATES[Math.floor(Math.random() * DONE_TEMPLATES.length)];
      doneText.textContent = doneMsg(state.person, formatDate(state.date));
      showPanel("done");
      stampAnim.querySelector(".stamp-mark").style.animation = "none";
      void stampAnim.offsetWidth;
      stampAnim.querySelector(".stamp-mark").style.animation = "";
      loadLog();
    } catch (err) {
      alert("Couldn't file the report — check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Stamp & File Report";
    }
  });

  resetBtn.addEventListener("click", () => {
    state.person = null;
    state.action = null;
    state.details = [];
    [...personGrid.children].forEach(c => c.classList.remove("selected"));
    showPanel(1);
  });

  // ---------- Log feed ----------
  async function loadLog(){
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Request failed");
      const entries = await res.json();
      renderLog(entries);
    } catch (err) {
      logFeed.innerHTML = `<p class="log-empty">Couldn't load the log. Pull to refresh?</p>`;
    }
  }

  function renderLog(entries){
    if (!entries.length) {
      const msg = EMPTY_LOG_TEMPLATES[Math.floor(Math.random() * EMPTY_LOG_TEMPLATES.length)];
      logFeed.innerHTML = `<p class="log-empty">${msg}</p>`;
      return;
    }
    const rows = entries.map(entry => {
      const msg = funnyMessage(entry);
      const details = JSON.parse(entry.details);
      const labels = details.map(k => (DETAIL_LOOKUP[k] ? DETAIL_LOOKUP[k].label : k)).join(", ");
      const taskWord = entry.action_type === "cleaning" ? "Cleaning" : "Trash";
      const icon = entry.action_type === "cleaning" ? "🧽" : "🗑️";
      const who = entry.person.toLowerCase();
      return `
        <tr class="who-${who}">
          <td data-label="Date">${formatDate(entry.entry_date)}</td>
          <td data-label="Who"><span class="badge tone-${who}">${entry.person}</span></td>
          <td data-label="Task">${icon} ${taskWord} — ${labels}</td>
          <td data-label="Note">${msg}</td>
        </tr>`;
    }).join("");

    logFeed.innerHTML = `
      <table class="log-table">
        <thead>
          <tr><th>Date</th><th>Who</th><th>Task</th><th>Note</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  refreshBtn.addEventListener("click", loadLog);

  // ---------- Init ----------
  entryDate.value = todayISO();
  loadLog();
})();
