import { activarLinksPDF } from './eventos.js';
import { actualizarEstrellas, crearBloqueValoracion, createImg } from './utils.js';

// -------------------------
// /js/usuario.js
// Módulo responsable de cargar y renderizar datos del usuario.
// No contiene auto-ejecución: general.js debe importar y llamar initUsuario
// -------------------------

// Funciones existentes que ya tienes (se asume que ya están definidas en este archivo)
// - fetchPerfil
// - renderPerfil
// - cargarPerfil
// - cargarBiblioteca
// - cargarObras


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
      // URL sin query: el servidor debe extraer el usuario desde el token
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

      // Opciones para los ids de los elementos del DOM (no hay id de usuario en los datos)
      //const {
      //  nickSelector = "nick",
      //  avatarSelector = "avatar-img",
      //  avatarFallback = "/img/avatar/default.webp"
      //} = opts;
      // Buscar elementos en el DOM
      //const nickEl = document.getElementById(nickSelector);
      //const avatarEl = document.getElementById(avatarSelector);

        //crear imagen avatar (cuando este activa la opcion con diferentes tamaños
        //  const newavatar = createImg(data.avatar || avatarFallback, data.nick, "perfilUsuario");
        //    newImg.id = avatarEl.id;
        //    newImg.className = "rounded-circle me-3";
        // reemplazar en el DOM (mantiene la posición original)
        //avatarEl.parentNode.replaceChild(newImg, avatarEl);
      // Asignaciones seguras
      //if (nickEl) nickEl.textContent = data.nick || "(sin nick)";
      //if (avatarEl) avatarEl.src = data.avatar || avatarFallback;
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
      try {
        // Obtener datos del servidor
        const data = await fetchPerfil();    
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
    }
  //FIN CARGA PERFIL USUARIO

  export async function cargarBiblioteca() {
    if (!usuario_id && !token) return;
  
    const url = `${API_BASE}/biblioteca/list?usuario_id=${encodeURIComponent(usuario_id)}`;
  
    const res = await authFetch(url);
    const data = await res.json();
  
    const cont = document.getElementById("bibliotecaResultado");
    if (!cont) return;
  
    const ul = document.createElement("ul");
    ul.className = "list-group";
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
            <div class="d-flex justify-content-between user-main">
              <h5 class="mb-1">${item.nombreobra || ''}</h5>
              <small class="text-muted">${item.estado ? `Estado: ${item.estado}` : ''}</small>
            </div>
            <div class="d-flex justify-content-between user-lastChapter">
              <a href="#" data-pdf-obra="${item.obra_id}" data-pdf-capitulo="${item.numCapitulo ?? item.ultimoCapituloLeido ?? '-'}" class="pdf-link">
                <span>${item.numCapitulo ?? item.ultimoCapituloLeido ?? '-'}: ${item.nombreCapitulo || '-'}</span>
              </a>
            </div>
            <div class="d-flex justify-content-between">
              <small class="text-muted user-progresion">${item.numCapitulo || '-'} / ${item.maxCapitulos || '-'} ( ${item.porcenLeido || '-'}% )</small>
            </div>
            <input type="hidden" class="obra-id" value="${item.obra_id ?? ''}">
          </div>
        `;
        //añadimos valoraciones para usuario
        const valoracion = crearBloqueValoracion(item.obra_id, item.valoracion, item.cantvalora, { soloEstrellas: true, actualizarVoto: true });
        li.querySelector('.user-progresion').insertAdjacentElement('afterend', valoracion);
        //prueba para insertar imagen con diferentes tamaños
          //const imgSrc = srcCandidate || FALLBACK_IMG || "";
            //const newImg = createImg(imgSrc, item.obra_id, "BibliotecaUsuario");
            //newImg.className = "img-thumbnail";
          //li.prepend(newImg);  
        ul.appendChild(li);
      });
    cont.appendChild(ul);
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
    // Requisito: solo funciona si hay token (no se hace llamada cuando no hay token)
    if (!token) return;
  
    const url = `${API_BASE}/obras/traductores`;
  
    // Petición usando authFetch (se asume que authFetch añade Authorization cuando corresponde)
    const res = await authFetch(url);
    if (!res || !res.ok) return;
    const data = await res.json();
  
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
  
    /*document.querySelectorAll('#obrasResultado .obra-link').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const obraId = a.dataset.obra;
        if (!obraId) return;
        if (typeof abrirFichaObra === 'function') abrirFichaObra(obraId);
        else console.log('Abrir obra', obraId);
      });
    });*/
  }



/*export async function cargarObras() {
  if (!usuario_id && !token) return;

  const perfilUrl = token
    ? `${API_BASE}/usuarios/get`
    : `${API_BASE}/usuarios/get?usuario_id=${encodeURIComponent(usuario_id)}`;
  const perfilRes = await authFetch(perfilUrl);
  const perfil = await perfilRes.json();

  const cont = document.getElementById("obrasResultado");
  if (!cont) return;

  if (perfil.rol !== "uploader" && perfil.rol !== "admin") {
    cont.innerHTML = "<div class='alert alert-info'>No eres uploader, no tienes obras propias.</div>";
    return;
  }

  const obrasUrl = `${API_BASE}/obras/search?visible=1&uploader=${encodeURIComponent(usuario_id || "")}`;
  const obrasRes = await authFetch(obrasUrl);
  const obras = await obrasRes.json();

  let html = "<ul class='list-group'>";
  (Array.isArray(obras) ? obras : []).forEach(o => {
    html += `<li class="list-group-item">
      <strong>${o.titulo || o.nombreobra || ''}</strong><br>
      Categoría: ${o.categoria || "-"}
    </li>`;
  });
  html += "</ul>";
  cont.innerHTML = html;
}*/

// -------------------------
// Avatar loader (lee índice de directorio /img/avatar/)
// - carga una sola vez al activarse la pestaña
// -------------------------
(function setupAvatarLoader() {
  function init() {
    const avatarTabBtn = document.querySelector('#avatar-tab');
    const avatarResultEl = document.querySelector('#avatarResultado');
    if (!avatarTabBtn || !avatarResultEl) return;

    let avatarsLoaded = false;
    let loadingInProgress = false;

    function renderAvatars(list) {
      const row = document.createElement('div');
      row.className = 'row g-2';
      list.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
        const card = document.createElement('div');
        card.className = 'card p-1 text-center';
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt || '';
        img.className = 'img-fluid rounded';
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
          document.querySelectorAll('#avatarResultado img.selected')
            .forEach(i => i.classList.remove('selected','border','border-primary'));
          img.classList.add('selected','border','border-primary');
        });
        const caption = document.createElement('div');
        caption.className = 'small text-truncate mt-1';
        caption.textContent = item.alt || '';
        card.appendChild(img);
        card.appendChild(caption);
        col.appendChild(card);
        row.appendChild(col);
      });
      avatarResultEl.innerHTML = '';
      avatarResultEl.appendChild(row);
    }

    function extractImageNamesFromHtml(htmlText) {
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');
      const candidates = new Set();
      Array.from(doc.querySelectorAll('a[href]')).forEach(a => {
        const href = a.getAttribute('href');
        if (href) candidates.add(href);
      });
      Array.from(doc.querySelectorAll('img[src]')).forEach(i => {
        const src = i.getAttribute('src');
        if (src) candidates.add(src);
      });
      const imgs = [];
      const IMG_RE = /\.(webp|jpe?g|png)$/i;
      candidates.forEach(p => {
        if (/^https?:\/\//i.test(p)) return;
        const name = p.split('/').filter(Boolean).pop();
        if (name && IMG_RE.test(name)) imgs.push(name);
      });
      return Array.from(new Set(imgs));
    }
    async function loadAvatars() {
      if (avatarsLoaded || loadingInProgress) return;
      loadingInProgress = true;
      avatarResultEl.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';
    
      try {
        const resp = await fetch('https://jabrascan.net/avatars', { cache: 'no-cache' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const payload = await resp.json();
        const rows = Array.isArray(payload) ? payload : (payload.items || []);
    
        const list = rows
          .map(r => {
            if (!r || r.avatar_path == null) return null;
            const src = String(r.avatar_path);
            const alt = r.descripcion; // valor directo, sin controles ni normalizaciones
            return { src, alt };
          })
          .filter(Boolean);
          if (list.length) {
            renderAvatars(list);
          } else {
            avatarResultEl.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
          }
        avatarsLoaded = true;
        loadingInProgress = false;
        return;
      } catch (e) {
        avatarResultEl.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
        avatarsLoaded = true;
        loadingInProgress = false;
        return;
      }
    }
    //fin loadAvatars
    loadAvatars
    avatarTabBtn.addEventListener('click', () => loadAvatars());
    avatarTabBtn.addEventListener('shown.bs.tab', () => loadAvatars());

    const pane = document.querySelector('#avatar');
    if (pane && pane.classList.contains('show') && pane.classList.contains('active')) {
      loadAvatars();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

// -------------------------------------------------
// initUsuario
// Orquestador que arranca la carga de datos asumiendo que
// el HTML de usuario ya fue insertado en el DOM por general.js.
// -------------------------------------------------
  export function initUsuario() {
    // Llamadas a las funciones que manipulan el DOM / datos.
    // Se asume que cargarPerfil y las demás gestionan sus propios errores y fallbacks.
    try {
      cargarPerfil();
      cargarBiblioteca();
      cargarObras();
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
    cargarPerfil,
    cargarBiblioteca,
    cargarObras,
    initUsuario
  };
