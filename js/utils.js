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
              valorarRecurso(clave, i).then(res => {
                console.log(res);
                if (res && /\bOK\b/.test(res)) {
                  localStorage.setItem(claveLocal, i);
                    console.log(`avoto: ${actualizarVoto} - estrellas: ${estrellas} - i ${i}`);
                    if (actualizarVoto) {
                      console.log(`estrellas: ${estrellas} - i ${i}`);
                      // Repintamos las estrellas con el voto del usuario
                      actualizarEstrellas(estrellas, i);
                      // Mantenemos los listeners activos para permitir votar de nuevo
                    } else {
                      // Comportamiento clásico: bloquear futuros clicks
                      // ejemplo simple: deshabilitar puntero para todos los íconos
                      const nodos = estrellas.querySelectorAll('i');
                      nodos.forEach(n => n.style.pointerEvents = 'none');
                    }
                } else {
                  // Manejo de errores
                }
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


















