import { incrementarVisita, leerVisitas, obtenerInfo, valorarRecurso } from './contadoresGoogle.js';

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
 * @param {string} clave - Identificador del recurso (sin el prefijo "obra_")
 * @param {number} valoracionPromedio - Valoración promedio del recurso (0–5)
 * @param {number} votos - Número total de votos registrados
 * @returns {HTMLElement} - Bloque HTML listo para insertar en el DOM
 */
export function crearBloqueValoracion(clave, valoracionPromedio = 0, votos = 0) {
  // 🧱 Contenedor principal del bloque
  const bloque = document.createElement("div");
  bloque.className = "book-rating";

  // ⭐ Contenedor de estrellas
  const estrellas = document.createElement("div");
  estrellas.className = "stars";

  // 📝 Texto con la valoración promedio y número de votos
  const textoValoracion = document.createElement("div");
  textoValoracion.className = "rating-text";
  textoValoracion.textContent = `${valoracionPromedio.toFixed(1)} / 5 (${votos} votos)`;

  // 💬 Texto para mostrar interacción del usuario
  const tuValoracion = document.createElement("div");
  tuValoracion.className = "your-rating";

  // 🔐 Verificamos si el usuario ya ha votado usando localStorage
  const claveLocal = clave;
  const yaVotado = localStorage.getItem(claveLocal);

  // 🧠 Si ya votó, mostramos agradecimiento; si no, invitamos a votar
  tuValoracion.textContent = yaVotado ? "¡Gracias por tu voto!" : "¿Tu valoración?";

  // 🔄 Generamos las 5 estrellas
  for (let i = 1; i <= 5; i++) {
    const estrella = document.createElement("i");
    estrella.className = "fa-solid fa-star";

    // 🎨 Color según la valoración promedio
    estrella.style.color = i <= Math.round(valoracionPromedio) ? "orange" : "lightgray";

    // 🖱️ Interacción: solo si el usuario no ha votado
    estrella.style.cursor = yaVotado ? "default" : "pointer";

    // 🗳️ Evento de click para votar
    if (!yaVotado) {
      estrella.addEventListener("click", () => {
        valorarRecurso(clave, i).then(res => {
    //console.log(`${clave} - ${i} - ${res}`);
          if (res && res.trim().startsWith("OK")) {
            // 🗂️ Guardamos el voto en localStorage
            localStorage.setItem(claveLocal, i);

            // ✅ Actualizamos el texto de agradecimiento
            tuValoracion.textContent = `Has votado: ${i} estrella${i > 1 ? "s" : ""}`;
            textoValoracion.textContent = "¡Gracias por tu voto!";

            // 🔄 Opcional: recargar datos desde obtenerInfo(clave) si se desea actualizar el promedio
          } else {
            tuValoracion.textContent = "Error al enviar tu voto";
          }
        });
      });
    }

    // 📌 Añadimos la estrella al contenedor
    estrellas.appendChild(estrella);
  }

  // 🧩 Ensamblamos el bloque completo
  bloque.appendChild(estrellas);
  bloque.appendChild(textoValoracion);
  bloque.appendChild(tuValoracion);

  return bloque;
}

/**
 * Actualiza las metaetiquetas del documento de forma granular para mejorar el SEO y la apariencia en redes sociales.
 * @param {object} data - Objeto con la información a actualizar.
 * @param {string} [data.title] - El nuevo título de la página.
 * @param {string} [data.description] - La nueva descripción.
 * @param {string} [data.imageUrl] - La URL de la imagen para previsualizaciones (debe ser absoluta).
 * @param {string} [data.url] - La URL canónica de la página.
 * @param {string} [data.keywords] - Palabras clave opcionales separadas por comas.
 * @param {object} [data.structuredData] - Objeto con los datos estructurados para JSON-LD.
 */
export function updateMetaTags({ title, description, imageUrl, url, keywords, structuredData }) {
  // Función auxiliar para crear o actualizar una metaetiqueta
  const setMeta = (attr, value, content) => {
    let element = document.querySelector(`meta[${attr}='${value}']`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, value);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Actualiza el título si se proporciona
  if (title) {
    document.title = title;
    setMeta('property', 'og:title', title);
    setMeta('name', 'twitter:title', title);
  }

  // Actualiza la descripción si se proporciona
  if (description) {
    setMeta('name', 'description', description);
    setMeta('property', 'og:description', description);
    setMeta('name', 'twitter:description', description);
  }

  // Actualiza la imagen si se proporciona
  if (imageUrl) {
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:image', imageUrl);
  }

  // Actualiza la URL canónica si se proporciona
  if (url) {
    setMeta('property', 'og:url', url);
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
  }

  // Actualiza las keywords si se proporcionan
  if (keywords) {
    setMeta('name', 'keywords', keywords);
  }

  // LÓGICA PARA JSON-LD
  // Elimina el script de datos estructurados anterior si existe
  const oldJsonLdScript = document.querySelector('script[type="application/ld+json"]');
  if (oldJsonLdScript) {
    oldJsonLdScript.remove();
  }

  // Crea y añade el nuevo script si se proporcionan datos estructurados
  if (structuredData) {
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(jsonLdScript);
  }

  // Etiquetas estáticas que no dependen de los parámetros (se pueden establecer siempre)
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:site_name', 'JabraScan');
  setMeta('name', 'twitter:card', 'summary_large_image');
  };

export function truncarTexto(texto, maxLength = 40) {
  return texto.length > maxLength ? texto.slice(0, maxLength) + "…" : texto;
}
