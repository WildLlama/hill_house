window.onload = function () {
  const out = document.getElementById("out");
  document.getElementById("roll").onclick = () => {
    const z = document.getElementById("zero").checked,
      n = z
        ? 2
        : Math.max(
            0,
            Math.min(12, Number(document.getElementById("n").value) || 0),
          );
    if (!n) {
      out.textContent = "Seleziona almeno un dado.";
      return;
    }
    const a = Array.from(
        { length: n },
        () => 1 + Math.floor(Math.random() * 6),
      ),
      v = z ? Math.min(...a) : Math.max(...a);
    let dice_class = {"Risultato minore": "min", "Critico": "crit", "Successo pieno": "high", "Successo con costo" : "med", "Conseguenza / insuccesso": "low"};
    let dice_res = `${a.filter((x) => x === 6).length >= 2 ? "Critico" : v === 6 ? "Successo pieno" : v >= 4 ? "Successo con costo" : "Conseguenza / insuccesso"}`;
    out.innerHTML = `Dadi: ${a.join(" · ")} → <span class="dado">${v}</span> · <span class="${dice_class[dice_res]}">${dice_res}</span> ${z ? " · <span>Risultato minore</span>": ""}`;
  };
  
};
