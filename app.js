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
  ];

  const TRASH_TEMPLATES = [
    p => `${p} yeeted the ${bins()} down to the bins. Mutter Erde says danke. 🌍`,
    p => `${p} completed today's Mülltrennung like a true Ordnungsamt inspector.`,
    p => `${p} hauled the ${bins()} down — heroic multi-flight-of-stairs edition. 🚮`,
    p => `${p} sorted the ${bins()} with German-level precision.`,
    p => `${p} freed the kitchen from the ${bins()}. One small step for man, one giant step for Mülltrennung.`,
    p => `${p} took out the ${bins()} before anyone had to ask twice. Legend.`,
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

      doneText.textContent = `${state.person}'s report has been filed for ${formatDate(state.date)}.`;
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
      logFeed.innerHTML = `<p class="log-empty">No entries yet — be the first to earn your stamp.</p>`;
      return;
    }
    logFeed.innerHTML = entries.map(entry => {
      const msg = funnyMessage(entry);
      const details = JSON.parse(entry.details);
      const primaryTone = entry.action_type === "cleaning" ? "clean" : (DETAIL_LOOKUP[details[0]] || {}).tone || "clean";
      const icon = entry.action_type === "cleaning" ? "🧽" : "🗑️";
      return `
        <div class="log-entry">
          <div class="log-stamp tone-${primaryTone}">${icon}</div>
          <div class="log-text">
            <p class="log-msg">${msg}</p>
            <p class="log-meta">${entry.person} · ${formatDate(entry.entry_date)}</p>
          </div>
        </div>`;
    }).join("");
  }

  refreshBtn.addEventListener("click", loadLog);

  // ---------- Init ----------
  entryDate.value = todayISO();
  loadLog();
})();
