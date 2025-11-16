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

  const res = await authFetch(url);
  const data = await res.json();

  const idEl = document.getElementById("usuario_id");
  const nickEl = document.getElementById("nick");
  const avatarEl = document.getElementById("avatar");

  if (idEl) idEl.textContent = data.usuario_id || usuario_id;
  if (nickEl) nickEl.textContent = data.nick || "(sin nick)";
  if (avatarEl) avatarEl.src = data.avatar || "https://via.placeholder.com/80";
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
