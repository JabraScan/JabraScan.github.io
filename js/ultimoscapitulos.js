// ultimoscapitulos.js
import { flatten, sortDesc, sortAsc, cargarCapitulos } from './data.js';
import { activarLinksPDF } from './eventos.js';
import { parseDateDMY } from './utils.js';

export function initUltimosCapitulos() {
  const listEl = document.getElementById("book-card-caps");
  const emptyEl = document.getElementById("empty");
  const metaEl = document.getElementById("meta");
  const qEl = document.getElementById("q");

  // Estado interno de la vista
  const state = {
    items: [],
    filtered: [],
    orden: "desc" // Estado inicial de ordenación
  };

  // Formatea fecha en formato DD-MM-YYYY
  const formatDateEs = (date) => {
    const d = typeof date === "string" ? parseDateDMY(date) : date;
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Renderiza la lista de capítulos
  const render = () => {
    listEl.innerHTML = "";

    if (!state.filtered.length) {
      emptyEl.style.display = "block";
      metaEl.textContent = "0 elementos";
      return;
    }

    emptyEl.style.display = "none";

    const section = document.createElement("div");
    section.className = "book-section book-latest-chapters";

    // Icono dinámico según el orden actual
    const iconClass = state.orden === "asc"
      ? "fa-arrow-up-wide-short"
      : "fa-arrow-down-wide-short";

    const titleText = state.orden === "asc"
      ? "Orden ascendente"
      : "Orden descendente";

    // Cabecera con botón de ordenación
    section.innerHTML = `
      <div class="book-header">
        <span><i class="fa-solid fa-clock-rotate-left"></i> Últimos capítulos</span>
        <button id="toggle-order" class="order-toggle" title="${titleText}">
          <i class="fa-solid ${iconClass}"></i>
        </button>
      </div>
    `;

    const ul = document.createElement("ul");
    ul.className = "chapter-list";

    for (const item of state.filtered) {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="#" class="pdf-link"
           data-pdf-obra="${item._clave}"
           data-pdf-capitulo="${item.numCapitulo}">
          <span class="fecha">${formatDateEs(item._fecha)}</span> -
          <span class="obra ${item._clave}">${item._obra}</span> -
          <span class="cap">${item.numCapitulo}</span> ·
          <span class="titulo">${item.nombreCapitulo}</span>
        </a>
      `;
      ul.appendChild(li);
    }

    section.appendChild(ul);
    listEl.appendChild(section);

    activarLinksPDF();

    const totalObras = new Set(state.filtered.map(i => i._obra)).size;
    metaEl.textContent = `${state.filtered.length} capítulos · ${totalObras} obras`;

    // Activar botón de ordenación
    const toggleBtn = document.getElementById("toggle-order");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        // Alternar orden y volver a aplicar filtro
        state.orden = state.orden === "asc" ? "desc" : "asc";
        applyFilter(); // Refiltra y reordena
      });
    }
  };

  // Aplica filtro de búsqueda y ordenación
  const applyFilter = () => {
    const q = qEl.value.trim().toLowerCase();
    const base = !q
      ? [...state.items]
      : state.items.filter(it =>
          it._obra.toLowerCase().includes(q) ||
          it.nombreCapitulo.toLowerCase().includes(q) ||
          String(it.numCapitulo).includes(q)
        );

    // Ordenar según estado actual
    state.filtered = state.orden === "asc"
      ? base.sort(sortAsc)
      : base.sort(sortDesc);

    render();
  };

  // Filtro en tiempo real
  qEl.addEventListener("input", applyFilter);

  // Atajo para enfocar búsqueda con "/"
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== qEl) {
      e.preventDefault();
      qEl.focus();
      qEl.select();
    }
  });

  // Cargar datos iniciales
  cargarCapitulos()
    .then(data => {
      state.items = flatten(data);
      applyFilter(); // Aplica filtro y orden inicial
    })
    .catch(err => {
      console.error("Error cargando capitulos.json:", err);
    });
}
