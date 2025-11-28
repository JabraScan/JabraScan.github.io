import { onLibroClick } from'./leerobras.js';
import { activarLinksPDF } from './eventos.js';
import { actualizarEstrellas, crearBloqueValoracion, createImg, managerTabs } from './utils.js';

// -------------------------
// /js/usuario.js
// Módulo responsable de cargar y renderizar datos del usuario.
// No contiene auto-ejecución: general.js debe importar y llamar initUsuario
// -------------------------

// -------------------------
// Config y constantes
// -------------------------
const API_BASE = "https://jabrascan.net";
const FALLBACK_IMG = "/img/avatar/default.webp";
const usuario_id = localStorage.getItem("user_id");
const nickname = localStorage.getItem("user_nickname");
const avatar = localStorage.getItem("user_avatar");
const token = localStorage.getItem("jwt");

// -------------------------
// Redirección si no hay login (no bloquea el resto del código)
// -------------------------
  function getHashPage() {
    return (location.hash || '').replace(/^#\/?/, '').split(/[?#]/, 1)[0].replace(/\/$/, '');
  }
  const protectedPages = new Set(['usuario', 'usuario.html', 'login', 'login.html']);
  const page = getHashPage();
  if (protectedPages.has(page) && !usuario_id) {
    window.location.replace('/');
  }
// -------------------------
// Helpers
// -------------------------
/**
 * ensureBootstrap()
 * Inserta CSS/JS de Bootstrap solo si no están presentes.
 */
(function ensureBootstrap() {
  const hasBootstrapCSS = Array.from(document.styleSheets)
    .some(s => s.href && s.href.includes("bootstrap"));
  if (!hasBootstrapCSS) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
    document.head.appendChild(link);
  }

  const hasBootstrapJS = Array.from(document.scripts)
    .some(s => s.src && s.src.includes("bootstrap"));
  if (!hasBootstrapJS) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
    document.body.appendChild(script);
  }
})();

/**
 * authFetch(input, init)
 * Wrapper de fetch que añade Authorization Bearer si existe token
 */
function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

// -------------------------
// API Worker: funciones que consultan el backend
// -------------------------
  //CARGA PERFIL USUARIO
    // Llama al endpoint autenticado y devuelve los datos del perfil en JSON
    export async function fetchPerfil() {
      const url = `${API_BASE}/usuarios/get`;
      // authFetch debe añadir el header Authorization o el mecanismo de autenticación que uses
      const res = await authFetch(url);    
      // Lanzar error si la respuesta no es 2xx
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        const err = new Error(`Error ${res.status}: ${text}`);
        err.status = res.status;
        throw err;
      }    
      // Devolver JSON parseado (se espera { nick, avatar, rol, ... } sin usuario_id)
      return res.json();
    }    
    // Actualiza el DOM con los datos del perfil
    export function renderPerfil(data, opts = {}) {
      const usermain = document.getElementById("perfil-info");
        usermain.innerHTML = `
          <img id="avatar-img" src="${data.avatar || FALLBACK_IMG}" alt="avatar" class="rounded-circle me-3" style="width:80px;height:80px;">
          <div id="datos-user">
            <h3 id="nick">${data.nick || "(sin nick)"}</h3>
            <p class="text-muted">Puntos: <span id="user_puntos">${data.puntos}</span></p>
          </div>
        `;
    }    
    // Orquestadora: usa fetchPerfil y renderPerfil (solo autenticado)
    // opts permite pasar selectors opcionales: { loadingSelector, errorSelector, nickSelector, avatarSelector }
    export async function cargarPerfil(opts = {}) {
      // Solo autenticado: si no hay token no intentamos nada
      if (!token) return;    
      // Mostrar indicador de carga si se proporcionó selector
      let loadingEl;
      if (opts.loadingSelector) {
        loadingEl = document.getElementById(opts.loadingSelector);
        if (loadingEl) loadingEl.style.display = ""; // mostrar
      }
      let data = null;
      try {
        // Obtener datos del servidor
        data = await fetchPerfil();    
        // Renderizar en el DOM
        renderPerfil(data, opts);
      } catch (err) {
        // Manejo centralizado de errores
        console.error("No se pudo cargar perfil:", err);
        if (opts.errorSelector) {
          const errEl = document.getElementById(opts.errorSelector);
          if (errEl) errEl.textContent = "Error al cargar perfil";
        }
      } finally {
        // Ocultar indicador de carga si se usó
        if (loadingEl) loadingEl.style.display = "none";
      }
      return data;
    }
  //FIN CARGA PERFIL USUARIO

  export async function cargarBiblioteca() {
    if (!usuario_id && !token) return;
  
    const url = `${API_BASE}/biblioteca/list?usuario_id=${encodeURIComponent(usuario_id)}`;
  
    const res = await authFetch(url);
    const data = await res.json();
  
    const cont = document.getElementById("bibliotecaResultado");
    const contfinal = document.getElementById("bibliotecafin_Resultado");
    if (!cont) return;
  
    const ul = document.createElement("ul");
      ul.className = "list-group";
    const ulfinal = document.createElement("ul");
      ulfinal.className = "list-group";
    
        (Array.isArray(data) ? data : []).forEach(item => {
          const li = document.createElement("li");
          li.className = "list-group-item d-flex gap-3 align-items-start";
          li.dataset.obraId = item.obra_id ?? "";
    //console.log(item);     
          // normalizar item.imagen y limpiar comillas, backslashes, prefijos img/ y slashes iniciales
          let srcCandidate = '/img/' + (
                              String(item.imagen ?? '')
                                .replace(/^"+|"+$/g, '')           // quitar comillas literales alrededor
                                .replace(/\\/g, '/')               // convertir backslashes a slash
                                .replace(/^\/+/, '')               // quitar slashes iniciales
                                .replace(/^img\/+/i, '')          // quitar prefijo img/ si existe
                                .replace(/\.webp(\?.*)?$/i, '-300w.webp$1')
                              ); 
          // construimos src de imagen sólo si viene o si FALLBACK_IMG está definido
          const imgSrc = srcCandidate || FALLBACK_IMG || "";
          li.innerHTML = `
            <img src="${imgSrc}" ${imgSrc ? `onerror="this.onerror=null;this.src='${FALLBACK_IMG}'"` : ''} 
                 alt="${item.nombreobra || ''}" class="img-thumbnail user-image" style="width:96px;height:128px;object-fit:cover;">
            <div class="flex-grow-1">
              <p class="clave d-none">${item.obra_id}</p>
              <div class="d-flex justify-content-between user-main">
                <h5 class="mb-1 biblio-obra libro-item" >${item.nombreobra || ''}</h5>
                <small class="text-muted">${item.estado ? `${item.estado}` : ''}</small>
              </div>
              <div class="d-flex justify-content-between user-lastChapter">
                <a href="#" data-pdf-obra="${item.obra_id}" data-pdf-capitulo="${item.numCapitulo ?? item.ultimoCapituloLeido ?? '-'}" class="pdf-link">
                  <span>${item.numCapitulo ?? item.ultimoCapituloLeido ?? '-'}: ${item.nombreCapitulo || '-'}</span>
                </a>
              </div>
              <div class="d-flex justify-content-between">
                <small class="text-muted user-progresion">${item.numCapitulo || '-'} / ${item.maxCapitulos || '-'} ( ${item.porcenLeido || '-'}% )</small>
              </div>
              <input type="hidden" class="d-none obra-id" value="${item.obra_id ?? ''}">
              
              <!-- Botones para móvil' -->
              <div class="biblioteca-acciones biblioteca-acciones-mobile d-flex d-sm-none mt-2">
                <button type="button" class="btn btn-sm btn-outline-danger delete-obra" data-obra-id="${item.obra_id ?? ''}" title="Quitar de la Biblioteca" aria-label="Quitar de la Biblioteca">
                  <i class="fa fa-trash" aria-hidden="true"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-success marcar-finalizado" data-obra-id="${item.obra_id ?? ''}" title="Marcar como finalizado" aria-label="Marcar como finalizado">
                  <i class="fa fa-check" aria-hidden="true"></i>
                </button>
              </div>
          
              <input type="hidden" class="d-none obra-id" value="${item.obra_id ?? ''}">
            </div>
          
            <!-- Botones para pantallas >= sm: (vertical) -->
            <div class="biblioteca-acciones d-none d-sm-flex flex-column ms-auto align-self-stretch justify-content-center gap-2" role="group" aria-label="Acciones Biblioteca">
              <button type="button" class="btn btn-sm btn-outline-danger delete-obra" data-obra-id="${item.obra_id ?? ''}" title="Quitar de la Biblioteca" aria-label="Quitar de la Biblioteca">
                <i class="fa fa-trash" aria-hidden="true"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-success marcar-finalizado" data-obra-id="${item.obra_id ?? ''}" title="Marcar como finalizado" aria-label="Marcar como finalizado">
                <i class="fa fa-check" aria-hidden="true"></i>
              </button>
            </div>
          `;
          //añadimos valoraciones para usuario
          const valoracion = crearBloqueValoracion(item.obra_id, item.valoracion, item.cantvalora, { soloEstrellas: true, actualizarVoto: true });
          li.querySelector('.user-progresion').insertAdjacentElement('afterend', valoracion);
          li.querySelector('.biblio-obra').onclick = () => onLibroClick(item.obra_id);
          li.querySelector(".libro-item").onclick = () => onLibroClick(item.obra_id);
          //prueba para insertar imagen con diferentes tamaños
            //const imgSrc = srcCandidate || FALLBACK_IMG || "";
              //const newImg = createImg(imgSrc, item.obra_id, "BibliotecaUsuario");
              //newImg.className = "img-thumbnail";
            //li.prepend(newImg);  
          if (item.finalizado === 0 ) {
            ul.appendChild(li);
          } else {
            ulfinal.appendChild(li);
          }
        });
    cont.appendChild(ul);
    contfinal.appendChild(ulfinal);
    activarLinksPDF();
  }
  /**
   * cargarObras
   *
   * Misma estructura y nivel de código que cargarBiblioteca.
   * - Usa authFetch(url) (igual que cargarBiblioteca).
   * - Renderiza en #obrasResultado usando innerHTML (mínimo código extra).
   */
  export async function cargarObras() {
    if (!usuario_id && !token) return;
    
    const perfilUrl = token
      ? `${API_BASE}/obras/traductores`
      : `${API_BASE}/obras/traductores?user_id=${encodeURIComponent(usuario_id)}`;
      const perfilRes = await authFetch(perfilUrl);
      // Comprobar la Response antes de parsear
      if (!perfilRes || !perfilRes.ok) {        return;      }
      // Parsear
      const data = await perfilRes.json();
      const cont = document.getElementById("obrasResultado");
        if (!cont) return;
    
    const ul = document.createElement("ul");
    ul.className = "list-group";
  
    (Array.isArray(data) ? data : []).forEach(item => {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex gap-3 align-items-start";
      li.dataset.obraId = item.obra_id ?? "";
  
      // Normalizar imagen (misma lógica que en cargarBiblioteca)
      let srcCandidate = '/img/' + (
        String(item.imagen ?? '')
          .replace(/^"+|"+$/g, '')
          .replace(/\\/g, '/')
          .replace(/^\/+/, '')
          .replace(/^img\/+/i, '')
          .replace(/\.webp(\?.*)?$/i, '-300w.webp$1')
      );
      const imgSrc = srcCandidate || FALLBACK_IMG || "";
      li.innerHTML = `
        <img src="${imgSrc}" ${imgSrc ? `onerror="this.onerror=null;this.src='${FALLBACK_IMG}'"` : ''} 
             alt="${item.nombreobra || ''}" class="img-thumbnail obra-image" style="width:96px;height:128px;object-fit:cover;">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between obra-main">
            <h5 class="mb-1">${item.nombreobra || ''}</h5>
            <small class="text-muted">${item.estado ? `Estado: ${item.estado}` : ''}</small>
          </div>
          <div class="d-flex justify-content-between user-lastChapter">
            <a href="#" data-obra="${item.obra_id}" class="obra-link">
              <span>${item.maxNumCapReal ?? '-'}: ${item.nombreCapitulo || '-'}</span>
            </a>
            <small class="text-muted">Valoración: ${item.valoracion ?? 0}</small>
          </div>
          <div class="d-flex justify-content-between">
            <small class="text-muted user-progresion"></small>
          </div>
          <input type="hidden" class="obra-id" value="${item.obra_id ?? ''}">
        </div>
      `;
      // Insertar valoración exactamente como en biblioteca
        const valoracion = crearBloqueValoracion(item.obra_id, item.valoracion, item.cantvalora, { soloEstrellas: true, actualizarVoto: true });
        li.querySelector('.user-progresion').insertAdjacentElement('afterend', valoracion);
  
      ul.appendChild(li);
    });
  
    cont.innerHTML = "";
    cont.appendChild(ul);
  
    if (typeof activarLinksPDF === "function") activarLinksPDF();
  }

/**
 * cargarTienda
 *
 * Realiza una petición al endpoint de avatares y renderiza las imágenes dentro
 * del contenedor '#avatarResultado'.
 *
 * Comportamiento:
 * - NO auto-inicia. Llamar manualmente: cargarTienda();
 * - NO añade listeners ni verifica si un panel está visible.
 * - Muestra un mensaje de carga y un mensaje genérico si no hay avatares o hay error.
 *
 * Requisitos del JSON esperado:
 * - Puede ser un array directamente o un objeto con { items: [...] }.
 * - Cada elemento debe contener al menos la propiedad `avatar_path`.
 *
 * Seguridad / notas:
 * - `img.src` se asigna directamente desde `avatar_path`. Si el endpoint puede
 *   devolver URLs no deseadas, valida/normaliza antes de asignar.
 * - `alt` se rellena con `descripcion` para accesibilidad; asegúrate de que ese
 *   campo sea descriptivo en el backend.
 *
 * @returns {Promise<void>} Promise que resuelve cuando termina la carga/render.
 */
/**
 * cargarTienda
 * - Lee endpoint y renderiza avatares en '#avatarResultado'.
 * - Inserta el campo numérico `precio` tal cual (sin formateo) en el card-footer.
 * - NO auto-inicia ni añade listeners; llama a cargarTienda() manualmente.
 */
async function cargarTienda() {
  if (!usuario_id && !token) return;
    const ENDPOINT = 'https://jabrascan.net/avatars';
    const tienda = document.querySelector('#tiendaResultado');
    const avatares = document.querySelector('#avatarResultado');
  if (!tienda || !avatares) return;
    tienda.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';
    avatares.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';

  try {
    const res = await authFetch(ENDPOINT, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const rows = Array.isArray(data) ? data : (data.items || []);

    if (!rows.length) {
      avatares.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
      tienda.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
      return;
    }

    // limpiar contenedores y crear filas
    tienda.innerHTML = '';
      const rowTienda = document.createElement('div');
        rowTienda.className = 'row g-2';
    avatares.innerHTML = '';
      const rowAvatares = document.createElement('div');
        rowAvatares.className = 'row g-2';

    rows.forEach(r => {
      const item = {
        src: String(r.avatar_path),
        alt: r.descripcion || '',
        precio: Object.prototype.hasOwnProperty.call(r, 'precio') ? r.precio : null,
        adquirido: r.adquirido
      };
      
      const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2 d-flex';
      // Clases de card
      const card = document.createElement('div');
        card.className = 'card p-1 text-center d-flex flex-column w-100';
      //insertamos imagen
      const img = document.createElement('img');
        img.src = item.src?v=20251128;
        img.alt = item.alt;
        img.className = 'img-fluid rounded';
        img.style.cursor = 'pointer';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.addEventListener('click', () => {
          document.querySelectorAll('#tiendaResultado img.selected, #avatarResultado img.selected')
            .forEach(i => i.classList.remove('selected', 'border', 'border-primary'));
          img.classList.add('selected', 'border', 'border-primary');
        });
      //caption del avatar
      const caption = document.createElement('div');
        caption.className = 'small text-truncate mt-1';
        caption.textContent = item.alt;
      // No insertar footer si ya está adquirido
      let footer = null;
        if (item.adquirido !== 'adquirido' && typeof item.precio === 'number' && Number.isFinite(item.precio)) {
          footer = document.createElement('div');
          footer.className = 'card-footer mt-auto bg-transparent border-0 small text-muted d-flex justify-content-center align-items-center';
          const icon = document.createElement('span');
          icon.className = 'me-1';
          icon.textContent = '💰';
          const priceText = document.createElement('span');
          priceText.textContent = String(item.precio);
          footer.appendChild(icon);
          footer.appendChild(priceText);
        }
      //agregamos a las cards
      card.appendChild(img);
        card.appendChild(caption);
        if (footer) card.appendChild(footer);
        col.appendChild(card);
      //repartir entre adquiridos y no adquiridos
        if (item.adquirido === 'adquirido') {
          attachAvatarOverlay(card, item, window.establecerAvatar);
          rowAvatares.appendChild(col);
        } else {
          rowTienda.appendChild(col);
        }
    });
    //añadimos a los respectivos tabs
      tienda.appendChild(rowTienda);
      avatares.appendChild(rowAvatares);
  } catch (err) {
    avatares.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
    tienda.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
  }
}
    /**
     * Establece el avatar del usuario llamando al endpoint remoto y actualiza
     * los elementos <img> en la página con la nueva ruta devuelta por el servidor.
     *
     * Requisitos previos (variables/funciones globales que debe haber en el entorno):
     *  - usuario_id: identificador del usuario (o valor falsy si no hay sesión)
     *  - token: token de autenticación (o valor falsy si no hay sesión)
     *  - authFetch(input, init): función que añade el header Authorization con el token y llama a fetch
     *
     * Comportamiento:
     *  - Si no hay usuario logueado (ni usuario_id ni token) sale sin hacer nada.
     *  - Llama al endpoint POST /usuarios/edit/avatar usando authFetch.
     *  - Si la respuesta HTTP no es OK devuelve un objeto { ok: false, status, error } con el cuerpo como texto.
     *  - Si la respuesta es OK parsea el JSON, extrae `avatar_path`, actualiza los atributos `src` de:
     *      - <img id="user-avatar" class="rounded-circle user-avatar">
     *      - <img id="avatar-img" class="rounded-circle me-3">
     *    y devuelve el objeto JSON recibido del servidor.
     *
     * Nota: no hay fallback en los cambios de src; se asigna directamente el valor devuelto.
     *
     * @param {string|number} avatarId - Id del avatar a establecer (se envía en el body JSON como { avatar: avatarId }).
     * @returns {Promise<object>} - Si éxito devuelve el JSON del endpoint; si error devuelve { ok: false, status?, error }.
     */
      async function establecerAvatar(avatarId) {
        // verificacion usuario logueado
        if (!usuario_id && !token) return;
        const ENDPOINT = 'https://jabrascan.net/usuarios/edit/avatar';
        await authFetch(ENDPOINT, { cache: 'no-cache' });
          try {
            // llamada al endpoint con authFetch (que añade el Authorization)
            const response = await authFetch(ENDPOINT, {
              method: 'POST',
              cache: 'no-cache',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ avatar: avatarId })
            });
            // manejo simple de errores
            if (!response.ok) {
              const text = await response.text().catch(() => response.statusText);
              return { ok: false, status: response.status, error: text };
            }      
          // parsear respuesta exitosa
          const data = await response.json();
          // cambiar src de los elementos
            const userAvatar = document.getElementById('user-avatar');
              if (userAvatar) userAvatar.src = data.avatar_path;      
            const avatarImg = document.getElementById('avatar-img');
              if (avatarImg) avatarImg.src = data.avatar_path;
          //
          return data;
        } catch (err) {
          // error de red u otro fallo en la llamada
          return { ok: false, error: err?.message || 'Error de red' };
        }
      }
/* actualizar todos los tabs con un select para dispositivos moviles */
      function bindTabsSelect() {
        const select = document.getElementById('tabsSelect');
        if (!select) return;
      
        // Si ya había un listener, lo quitamos
        if (select._tabsSelectHandler) {
          select.removeEventListener('change', select._tabsSelectHandler);
        }
      
        const handler = function () {
          const target = this.value;
          const tabButton = document.querySelector(`#usuarioTabs button[data-bs-target="${target}"]`);
          if (tabButton && window.bootstrap && typeof bootstrap.Tab === 'function') {
            new bootstrap.Tab(tabButton).show();
          } else {
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('show','active'));
            document.querySelector(target)?.classList.add('show','active');
          }
        };
      
        select.addEventListener('change', handler);
        // Guardamos la referencia para poder eliminarla la próxima vez
        select._tabsSelectHandler = handler;
      }
  // Añadir a la biblioteca (usa authFetch que añade Authorization automáticamente)
  // Devuelve siempre un objeto con la forma: { ok: boolean, data?, error?, status? }
  export async function addToBiblio(clave, { timeout = 8000 } = {}) {
    // Validación básica de entrada: clave debe ser una cadena no vacía
    if (!clave || typeof clave !== "string") {  return { ok: false, error: "obra NO válida" };      }  
    // Comprobación de autorización en cliente: evita llamadas sin token
    // (authFetch añade el header Authorization si la variable token está presente)
    if (!token) {  return { ok: false, error: "no autorizado" };    }
  
    const url = `${API_BASE}/biblioteca/add`;
    // AbortController para poder cancelar la petición si excede el timeout
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
      try {
        // Realiza la petición POST
        const res = await authFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ obra_id: clave }),
          signal: controller.signal
        });
        // Limpiar el timeout una vez recibida la respuesta
        clearTimeout(id);
        // Si no hay respuesta (caso raro), devolver error consistente
        if (!res) return { ok: false, error: "sin respuesta del servidor" };  
        // Intentar parsear la respuesta como JSON de forma segura
        let data;
        try {
          data = await res.json();
        } catch {
          // Si la respuesta no es JSON, devolvemos un error claro con el status
          return { ok: false, status: res.status, error: "Respuesta no JSON" };
        }  
        // Si el servidor devolvió un status de error, normalizamos la respuesta
        if (!res.ok) {  return { ok: false, status: res.status, error: data?.error || data };  }  
        // Éxito: devolvemos el payload recibido
        return { ok: true, data };
      } catch (err) {
          // Aseguramos limpiar el timeout en caso de excepción
          clearTimeout(id);
          // Tratamiento específico para cancelación por timeout
          if (err && err.name === "AbortError") {
            return { ok: false, error: "La petición fue cancelada (timeout)" };
          }
          // Error genérico: devolvemos mensaje legible
          return { ok: false, error: err?.message || String(err) };
      }
  }
    /**
     * Añade un overlay con botón "+ Establecer Avatar" a una tarjeta (card).
     *
     * @param {HTMLElement} card  Elemento .card donde se añadirá el overlay.
     * @param {Object} item      Objeto asociado al avatar (se pasa a onSet).
     * @param {Function} onSet   Función llamada cuando se pulsa el botón: onSet(item, card).
     * @returns {Function}       Función de limpieza: llama para quitar listeners y elementos añadidos.
     */
      function attachAvatarOverlay(card, item = {}, onSet = () => {}) {
        if (!card || !(card instanceof HTMLElement)) throw new TypeError('card debe ser un HTMLElement');
      
        // Si ya tiene overlay, actualizamos el item y devolvemos la función de cleanup existente
        if (card._avatarOverlay) {
          card._avatarOverlay.item = item;
          card._avatarOverlay.onSet = onSet;
          return card._avatarOverlay.cleanup;
        }
      
        // Crear elementos
        const backdrop = document.createElement('div');
        const btn = document.createElement('button');
      
        // Marcar para evitar duplicados
        card._avatarOverlay = { item, onSet, backdrop, btn, cleanup: null };
      
        // Clases/estilos mínimos y no intrusivos (puedes mover a CSS si prefieres)
        backdrop.className = 'avatar-overlay-backdrop';
        Object.assign(backdrop.style, {
          position: 'absolute',
          inset: '0',
          background: 'rgba(0,0,0,0.25)',
          display: 'none',
          zIndex: '5',
          pointerEvents: 'none'
        });
      
        btn.type = 'button';
        btn.className = 'avatar-overlay-btn';
        btn.textContent = '+ Establecer Avatar';
        btn.setAttribute('aria-label', 'Establecer avatar');
        Object.assign(btn.style, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'none',
          zIndex: '10',
          padding: '0.35rem 0.6rem',
          fontSize: '0.9rem',
          borderRadius: '0.35rem',
          border: 'none',
          background: 'rgba(0, 123, 255, 0.95)',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
        });
      
        // Asegurar que el card sea contenedor posicionado para overlay
        const prevPosition = card.style.position || '';
        if (getComputedStyle(card).position === 'static') {
          card.style.position = 'relative';
          card._avatarOverlay._restoredPosition = true;
        }
      
        // Insertar al final del card para no interferir con tu estructura
        card.appendChild(backdrop);
        card.appendChild(btn);
      
        // Mostrar/ocultar helpers
        function showOverlay() {
          // ocultar otros overlays
          document.querySelectorAll('.avatar-overlay-btn.show').forEach(b => {
            b.classList.remove('show');
            b.style.display = 'none';
          });
          document.querySelectorAll('.avatar-overlay-backdrop.show').forEach(d => {
            d.classList.remove('show');
            d.style.display = 'none';
          });
      
          btn.classList.add('show');
          backdrop.classList.add('show');
          btn.style.display = 'inline-block';
          backdrop.style.display = 'block';
        }
        function hideOverlay() {
          btn.classList.remove('show');
          backdrop.classList.remove('show');
          btn.style.display = 'none';
          backdrop.style.display = 'none';
        }
      
        // Click en el botón: ejecutar callback con item y card
        function onBtnClick(ev) {
          ev.stopPropagation();
          try {
            // permitir que el callback maneje la lógica (petición, UI, etc.)
            card._avatarOverlay.onSet(card._avatarOverlay.item, card);
          } finally {
            // opcional: ocultar overlay tras pulsar
            hideOverlay();
          }
        }
      
        // Click en la tarjeta: mostrar overlay (si el click no fue sobre el botón)
        function onCardClick(ev) {
          // Si el click fue sobre el botón, el handler del botón ya lo gestiona
          if (btn.contains(ev.target)) return;
          showOverlay();
      
          // mantener la selección visual si hay imágenes dentro
          const img = card.querySelector('img');
          if (img) {
            document.querySelectorAll('#tiendaResultado img.selected, #avatarResultado img.selected')
              .forEach(i => i.classList.remove('selected', 'border', 'border-primary'));
            img.classList.add('selected', 'border', 'border-primary');
          }
        }
      
        // Click global fuera de cualquier card: ocultar overlays
        function onDocClick(ev) {
          // si el click está dentro de algún .avatar-overlay-btn o .avatar-card, no ocultar
          if (ev.target.closest('.avatar-overlay-btn') || ev.target.closest('.avatar-card')) return;
          // ocultar todos
          document.querySelectorAll('.avatar-overlay-btn.show').forEach(b => {
            b.classList.remove('show');
            b.style.display = 'none';
          });
          document.querySelectorAll('.avatar-overlay-backdrop.show').forEach(d => {
            d.classList.remove('show');
            d.style.display = 'none';
          });
        }
      
        // Añadir listeners
        btn.addEventListener('click', onBtnClick);
        card.addEventListener('click', onCardClick);
        document.addEventListener('click', onDocClick, true);
      
        // Guardar cleanup para poder eliminar todo si se necesita
        function cleanup() {
          btn.removeEventListener('click', onBtnClick);
          card.removeEventListener('click', onCardClick);
          document.removeEventListener('click', onDocClick, true);
          if (btn.parentNode === card) card.removeChild(btn);
          if (backdrop.parentNode === card) card.removeChild(backdrop);
          if (card._avatarOverlay && card._avatarOverlay._restoredPosition) {
            card.style.position = prevPosition;
          }
          delete card._avatarOverlay;
        }
      
        card._avatarOverlay.cleanup = cleanup;
      
        // Exponer método para actualizar item/onSet si es necesario
        card._avatarOverlay.update = function (newItem, newOnSet) {
          card._avatarOverlay.item = newItem;
          if (typeof newOnSet === 'function') card._avatarOverlay.onSet = newOnSet;
        };
      
        return cleanup;
      }


// -------------------------------------------------
// initUsuario
// Orquestador que arranca la carga de datos asumiendo que
// el HTML de usuario ya fue insertado en el DOM por general.js.
// -------------------------------------------------
  export async function initUsuario() {
    // Llamadas a las funciones que manipulan el DOM / datos.
    // Se asume que cargarPerfil y las demás gestionan sus propios errores y fallbacks.
      //sincronizar el select
        bindTabsSelect();
    try {
      // 1. Ejecutar las tres funciones async al mismo tiempo
        const perfilPromise = cargarPerfil();
        const bibliotecaPromise = cargarBiblioteca();
        const obrasPromise = cargarObras();
        const tiendaPromise = cargarTienda();
      // 2. Usar Promise.all() para esperar a que las tres promesas se resuelvan
        const results = await Promise.allSettled([perfilPromise, bibliotecaPromise, obrasPromise, tiendaPromise]);
    
        const perfil = results[0].status === 'fulfilled' ? results[0].value : undefined;
        const biblioteca = results[1].status === 'fulfilled' ? results[1].value : undefined;
        const obras = results[2].status === 'fulfilled' ? results[2].value : undefined;
    } catch (err) {
      // Error de orquestación: registrar para depuración
      console.error('initUsuario: error al arrancar cargas', err);
    }
  }
  
  // -------------------------------------------------
  // API pública (opcional) que expone funciones para uso desde la consola
  // o desde otros módulos. Esto no sustituye la llamada directa desde general.js.
  // -------------------------------------------------
  window.usuarioAPI = {
    initUsuario
  };
