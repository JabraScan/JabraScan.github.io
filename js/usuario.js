// -------------------------
// Config
// -------------------------
const API_BASE = "https://jabrascan.net";

// -------------------------
// Redirección si no hay login (no bloquea el resto del código)
// -------------------------
const usuario_id = localStorage.getItem('usuario_id');
const token = localStorage.getItem("jwt");
const path = window.location.pathname.split('/').pop(); // obtiene el nombre del archivo
if (path === 'usuario.html' || path === 'login.html') {
  if (!usuario_id) {
    window.location.replace('/');
  }
}

// -------------------------
// Verificar/inyectar Bootstrap solo si falta
// -------------------------
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

// -------------------------
// Helper fetch que inyecta Authorization si hay token
// -------------------------
function authFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

// -------------------------
// API Worker
// -------------------------
export async function cargarPerfil() {
  console.log('cargaPerfil');
  if (!usuario_id && !token) return;

  // Si hay token preferimos usarla (el Worker la toma como preferencia)
  const url = token
    ? `${API_BASE}/usuarios/get`
    : `${API_BASE}/usuarios/get?usuario_id=${encodeURIComponent(usuario_id)}`;
console.log(`url : ${url} - user ${usuario_id} - token ${token}`);
  const res = await authFetch(url);
  const data = await res.json();

  const idEl = document.getElementById("usuario_id");
  const nickEl = document.getElementById("nick");
  const avatarEl = document.getElementById("avatar");

  if (idEl) idEl.textContent = data.usuario_id || usuario_id;
  if (nickEl) nickEl.textContent = data.nick || "(sin nick)";
  if (avatarEl) avatarEl.src = data.avatar || "/img/avatar/default.webp";
}

export async function cargarBiblioteca() {
  if (!usuario_id && !token) return;

  const url = token
    ? `${API_BASE}/biblioteca/list`
    : `${API_BASE}/biblioteca/list?usuario_id=${encodeURIComponent(usuario_id)}`;

  const res = await authFetch(url);
  const data = await res.json();

  const cont = document.getElementById("bibliotecaResultado");
  if (!cont) return;

  let html = "<ul class='list-group'>";
  data.forEach(o => {
    html += `<li class="list-group-item">
      <strong>${o.nombreobra}</strong> (Estado: ${o.estado})<br>
      Última lectura: ${o.fechaUltimaLectura || "-"}
    </li>`;
  });
  html += "</ul>";
  cont.innerHTML = html;
}

export async function cargarObras() {
  if (!usuario_id && !token) return;

  // Recuperar perfil (preferir token)
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

  // Llamada al search; mantenemos el parámetro uploader por compatibilidad con clientes antiguos.
  // El Worker preferirá el token si está presente.
  const obrasUrl = `${API_BASE}/obras/search?visible=1&uploader=${encodeURIComponent(usuario_id || "")}`;
  const obrasRes = await authFetch(obrasUrl);
  const obras = await obrasRes.json();

  let html = "<ul class='list-group'>";
  obras.forEach(o => {
    html += `<li class="list-group-item">
      <strong>${o.titulo || o.nombreobra || ''}</strong><br>
      Categoría: ${o.categoria || "-"}
    </li>`;
  });
  html += "</ul>";
  cont.innerHTML = html;
}

// -------------------------
// Inicialización idempotente (no bloquea si ya cargaste Bootstrap antes)
// -------------------------
export function initUsuario() {
  /*
  if (window.usuarioInitialized) return;
  window.usuarioInitialized = true;
  */
  cargarPerfil();
  cargarBiblioteca();
  cargarObras();
}

// Ejecuta al cargar DOM (una sola vez)
document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", initUsuario, { once: true })
  : initUsuario();

// Opcional: expone API global para usar desde tu JSA
window.usuarioAPI = {
  cargarPerfil,
  cargarBiblioteca,
  cargarObras
};

//carga de imagenes de avatar dinámica
document.addEventListener('DOMContentLoaded', () => {
  // Referencias al botón de la pestaña y al contenedor donde se mostrarán los avatares
  const avatarTabBtn = document.querySelector('#avatar-tab');
  const avatarResultEl = document.querySelector('#avatarResultado');
  if (!avatarTabBtn || !avatarResultEl) return; // protección por si cambian IDs

  // Flags para evitar recargas / reentradas
  let avatarsLoaded = false;       // true una vez que ya se han renderizado (éxito o fallo)
  let loadingInProgress = false;   // true mientras se está haciendo fetch/parsing

  /**
   * renderAvatars(list)
   * list: array de { src: string, alt: string }
   * Construye y sustituye el contenido de avatarResultEl por una rejilla Bootstrap.
   */
  function renderAvatars(list) {
    const row = document.createElement('div');
    row.className = 'row g-2';

    list.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';

      const card = document.createElement('div');
      card.className = 'card p-1 text-center';

      const img = document.createElement('img');
      img.src = item.src;             // ruta relativa: img/avatar/<nombre>
      img.alt = item.alt || '';
      img.className = 'img-fluid rounded';
      img.style.cursor = 'pointer';

      // Click en imagen: marcar selección visualmente (no guarda nada por defecto)
      img.addEventListener('click', () => {
        // des-marcar cualquier selección previa
        document.querySelectorAll('#avatarResultado img.selected')
          .forEach(i => i.classList.remove('selected','border','border-primary'));
        // marcar la seleccionada
        img.classList.add('selected','border','border-primary');

        // Aquí puedes llamar a tu función para persistir la selección (no incluida)
        // ej: saveAvatarSelection(item.src);
      });

      const caption = document.createElement('div');
      caption.className = 'small text-truncate mt-1';
      caption.textContent = item.alt || '';

      card.appendChild(img);
      card.appendChild(caption);
      col.appendChild(card);
      row.appendChild(col);
    });

    // Reemplazar contenido del contenedor
    avatarResultEl.innerHTML = '';
    avatarResultEl.appendChild(row);
  }

  /**
   * extractImageNamesFromHtml(htmlText)
   * - Parsea el HTML de un listado de directorio (index) y extrae nombres de ficheros
   * - Busca en <a href> y <img src>
   * - Filtra sólo extensiones de imagen (webp|jpg|jpeg|png)
   * - Ignora rutas externas absolutas
   * - Devuelve array de nombres (sin ruta), orden estable y deduplicado
   */
  function extractImageNamesFromHtml(htmlText) {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    const candidates = new Set();

    // Recoger posibles rutas desde enlaces y desde imágenes
    Array.from(doc.querySelectorAll('a[href]')).forEach(a => {
      const href = a.getAttribute('href');
      if (href) candidates.add(href);
    });
    Array.from(doc.querySelectorAll('img[src]')).forEach(i => {
      const src = i.getAttribute('src');
      if (src) candidates.add(src);
    });

    // Filtrar y normalizar sólo ficheros de imagen locales
    const imgs = [];
    const IMG_RE = /\.(webp|jpe?g|png)$/i;

    candidates.forEach(p => {
      // ignorar URLs absolutas (externas)
      if (/^https?:\/\//i.test(p)) return;
      // extraer el nombre del fichero de la ruta (último segmento)
      const name = p.split('/').filter(Boolean).pop();
      if (name && IMG_RE.test(name)) imgs.push(name);
    });

    // Deduplicado y devolución como array estable
    return Array.from(new Set(imgs));
  }

  /**
   * loadAvatarsFromDirectoryIndex()
   * - Intenta fetch GET /img/avatar/
   * - Si recibe HTML con enlaces/imagenes, extrae nombres y renderiza
   * - Si falla (respuesta no ok o no encuentra imágenes), marca como cargado y muestra mensaje
   *
   * Nota: según tu petición, **NO** realiza probing de ficheros ni llama a endpoints externos.
   */
  async function loadAvatarsFromDirectoryIndex() {
    // evitar dobles llamadas
    if (avatarsLoaded || loadingInProgress) return;
    loadingInProgress = true;

    // indicador visual de carga mientras se resuelve
    avatarResultEl.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';

    try {
      // Intentar obtener el índice de directorio que el servidor pueda servir
      // (p.ej. Apache/Nginx con autoindex activo). No se asume otro endpoint.
      const resp = await fetch('/img/avatar/', { cache: 'no-cache' });
      if (!resp.ok) throw new Error('no directory index');

      const text = await resp.text();
      const names = extractImageNamesFromHtml(text);

      // si no se encuentran nombres válidos, consideramos que no hay imágenes
      if (!names.length) throw new Error('no images in index');

      // Construir lista completa de objetos con ruta y alt
      const list = names
        .filter(n => /\.(webp|jpe?g|png)$/i.test(n))
        .map(n => ({ src: `img/avatar/${n}`, alt: n.replace(/\.(webp|jpe?g|png)$/i, '') }));

      // Renderizar y marcar cargado
      renderAvatars(list);
      avatarsLoaded = true;
      loadingInProgress = false;
      return;
    } catch (e) {
      // Si falla (no hay index, error de red, etc.), mostrar mensaje y no intentar más
      avatarResultEl.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
      avatarsLoaded = true;         // evitar reintentos posteriores
      loadingInProgress = false;
      return;
    }
  }

  // Disparadores para cargar una sola vez:
  // - click en el botón de la pestaña (usuario interactúa)
  // - shown.bs.tab por Bootstrap (si la pestaña se activa por JS u otros medios)
  avatarTabBtn.addEventListener('click', () => loadAvatarsFromDirectoryIndex());
  avatarTabBtn.addEventListener('shown.bs.tab', () => loadAvatarsFromDirectoryIndex());

  // Caso especial: si la pestaña ya está activa al cargar el documento, cargar inmediatamente
  const pane = document.querySelector('#avatar');
  if (pane && pane.classList.contains('show') && pane.classList.contains('active')) {
    loadAvatarsFromDirectoryIndex();
  }
});


