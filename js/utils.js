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

export function truncarTexto(texto, maxLength = 40) {
  return texto.length > maxLength ? texto.slice(0, maxLength) + "…" : texto;
}
// 🖼️ Selecciona la imagen correcta para que TODAS se muestren en un año
export function seleccionarImagen(nodosImagen) {
  const totalImagenes = nodosImagen.length;

  // 🚫 Sin imágenes → vacío
  if (totalImagenes === 0) return "";

  // ⚡ Solo 1 imagen → siempre la misma
  if (totalImagenes === 1) return nodosImagen[0].textContent.trim();

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

  return nodosImagen[indice].textContent.trim();
}

/**
 * 📚 Función para obtener los nombres de obra desde un nodo XML <obra>
 * Devuelve:
 *   - nombreobra: 🏷️ el primer nombre (el que se muestra)
 *   - nombresAlternativos: 📂 el resto de nombres (para ocultar en HTML)
 */
export function obtenerNombreObra(obra) {
  // 🔎 Recoger todas las etiquetas <nombreobra> del nodo obra
  const nombresObra = Array.from(obra.querySelectorAll("nombreobra"))
    .map(n => n.textContent.trim())   // ✂️ Eliminar espacios
    .filter(Boolean);                 // ✅ Filtrar vacíos

  // 🏷️ El primero es el que se muestra en pantalla
  const nombreobra = nombresObra[0] || "";

  // 📂 El resto son los alternativos (para SEO / indexación)
  const nombresAlternativos = nombresObra.slice(1);

  // 📦 Devolver ambos parámetros en un objeto
  return { nombreobra, nombresAlternativos };
}
