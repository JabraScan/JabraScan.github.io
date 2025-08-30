// ultimoscapitulos.js
import { flatten, sortDesc, cargarCapitulos } from './data.js';
import { activarLinksPDF } from './eventos.js';
import { parseDateDMY } from './utils.js';

export function initUltimosCapitulos() {
  // 📦 Elementos del DOM
  const listEl = document.getElementById("book-card-caps");
  const emptyEl = document.getElementById("empty");
  const metaEl = document.getElementById("meta");
  const qEl = document.getElementById("q");

  // 🧠 Estado interno
  const state = {
    items: [],       // Todos los capítulos
    filtered: [],    // Capítulos filtrados por búsqueda
    orderAsc: false  // Orden actual: false = descendente
  };

  // 📅 Formatea fecha al estilo español
  const formatDateEs = (date) => {
    const d = typeof date === "string" ? parseDateDMY(date) : date;
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // 🎨 Renderiza la lista de capítulos
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

    // 🧭 Encabezado con botón de orden
    section.innerHTML = `
      <div class="book-header">
        <span><i class="fa-solid fa-clock-rotate-left"></i> Últimos capítulos</span>
        <button id="toggle-order" class="order-toggle" title="${state.orderAsc ? 'Orden ascendente' : 'Orden descendente'}">
          <i class="fa-solid ${state.orderAsc ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short'}"></i>
        </button>
      </div>
    `;

    const ul = document.createElement("ul");
    ul.className = "chapter-list";

    // 📚 Genera cada capítulo como <li>
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

    // 📊 Muestra resumen de capítulos y obras
    const totalObras = new Set(state.filtered.map(i => i._obra)).size;
    metaEl.textContent = `${state.filtered.length} capítulos · ${totalObras} obras`;

    // 🔁 Evento para alternar orden al hacer clic en el icono
    const toggleBtn = section.querySelector("#toggle-order");
    toggleBtn.addEventListener("click", () => {
      state.orderAsc = !state.orderAsc;

      const sortFn = state.orderAsc
        ? (a, b) => parseDateDMY(a._fecha) - parseDateDMY(b._fecha)
        : (a, b) => parseDateDMY(b._fecha) - parseDateDMY(a._fecha);

      state.filtered.sort(sortFn);
      render(); // 🔄 Vuelve a renderizar con nuevo orden
    });
  };

  // 🔍 Aplica filtro de búsqueda
  const applyFilter = () => {
    const q = qEl.value.trim().toLowerCase();
    state.filtered = !q
      ? [...state.items]
      : state.items.filter(it =>
          it._obra.toLowerCase().includes(q) ||
          it.nombreCapitulo.toLowerCase().includes(q) ||
          String(it.numCapitulo).includes(q)
        );

    // 🧮 Aplica orden actual al filtrar
    const sortFn = state.orderAsc
      ? (a, b) => parseDateDMY(a._fecha) - parseDateDMY(b._fecha)
      : (a, b) => parseDateDMY(b._fecha) - parseDateDMY(a._fecha);

    state.filtered.sort(sortFn);
    render();
  };

  // ⌨️ Atajo para enfocar el campo de búsqueda
  qEl.addEventListener("input", applyFilter);
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== qEl) {
      e.preventDefault();
      qEl.focus();
      qEl.select();
    }
  });

  // 🚚 Carga inicial de capítulos
  cargarCapitulos()
    .then(data => {
      state.items = flatten(data);
      applyFilter(); // Aplica filtro y orden inicial
    })
    .catch(err => {
      console.error("Error cargando capitulos.json:", err);
    });
}
