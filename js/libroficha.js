import { obtenerCapitulos } from './capitulos.js';
import { parseDateDMY, parseChapterNumber, compareCapNumDesc } from './utils.js';
import { activarLinksPDF, activarPaginacion } from './eventos.js';

/**
 * Carga los datos de una obra y renderiza sus capítulos.
 * @param {string} libroId - Clave identificadora de la obra.
 */
export function cargarlibro(libroId) {
  if (!libroId) {
    document.body.innerHTML = '<p>No se encontró el libro seleccionado.</p>';
    return;
  }

  fetch('obras.xml')
    .then(response => response.text())
    .then(str => new DOMParser().parseFromString(str, "text/xml"))
    .then(data => {
      const obra = Array.from(data.getElementsByTagName('obra'))
        .find(o => o.querySelector('clave')?.textContent.trim() === libroId);

      if (!obra) {
        document.body.innerHTML = '<p>Obra no encontrada.</p>';
        return;
      }

      // 📦 Extrae los datos principales de la obra
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

      const OKAutor = aprobadaAutor === 'si' ? `
        <span class="carousel-info-label">Traducción aprobada por el autor</span><br>
        <span>Discord Oficial : <a href="${discord}" target="_blank">${discord}</a></span>
      ` : '';

      // 🖼️ Imagen y marca +18 si aplica
      const imagenContenedor = document.createElement("div");
      imagenContenedor.classList.add("imagen-contenedor");
      const img = document.createElement("img");
      img.src = "../img/" + imagen;
      img.alt = nombreobra;
      imagenContenedor.appendChild(img);

      if (contenido18 === "adulto") {
        imagenContenedor.classList.add("adulto");
        const indicador = document.createElement("div");
        indicador.classList.add("indicador-adulto");
        indicador.textContent = "+18";
        imagenContenedor.appendChild(indicador);
      }

      // 🧾 Construye la cabecera e información principal
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

      DataBook.prepend(mainDataBook);
      DataBook.prepend(headerDataBook);
      mainDataBook.querySelector(".book-image").prepend(imagenContenedor);

      if (typeof mostrarDisqus === "function") {
        mostrarDisqus(clave, clave);
      }

      // 📚 Carga los capítulos y renderiza secciones
      obtenerCapitulos(clave).then(listacapitulos => {
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

        // 🧩 Renderiza todos los capítulos con orden ascendente por defecto
        renderCapitulosConOrden(listacapitulos, clave, seccionUltimos, "asc");
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
function renderCapitulosConOrden(listacapitulos, clave, seccionUltimos, ordenActual = "asc") {
  const DataBook = document.querySelector('.book-card-caps');

  // 🔄 Ordena los capítulos por fecha
  const listaOrdenada = [...listacapitulos].sort((a, b) => {
    const fechaA = parseDateDMY(a.Fecha);
    const fechaB = parseDateDMY(b.Fecha);
    return ordenActual === "asc" ? fechaA - fechaB : fechaB - fechaA;
  });

  const capitulosPorPagina = 10;
  const paginas = Math.ceil(listaOrdenada.length / capitulosPorPagina);
  let paginacionHTML = '';
  let botonesHTML = '';

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

    botonesHTML += `<button class="pagination-btn" data-pagina="${i + 1}">${i + 1}</button>`;
  }

  // 🔘 Botón de orden con clase personalizada
  const ordenBtnHTML = `
    <button id="ordenar-btn" class="order-toggle">
      Ordenar por fecha: ${ordenActual === "asc" ? "Ascendente ↑" : "Descendente ↓"}
    </button>
  `;

  const seccionTodos = `
    <div class="book-section book-chapters-list">
      <h3><i class="fa-solid fa-list-ol"></i> Todos los capítulos</h3>
      ${ordenBtnHTML}
      <div class="pagination-controls">${botonesHTML}</div>
      ${paginacionHTML}
    </div>
  `;

  // 🧩 Inserta ambas secciones en el DOM
  DataBook.insertAdjacentHTML("beforeend", seccionUltimos);
  DataBook.insertAdjacentHTML("beforeend", seccionTodos);

  // 🧠 Activa eventos
  activarLinksPDF();
  activarPaginacion();

  // 🔁 Evento para alternar orden
  const ordenarBtn = document.getElementById("ordenar-btn");
  ordenarBtn.addEventListener("click", () => {
    const nuevoOrden = ordenActual === "asc" ? "desc" : "asc";
    document.querySelector('.book-chapters-list').remove();
    renderCapitulosConOrden(listacapitulos, clave, "", nuevoOrden);
  });
}
