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
          /* optimizacion para ocultar los capitulos con fecha de publicacion futura
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
          */
            // Mapea y filtra los capítulos válidos y publicados
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
            
              // 🗓️ Filtrado por fecha: solo incluir si la fecha es hoy o anterior
              const fechaCapitulo = new Date(parseFecha(item.Fecha));
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0); // Elimina la hora para comparar solo la fecha
            
              if (fechaCapitulo > hoy) {
                //console.info(`⏳ Capítulo "${item.nombreCapitulo}" programado para el futuro (${item.Fecha}), se omite.`);
                return null;
              }
            
              // Devuelve el capítulo válido
              return {
                NombreArchivo: item.NombreArchivo,
                Fecha: item.Fecha,
                numCapitulo: item.numCapitulo,
                nombreCapitulo: item.nombreCapitulo
              };
            }).filter(Boolean); // Elimina los capítulos inválidos o futuros

          //
        });
    })
    .catch(error => {
      // Captura cualquier error general en el proceso
      console.error("❌ Error general al cargar los capítulos:", error.message);
      return [];
    });
}
/*
export function formatCDATA(raw) {
  if (raw == null) return '';
  let s = String(raw);
  // Si viene escapado como &lt;...&gt; lo decodificamos
  if (s.includes('&lt;') || s.includes('&gt;')) {
    const t = document.createElement('textarea');
    t.innerHTML = s;
    s = t.value;
  }
  // Quitamos etiquetas CDATA visibles
  s = s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();
  // Escape seguro del HTML para evitar XSS
  s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  // Permitir que quien ya tenga <br> en el contenido no doble los saltos:
  // convertimos saltos de línea a <br> para que se muestren igual que antes
  s = s.replace(/\r\n?/g, '\n').replace(/\n/g, '<br>');
  return s;
}*/
// Reemplaza tu formatCDATA por esta versión
export function formatCDATA(raw) {
  if (raw == null) return '';

  // Normalizar a string
  let s = String(raw);

  // Si viene escapado como &lt;...&gt; lo decodificamos
  if (s.includes('&lt;') || s.includes('&gt;')) {
    const t = document.createElement('textarea');
    t.innerHTML = s;
    s = t.value;
  }

  // Extraer contenido CDATA si existe
  s = s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim();

  // Si no parece contener tags HTML, escapar y convertir saltos a <br>
  if (!/[<>]/.test(s)) {
    s = s.replace(/&/g,'&amp;')
         .replace(/</g,'&lt;')
         .replace(/>/g,'&gt;')
         .replace(/"/g,'&quot;')
         .replace(/'/g,'&#39;')
         .replace(/\r\n?/g, '\n')
         .replace(/\n/g, '<br>');
    return s;
  }

  // Si contiene HTML, sanitizar permitiendo solo etiquetas/atributos seguros
  const allowedTags = new Set(['a','br','strong','em','b','i','u','span']);
  const allowedAttrs = {
    'a': new Set(['href','target','rel','title'])
  };

  // Parsear en DOM y filtrar nodos/atributos
  const wrapper = document.createElement('div');
  wrapper.innerHTML = s;

  (function sanitizeNode(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        continue;
      }
      if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
          // Reemplazar el nodo por su contenido textual (sin etiquetas)
          const text = document.createTextNode(child.textContent || '');
          node.replaceChild(text, child);
          continue;
        }
        // Filtrar atributos
        const attrs = Array.from(child.attributes);
        for (const at of attrs) {
          const name = at.name.toLowerCase();
          const val = at.value;
          if (!(allowedAttrs[tag] && allowedAttrs[tag].has(name))) {
            child.removeAttribute(at.name);
            continue;
          }
          // Atributos de enlace: validar esquema y evitar javascript:
          if (tag === 'a' && name === 'href') {
            try {
              const url = val.trim();
              // Rechazar javascript: y datos peligrosos
              if (/^\s*(javascript:|data:)/i.test(url)) {
                child.removeAttribute('href');
              } else {
                // Forzar target y rel si no vienen
                child.setAttribute('href', url);
              }
            } catch (e) {
              child.removeAttribute('href');
            }
          }
        }
        // Forzar relaciones seguras para enlaces externos
        if (tag === 'a') {
          if (!child.hasAttribute('target')) child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        }
        // Recursivo
        sanitizeNode(child);
      } else {
        // Otros tipos (comentarios etc) se eliminan
        node.removeChild(child);
      }
    }
  })(wrapper);

  // Convertir saltos de línea en <br> dentro de los textos
  const serializer = (root) => {
    const clone = root.cloneNode(true);
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const t of nodes) {
      if (t.nodeValue.includes('\n')) {
        const parts = t.nodeValue.replace(/\r\n?/g, '\n').split('\n');
        const frag = document.createDocumentFragment();
        for (let i = 0; i < parts.length; i++) {
          frag.appendChild(document.createTextNode(parts[i]));
          if (i < parts.length - 1) frag.appendChild(document.createElement('br'));
        }
        t.parentNode.replaceChild(frag, t);
      }
    }
    return clone.innerHTML;
  };

  return serializer(wrapper);
}


