window.onload = function () {
  "use strict";
  const key = "hill-house-gm-v1";
  const stages = [
    ["Estranei", "La casa li osserva."],
    ["Familiarità", "Odori, ricordi e piccoli gesti di conforto."],
    ["Appartenenza", "La casa conosce desideri e paure."],
    ["Intimità", "Le madri iniziano a chiamarli per nome."],
    ["Dipendenza", "Uscire dalla casa sembra doloroso."],
    ["Possesso", "La Madre offre di restituire ciò che hanno perso."],
    ["Per sempre", "La Madre tenta di trattenerli definitivamente."],
  ];
  const clues = [
    "Gli investigatori sono già stati nella villa da bambini.",
    "Il dottor Harrow ha sperimentato il legame tra bambini e Presenza.",
    "La Madre ha assorbito le coscienze di diverse madri.",
    "Chi muore nella villa viene conservato dall’entità.",
    "I Craine mantengono la Madre confinata nella Stanza Rossa.",
    "La Madre desidera amore e appartenenza, non semplicemente morte.",
  ];
  let state = { clock: 0, checked: [] };
  try {
    const s = JSON.parse(localStorage.getItem(key));
    if (s && typeof s === "object") {
      state.clock = Number.isInteger(s.clock)
        ? Math.max(0, Math.min(6, s.clock))
        : 0;
      state.checked = Array.isArray(s.checked)
        ? s.checked.filter(
            (x) => Number.isInteger(x) && x >= 0 && x < clues.length,
          )
        : [];
    }
  } catch (e) {
    document.getElementById("saveStatus").textContent =
      "Il salvataggio non è disponibile in questo browser.";
  }
  const segments = document.getElementById("segments");
  for (let i = 1; i <= 6; i++) {
    let b = document.createElement("button");
    b.type = "button";
    b.className = "segment";
    b.textContent = i;
    b.setAttribute("aria-label", "Imposta orologio a " + i);
    b.addEventListener("click", () => setClock(state.clock === i ? i - 1 : i));
    segments.appendChild(b);
  }
  const checklist = document.getElementById("checklist");
  clues.forEach((clue, i) => {
    let label = document.createElement("span");
    label.className = "check";
    let input = document.createElement("input");
    input.type = "checkbox";
    input.id = "check" + i;
    input.checked = state.checked.includes(i);
    input.addEventListener("change", () => {
      state.checked = Array.from(checklist.querySelectorAll("input")).flatMap(
        (e, j) => (e.checked ? [j] : []),
      );
      save();
    });
    let span = document.createElement("label");
    span.setAttribute("for", "check" + i);
    span.textContent = clue;
    label.append(input, span);
    checklist.appendChild(label);
  });
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      document.getElementById("saveStatus").textContent =
        "Salvataggio non disponibile: tieni aperta questa pagina.";
    }
  }
  function render() {
    document.getElementById("counter").textContent = state.clock + "/6";
    document.getElementById("stageName").textContent = stages[state.clock][0];
    document.getElementById("stageText").textContent = stages[state.clock][1];
    Array.from(segments.children).forEach((b, i) => {
      b.classList.toggle("active", i < state.clock);
      b.setAttribute("aria-pressed", String(i < state.clock));
    });
    save();
  }
  function setClock(n) {
    state.clock = Math.max(0, Math.min(6, n));
    render();
  }
  document
    .getElementById("minus")
    .addEventListener("click", () => setClock(state.clock - 1));
  document
    .getElementById("plus")
    .addEventListener("click", () => setClock(state.clock + 1));
  document.getElementById("reset").addEventListener("click", () => {
    if (confirm("Azzerare l’orologio della Casa?")) setClock(0);
  });
  document.getElementById("clearChecks").addEventListener("click", () => {
    if (confirm("Deselezionare tutte le rivelazioni?")) {
      state.checked = [];
      checklist.querySelectorAll("input").forEach((x) => (x.checked = false));
      save();
    }
  });
  render();
};
