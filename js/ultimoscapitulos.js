// ultimoscapitulos.js

// Importación de funciones auxiliares para manipular datos y eventos
import { flatten, sortDesc, cargarCapitulos } from './data.js';
import { activarLinksPDF } from './eventos.js';
import { parseDateDMY } from './utils.js';

// Función principal que inicializa la vista de últimos capítulos
export function initUltimosCapitulos() {
  // Referencias a elementos del DOM necesarios para mostrar contenido
  const listEl = document.getElementById("book-card-caps");
  const emptyEl = document.getElementById("empty");
  const metaEl = document.getElementById("meta");
  const qEl = document.getElementById("q");

  // Estado interno que almacena todos los capítulos y los filtrados
  const state = {
    items: [],     // Lista completa de capítulos
    filtered: []   // Lista filtrada según búsqueda
  };

  // Función para formatear fechas en formato DD-MM-YYYY
  const formatDateEs = (date) => {
    const d = typeof date === "string" ? parseDateDMY(date) : date;
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Función que renderiza la lista de capítulos en el DOM
  const render = () => {
    // Limpia el contenido anterior
    listEl.innerHTML = "";

    // Si no hay elementos filtrados, muestra mensaje de vacío
    if (!state.filtered.length) {
      emptyEl.style.display = "block";
      metaEl.textContent = "0 elementos";
      return;
    }

    // Oculta el mensaje de vacío si hay contenido
    emptyEl.style.display = "none";

    // Crea contenedor principal de la sección
    const section = document.createElement("div");
    section.className = "book-section book-latest-chapters";

    // Cabecera con icono de reloj (últimos capítulos)
    section.innerHTML = `<h3><i class="fa-solid fa-clock-rotate-left"></i> Últimos capítulos</h3>`;

    // Lista de capítulos
    const ul = document.createElement("ul");
    ul.className = "chapter-list";

    // Itera sobre los capítulos filtrados y genera cada elemento
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

    // Añade la lista al contenedor principal
    section.appendChild(ul);
    listEl.appendChild(section);

    // Activa los enlaces PDF para cada capítulo
    activarLinksPDF();

    // Muestra metadatos: número total de capítulos y obras distintas
    const totalObras = new Set(state.filtered.map(i => i._obra)).size;
    metaEl.textContent = `${state.filtered.length} capítulos · ${totalObras} obras`;
  };

  // Función que aplica el filtro de búsqueda sobre los capítulos
  const applyFilter = () => {
    const q = qEl.value.trim().toLowerCase(); // Texto de búsqueda en minúsculas

    // Si no hay búsqueda, se muestran todos los elementos
    state.filtered = !q
      ? [...state.items]
      : state.items.filter(it =>
          it._obra.toLowerCase().includes(q) ||
          it.nombreCapitulo.toLowerCase().includes(q) ||
          String(it.numCapitulo).includes(q)
        );

    // Vuelve a renderizar la vista con los elementos filtrados
    render();
  };

  // Evento que aplica el filtro en tiempo real al escribir en el input
  qEl.addEventListener("input", applyFilter);

  // Atajo de teclado: al presionar "/" se enfoca el campo de búsqueda
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== qEl) {
      e.preventDefault();
      qEl.focus();
      qEl.select();
    }
  });

  // Carga los capítulos desde el archivo JSON y los ordena
  cargarCapitulos()
    .then(data => {
      state.items = flatten(data).sort(sortDesc); // Orden descendente por defecto
      state.filtered = [...state.items];          // Inicializa la vista con todos los elementos
      render();                                   // Renderiza la vista inicial
    })
    .catch(err => {
      // Muestra error en consola si falla la carga
      console.error("Error cargando capitulos.json:", err);
    });
}
