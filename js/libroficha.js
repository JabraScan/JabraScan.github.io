// cargarlibro.js

import { obtenerCapitulos } from './capitulos.js';
import { abrirLectorPDF } from './lector.js';
import { parseDateDMY, parseChapterNumber, compareCapNumDesc } from './utils.js';
import { activarLinksPDF, activarPaginacion } from './eventos.js';

// Función principal que carga los datos de una obra y sus capítulos
export function cargarlibro(libroId) {
  if (!libroId) {
    document.body.innerHTML = '<p>No se encontró el libro seleccionado.</p>';
    return;
  }

  // Carga el archivo XML con los datos de las obras
  fetch('obras.xml')
    .then(response => response.text())
    .then(str => new DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      // Busca la obra correspondiente al libroId
      const obra = Array.from(data.getElementsByTagName('obra'))
        .find(o => o.querySelector('clave')?.textContent.trim() === libroId);

      if (!obra) {
        document.body.innerHTML = '<p>Obra no encontrada.</p>';
        return;
      }

      // Extrae los datos principales de la obra
      const get = tag => obra.querySelector(tag)?.textContent.trim() || '';
      const clave = get("clave");
      const nombreobra = get("nombreobra");
      const autor = get("autor");
      const sinopsis = get("sinopsis");
      const imagen = get("imagen");
      const tipoobra = get("tipoobra");
      const Categoria = get("categoria");
      const estado = get("estado");
      const ubicacion = get("ubicacion");
      const traduccion = get("traductor");
      const contenido18 = get("adulto");
      const discord = get("discord");
      const aprobadaAutor = get("aprobadaAutor");
      const wiki = get("wiki");

      // Mensaje si la traducción está aprobada por el autor
      const OKAutor = aprobadaAutor === 'si' ? `
        <span class="carousel-info-label">Traducción aprobada por el autor</span><br>
        <span>Discord Oficial : <a href="${discord}" target="_blank">${discord}</a></span>
      ` : '';

      // Construye el contenedor de imagen
      const imagenContenedor = document.createElement("div");
      imagenContenedor.classList.add("imagen-contenedor");
      const img = document.createElement("img");
      img.src = "../img/" + imagen;
      img.alt = nombreobra;
      imagenContenedor.appendChild(img);

      // Marca contenido +18 si corresponde
      if (contenido18 === "adulto") {
        imagenContenedor.classList.add("adulto");
        const indicador = document.createElement("div");
        indicador.classList.add("indicador-adulto");
        indicador.textContent = "+18";
        imagenContenedor.appendChild(indicador);
      }

      // Construye el encabezado y la información principal del libro
      const DataBook = document.querySelector('.book-card-caps');
      const headerDataBook = document.createElement("div");
      headerDataBook.className = "book-header";
      headerDataBook.innerHTML = `<i class="fa-solid fa-book"></i> ${nombreobra.toUpperCase()}`;

      const mainDataBook = document.createElement("div");
      mainDataBook.className = "book-main";
      mainDataBook.innerHTML = `
        <div class="book-image">
          <div class="book-genres"><span><i class="fa-solid fa-tags"></i>${Categoria}</span></div>
          <div class="book-links">
            <a href="#"><i class="fa-solid fa-book"></i> ${tipoobra}</a>
            <a href="#"><i class="fa-solid fa-globe"></i> ${ubicacion}</a>
            <a href="#"><i class="fa-solid fa-clock"></i> ${estado}</a>
          </div>
        </div>
        <div class="book-info-container">
          <div class="book-info">
            <h2 id="nombre-obra">${nombreobra}</h2>
            <div><b>Autor: </b> ${autor}</div>
            <div><b>Traducción: </b>${traduccion}</div>
            ${OKAutor}
          </div>
          <div class="book-synopsis">
            <b><i class="fa-solid fa-info-circle"></i> Sinopsis:</b>
            <p id="sinopsis-obra">${sinopsis}</p>
          </div>
          <div class="book_extras">
            <a class="book-wiki" href="${wiki}" target="_blank">Fans Wiki</a>
          </div>
        </div>
      `;

      // Inserta los elementos en el DOM
      DataBook.prepend(mainDataBook);
      DataBook.prepend(headerDataBook);
      mainDataBook.querySelector(".book-image").prepend(imagenContenedor);

      // Carga comentarios si la función está disponible
      if (typeof mostrarDisqus === "function") {
        mostrarDisqus(clave, clave);
      }

      // Carga los capítulos de la obra
      obtenerCapitulos(clave).then(listacapitulos => {
        // Prepara los últimos capítulos destacados
        const ultimosCapitulos = listacapitulos
          .map(c => ({
            ...c,
            fechaObj: parseDateDMY(c.Fecha),
            capNum: parseChapterNumber(c.numCapitulo)
          }))
          .filter(c => c.fechaObj)
          .sort((a, b) => {
            const diffFecha = b.fechaObj - a.fechaObj;
            if (diffFecha !== 0) return diffFecha;
            return compareCapNumDesc(a, b);
          })
          .slice(0, 6);

        const ultimosHTML = ultimosCapitulos.map(cap => `
          <li>
            <a href="#" data-pdf-obra="${clave}" data-pdf-capitulo="${cap.numCapitulo}" class="pdf-link">
              <span>${cap.numCapitulo}: ${cap.nombreCapitulo}</span>
              <span>(${cap.Fecha})</span>
            </a>
          </li>`).join('');

        const seccionUltimos = `
          <div class="book-section book-latest-chapters">
            <h3><i class="fa-solid fa-clock-rotate-left"></i> Últimos capítulos</h3>
            <ul class="chapter-list">${ultimosHTML}</ul>
          </div>
        `;

        // Renderiza todos los capítulos con paginación y ordenación
        renderCapitulosConOrden(listacapitulos, clave, seccionUltimos);
      });
    });
}
/**
 * Renderiza la sección "Todos los capítulos" con ordenación por fecha y paginación.
 * @param {Array} listacapitulos - Lista completa de capítulos.
 * @param {string} clave - Clave de la obra.
 * @param {string} seccionUltimos - HTML de la sección "Últimos capítulos".
 * @param {string} ordenActual - Orden inicial ("asc" o "desc").
 */
function renderCapitulosConOrden(listacapitulos, clave, seccionUltimos, ordenActual = "desc") {
  const DataBook = document.querySelector('.book-card-caps');

  // Ordena los capítulos por fecha según el orden actual
  const listaOrdenada = [...listacapitulos].sort((a, b) => {
    const fechaA = parseDateDMY(a.Fecha);
    const fechaB = parseDateDMY(b.Fecha);
    return ordenActual === "asc" ? fechaA - fechaB : fechaB - fechaA;
  });

  const capitulosPorPagina = 10;
  const paginas = Math.ceil(listaOrdenada.length / capitulosPorPagina);
  let paginacionHTML = '';

  // Genera cada página con su rango de capítulos
  for (let i = 0; i < paginas; i++) {
    const pagina = listaOrdenada.slice(i * capitulosPorPagina, (i + 1) * capitulosPorPagina);
    const inicio = pagina[0]?.numCapitulo || '';
    const fin = pagina[pagina.length - 1]?.numCapitulo || '';

    const capitulosHTML = pagina.map(cap => `
      <li>
        <a href="#" data-pdf-obra="${clave}" data-pdf-capitulo="${cap.numCapitulo}" class="pdf-link">
          <span>${cap.numCapitulo} · ${cap.nombreCapitulo}</span>
          <span>(${cap.Fecha})</span>
        </a>
      </li>`).join('');

    paginacionHTML += `
      <div class="chapter-page" data-pagina="${i + 1}" style="display: ${i === 0 ? 'block' : 'none'};">
        <ul>${capitulosHTML}</ul>
      </div>
      <div class="pagination-label" data-pagina="${i + 1}" style="display: ${i === 0 ? 'block' : 'none'};">
        <span>C.${inicio} - C.${fin}</span>
      </div>
    `;
  }

  // Construye la sección completa de capítulos con controles de paginación
  const seccionPaginada = `
    <div class="book-section book-chapters-list">
      <h3>
        <i class="fa-solid fa-list-ol"></i> Todos los capítulos
        <button id="ordenar-btn" title="Ordenar por fecha">
          <i class="fa-solid ${ordenActual === "asc" ? "fa-arrow-up-wide-short" : "fa-arrow-down-wide-short"}"></i>
        </button>
      </h3>
      <div class="chapter-pagination chapter-columns">${paginacionHTML}</div>
      <div class="pagination-controls pagination">
        <button class="pagina-btn" data-pagina="1">Primero</button>
        <button class="pagina-btn-prev">Previo</button>
        ${Array.from({ length: paginas }, (_, i) => `
          <button class="pagina-btn" data-pagina="${i + 1}">${i + 1}</button>
        `).join('')}
        <button class="pagina-btn-next">Siguiente</button>
        <button class="pagina-btn" data-pagina="${paginas}">Último</button>
      </div>
    </div>
  `;

  // Crea el contenedor que agrupa ambas secciones
  const contenedor = document.createElement("div");
  contenedor.className = "book-extra-sections";
  contenedor.innerHTML = seccionUltimos + seccionPaginada;

  // Inserta el contenido en el DOM
  DataBook.appendChild(contenedor);

  // Activa los enlaces PDF y la paginación
  activarLinksPDF();
  activarPaginacion();

  // Asigna funcionalidad al botón de ordenación
  const btnOrdenar = document.getElementById("ordenar-btn");
  if (btnOrdenar) {
    btnOrdenar.addEventListener("click", () => {
      contenedor.remove(); // Elimina la sección actual
      const nuevoOrden = ordenActual === "asc" ? "desc" : "asc";
      renderCapitulosConOrden(listacapitulos, clave, seccionUltimos, nuevoOrden); // Vuelve a renderizar con el nuevo orden
    });
  }
}
