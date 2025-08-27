const parseDateDMY = (s) => {
  const [dd, mm, yyyy] = String(s).split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
};
const parseChapterNumber = (n) => {
  const num = parseFloat(String(n).replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? -Infinity : num;
};
const formatDateEs = (d) =>
  new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(d).replace(".", "");

const getInitials = (obra) =>
  obra.split(/\s+/).filter(Boolean).slice(0, 3).map(w => w[0].toUpperCase()).join("");

const flatten = (obj) => {
  const items = [];
  for (const key of Object.keys(obj)) {
    for (const it of obj[key]) {
      items.push({
        ...it,
        _fecha: parseDateDMY(it.Fecha),
        _num: parseChapterNumber(it.numCapitulo),
        _obra: it.tituloObra || key
      });
    }
  }
  return items;
};

const sortDesc = (a, b) => {
  const t = b._fecha - a._fecha;
  if (t !== 0) return t;
  if (b._num !== a._num) return b._num - a._num;
  return String(b._obra).localeCompare(String(a._obra), "es", { sensitivity: "base" });
};

const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const metaEl = document.getElementById("meta");
const qEl = document.getElementById("q");

let state = { items: [], filtered: [] };

const render = () => {
  listEl.innerHTML = "";
  if (!state.filtered.length) {
    emptyEl.style.display = "block";
    metaEl.textContent = "0 elementos";
    return;
  }
  emptyEl.style.display = "none";
  state.filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="left">${getInitials(item._obra)}</div>
      <div class="body">
        <div class="obra">${item._obra}</div>
        <div class="cap">Capítulo ${item.numCapitulo} — ${item.nombreCapitulo}</div>
        <div class="metaRow">
          <span>${formatDateEs(item._fecha)}</span>
          <span>${item.NombreArchivo}</span>
        </div>
      </div>`;
    listEl.appendChild(card);
  });
  metaEl.textContent = `${state.filtered.length} capítulos · ${new Set(state.filtered.map(i => i._obra)).size} obras`;
};

const applyFilter = () => {
  const q = qEl.value.trim().toLowerCase();
  state.filtered = !q
    ? [...state.items]
    : state.items.filter(it =>
        it._obra.toLowerCase().includes(q) ||
        it.nombreCapitulo.toLowerCase().includes(q) ||
        String(it.numCapitulo).includes(q)
      );
  render();
};

fetch("books.json")
  .then(res => res.json())
  .then(data => {
    state.items = flatten(data).sort(sortDesc);
    state.filtered = [...state.items];
    render();
  });

qEl.addEventListener("input", applyFilter);
window.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement !== qEl) {
    e.preventDefault();
    qEl.focus();
    qEl.select();
  }
});
