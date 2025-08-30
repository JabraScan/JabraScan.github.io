// Importa funciones auxiliares desde el módulo utils.js
import { generarEtiquetaNuevo, parseFecha } from './utils.js';

/**
 * Crea un elemento HTML que representa el último capítulo publicado de una obra.
 * @param {Object} data - Objeto con los capítulos agrupados por clave de obra.
 * @param {string} claveObra - Clave que identifica la obra dentro del objeto data.
 * @returns {HTMLElement|null} - Elemento HTML con la información del último capítulo o null si no hay capítulos válidos.
 */
export function crearUltimoCapituloDeObra(data, claveObra) {
  // Convierte una fecha en formato "dd-mm-yyyy" a un objeto Date
  const parseDateDMY = (s) => {
    const [dd, mm, yyyy] = s.split("-").map(Number);
    return new Date(yyyy, mm - 1, dd);
  };

  // Extrae el número de capítulo como float, ignorando caracteres no numéricos
  const parseChapterNumber = (n) => {
    const num = parseFloat(String(n).replace(/[^0-9.]/g, ""));
    return Number.isNaN(num) ? -Infinity : num;
  };

  // Formatea una fecha Date al formato "dd-mm-yyyy"
  const formatDateEs = (d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Obtiene los capítulos de la obra especificada
  const capitulos = data[claveObra];
  if (!Array.isArray(capitulos) || capitulos.length === 0) return null;

  // Ordena los capítulos por fecha descendente y luego por número de capítulo
  const ordenados = capitulos.slice().sort((a, b) => {
    const fechaDiff = parseDateDMY(b.Fecha) - parseDateDMY(a.Fecha);
    if (fechaDiff !== 0) return fechaDiff;
    return parseChapterNumber(b.numCapitulo) - parseChapterNumber(a.numCapitulo);
  });

  // Selecciona el capítulo más reciente
  const ultimo = ordenados[0];
  const fechaUltimo = parseDateDMY(ultimo.Fecha);

  // Crea el elemento HTML con la información del último capítulo
  const divsection = document.createElement("div");
  divsection.className = "book-latest-chapter";
  divsection.setAttribute('data-fecha', ultimo.Fecha);
  divsection.innerHTML = `
    <span>Último cap.</span>  
    <span class="cap">${ultimo.numCapitulo}</span>
    <span class="fecha">( ${formatDateEs(fechaUltimo)} )</span>
    ${generarEtiquetaNuevo(fechaUltimo)}
  `;
  return divsection;
}

/**
 * Obtiene los capítulos de una obra desde archivos JSON, con validaciones de estructura y errores.
 * @param {string} clave - Clave que identifica la obra en el índice de capítulos.
 * @returns {Promise<Array>} - Promesa que resuelve con un array de capítulos válidos.
 */
export function obtenerCapitulos(clave) {
  // Carga el índice de capítulos desde capitulos.json
  return fetch('../capitulos.json')
    .then(response => {
      if (!response.ok) {
        console.error("❌ No se pudo cargar el índice de capítulos.");
        return Promise.reject(new Error("Archivo capitulos.json no encontrado"));
      }
      // Intenta parsear el JSON del índice
      return response.json().catch(() => {
        console.error("❌ El archivo capitulos.json tiene un formato inválido.");
        return Promise.reject(new Error("Formato inválido en capitulos.json"));
      });
    })
    .then(index => {
      // Verifica que el índice sea un objeto válido
      if (!index || typeof index !== 'object') {
        console.error("❌ El índice de capítulos está vacío o mal estructurado.");
        return [];
      }

      // Obtiene la ruta del archivo de capítulos correspondiente a la clave
      const ruta = index[clave];
      if (!ruta) {
        console.error(`❌ Clave "${clave}" no encontrada en el índice.`);
        return [];
      }

      // Carga el archivo JSON de capítulos de la obra
      return fetch(ruta)
        .then(res => {
          if (!res.ok) {
            console.error(`❌ No se pudo cargar el archivo de la obra "${clave}" desde ${ruta}`);
            return [];
          }
          // Intenta parsear el JSON del archivo de capítulos
          return res.json().catch(() => {
            console.error(`❌ El archivo "${ruta}" tiene un formato JSON inválido.`);
            return [];
          });
        })
        .then(dataObra => {
          // Verifica que los capítulos estén en un array válido
          const capitulos = Array.isArray(dataObra?.[clave])
            ? dataObra[clave]
            : [];

          if (!capitulos.length) {
            console.warn(`⚠️ No se encontraron capítulos válidos para "${clave}".`);
          }

          // Mapea y filtra los capítulos válidos
          return capitulos.map((item, i) => {
            // Verifica que cada capítulo tenga la estructura esperada
            if (
              typeof item !== 'object' ||
              !item?.NombreArchivo ||
              !item?.Fecha ||
              item?.numCapitulo == null ||
              !item?.nombreCapitulo
            ) {
              console.warn(`⚠️ Capítulo inválido en posición ${i} del archivo "${clave}".`);
              return null;
            }

            // Devuelve el capítulo con los campos esperados
            return {
              NombreArchivo: item.NombreArchivo,
              Fecha: item.Fecha,
              numCapitulo: item.numCapitulo,
              nombreCapitulo: item.nombreCapitulo
            };
          }).filter(Boolean); // Elimina los capítulos inválidos (null)
        });
    })
    .catch(error => {
      // Captura cualquier error general en el proceso
      console.error("❌ Error general al cargar los capítulos:", error.message);
      return [];
    });
}
