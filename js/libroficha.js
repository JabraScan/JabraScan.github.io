function renderCapitulosConOrden(listacapitulos, clave, seccionUltimos, ordenActual = "asc") {
  const DataBook = document.querySelector('.book-card-caps');

  const listaOrdenada = [...listacapitulos].sort((a, b) => {
    const fechaA = parseDateDMY(a.Fecha);
    const fechaB = parseDateDMY(b.Fecha);
    return ordenActual === "asc" ? fechaA - fechaB : fechaB - fechaA;
  });

  const capitulosPorPagina = 10;
  const paginas = Math.ceil(listaOrdenada.length / capitulosPorPagina);
  let contenidoPaginas = '';
  let rangos = [];

  for (let i = 0; i < paginas; i++) {
    const pagina = listaOrdenada.slice(i * capitulosPorPagina, (i + 1) * capitulosPorPagina);
    const inicio = pagina[0]?.numCapitulo.padStart(4, '0') || '';
    const fin = pagina[pagina.length - 1]?.numCapitulo.padStart(4, '0') || '';
    rangos.push(`C.${inicio} - C.${fin}`);

    const capitulosHTML = pagina.map(cap => `
      <li>
        <a href="#" data-pdf-obra="${clave}" data-pdf-capitulo="${cap.numCapitulo}" class="pdf-link">
          <span>${cap.numCapitulo} · ${cap.nombreCapitulo}</span>
          <span>(${cap.Fecha})</span>
        </a>
      </li>`).join('');

    contenidoPaginas += `
      <div class="chapter-page" data-pagina="${i + 1}" style="display: ${i === 0 ? 'block' : 'none'};">
        <ul>${capitulosHTML}</ul>
      </div>
    `;
  }

  // 🔘 Botón de ordenación con icono alineado a la derecha
  const headerHTML = `
    <div class="chapter-header" style="display: flex; justify-content: space-between; align-items: center;">
      <h3><i class="fa-solid fa-list-ol"></i> Todos los capítulos</h3>
      <button id="ordenar-btn" class="order-toggle" title="Cambiar orden">
        <i class="fa-solid fa-arrow-up-wide-short"></i>
      </button>
    </div>
  `;

  // 🧭 Paginación con rango entre Prev y Next
  const rangoActual = rangos[0]; // se actualiza dinámicamente en activarPaginacion
  const paginacionHTML = `
    <div class="pagination-controls">
      <button class="pagina-btn" data-pagina="1">Primero</button>
      <button class="pagina-btn" data-prev="true">Previo</button>
      <span class="pagination-range">${rangoActual}</span>
      <button class="pagina-btn" data-next="true">Siguiente</button>
      <button class="pagina-btn" data-pagina="${paginas}">Último</button>
    </div>
  `;

  const seccionTodos = `
    <div class="book-section book-chapters-list">
      ${headerHTML}
      ${contenidoPaginas}
      ${paginacionHTML}
    </div>
  `;

  DataBook.insertAdjacentHTML("beforeend", seccionUltimos);
  DataBook.insertAdjacentHTML("beforeend", seccionTodos);

  activarLinksPDF();
  activarPaginacion(rangos);

  document.getElementById("ordenar-btn").addEventListener("click", () => {
    document.querySelector('.book-chapters-list').remove();
    const nuevoOrden = ordenActual === "asc" ? "desc" : "asc";
    renderCapitulosConOrden(listacapitulos, clave, "", nuevoOrden);
  });
}
function renderCapitulosConOrden(listacapitulos, clave, seccionUltimos, ordenActual = "asc") {
  const DataBook = document.querySelector('.book-card-caps');

  const listaOrdenada = [...listacapitulos].sort((a, b) => {
    const fechaA = parseDateDMY(a.Fecha);
    const fechaB = parseDateDMY(b.Fecha);
    return ordenActual === "asc" ? fechaA - fechaB : fechaB - fechaA;
  });

  const capitulosPorPagina = 10;
  const paginas = Math.ceil(listaOrdenada.length / capitulosPorPagina);
  let contenidoPaginas = '';
  let rangos = [];

  for (let i = 0; i < paginas; i++) {
    const pagina = listaOrdenada.slice(i * capitulosPorPagina, (i + 1) * capitulosPorPagina);
    const inicio = pagina[0]?.numCapitulo.padStart(4, '0') || '';
    const fin = pagina[pagina.length - 1]?.numCapitulo.padStart(4, '0') || '';
    rangos.push(`C.${inicio} - C.${fin}`);

    const capitulosHTML = pagina.map(cap => `
      <li>
        <a href="#" data-pdf-obra="${clave}" data-pdf-capitulo="${cap.numCapitulo}" class="pdf-link">
          <span>${cap.numCapitulo} · ${cap.nombreCapitulo}</span>
          <span>(${cap.Fecha})</span>
        </a>
      </li>`).join('');

    contenidoPaginas += `
      <div class="chapter-page" data-pagina="${i + 1}" style="display: ${i === 0 ? 'block' : 'none'};">
        <ul>${capitulosHTML}</ul>
      </div>
    `;
  }

  // 🔘 Botón de ordenación con icono alineado a la derecha
  const headerHTML = `
    <div class="chapter-header" style="display: flex; justify-content: space-between; align-items: center;">
      <h3><i class="fa-solid fa-list-ol"></i> Todos los capítulos</h3>
      <button id="ordenar-btn" class="order-toggle" title="Cambiar orden">
        <i class="fa-solid fa-arrow-up-wide-short"></i>
      </button>
    </div>
  `;

  // 🧭 Paginación con rango entre Prev y Next
  const rangoActual = rangos[0]; // se actualiza dinámicamente en activarPaginacion
  const paginacionHTML = `
    <div class="pagination-controls">
      <button class="pagina-btn" data-pagina="1">Primero</button>
      <button class="pagina-btn" data-prev="true">Previo</button>
      <span class="pagination-range">${rangoActual}</span>
      <button class="pagina-btn" data-next="true">Siguiente</button>
      <button class="pagina-btn" data-pagina="${paginas}">Último</button>
    </div>
  `;

  const seccionTodos = `
    <div class="book-section book-chapters-list">
      ${headerHTML}
      ${contenidoPaginas}
      ${paginacionHTML}
    </div>
  `;

  DataBook.insertAdjacentHTML("beforeend", seccionUltimos);
  DataBook.insertAdjacentHTML("beforeend", seccionTodos);

  activarLinksPDF();
  activarPaginacion(rangos);

  document.getElementById("ordenar-btn").addEventListener("click", () => {
    document.querySelector('.book-chapters-list').remove();
    const nuevoOrden = ordenActual === "asc" ? "desc" : "asc";
    renderCapitulosConOrden(listacapitulos, clave, "", nuevoOrden);
  });
}
