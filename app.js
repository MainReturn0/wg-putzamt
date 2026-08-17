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
      { key: "bio",     label: "Organic", emoji: "🥕", tone: "bio" },
      { key: "plastic", label: "Plastic", emoji: "♻️", tone: "plastic" },
      { key: "paper",   label: "Paper",   emoji: "📦", tone: "paper" },
    ],
  };

  const DETAIL_LOOKUP = {};
  Object.values(DETAIL_CONFIG).flat().forEach(d => DETAIL_LOOKUP[d.key] = d);
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  // ---------- Funny message templates ----------
  const CLEAN_TEMPLATES = [
    p => `${p} went to war with the ${rooms()} and won. 🧼`,
    p => `${p} restored order to the ${rooms()}. The apartment can breathe again.`,
    p => `Breaking: ${p} touched a cleaning product. The ${rooms()} did not see it coming. ✨`,
    p => `${p} cleared the ${rooms()} boss level. Achievement unlocked: Cleanliness.`,
    p => `${p} made the ${rooms()} presentable for exactly one visitor's worth of time.`,
    p => `${p} scrubbed the ${rooms()} like the move-out inspection depends on it.`,
    p => `${p} vs. the ${rooms()}: final score, ${p} 1 — Chaos 0.`,
    p => `Witnesses report ${p} was seen holding a sponge near the ${rooms()}. Miracles happen.`,
    p => `${p} has entered the ${rooms()} chat. Grime has left the ${rooms()} chat.`,
    p => `The ${rooms()} briefly considered filing a complaint. Then ${p} showed up.`,
    p => `${p} performed an emergency intervention on the ${rooms()}. Patient stable. 🩺`,
    p => `${p} channeled their inner building caretaker and the ${rooms()} obeyed.`,
    p => `Local hero ${p} defended the ${rooms()} from roommate shame once again.`,
    p => `${p} did the thing nobody asked for out loud but everyone was thinking: cleaned the ${rooms()}.`,
    p => `${p} left the ${rooms()} cleaner than they found their own motivation to do it.`,
    p => `Sponsored by ${p}: today's episode of "The ${rooms()} Strikes Back... and Loses."`,
  ];

  const TRASH_TEMPLATES = [
    p => `${p} yeeted the ${bins()} to the dumpsters. Planet Earth says thanks. 🌍`,
    p => `${p} sorted today's trash like a true recycling inspector.`,
    p => `${p} hauled the ${bins()} down — heroic multi-flight-of-stairs edition. 🚮`,
    p => `${p} sorted the ${bins()} with German-level precision.`,
    p => `${p} freed the kitchen from the ${bins()}. One small step for a roommate, one giant step for trash sorting.`,
    p => `${p} took out the ${bins()} before anyone had to ask twice. Legend.`,
    p => `${p} has achieved perfect recycling karma with the ${bins()} run.`,
    p => `Somewhere, a German neighbor nodded in approval as ${p} sorted the ${bins()}.`,
    p => `${p} carried the ${bins()} past the door like it owed them money.`,
    p => `${p} single-handedly prevented a smell-based roommate emergency: ${bins()}, taken out.`,
    p => `Plot twist: ${p} remembered bin day. The ${bins()} are gone.`,
    p => `${p} completed a stealth mission: get the ${bins()} out before Razim/Mahin/Jubayer notices it was full.`,
    p => `The ${bins()} have been evicted from the apartment, courtesy of ${p}.`,
    p => `${p} gave the ${bins()} a one-way ticket downstairs. No survivors.`,
    p => `Rumor has it ${p} can smell an overflowing bin from two rooms away. The ${bins()} confirm it.`,
    p => `${p} earned this week's Recycling Merit Badge for the ${bins()} run. 🏅`,
  ];

  const DONE_TEMPLATES = [
    (p, d) => `${p}'s report has been filed for ${d}. The office is pleased.`,
    (p, d) => `Stamped, sealed, delivered — ${p} is officially off the hook for ${d}.`,
    (p, d) => `${p}'s ${d} report is now in the records forever. History has been made.`,
    (p, d) => `Filed under "Reasons ${p} is a good roommate," dated ${d}.`,
    (p, d) => `${p}'s paperwork is in order. The Chore Office has no further questions about ${d}.`,
    (p, d) => `Officially logged: ${p} did a thing on ${d}. The bureaucracy thanks you.`,
  ];

  const EMPTY_LOG_TEMPLATES = [
    "No entries yet — be the first to earn your stamp.",
    "The records folder is suspiciously empty. Someone fix that.",
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
  const logsTableBody = document.getElementById("logs-table-body");
  const refreshLogsBtn = document.getElementById("refresh-logs-btn");
  const adminLoggedOut = document.getElementById("admin-logged-out");
  const adminLoggedIn = document.getElementById("admin-logged-in");
  const adminPassInput = document.getElementById("admin-pass-input");
  const adminLoginBtn = document.getElementById("admin-login-btn");
  const adminLogoutBtn = document.getElementById("admin-logout-btn");
  let adminPasscode = localStorage.getItem("wg_admin_pass") || "";

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
    if (!iso || !DATE_RE.test(iso)) return iso || "";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  function taskDoneText(entry) {
    if (entry.task_text) return entry.task_text;
    const details = JSON.parse(entry.details);
    const labels = details.map(k => (DETAIL_LOOKUP[k] ? DETAIL_LOOKUP[k].label : k)).join(", ");
    const taskWord = entry.action_type === "cleaning" ? "Cleaning" : "Trash";
    return `${taskWord} — ${labels}`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function updateAdminUI() {
    const actionHeaders = document.querySelectorAll(".admin-cell-action");
    const isAdmin = Boolean(adminPasscode);
    adminLoggedOut.style.display = isAdmin ? "none" : "flex";
    adminLoggedIn.style.display = isAdmin ? "flex" : "none";
    actionHeaders.forEach(cell => {
      cell.style.display = isAdmin ? "table-cell" : "none";
    });
  }

  function renderLoadingRow() {
    logsTableBody.innerHTML = `<tr><td colspan="4" class="log-empty">Loading logs...</td></tr>`;
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
      renderLogsTable();
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

  // ---------- Log table ----------
  async function renderLogsTable(){
    renderLoadingRow();
    try {
      const res = await fetch("/api/logs");
      if (!res.ok) throw new Error("Request failed");
      const entries = await res.json();
      renderLogRows(entries);
    } catch (err) {
      logsTableBody.innerHTML = `<tr><td colspan="4" class="log-empty">Couldn't load the log.</td></tr>`;
    }
  }

  function renderLogRows(entries){
    if (!entries.length) {
      const msg = EMPTY_LOG_TEMPLATES[Math.floor(Math.random() * EMPTY_LOG_TEMPLATES.length)];
      logsTableBody.innerHTML = `<tr><td colspan="4" class="log-empty">${escapeHtml(msg)}</td></tr>`;
      return;
    }
    const isAdmin = Boolean(adminPasscode);
    logsTableBody.innerHTML = entries.map(entry => {
      const who = String(entry.person).toLowerCase();
      const taskText = taskDoneText(entry);
      const displayDate = formatDate(entry.entry_date);
      const actionCellStyle = isAdmin ? "" : "display:none;";
      return `
        <tr class="who-${who}" id="row-${entry.id}" data-entry-date="${escapeHtml(entry.entry_date)}">
          <td data-label="Name"><span class="badge tone-${who}">${escapeHtml(entry.person)}</span></td>
          <td data-label="Task Done">${escapeHtml(taskText)}</td>
          <td data-label="Date">${escapeHtml(displayDate)}</td>
          <td data-label="Manage" class="admin-cell-action" style="${actionCellStyle}">
            <button class="btn-sm btn-edit" type="button" data-action="edit" data-id="${entry.id}">Edit</button>
            <button class="btn-sm btn-delete" type="button" data-action="delete" data-id="${entry.id}">Delete</button>
          </td>
        </tr>`;
    }).join("");
  }

  function startEdit(id, person, taskText, entryDate) {
    const row = document.getElementById(`row-${id}`);
    if (!row) return;
    row.innerHTML = `
      <td data-label="Name"><input type="text" class="edit-input" id="edit-name-${id}" value="${escapeHtml(person)}"></td>
      <td data-label="Task Done"><input type="text" class="edit-input" id="edit-task-${id}" value="${escapeHtml(taskText)}"></td>
      <td data-label="Date"><input type="date" class="edit-input" id="edit-date-${id}" value="${escapeHtml(entryDate)}"></td>
      <td data-label="Manage" class="admin-cell-action">
        <button class="btn-sm btn-save" type="button" data-action="save" data-id="${id}">Save</button>
        <button class="btn-sm btn-cancel" type="button" data-action="cancel">Cancel</button>
      </td>`;
  }

  async function saveEdit(id) {
    const nameEl = document.getElementById(`edit-name-${id}`);
    const taskEl = document.getElementById(`edit-task-${id}`);
    const dateEl = document.getElementById(`edit-date-${id}`);
    const payload = {
      id,
      name: nameEl.value.trim(),
      task: taskEl.value.trim(),
      date: dateEl.value.trim(),
    };
    const res = await fetch("/api/logs", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminPasscode,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Update failed. Check admin passcode or field values.");
      return;
    }
    await renderLogsTable();
  }

  async function deleteLog(id) {
    if (!confirm("Are you sure you want to delete this row?")) return;
    const res = await fetch(`/api/logs?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-key": adminPasscode },
    });
    if (!res.ok) {
      alert("Delete failed. Check admin passcode.");
      return;
    }
    await renderLogsTable();
  }

  adminLoginBtn.addEventListener("click", () => {
    const pass = adminPassInput.value.trim();
    if (!pass) return;
    adminPasscode = pass;
    localStorage.setItem("wg_admin_pass", pass);
    adminPassInput.value = "";
    updateAdminUI();
    renderLogsTable();
  });

  adminLogoutBtn.addEventListener("click", () => {
    adminPasscode = "";
    localStorage.removeItem("wg_admin_pass");
    updateAdminUI();
    renderLogsTable();
  });

  refreshLogsBtn.addEventListener("click", renderLogsTable);

  logsTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "cancel") {
      renderLogsTable();
      return;
    }
    const id = Number(button.dataset.id);
    if (!Number.isInteger(id)) return;
    if (action === "delete") {
      deleteLog(id);
      return;
    }
    if (action === "save") {
      saveEdit(id);
      return;
    }
    if (action === "edit") {
      const row = button.closest("tr");
      if (!row) return;
      const name = row.querySelector('[data-label="Name"] .badge').textContent.trim();
      const task = row.querySelector('[data-label="Task Done"]').textContent.trim();
      const isoDate = row.dataset.entryDate || "";
      startEdit(id, name, task, isoDate);
    }
  });

  // ---------- Init ----------
  entryDate.value = todayISO();
  updateAdminUI();
  renderLogsTable();
})();
