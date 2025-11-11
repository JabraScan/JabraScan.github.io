/**
 * 🧙‍♂️ API Web para gestionar visitas, valoraciones y obtener información
 * sobre obras y capítulos.
 *
 * Esta versión "dual" llama a dos backends en paralelo:
 * - Google Apps Script (tu backend actual sobre Google Sheets)
 * - Cloudflare Worker (nuevo backend con D1)
 *
 * ✔ Mantiene la misma interfaz pública (mismos parámetros y retornos)
 * ✔ No requiere cambiar tu frontend fuera de este módulo
 * ⚠ Eventual consistency: puede haber pequeñas diferencias momentáneas entre ambos
 */

/* ============================
   🔗 URLs de los dos backends
   ============================ */

// URL original de Google Apps Script (tu hoja de cálculo)
const URL_GOOGLE = "https://script.google.com/macros/s/AKfycbzd0PXifcGV1nG1gNucm_9DB7UI_YLdOS4qEYZm_8CcW-W4jBkh3PNZiQ2qK4tqgok6Bg/exec";

// URL del Cloudflare Worker que replica el flujo (ajusta al tuyo)
const URL_CLOUDFLARE = "https://api.midominio.com/registros"; // TODO: cambia por tu ruta real

//const API_KEY = "X%B~ZiP?RJA5LUGVAU_9KgDp?7~rUX8KW2D9Q3Fgiyt=1.]Ww#a^FGEMFuM:}#WP4r2L!e9U?fA+qcUjReWV"; // Opcional, si tu backend lo requiere
const API_KEY = "";

/**
 * 🔐 Genera un token temporal codificado en base64
 * (comentado porque ahora no lo usas; deja aquí por si activas validación por token en el futuro)
 */
// export function generarToken() {
//   // 🗝️ Clave privada compartida con el backend para validar el token
//   const clavePrivada = API_KEY;
//   // ⏱️ Obtiene el timestamp actual en milisegundos
//   const timestamp = Date.now();
//   // ⏳ Calcula el tiempo de expiración: 10 minutos desde ahora
//   const expiracion = timestamp + 10 * 60 * 1000;
//   // 🧵 Crea una cadena que une la clave privada y la expiración
//   const raw = `${clavePrivada}:${expiracion}`;
//   // 📦 Codifica la cadena en base64 para generar el token
//   const token = btoa(raw);
//   // 🚀 Devuelve el token generado
//   return token;
// }

/* ==========================================================
   🧩 Utilidad interna: construir URL con parámetros comunes
   ========================================================== */

/**
 * Construye la URL con query params para ambos backends.
 * - Incluye accion, id, valor (si aplica) y api_key (si existiera)
 * - Evita duplicación de lógica en cada función
 */
function buildUrl(base, accion, id, valor) {
  const qp = new URLSearchParams();
  if (accion) qp.set("accion", accion);
  if (id) qp.set("id", id);
  if (typeof valor !== "undefined") qp.set("valor", String(valor));
  if (API_KEY) qp.set("api_key", API_KEY);
  return `${base}?${qp.toString()}`;
}

/* =======================================
   ➕ Incrementa el contador de visitas
   ======================================= */
/**
 * Incrementa el contador de visitas para un ID
 * @param {string} idvisitado
 * @returns {Promise<string>} "OK" si se actualizó correctamente
 *
 * Implementación dual:
 * - Lanza dos fetch en paralelo (Google + Cloudflare)
 * - Devuelve el texto de Google para mantener compatibilidad
 * - Registra en ambos, aunque uno falle (error aislado no tumba la respuesta)
 */
export function incrementarVisita(idvisitado) {
  const urlGoogle = buildUrl(URL_GOOGLE, "incrementar", encodeURIComponent(idvisitado));
  const urlCloud = buildUrl(URL_CLOUDFLARE, "incrementar", encodeURIComponent(idvisitado));

  return Promise.all([
    fetch(urlGoogle).then(res => res.text()).catch(err => {
      console.error("Error incrementando visita (Google):", err);
      return "ERROR Google";
    }),
    fetch(urlCloud).then(res => res.text()).catch(err => {
      console.error("Error incrementando visita (Cloudflare):", err);
      return "ERROR Cloudflare";
    })
  ]).then(([resGoogle]) => resGoogle);
}

/* =======================================
   👁️ Consulta el número de visitas
   ======================================= */
/**
 * Consulta el número de visitas para un ID
 * @param {string} idvisitado
 * @returns {Promise<number>} número de visitas
 *
 * Implementación dual:
 * - Lee en paralelo de ambos backends
 * - Prioriza Google; si no hay dato válido, usa Cloudflare
 * - Si ambos fallan, devuelve 0
 */
export function leerVisitas(idvisitado) {
  const urlGoogle = buildUrl(URL_GOOGLE, "leer", encodeURIComponent(idvisitado));
  const urlCloud = buildUrl(URL_CLOUDFLARE, "leer", encodeURIComponent(idvisitado));

  return Promise.all([
    fetch(urlGoogle).then(res => res.text()).catch(err => {
      console.error("Error leyendo visitas (Google):", err);
      return "0";
    }),
    fetch(urlCloud).then(res => res.text()).catch(err => {
      console.error("Error leyendo visitas (Cloudflare):", err);
      return "0";
    })
  ]).then(([textGoogle, textCloud]) => {
    const g = parseInt(textGoogle, 10);
    const c = parseInt(textCloud, 10);
    return Number.isFinite(g) && g >= 0 ? g : (Number.isFinite(c) && c >= 0 ? c : 0);
  });
}

/* =======================================
   ⭐ Envía una valoración 0–5
   ======================================= */
/**
 * Envía una valoración (de 0 a 5) para un recurso identificado por ID
 * @param {string} idvisitado
 * @param {number} valor Valor numérico entre 0 y 5
 * @returns {Promise<string>} "OK" si se registró correctamente
 *
 * Implementación dual:
 * - Intenta registrar en ambos sistemas
 * - Devuelve el texto de Google (compatibilidad)
 * - Si un backend falla, loguea el error y continúa
 */
// ⭐ Valorar recurso en ambos (usuario_id solo en Cloudflare)
export function valorarRecurso(idvisitado, valor, usuarioId = null) {
  // Google Apps Script: no necesita usuarioId
  const urlGoogle = `${URL_GOOGLE}?id=${encodeURIComponent(idvisitado)}&accion=valorar&valor=${valor}`;

  // Cloudflare Worker: acepta usuarioId si se pasa
  let urlCloud = `${URL_CLOUDFLARE}?id=${encodeURIComponent(idvisitado)}&accion=valorar&valor=${valor}`;
  if (usuarioId) {
    urlCloud += `&usuario_id=${encodeURIComponent(usuarioId)}`;
  }

  return Promise.all([
    fetch(urlGoogle).then(res => res.text()).catch(err => {
      console.error("Error valorando recurso (Google):", err);
      return "ERROR Google";
    }),
    fetch(urlCloud).then(res => res.text()).catch(err => {
      console.error("Error valorando recurso (Cloudflare):", err);
      return "ERROR Cloudflare";
    })
  ]).then(([resGoogle]) => resGoogle);
}

/* =======================================
   📦 Obtiene información completa del recurso
   ======================================= */
/**
 * Obtiene la información completa del recurso: visitas, valoración promedio y fecha de última actualización
 * @param {string} idvisitado
 * @returns {Promise<Object>} Objeto con propiedades: visitas, valoracion, fechaActualizacion, votos, obra, numVisitasCapitulo
 *
 * Implementación dual:
 * - Consulta ambos backends en paralelo
 * - Prioriza Google por compatibilidad; si es nulo, usa Cloudflare
 * - Fallback seguro si ambos fallan
 */
export function obtenerInfo(idvisitado) {
  const urlGoogle = buildUrl(URL_GOOGLE, "obtenerInfo", encodeURIComponent(idvisitado));
  const urlCloud = buildUrl(URL_CLOUDFLARE, "obtenerInfo", encodeURIComponent(idvisitado));

  return Promise.all([
    fetch(urlGoogle).then(res => res.json()).catch(err => {
      console.error("Error obteniendo información (Google):", err);
      return null;
    }),
    fetch(urlCloud).then(res => res.json()).catch(err => {
      console.error("Error obteniendo información (Cloudflare):", err);
      return null;
    })
  ]).then(([infoGoogle, infoCloud]) => {
    return infoGoogle || infoCloud || {
      visitas: 1,
      valoracion: 5,
      fechaActualizacion: null,
      votos: 1,
      obra: null,
      numVisitasCapitulo: 0
    };
  });
}

/* =======================================
   📋 Resumen general de todas las obras
   ======================================= */
/**
 * 📋 Obtiene el resumen completo de todas las obras
 * @returns {Promise<Array>} Array de objetos con datos de cada obra
 *
 * Implementación dual:
 * - Pide a ambos sistemas
 * - Devuelve Google si tiene datos; si no, Cloudflare
 * - Si ambos fallan, devuelve []
 */
export function obtenerResumenObras() {
  const urlGoogle = buildUrl(URL_GOOGLE, "resumenObras");
  const urlCloud = buildUrl(URL_CLOUDFLARE, "resumenObras");

  return Promise.all([
    fetch(urlGoogle).then(res => res.json()).catch(err => {
      console.error("Error obteniendo resumen (Google):", err);
      return [];
    }),
    fetch(urlCloud).then(res => res.json()).catch(err => {
      console.error("Error obteniendo resumen (Cloudflare):", err);
      return [];
    })
  ]).then(([resGoogle, resCloud]) => {
    return (Array.isArray(resGoogle) && resGoogle.length) ? resGoogle : resCloud;
  });
}

/* =======================================
   📚 Listado de capítulos por visitas
   ======================================= */
/**
 * Devuelve un listado de capítulos ordenado por número de visitas (descendente)
 * incluyendo el número de capítulo y la fecha sin formatear.
 * @returns {Promise<Array>} JSON con array de objetos ordenados por visitas
 *
 * Nota:
 * - Esta acción existe en el Worker (Cloudflare) como "listarCapitulos".
 * - Si decides crear la misma acción en Apps Script, puedes hacerlo dual también.
 */
export function listarCapitulos() {
  const urlCloud = buildUrl(URL_CLOUDFLARE, "listarCapitulos");
  return fetch(urlCloud)
    .then(res => res.json())
    .catch(err => {
      console.error("Error listando capítulos (Cloudflare):", err);
      return [];
    });
}

/* =======================================
   📝 Consideraciones operativas
   ======================================= */
/**
 * - Doble escritura: ambos sistemas registran visitas/valoraciones (puede haber pequeñas diferencias
 *   temporales hasta que ambos confirmen).
 * - Idempotencia: las operaciones son acumulativas; si uno falla, el otro sigue.
 * - Tolerancia a fallos: usamos Promise.all y capturas individuales para no bloquear la UX.
 * - Migración gradual: cuando decidas usar solo Cloudflare, bastará con cambiar a una sola URL_BASE.
 */
