const URL_BASE = "https://script.google.com/macros/s/AKfycbzd0PXifcGV1nG1gNucm_9DB7UI_YLdOS4qEYZm_8CcW-W4jBkh3PNZiQ2qK4tqgok6Bg/exec";

/**
 * Incrementa el contador de visitas para un ID
 * @param {string} idvisitado
 * @returns {Promise<string>} "OK" si se actualizó correctamente
 */
export function incrementarVisita(idvisitado) {
  const url = `${URL_BASE}?id=${encodeURIComponent(idvisitado)}&accion=incrementar`;
  return fetch(url)
    .then(res => res.text())
    .catch(err => {
      console.error("Error incrementando visita:", err);
      return "ERROR";
    });
}

/**
 * Consulta el número de visitas para un ID
 * @param {string} idvisitado
 * @returns {Promise<number>} número de visitas
 */
export function leerVisitas(idvisitado) {
  const url = `${URL_BASE}?id=${encodeURIComponent(idvisitado)}&accion=leer`;
  return fetch(url)
    .then(res => res.text())
    .then(text => parseInt(text, 10) || 0)
    .catch(err => {
      console.error("Error leyendo visitas:", err);
      return 0;
    });
}
