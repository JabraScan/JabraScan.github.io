/**
 * Módulo para manejar el diseño moderno de la ficha del libro
 * Permite alternar entre el diseño clásico y el moderno
 */

import { createImg } from './utils.js';
import { obtenerInfo, consultarVotos } from './contadoresGoogle.js';
import { mostrarurl } from './general.js';
import { addToBiblio } from './usuario.js';
import { activarLinksPDF } from './eventos.js';

/**
 * Renderiza la ficha del libro en diseño moderno
 * @param {Object} data - Datos de la obra
 * @param {Array} listacapitulos - Lista de capítulos
 */
export function renderModernLayout(data, listacapitulos) {
    const {
        clave,
        nombreobra,
        nombresAlternativos = [],
        imagen,
        autor,
        traduccion,
        sinopsis,
        tipoobra,
        Categoria,
        estado,
        ubicacion,
        contenido18,
        discord,
        aprobadaAutor,
        wikifan
    } = data;

    // Crear estructura moderna
    const modernContainer = document.createElement('div');
    modernContainer.className = 'modern-layout-wrapper';

    // Hero Section
    const hero = createModernHero(data, imagen, contenido18);
    modernContainer.appendChild(hero);

    // Synopsis Section
    const synopsisSection = createSynopsisSection(sinopsis);
    modernContainer.appendChild(synopsisSection);

    // Chapters Section
    const chaptersSection = createChaptersSection(listacapitulos, clave);
    modernContainer.appendChild(chaptersSection);

    return modernContainer;
}

/**
 * Crea la sección hero con la información principal
 */
function createModernHero(data, imagen, contenido18) {
    const section = document.createElement('section');
    section.className = 'modern-hero';

    const content = document.createElement('div');
    content.className = 'modern-hero-content';

    const grid = document.createElement('div');
    grid.className = 'modern-hero-grid';

    // Cover + Add to Library button
    const coverSection = createCoverSection(imagen, data.nombreobra, contenido18, data.clave);
    grid.appendChild(coverSection);

    // Info section
    const infoSection = createInfoSection(data);
    grid.appendChild(infoSection);

    content.appendChild(grid);
    section.appendChild(content);

    return section;
}

/**
 * Crea la sección de portada
 */
function createCoverSection(imagen, nombreobra, contenido18, clave) {
    const div = document.createElement('div');
    div.className = 'modern-cover';

    // Contenedor de imagen
    const wrapper = document.createElement('div');
    wrapper.className = 'modern-cover-wrapper';

    // Usar createImg para manejar correctamente las rutas y optimizaciones
    const img = createImg(imagen, nombreobra, 'libroficha');

    // Indicador +18
    if (contenido18 === 'adulto') {
        wrapper.classList.add('adulto');
        const indicador = document.createElement('div');
        indicador.className = 'indicador-adulto';
        indicador.textContent = '+18';
        wrapper.appendChild(indicador);
    }

    wrapper.appendChild(img);
    div.appendChild(wrapper);

    // Botón para leer primer capítulo 
    const btnRead = document.createElement('button');
    btnRead.className = 'modern-btn-read';
    btnRead.innerHTML = `
    <i class="fa-solid fa-book-open"></i>
    <span>Leer</span>
  `;
    btnRead.addEventListener('click', async (e) => {
        e.preventDefault();
        btnRead.classList.add('disabled');
        
        // Obtener el primer capítulo
        if (window.currentChapters && window.currentChapters.length > 0) {
            const primerCapitulo = window.currentChapters[0].numCapitulo;
            
            // Guardar en localStorage
            localStorage.setItem('ultimaObra', clave);
            localStorage.setItem('ultimoCapitulo', primerCapitulo);
            localStorage.setItem('ultimaPagina', 1);
            
            // Actualizar URL
            mostrarurl(clave, primerCapitulo);
            
            // Cargar el lector PDF
            try {
                const response = await fetch('lectorpdf.html');
                const html = await response.text();
                const main = document.querySelector('main');
                if (main) {
                    main.innerHTML = html;
                }
                
                // Cargar el módulo del lector
                const { abrirLectorPDF } = await import('./lector.js');
                abrirLectorPDF();
            } catch (err) {
                console.error('Error al cargar el lector:', err);
                btnRead.classList.remove('disabled');
            }
        } else {
            console.error('No hay capítulos disponibles');
            btnRead.classList.remove('disabled');
        }
    });

    div.appendChild(btnRead);

    // Botón añadir a biblioteca
    const btnLibrary = document.createElement('button');
    btnLibrary.className = 'modern-btn-library';
    btnLibrary.innerHTML = `
    <i class="fa-solid fa-plus"></i>
    <span>Añadir a la biblioteca</span>
  `;
    btnLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        btnLibrary.classList.add('disabled');
        setTimeout(() => btnLibrary.classList.remove('disabled'), 700);
        addToBiblio(clave);
    });

    div.appendChild(btnLibrary);

    return div;
}

/**
 * Crea la sección de información
 */
function createInfoSection(data) {
    const div = document.createElement('div');
    div.className = 'modern-info';

    // Title section
    const titleSection = document.createElement('div');
    titleSection.className = 'modern-title-section';

    const title = document.createElement('h1');
    title.className = 'modern-title';
    title.textContent = data.nombreobra;

    const subtitle = document.createElement('p');
    subtitle.className = 'modern-subtitle';
    subtitle.textContent = data.nombreobra; // O nombre alternativo si existe

    titleSection.appendChild(title);
    if (data.nombresAlternativos && data.nombresAlternativos.length > 0) {
        subtitle.textContent = data.nombresAlternativos[0];
        titleSection.appendChild(subtitle);
    }

    div.appendChild(titleSection);

    // Meta information
    const metaGrid = document.createElement('div');
    metaGrid.className = 'modern-meta-grid';

    const metaItems = [
        { label: 'Autor', value: data.autor },
        { label: 'Traducción', value: data.traduccion },
        { label: 'Tipo', value: data.tipoobra },
        { label: 'Idioma', value: data.ubicacion }
    ];

    metaItems.forEach(item => {
        const metaItem = document.createElement('div');
        metaItem.className = 'modern-meta-item';
        metaItem.innerHTML = `
      <p class="modern-meta-label">${item.label}</p>
      <p class="modern-meta-value">${item.value}</p>
    `;
        metaGrid.appendChild(metaItem);
    });

    div.appendChild(metaGrid);

    // Stats cards (calificación, visitas, estado)
    const statsDiv = createStatsSection(data.clave, data.estado);
    div.appendChild(statsDiv);

    // Genres
    if (data.Categoria) {
        const genresSection = createGenresSection(data.Categoria);
        div.appendChild(genresSection);
    }

    // Información adicional (Traducción aprobada, Discord, Wiki)
    if (data.aprobadaAutor === 'si' || data.wikifan) {
        const extraInfo = createExtraInfoSection(data);
        div.appendChild(extraInfo);
    }

    return div;
}

/**
 * Crea la sección de información adicional (Traducción aprobada, Discord, Wiki)
 */
function createExtraInfoSection(data) {
    const section = document.createElement('div');
    section.className = 'modern-extra-info';

    if (data.aprobadaAutor === 'si' && data.discord) {
        const approvedDiv = document.createElement('div');
        approvedDiv.className = 'modern-approved-translation';
        approvedDiv.innerHTML = `
            <div class="modern-badge-approved">
                <i class="fa-solid fa-circle-check"></i>
                <span>Traducción aprobada por el autor</span>
            </div>
            <div class="modern-discord-link">
                <i class="fa-brands fa-discord"></i>
                <span>Discord Oficial: <a href="${data.discord}" target="_blank" rel="noopener noreferrer">${data.discord}</a></span>
            </div>
        `;
        section.appendChild(approvedDiv);
    }

    if (data.wikifan) {
        const wikiLink = document.createElement('a');
        wikiLink.href = data.wikifan;
        wikiLink.target = '_blank';
        wikiLink.rel = 'noopener noreferrer';
        wikiLink.className = 'modern-wiki-link';
        wikiLink.innerHTML = `
            <i class="fa-solid fa-book-bookmark"></i>
            <span>Fans Wiki</span>
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
        `;
        section.appendChild(wikiLink);
    }

    return section;
}

/**
 * Crea la sección de estadísticas
 */
function createStatsSection(clave, estado) {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'modern-stats';

    // Calificación (se llenará dinámicamente)
    const ratingCard = document.createElement('div');
    ratingCard.className = 'modern-stat-card';
    ratingCard.setAttribute('data-stat', 'rating');
    ratingCard.innerHTML = `
    <div class="modern-stat-header">
      <i class="fa-solid fa-star"></i>
      <span class="modern-stat-label">Calificación</span>
    </div>
    <div class="modern-rating-display">
      <div class="modern-stars" id="modern-rating-stars-${clave}">
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
        <i class="fa-solid fa-star"></i>
      </div>
      <p class="modern-rating-text">
        <span class="modern-rating-value" id="modern-rating-value-${clave}">--</span>
        <span class="modern-rating-separator">/</span>
        <span class="modern-rating-max">5</span>
        <span class="modern-stat-votes" id="modern-rating-votes-${clave}"></span>
      </p>
    </div>
  `;

    // Visitas (se llenará dinámicamente)
    const viewsCard = document.createElement('div');
    viewsCard.className = 'modern-stat-card';
    viewsCard.setAttribute('data-stat', 'views');
    viewsCard.innerHTML = `
    <div class="modern-stat-header">
      <i class="fa-solid fa-eye"></i>
      <span class="modern-stat-label">Visitas</span>
    </div>
    <p class="modern-stat-value" id="modern-views-value-${clave}">--</p>
  `;

    // Estado
    const statusCard = document.createElement('div');
    statusCard.className = 'modern-stat-card';
    statusCard.innerHTML = `
    <div class="modern-stat-header">
      <i class="fa-solid fa-clock"></i>
      <span class="modern-stat-label">Estado</span>
    </div>
    <p class="modern-stat-value">${estado}</p>
  `;

    statsDiv.appendChild(ratingCard);
    statsDiv.appendChild(viewsCard);
    statsDiv.appendChild(statusCard);

    // Cargar estadísticas dinámicamente
    obtenerInfo(`obra_${clave}`).then(info => {
        const visitCap = info.visitas === -1 ? 0 : info.numVisitasCapitulo;
        const visitObra = info.visitas === -1 ? 1 : info.visitas + 1;
        const visitas = visitCap + visitObra;
        const viewsElement = document.getElementById(`modern-views-value-${clave}`);
        if (viewsElement) {
            viewsElement.textContent = visitas > 1000
                ? `${(visitas / 1000).toFixed(1)}k+`
                : visitas;
        }
    }).catch(err => console.error('Error al obtener visitas:', err));

    consultarVotos(clave).then(({ valoracion, votos }) => {
        const ratingElement = document.getElementById(`modern-rating-value-${clave}`);
        const votesElement = document.getElementById(`modern-rating-votes-${clave}`);
        const starsContainer = document.getElementById(`modern-rating-stars-${clave}`);
        
        if (ratingElement) {
            ratingElement.textContent = valoracion.toFixed(1);
        }
        if (votesElement) {
            votesElement.textContent = `(${votos} votos)`;
        }
        
        // Actualizar estrellas según la valoración
        if (starsContainer) {
            const stars = starsContainer.querySelectorAll('i');
            const fullStars = Math.floor(valoracion);
            const hasHalfStar = valoracion % 1 >= 0.5;
            
            stars.forEach((star, index) => {
                if (index < fullStars) {
                    star.className = 'fa-solid fa-star'; // Estrella llena
                } else if (index === fullStars && hasHalfStar) {
                    star.className = 'fa-solid fa-star-half-stroke'; // Media estrella
                } else {
                    star.className = 'fa-regular fa-star'; // Estrella vacía
                }
            });
        }
    }).catch(err => console.error('Error al obtener calificación:', err));

    return statsDiv;
}

/**
 * Crea la sección de géneros
 */
function createGenresSection(categorias) {
    const section = document.createElement('div');
    section.className = 'modern-genres-section';

    const label = document.createElement('p');
    label.className = 'modern-genres-label';
    label.textContent = 'Géneros';

    const genresDiv = document.createElement('div');
    genresDiv.className = 'modern-genres';

    const genresList = categorias.split(',').map(g => g.trim());
    genresList.forEach(genre => {
        const tag = document.createElement('span');
        tag.className = 'modern-genre-tag';
        tag.textContent = genre;
        genresDiv.appendChild(tag);
    });

    section.appendChild(label);
    section.appendChild(genresDiv);

    return section;
}

/**
 * Crea la sección de sinopsis
 */
function createSynopsisSection(sinopsis) {
    const section = document.createElement('section');
    section.className = 'modern-section';

    const content = document.createElement('div');
    content.className = 'modern-section-content';

    const title = document.createElement('h2');
    title.className = 'modern-section-title';
    title.innerHTML = `
    <i class="fa-solid fa-book-open"></i>
    Sinopsis
  `;

    const text = document.createElement('p');
    text.className = 'modern-synopsis-text';
    text.textContent = sinopsis;

    content.appendChild(title);
    content.appendChild(text);
    section.appendChild(content);

    return section;
}

/**
 * Crea la sección de capítulos
 */
function createChaptersSection(listacapitulos, clave) {
    const section = document.createElement('section');
    section.className = 'modern-section';

    const content = document.createElement('div');
    content.className = 'modern-section-content';

    const title = document.createElement('h2');
    title.className = 'modern-section-title';
    title.innerHTML = `
    <i class="fa-solid fa-clock"></i>
    Últimos Capítulos
  `;

    content.appendChild(title);

    // Mostrar últimos 5 capítulos
    const recentChapters = listacapitulos.slice(-5).reverse();
    const chaptersList = document.createElement('div');
    chaptersList.className = 'modern-chapters-list';

    recentChapters.forEach((cap, idx) => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'modern-chapter-item';
        item.setAttribute('data-pdf-obra', clave);
        item.setAttribute('data-pdf-capitulo', cap.numCapitulo);

        item.innerHTML = `
      <div class="modern-chapter-content">
        <span class="modern-chapter-number">${cap.numCapitulo}</span>
        <div class="modern-chapter-info">
          <p class="modern-chapter-title">${cap.nombreCapitulo}</p>
          <p class="modern-chapter-date">${cap.Fecha}</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right modern-chapter-arrow"></i>
    `;

        chaptersList.appendChild(item);
    });

    content.appendChild(chaptersList);

    // Botón ver todos
    const btnAll = document.createElement('button');
    btnAll.className = 'modern-btn-all-chapters';
    btnAll.textContent = 'Ver Todos los Capítulos';
    btnAll.addEventListener('click', () => {
        // Expandir para mostrar todos los capítulos en el diseño moderno
        const allChaptersSection = createAllChaptersSection(listacapitulos, clave);
        content.removeChild(chaptersList);
        content.removeChild(btnAll);
        content.appendChild(allChaptersSection);
    });

    content.appendChild(btnAll);
    section.appendChild(content);

    // Activar links PDF
    setTimeout(() => activarLinksPDF(), 100);

    return section;
}

/**
 * Crea la sección con TODOS los capítulos
 */
function createAllChaptersSection(listacapitulos, clave) {
    const container = document.createElement('div');
    container.className = 'modern-all-chapters';

    // Invertir para mostrar del más reciente al más antiguo
    const allChapters = [...listacapitulos].reverse();
    
    allChapters.forEach((cap) => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'modern-chapter-item';
        item.setAttribute('data-pdf-obra', clave);
        item.setAttribute('data-pdf-capitulo', cap.numCapitulo);

        item.innerHTML = `
      <div class="modern-chapter-content">
        <span class="modern-chapter-number">${cap.numCapitulo}</span>
        <div class="modern-chapter-info">
          <p class="modern-chapter-title">${cap.nombreCapitulo}</p>
          <p class="modern-chapter-date">${cap.Fecha}</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right modern-chapter-arrow"></i>
    `;

        container.appendChild(item);
    });

    // Activar links PDF después de crear los elementos
    setTimeout(() => activarLinksPDF(), 100);

    return container;
}

/**
 * Alterna entre diseño moderno y clásico
 */
export function toggleDesignMode() {
    const body = document.body;
    const toggleBtn = document.getElementById('design-toggle-btn');
    const isModern = body.classList.contains('modern-layout');

    console.log('Toggle diseño - Modo actual:', isModern ? 'moderno' : 'clásico');

    if (isModern) {
        // Cambiar a clásico
        body.classList.remove('modern-layout');

        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i>';
            toggleBtn.title = 'Cambiar a Diseño Moderno';
        }

        // Guardar preferencia
        localStorage.setItem('design-mode', 'classic');
        console.log('Cambiado a diseño clásico');
    } else {
        // Cambiar a moderno
        body.classList.add('modern-layout');

        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fa-solid fa-list"></i>';
            toggleBtn.title = 'Cambiar a Diseño Clásico';
        }

        // Renderizar diseño moderno si no existe
        console.log('Renderizando diseño moderno...');
        renderModernLayoutIfNeeded();

        // Guardar preferencia
        localStorage.setItem('design-mode', 'modern');
        console.log('Cambiado a diseño moderno');
    }
}

/**
 * Renderiza el diseño moderno si es necesario
 */
function renderModernLayoutIfNeeded() {
    console.log('renderModernLayoutIfNeeded - Iniciando...');

    // Verificar si ya existe
    const existing = document.querySelector('.modern-layout-wrapper');
    if (existing) {
        console.log('El diseño moderno ya existe');
        return; // Ya existe
    }

    // Verificar que hay datos disponibles
    if (!window.currentBookData) {
        console.warn('No hay currentBookData disponible');
        return;
    }

    if (!window.currentChapters) {
        console.warn('No hay currentChapters disponible');
        return;
    }

    console.log('Datos disponibles:', {
        bookData: window.currentBookData,
        chapters: window.currentChapters.length
    });

    const bookCard = document.querySelector('.book-card-caps');
    if (!bookCard) {
        console.error('No se encontró .book-card-caps');
        return;
    }

    console.log('Renderizando diseño moderno con datos...');
    // Crear y agregar el diseño moderno
    const modernWrapper = renderModernLayout(window.currentBookData, window.currentChapters);
    bookCard.appendChild(modernWrapper);
    console.log('Diseño moderno agregado al DOM');
}

/**
 * Inicializa el botón de alternancia
 */
export function initDesignToggle() {
    // Evitar duplicados
    if (document.getElementById('design-toggle-btn')) {
        console.log('Botón de alternancia ya existe');
        return;
    }

    console.log('Inicializando botón de alternancia de diseño');

    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'design-toggle-btn';
    toggleBtn.className = 'design-toggle';
    toggleBtn.title = 'Cambiar a Diseño Moderno';
    toggleBtn.innerHTML = '<i class="fa-solid fa-sparkles"></i>';

    toggleBtn.addEventListener('click', toggleDesignMode);

    document.body.appendChild(toggleBtn);
    console.log('Botón de alternancia agregado');

    // Restaurar preferencia guardada
    const savedMode = localStorage.getItem('design-mode');
    console.log('Modo guardado:', savedMode);
    if (savedMode === 'modern') {
        // Aplicar después de que se cargue todo el contenido
        setTimeout(() => {
            console.log('Aplicando diseño moderno guardado');
            toggleDesignMode();
        }, 100);
    }
}
