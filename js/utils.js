import { incrementarVisita, leerVisitas, obtenerInfo, valorarRecurso } from './contadoresGoogle.js';

// transformar "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS" -> "DD-MM-YYYY"
export function toDDMMYYYY(fechaStr) {
  if (!fechaStr) return "";
  const m = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return fechaStr; // si ya está en otro formato, lo dejamos
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export function parseDateDMY(fechaStr) {
  if (!fechaStr) return null;

  const parts = String(fechaStr).split("-");
  if (parts.length !== 3) return null;

  let [d, m, y] = parts.map(p => p.trim());
  d = d.padStart(2, "0");
  m = m.padStart(2, "0");

  if (!/^\d{2}$/.test(d) || !/^\d{2}$/.test(m) || !/^\d{4}$/.test(y)) return null;

  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (
    date.getFullYear() !== Number(y) ||
    date.getMonth() !== Number(m) - 1 ||
    date.getDate() !== Number(d)
  ) {
    return null;
  }

  return date;
}

export function parseChapterNumber(numeroCapitulo) {
  return numeroCapitulo != null ? String(numeroCapitulo).trim() : "";
}

export function compareCapNumDesc(a, b) {
  const sa = String(a.capNum ?? "").trim();
  const sb = String(b.capNum ?? "").trim();

  if (sa === "" && sb === "") return 0;
  if (sa === "") return 1;
  if (sb === "") return -1;

  const r = sb.localeCompare(sa, undefined, { numeric: true, sensitivity: "base" });
  if (r !== 0) return r;

  const na = Number(sa);
  const nb = Number(sb);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && nb !== na) return nb - na;

  return 0;
}

// utils.js
export function parseFecha(fechaStr) {
  if (!fechaStr || !/^\d{2}-\d{2}-\d{4}$/.test(fechaStr)) return null;
  const [dia, mes, año] = fechaStr.split('-').map(Number);
  const fecha = new Date(año, mes - 1, dia);
  if (
    fecha.getFullYear() !== año ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }
  return fecha;
}

export function generarEtiquetaNuevo(fechaInput) {
  const hoy = new Date();
  const fecha = new Date(fechaInput);
  hoy.setHours(0, 0, 0, 0);
  fecha.setHours(0, 0, 0, 0);
  const diferenciaDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
  if (diferenciaDias === 0) {
    return `<span class="tag-capitulo hoy">hoy</span>`;
  } else if (diferenciaDias > 0 && diferenciaDias <= 7) {
    return `<span class="tag-capitulo nuevo">nuevo</span>`;
  } else {
    return '';
  }
}
/**
 * 📦 crearBloqueValoracion(clave, valoracionPromedio, votos)
 * Genera dinámicamente un bloque HTML para mostrar la valoración de un recurso
 * y permitir al usuario votar si no lo ha hecho antes.
 *
 * Firma:
 *   crearBloqueValoracion(clave, valoracionPromedio = 0, votos = 0, opciones = {})
 *
 * Parámetros:
 *   - clave (string)               : identificador único del recurso (clave usada en localStorage y en la llamada a valorarRecurso) (sin el prefijo "obra_").
 *   - valoracionPromedio (number)  : promedio actual de valoración. Se muestra y se usa para pintar estrellas.
 *   - votos (number)               : número de votos registradps.
 *   - soloEstrellas (boolean)      : si true, la función devuelve un bloque que solo contiene las estrellas.
 *
 * Comportamiento principal:
 *   - Lee localStorage("user_id") para saber si hay usuario logueado.
 *   - Lee localStorage(clave) para saber si el usuario ya ha votado ese recurso.
 *   - Calcula puedeVotar = (usuario logueado) && (no ha votado).
 *   - Crea las estrellas delegando en crearEstrellas(clave, valoracionPromedio, puedeVotar).
 *     crearEstrellas asume que el permiso viene del llamador y NO vuelve a comprobar user_id ni localStorage.
 *   - Si opciones.soloEstrellas === true devuelve un bloque con solo las estrellas.
 *   - Si no, añade el texto de promedio/votos y el texto de interacción del usuario:
 *       - "Inicia sesión para valorar" si no hay usuario.
 *       - "¡Gracias por tu voto!" si ya votó.
 *       - "¿Tu valoración?" si puede votar.
 *
 * Return:
 *   - HTMLElement DIV con class "book-rating" que contiene los elementos descritos.
 */
      // repinta las estrellas según el voto del usuario (1..5)
      export function actualizarEstrellas(estrellasEl, voto) {
        const nodos = estrellasEl.querySelectorAll('i');
        nodos.forEach((nodo, idx) => {
          const posicion = idx + 1;
          nodo.style.color = posicion <= voto ? 'orange' : 'lightgray';
          nodo.setAttribute('aria-pressed', posicion <= voto ? 'true' : 'false');
        });
      }
      /**
       * crearEstrellas
       *
       * @param {string} clave
       * @param {number} valoracion
       * @param {boolean} puedeVotar        // si true se añaden listeners
       * @param {boolean} actualizarVoto    // si true tras cada OK se repintan las estrellas y se permite votar de nuevo
       */
      export function crearEstrellas(clave, valoracion, puedeVotar = false, actualizarVoto = false) {
        const claveLocal = clave;
        const estrellas = document.createElement("div");
        estrellas.className = "stars";
        const puntuacionEntera = Math.round(valoracion);
      
        for (let i = 1; i <= 5; i++) {
          const estrella = document.createElement("i");
          estrella.className = "fa-solid fa-star";
          estrella.style.color = i <= puntuacionEntera ? "orange" : "lightgray";
          estrella.style.cursor = puedeVotar ? "pointer" : "default";
      
          if (puedeVotar) {
            estrella.addEventListener("click", () => {
              // crear placeholder y ocultar solo este widget
              const placeholder = document.createElement('div');
              placeholder.className = 'voting-placeholder';
              placeholder.textContent = 'Registrando voto...';
      
              // ocultar solo este widget usando display (no hace falta bloquear)
              estrellas.style.display = 'none';
              estrellas.parentNode.insertBefore(placeholder, estrellas);
      
              // valoracion
              valorarRecurso(clave, i)
                .then(res => {
                  // quitar placeholder siempre
                  placeholder.remove();
      
                  if (res && /\bOK\b/.test(res)) {
                    if (actualizarVoto) {
                      // Repintamos las estrellas con el voto del usuario
                      actualizarEstrellas(estrellas, i);
                      // Mantenemos los listeners activos para permitir votar de nuevo
                    } else {
                      //localStorage.setItem(claveLocal, i);
                      // Comportamiento clásico: bloquear futuros clicks
                      // ejemplo simple: deshabilitar puntero para todos los íconos
                      estrellas.querySelectorAll('i').forEach(n => n.style.pointerEvents = 'none');
                    }
      
                    // mostrar el widget actualizado o bloqueado
                    estrellas.style.display = '';
                  } else {
                    // Manejo de errores
                    // fallo: mostrar mensaje breve y volver a mostrar el widget sin cambios
                    const err = document.createElement('div');
                    err.className = 'voting-error';
                    err.textContent = 'No se pudo registrar el voto';
                    estrellas.parentNode.insertBefore(err, estrellas.nextSibling);
                    setTimeout(() => err.remove(), 3000);
                    estrellas.style.display = '';
                  }
                })
                .catch(() => {
                  // error de red: limpiar y restaurar
                  placeholder.remove();
                  const err = document.createElement('div');
                  err.className = 'voting-error';
                  err.textContent = 'No se pudo registrar el voto';
                  estrellas.parentNode.insertBefore(err, estrellas.nextSibling);
                  setTimeout(() => err.remove(), 3000);
                  estrellas.style.display = '';
                });
            });
          }
          estrellas.appendChild(estrella);
        }
        return estrellas;
      }
      /**
       * crearBloqueValoracion
       * Crea y devuelve un bloque DOM que representa la valoración de un recurso.
       **/
        export function crearBloqueValoracion(clave, valoracionPromedio = 0, votos = 0, opciones = {} ) {
          //leer opciones, si las hay, y asignar valores, por defecto false
          const { soloEstrellas = false, actualizarVoto = false } = opciones || {};
          // Contenedor principal
          const bloque = document.createElement("div");
          bloque.className = "book-rating";
        
          // Comprobación de login (misma lógica que antes)
          const usuarioId = localStorage.getItem("user_id");
          const estaLogueado = usuarioId && usuarioId !== "null";
        
          // Comprobación de voto previo (misma lógica que antes)
          const claveLocal = clave;
          const yaVotado = localStorage.getItem(claveLocal);
        
          // Decisión centralizada sobre si se permite votar
          const puedeVotar = estaLogueado && !yaVotado;
        
          // Delegamos la creación de las estrellas; PASAMOS el flag calculado para evitar duplicar comprobaciones
          const estrellas = crearEstrellas(clave, valoracionPromedio, puedeVotar, actualizarVoto );
        
          // Si el llamador solo quiere las estrellas, devolvemos ese bloque mínimo
          if (soloEstrellas === true) {
            bloque.appendChild(estrellas);
            return bloque;
          } else {
            // Texto con promedio y número de votos (formato original)
            const textoValoracion = document.createElement("div");
              textoValoracion.className = "rating-text";
              textoValoracion.textContent = `${valoracionPromedio.toFixed(1)} / 5 (${votos} votos)`;
        
          // Texto de interacción/estado para el usuario (mismos mensajes que antes)
            const tuValoracion = document.createElement("div");
              tuValoracion.className = "your-rating";
          
            function mensajeEstado(estaLogueado, yaVotado) {
              if (!estaLogueado) return "Inicia sesión para valorar";
              if (yaVotado) return "¡Gracias por tu voto!";
              return "¿Tu valoración?";
            }
            tuValoracion.textContent = mensajeEstado(estaLogueado, yaVotado);
            // Ensamblado final del bloque
              bloque.appendChild(estrellas);
              bloque.appendChild(textoValoracion);
              bloque.appendChild(tuValoracion);
            return bloque;
          }
        }

export function truncarTexto(texto, maxLength = 40) {
  return texto.length > maxLength ? texto.slice(0, maxLength) + "…" : texto;
}
// seleccionarImagen: normaliza NodeList, Array o string y devuelve la imagen que toca hoy
export function seleccionarImagen(nodosImagen) {
  // Normalización de la entrada:
  // - Soporta NodeList/HTMLCollection (XML original)
  // - Soporta Array de strings (endpoint JSON)
  // - Soporta un string simple
  // - Si es null/undefined devuelve cadena vacía
  if (!nodosImagen) return "";

  // Construimos 'lista' como array de objetos con textContent para mantener tu lógica original
  let lista;

  // Si nos pasan directamente un string único, convertirlo a lista con un objeto que tenga textContent
  if (typeof nodosImagen === "string") {
    lista = [{ textContent: nodosImagen.trim() }];
  } else if (Array.isArray(nodosImagen)) {
    // Si nos pasan un array (endpoint JSON): mapear a objetos con textContent
    lista = nodosImagen.map(item => {
      if (typeof item === "string") return { textContent: item.trim() };
      if (item && typeof item.textContent === "string") return { textContent: item.textContent.trim() };
      return { textContent: "" };
    });
  } else {
    // Asumimos NodeList / HTMLCollection u objeto similar (tu caso original)
    lista = Array.from(nodosImagen).map(node => {
      if (!node) return { textContent: "" };
      if (typeof node === "string") return { textContent: node.trim() };
      return { textContent: (node.textContent || "").trim() };
    });
  }

  // Filtrar vacíos y mantener orden (evita que elementos vacíos cambien totalImagenes)
  lista = lista.filter(item => (item.textContent || "").length > 0);

  const totalImagenes = lista.length;

  // 🚫 Sin imágenes → vacío
  if (totalImagenes === 0) return "";

  // ⚡ Solo 1 imagen → siempre la misma
  if (totalImagenes === 1) return (lista[0].textContent || "").trim();

  // 📅 Fecha actual
  const hoy = new Date();
  const año = hoy.getFullYear();

  // 🔍 Comprobamos si el año es bisiesto
  const esBisiesto = (año % 4 === 0 && año % 100 !== 0) || (año % 400 === 0);
  const diasEnAño = esBisiesto ? 366 : 365;

  // 📅 Día del año (0–364 o 0–365 si bisiesto)
  const inicio = new Date(año, 0, 0);
  const diff = hoy - inicio;
  const diaDelAño = Math.floor(diff / (1000 * 60 * 60 * 24));

  // 🔢 Cuántos días dura cada imagen
  const diasPorImagen = diasEnAño / totalImagenes;

  // 🎯 Índice de la imagen
  let indice = Math.floor(diaDelAño / diasPorImagen);

  // ✅ Seguridad: no pasarse del array
  if (indice >= totalImagenes) indice = totalImagenes - 1;
  if (indice < 0) indice = 0;

  // Devolver el texto limpiado del nodo seleccionado
  return (lista[indice].textContent || "").trim();
}


// Crea y devuelve un elemento <img> configurado para la obra (imagen es string)
  export function createImg(imagen, nombreobra, tipo) {
    // Crear el elemento imagen
    const img = document.createElement("img");  
    // Extraer la ruta base sin extensión (.jpg .jpeg .png .webp)
    const imagenPath = (Array.isArray(imagen) ? (imagen[0] || '') : imagen).replace(/\.(jpg|jpeg|png|webp)$/i, '');
    // Src principal con cache-busting; sirve como fallback si no hay versiones optimizadas
    const version = '?v=20251131';
    img.src = `img/${Array.isArray(imagen) ? (imagen[0] || '') : imagen}${version}`;
    // Texto alternativo accesible
    img.alt = nombreobra;  
    // Carga perezosa por defecto para evitar bloquear el render inicial
    img.loading = "lazy";  
    // Si no es main, solo aplicar el cambio de dimensiones que pediste (600x750)
    if (tipo !== 'main') {
      img.width = 600; // ancho intrínseco solicitado
      img.height = 750; // alto intrínseco solicitado
    } else {
      // Dimensiones intrínsecas iniciales para evitar CLS (se ajustan según tipo más abajo)
      img.width = 280;
      img.height = 280;
    }
    // Decodificación asíncrona para evitar bloquear el hilo de render
    img.decoding = "async";  
    // Si la ruta incluye carpeta, asumimos que hay versiones webp optimizadas
    if (imagen.includes('/')) {
      const webpPath = imagenPath;
      // srcset con varias anchuras en webp; el navegador elegirá la mejor y usará src como fallback
      img.srcset = `img/${webpPath}-300w.webp${version} 300w, img/${webpPath}-600w.webp${version} 600w, img/${webpPath}-900w.webp${version} 900w`;
      // Ajuste de sizes según device pixel ratio para evitar descargar imágenes sobredimensionadas
      const dpr = window.devicePixelRatio || 1;
      if (dpr > 2) {
        // En pantallas de alta densidad reducimos el ancho efectivo solicitado
        img.sizes = "(max-width: 576px) 50vw, (max-width: 768px) 33vw, (max-width: 992px) 25vw, 20vw";
      } else {
        // Comportamiento por defecto para densidades normales
        img.sizes = "(max-width: 576px) 100vw, (max-width: 768px) 50vw, (max-width: 992px) 33vw, (max-width: 1200px) 25vw, 20vw";
      }
    }
    // Manejo de error en carga: quitar srcset y reintentar con el src sin query; si falla, ocultar
    img.onerror = function () {
      this.removeAttribute('srcset');
      this.src = `img/${imagen}`;
      this.onerror = function () { this.onerror = null; this.style.display = 'none'; };
    };  
    return img;
  }
/**
 * 📚 Función para obtener los nombres de obra
 * Recibe directamente la lista de nodos <nombreobra>
 * Devuelve:
 *   - nombreobra: 🏷️ el primer nombre (el que se muestra)
 *   - nombresAlternativos: 📂 el resto de nombres (para ocultar en HTML)
 */
export function obtenerNombreObra(nodosNombreObra) {
  // 🔎 convertir NodeList en array y limpiar
  const nombresObra = Array.from(nodosNombreObra)
    .map(n => n.textContent.trim())   // ✂️ limpiar espacios
    .filter(Boolean);                 // ✅ filtrar vacíos

  // 🏷️ el primero es el que se muestra
  const nombreobra = nombresObra[0] || "";

  // 📂 el resto son los alternativos
  const nombresAlternativos = nombresObra.slice(1);

  // 📦 devolver ambos parámetros
  return { nombreobra, nombresAlternativos };
}
/**
 * Devuelve true si hay token en localStorage.
 * @param {string} [tokenKey='jwt']
 * @returns {boolean}
 */
function isLoggedIn(tokenKey = 'jwt') {
  return !!localStorage.getItem(tokenKey);
}
/**
 * managerTabs
 *
 * Crea y gestiona una estructura de pestañas dentro del contenedor indicado.
 *
 * - Inserta (si no existen) los elementos necesarios .nav.nav-tabs y .tab-content dentro del contenedor.
 * - Por cada entrada en `tabs` crea un nav item (<li> + <a>) y su pane asociado (<div class="tab-pane">).
 * - Evita duplicados en el DOM al añadir pestañas con el mismo id.
 * - Proporciona métodos para obtener la lista de pestañas, activar una pestaña, añadir y eliminar pestañas.
 *
 * Parámetros:
 * - containerSelector {string} Selector CSS del contenedor donde montar la estructura.
 * - tabs {Array<Object>} Array de definiciones de pestañas. Cada objeto puede contener:
 *     - id {string}
 *     - title {string}
 *     - render {function(): HTMLElement|string|null|undefined}
 * - options {Object} Opciones:
 *     - activeId {string}
 *
 * Devuelve:
 *   - { getTabs, setActive, addTab, removeTab }
 *
 * Uso de la API (ejemplos)
 *     manager.getTabs();
 *     manager.setActive('obras');
 *     manager.addTab({ id: 'otra', title: 'Otra', render: () => '<p>Contenido</p>' });
 *     manager.removeTab('avatar');
 */
  export function managerTabs(containerSelector, tabs = [], options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) throw new Error(`Contenedor no encontrado: ${containerSelector}`);
  
    // Buscar o crear nav y tab-content
    let nav = container.querySelector(".nav.nav-tabs");
    if (!nav) {
      nav = document.createElement("ul");
      nav.className = "nav nav-tabs";
      nav.setAttribute("role", "tablist");
      container.appendChild(nav);
    }
  
    let content = container.querySelector(".tab-content");
    if (!content) {
      content = document.createElement("div");
      content.className = "tab-content";
      container.appendChild(content);
    }
  
    const state = {
      tabs: [...tabs],
      activeId: options.activeId || (tabs[0] && tabs[0].id) || null
    };
  
    /**
     * createNavItem
     *
     * Crea el <li> y el <a> para la pestaña.
     * - No añade listeners de click.
     *
     * Devuelve:
     * - { li: HTMLLIElement, a: HTMLAnchorElement }
     */
      function createNavItem(tab, isActive) {
        const paneId = `tab-pane-${tab.id}`;
        const linkId = `tab-link-${tab.id}`;
    
        const li = document.createElement("li");
        li.className = "nav-item";
        li.setAttribute("role", "presentation");
    
        const a = document.createElement("a");
        a.className = "nav-link";
        a.setAttribute("data-bs-toggle", "tab");
        a.setAttribute("role", "tab");
        a.setAttribute("aria-controls", paneId);
        a.href = `#${paneId}`;
        a.dataset.tabId = tab.id;
        a.id = linkId;
        a.textContent = tab.title || tab.id;
        if (isActive) a.classList.add("active");
    
        li.appendChild(a);
        return { li, a };
      }
  
    /**
     * createPane
     *
     * Crea el pane asociado a la pestaña.
     * - Añade contenido solo si tab.render es función y devuelve HTMLElement o string.
     *
     * Devuelve:
     * - HTMLDivElement
     */
      function createPane(tab, isActive) {
        const paneId = `tab-pane-${tab.id}`;
        const pane = document.createElement("div");
        pane.className = "tab-pane fade";
        pane.id = paneId;
        pane.setAttribute("role", "tabpanel");
        pane.setAttribute("aria-labelledby", `tab-link-${tab.id}`);
        if (isActive) pane.classList.add("show", "active");
    
        if (typeof tab.render === "function") {
          const result = tab.render();
          if (result instanceof HTMLElement) {
            pane.appendChild(result);
          } else if (result != null) {
            pane.innerHTML = String(result);
          }
        }
    
        return pane;
      }
  
    /**
     * renderAll
     *
     * Renderiza todas las pestañas y panes a partir de state.tabs.
     */
      function renderAll() {
        nav.innerHTML = "";
        content.innerHTML = "";
        state.tabs.forEach((tab, index) => {
          const isActive = tab.id === state.activeId || (state.activeId == null && index === 0);
          const { li } = createNavItem(tab, isActive);
          nav.appendChild(li);
          const pane = createPane(tab, isActive);
          content.appendChild(pane);
        });
        if (!state.activeId && state.tabs[0]) state.activeId = state.tabs[0].id;
      }
  
    /**
     * setActive
     *
     * Activa la pestaña con id dado.
     * - Si la API de Bootstrap está disponible usa bootstrap.Tab(link).show(); si no, aplica clases como fallback.
     */
      function setActive(id) {
        state.activeId = id;
    
        const link = nav.querySelector(`.nav-link[data-tab-id="${id}"]`);
        if (typeof window.bootstrap === "object" && typeof window.bootstrap.Tab === "function" && link) {
          try {
            const tabInstance = new window.bootstrap.Tab(link);
            tabInstance.show();
            return;
          } catch (e) {
            // fallback a manipulación de clases si la API falla
          }
        }
    
        nav.querySelectorAll(".nav-link").forEach(n => n.classList.remove("active"));
        content.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("show", "active"));
        if (link) link.classList.add("active");
        const pane = content.querySelector(`#tab-pane-${id}`);
        if (pane) pane.classList.add("show", "active");
      }
  
    /**
     * addTab
     *
     * Añade una nueva pestaña y su pane asociado.
     * - No crea duplicados en el DOM.
     */
      function addTab(tabDef) {
        if (!tabDef || !tabDef.id) throw new Error("tabDef.id required");
    
        if (nav.querySelector(`.nav-link[data-tab-id="${tabDef.id}"]`) || content.querySelector(`#tab-pane-${tabDef.id}`)) {
          if (!state.tabs.find(t => t.id === tabDef.id)) state.tabs.push(tabDef);
          return;
        }
    
        state.tabs.push(tabDef);
    
        let isActive = false;
        if (!state.activeId) {
          state.activeId = tabDef.id;
          isActive = true;
        }
    
        const { li } = createNavItem(tabDef, isActive);
        nav.appendChild(li);
        const pane = createPane(tabDef, isActive);
        content.appendChild(pane);
    
        if (isActive) {
          setActive(tabDef.id);
        }
      }
  
    /**
     * removeTab
     *
     * Elimina la pestaña y su pane asociado.
     * - Si la pestaña eliminada estaba activa, activa la primera pestaña restante (si existe).
     */
      function removeTab(id) {
        const idx = state.tabs.findIndex(t => t.id === id);
        if (idx === -1) return;
        state.tabs.splice(idx, 1);
    
        const link = nav.querySelector(`.nav-link[data-tab-id="${id}"]`);
        if (link && link.parentElement) link.parentElement.remove();
        const pane = content.querySelector(`#tab-pane-${id}`);
        if (pane) pane.remove();
    
        if (state.activeId === id) {
          state.activeId = state.tabs[0] && state.tabs[0].id;
          if (state.activeId) setActive(state.activeId);
        }
      }
  
    // Render inicial
    renderAll();
  
    // API pública
    return {
      getTabs: () => state.tabs.map(t => t.id),
      setActive,
      addTab,
      removeTab
    };
  }
/**
 * imgSrcFromBlob(img, path, fallback)
 *
 * Asigna `img.src` a partir de distintos formatos de `path` y gestiona un único
 * manejador centralizado de errores/carga. Si la carga falla, intenta un
 * `fallback` (si se proporciona) una sola vez.
 *
 * Parámetros:
 *  - img: HTMLImageElement ya resuelto por el llamador.
 *  - path: puede ser:
 *      * string URL (http(s)://, //, /ruta, data:)
 *      * string con lista de bytes "82,73,70,70,..."
 *      * Array<number>
 *      * Uint8Array, ArrayBuffer, TypedArray
 *      * Blob
 *      * cualquier otro valor (se convertirá a string)
 *  - fallback: opcional. Si se proporciona y la carga falla, se intentará
 *      asignar `img.src = fallback` (solo una vez). `fallback` se trata como
 *      una URL/string simple en esta versión.
 *
 * Comportamiento clave:
 *  - Centraliza la lógica de onerror/onload en dos funciones (onError, onLoad).
 *  - Revoca cualquier object URL creada para evitar fugas.
 *  - Evita recursión infinita al intentar el fallback solo una vez.
 *  - Mantiene la lógica original de detección de bytes y creación de Blob.
 */
export function imgSrcFromBlob(img, path, fallback) {
  // variable que guardará la object URL creada (si procede) para poder revocarla
    let currentObjectUrl = null;

    /**
     * cleanup
     * - Revoca la object URL si existe.
     * - Elimina los listeners de load/error del elemento img.
     * - Se usa tanto en onLoad como en onError para centralizar la limpieza.
     */
    function cleanup() {
      if (currentObjectUrl) {
        try { URL.revokeObjectURL(currentObjectUrl); } catch (e) { /* ignore */ }
        currentObjectUrl = null;
      }
      img.removeEventListener('error', onError);
        img.removeEventListener('load', onLoad);
    }
    /**
     * onError (manejador centralizado)
     * - Se ejecuta cuando falla la carga del src actual.
     * - Revoca object URL y quita listeners mediante cleanup().
     * - Si existe `fallback` y no es el src actual, intenta asignarlo una vez.
     * - El intento de fallback instala sus propios listeners con { once: true }
     *   para evitar recursión y para limpiar correctamente si falla también.
     */
    function onError() {
      cleanup();
      // Intentar fallback solo si está definido y no es el src actual
        if (fallback && img.src !== fallback) {
          // listeners para el intento de fallback (se ejecutan una sola vez)
          function fallbackLoad() {
            // éxito con fallback: nada más que limpiar (cleanup ya fue llamado)
          }
          function fallbackError() {
            // si falla el fallback, no intentamos más; solo quitamos listeners
            img.removeEventListener('load', fallbackLoad);
          }
    
          img.addEventListener('load', fallbackLoad, { once: true });
            img.addEventListener('error', fallbackError, { once: true });
          // asignar fallback (se tratará como URL/string en esta versión)
            img.src = fallback;
        }
    }
  /**
   * onLoad (manejador centralizado)
   * - Se ejecuta cuando la imagen carga correctamente.
   * - Llama a cleanup para revocar object URL y quitar listeners.
   */
    function onLoad() {
      cleanup();
    }
  // Normalizar String objects (new String(...)) a primitivo
  if (path instanceof String) path = path.valueOf();
  // 0) Si path es una URL/data/ruta absoluta -> asignar directamente
  //    (esto debe comprobarse antes de interpretar cadenas como listas de bytes)
    if (typeof path === 'string' && ( /^(https?:)?\/\//i.test(path) || path.startsWith('/') || path.startsWith('data:') )) {
      img.addEventListener('error', onError, { once: true });
        img.addEventListener('load', onLoad, { once: true });
        img.src = path;
      return;
    }
  // --- convertir distintos formatos a Uint8Array cuando proceda ---
  let u8 = null;
  // 1) cadena que representa una lista de bytes "82,73,70,70,..." (solo dígitos y comas)
    if (typeof path === 'string' && /^\s*\d+(?:\s*,\s*\d+)+\s*$/.test(path)) {
      const nums = path.split(',').map(s => Number(s.trim()));
        u8 = new Uint8Array(nums);
    }
  // 2) Array<number>
    else if (Array.isArray(path)) {
      u8 = new Uint8Array(path);
    }
  // 3) Uint8Array ya listo
    else if (path instanceof Uint8Array) {
      u8 = path;
    }
  // 4) ArrayBuffer
    else if (path instanceof ArrayBuffer) {
      u8 = new Uint8Array(path);
    }
  // 5) cualquier TypedArray (Int8Array, Float32Array, etc.)
    else if (ArrayBuffer.isView(path)) {
      u8 = new Uint8Array(path.buffer);
    }
  // 6) Blob -> crear object URL y asignar (gestión centralizada de errores)
    else if (path instanceof Blob) {
      const url = URL.createObjectURL(path);
        currentObjectUrl = url;
      img.addEventListener('error', onError, { once: true });
        img.addEventListener('load', onLoad, { once: true });
        img.src = url;
      return;
    }
  // 7) string que no es lista de bytes -> tratar como URL/data URL (fallback)
    else if (typeof path === 'string') {
      img.addEventListener('error', onError, { once: true });
        img.addEventListener('load', onLoad, { once: true });
        img.src = path;
      return;
    }
  // 8) fallback: forzar a string y asignar
    else {
      img.addEventListener('error', onError, { once: true });
        img.addEventListener('load', onLoad, { once: true });
        img.src = String(path);
      return;
    }
  // Si no se ha obtenido u8 por alguna razón, usar fallback o forzar string
    if (!u8) {
      if (fallback) {
        img.addEventListener('error', onError, { once: true });
          img.addEventListener('load', onLoad, { once: true });
          img.src = fallback;
      } else {
        img.addEventListener('error', onError, { once: true });
          img.addEventListener('load', onLoad, { once: true });
          img.src = String(path);
      }
      return;
    }
  // --- en este punto tenemos u8 (Uint8Array) con los bytes de la imagen ---
  // detectar MIME básico por las cabeceras más comunes
    let mime = 'application/octet-stream';
      if (u8.length >= 4 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) {
        // "RIFF" -> suele indicar WebP (RIFF + WEBP)
        mime = 'image/webp';
      } else if (u8.length >= 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
        // PNG signature
        mime = 'image/png';
      } else if (u8.length >= 3 && u8[0] === 0xFF && u8[1] === 0xD8 && u8[2] === 0xFF) {
        // JPEG start of image
        mime = 'image/jpeg';
      }
  // crear Blob con el MIME detectado y generar object URL
    const blob = new Blob([u8], { type: mime });
    const url = URL.createObjectURL(blob);
      currentObjectUrl = url;
  // instalar listeners centralizados y asignar src
    img.addEventListener('error', onError, { once: true });
      img.addEventListener('load', onLoad, { once: true });
    img.src = url;
}
