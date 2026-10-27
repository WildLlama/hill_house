window.onload = function () {
  "use strict";
  const KEY = "hillhouse_gm_archive_v1",
    DB = "hillhouse_files_v1";
  let data = {
      session: "",
      general: "",
      clues: "",
      secrets: "",
      characters: [],
    },
    active = null,
    db;
  const $ = (id) => document.getElementById(id);
  const uid = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random();
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  function status(s) {
    $("saveStatus").textContent = s;
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      status("Salvato in locale · " + new Date().toLocaleTimeString("it-IT"));
    } catch (e) {
      status("Errore salvataggio: esporta i dati · " + e.message);
    }
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && Array.isArray(d.characters)) data = d;
    } catch (e) {
      status("Archivio non leggibile");
    }
  }
  function openDb() {
    return new Promise((res, rej) => {
      let r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () =>
        r.result.createObjectStore("files", { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function tx(mode = "readonly") {
    return db.transaction("files", mode).objectStore("files");
  }
  function req(r) {
    return new Promise((res, rej) => {
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async function allFiles() {
    return req(tx().getAll());
  }
  async function putFile(f) {
    return req(tx("readwrite").put(f));
  }
  async function delFile(id) {
    return req(tx("readwrite").delete(id));
  }
  function saveNotes() {
    for (const k of ["session", "general", "clues", "secrets"])
      data[k] = $(k).value;
    persist();
  }
  function render() {
    const wrap = $("cards");
    wrap.innerHTML = "";
    $("empty").classList.toggle("hidden", data.characters.length > 0);
    for (const c of data.characters) {
      let div = document.createElement("div");
      div.className = "char";
      div.innerHTML = `<h3>${esc(c.name || "Senza nome")}</h3><div class="meta">${esc(c.player || "Giocatore non indicato")}</div><span class="pill">${esc(c.role || "Ruolo non indicato")}</span><div class="actions"><button class="action" data-id="${esc(c.id)}">Apri scheda</button></div>`;
      div.querySelector("button").onclick = () => edit(c.id);
      wrap.appendChild(div);
    }
  }
  function clearEditor() {
    for (const k of fields) $(k).value = "";
  }
  const fields = [
    "name",
    "player",
    "role",
    "circle",
    "drive",
    "redroom",
    "unresolved",
    "happyMemories",
    "marks",
    "stats",
    "charNotes",
  ];
  function edit(id) {
    active = id;
    const c = data.characters.find((x) => x.id === id);
    clearEditor();
    if (c) for (const k of fields) $(k).value = c[k] || "";
    $("editorTitle").textContent = c
      ? "Scheda · " + (c.name || "Senza nome")
      : "Nuovo investigatore";
    $("editor").classList.remove("hidden");
    $("deleteChar").disabled = !c;
    renderFiles();
    $("editor").scrollIntoView({ behavior: "smooth" });
  }
  function saveChar() {
    let c = data.characters.find((x) => x.id === active);
    if (!c) {
      c = { id: uid() };
      data.characters.push(c);
      active = c.id;
    }
    for (const k of fields) c[k] = $(k).value;
    persist();
    render();
    $("editorTitle").textContent = "Scheda · " + (c.name || "Senza nome");
  }
  async function renderFiles() {
    const el = $("fileList");
    el.innerHTML = "";
    if (!active || !db) return;
    let files = (await allFiles()).filter((f) => f.charId === active);
    for (const f of files) {
      let div = document.createElement("div");
      div.className = "fileitem";
      let span = document.createElement("span");
      span.textContent =
        f.name + " · " + Math.round(f.blob.size / 1024) + " KB";
      let actions = document.createElement("div");
      actions.className = "actions";
      let open = document.createElement("button");
      open.className = "alt";
      open.textContent = "Apri";
      open.onclick = () => {
        let url = URL.createObjectURL(f.blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      };
      let down = document.createElement("button");
      down.className = "alt";
      down.textContent = "Scarica";
      down.onclick = () => downloadBlob(f.blob, f.name);
      let del = document.createElement("button");
      del.className = "danger";
      del.textContent = "Rimuovi";
      del.onclick = async () => {
        if (confirm("Rimuovere questo allegato?")) {
          await delFile(f.id);
          renderFiles();
        }
      };
      actions.append(open, down, del);
      div.append(span, actions);
      el.append(div);
    }
  }
  function downloadBlob(blob, name) {
    let a = document.createElement("a"),
      url = URL.createObjectURL(blob);
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  function readDataURL(blob) {
    return new Promise((res, rej) => {
      let r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(blob);
    });
  }
  function fromDataURL(str) {
    let [head, b64] = str.split(",");
    let type = /data:([^;]+)/.exec(head)?.[1] || "application/octet-stream";
    let raw = atob(b64),
      arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type });
  }
  async function exportAll() {
    try {
      let files = await allFiles(),
        packed = [];
      for (const f of files)
        packed.push({
          id: f.id,
          charId: f.charId,
          name: f.name,
          data: await readDataURL(f.blob),
        });
      downloadBlob(
        new Blob(
          [
            JSON.stringify(
              { format: "hillhouse-archive-v1", data, files: packed },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        "hill_house_archivio_" +
          new Date().toISOString().slice(0, 10) +
          ".json",
      );
      status("Archivio esportato");
    } catch (e) {
      alert("Esportazione non riuscita: " + e.message);
    }
  }
  async function importAll(file) {
    try {
      let o = JSON.parse(await file.text());
      if (
        o.format !== "hillhouse-archive-v1" ||
        !o.data ||
        !Array.isArray(o.data.characters) ||
        !Array.isArray(o.files)
      )
        throw Error("Formato archivio non valido");
      if (
        !confirm(
          "Sostituire tutte le note, le schede e gli allegati correnti con quelli del file?",
        )
      )
        return;
      for (const f of await allFiles()) await delFile(f.id);
      for (const f of o.files) {
        if (typeof f.data !== "string" || !f.data.startsWith("data:")) continue;
        await putFile({
          id: f.id,
          charId: f.charId,
          name: f.name,
          blob: fromDataURL(f.data),
        });
      }
      data = o.data;
      for (const k of ["session", "general", "clues", "secrets"])
        $(k).value = data[k] || "";
      persist();
      render();
      $("editor").classList.add("hidden");
      active = null;
      status("Archivio importato");
    } catch (e) {
      alert("Importazione non riuscita: " + e.message);
    }
  }
  const debounce = (fn, ms) => {
    let t;
    return () => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  };
  load();
  for (const k of ["session", "general", "clues", "secrets"]) {
    $(k).value = data[k] || "";
    $(k).addEventListener("input", debounce(saveNotes, 350));
  }
  render();
  openDb()
    .then((d) => {
      db = d;
      status("Archivio locale pronto");
    })
    .catch((e) => {
      status("Allegati non disponibili: " + e.message);
      $("attachments").disabled = true;
    });
  $("newChar").onclick = () => edit(null);
  $("closeEditor").onclick = () => {
    $("editor").classList.add("hidden");
    active = null;
  };
  $("saveChar").onclick = saveChar;
  $("deleteChar").onclick = async () => {
    if (!active || !confirm("Eliminare questa scheda e tutti i suoi allegati?"))
      return;
    data.characters = data.characters.filter((c) => c.id !== active);
    for (const f of (await allFiles()).filter((f) => f.charId === active))
      await delFile(f.id);
    active = null;
    persist();
    render();
    $("editor").classList.add("hidden");
  };
  $("attachments").onchange = async (e) => {
    if (!db) return;
    if (!active) saveChar();
    try {
      for (const f of e.target.files)
        await putFile({
          id: uid(),
          charId: active,
          name: f.name,
          blob: f,
        });
      await renderFiles();
      status("Allegati salvati nel browser");
    } catch (err) {
      alert("Impossibile salvare allegato: " + err.message);
    }
    e.target.value = "";
  };
  $("export").onclick = exportAll;
  $("importBtn").onclick = () => $("importFile").click();
  $("importFile").onchange = (e) => {
    if (e.target.files[0]) importAll(e.target.files[0]);
    e.target.value = "";
  };
  $("print").onclick = () => window.print();
  $("reset").onclick = async () => {
    if (
      !confirm(
        "Cancellare definitivamente note, investigatori e allegati da questo browser?",
      )
    )
      return;
    data = {
      session: "",
      general: "",
      clues: "",
      secrets: "",
      characters: [],
    };
    for (const f of await allFiles()) await delFile(f.id);
    for (const k of ["session", "general", "clues", "secrets"]) $(k).value = "";
    active = null;
    persist();
    render();
    $("editor").classList.add("hidden");
  };
  window.addEventListener("beforeunload", () => {
    for (const k of ["session", "general", "clues", "secrets"])
      data[k] = $(k).value;
    persist();
  });
};
