// -------------------------
// Config
// -------------------------
const API_BASE = "https://jabrascan.net";

// -------------------------
// Redirección si no hay login (no bloquea el resto del código)
// -------------------------
/*const usuario_id = localStorage.getItem("usuario_id");
if (!usuario_id) {
  // si no hay usuario, redirige a la raíz
  window.location.replace("/");
}*/

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
// API Worker
// -------------------------
export async function cargarPerfil() {
    console.log('carga');
  if (!usuario_id) return;
  console.log(  usuario_id);
  const res = await fetch(`${API_BASE}/usuarios/get?usuario_id=${usuario_id}`);
  const data = await res.json();

  const idEl = document.getElementById("usuario_id");
  const nickEl = document.getElementById("nick");
  const avatarEl = document.getElementById("avatar");

  if (idEl) idEl.textContent = data.usuario_id || usuario_id;
  if (nickEl) nickEl.textContent = data.nick || "(sin nick)";
  if (avatarEl) avatarEl.src = data.avatar || "https://via.placeholder.com/80";
}

export async function cargarBiblioteca() {
  if (!usuario_id) return;
  const res = await fetch(`${API_BASE}/biblioteca/list?usuario_id=${usuario_id}`);
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
  if (!usuario_id) return;
  const perfilRes = await fetch(`${API_BASE}/usuarios/get?usuario_id=${usuario_id}`);
  const perfil = await perfilRes.json();

  const cont = document.getElementById("obrasResultado");
  if (!cont) return;

  if (perfil.rol !== "uploader" && perfil.rol !== "admin") {
    cont.innerHTML = "<div class='alert alert-info'>No eres uploader, no tienes obras propias.</div>";
    return;
  }

  const obrasRes = await fetch(`${API_BASE}/obras/search?visible=1&uploader=${usuario_id}`);
  const obras = await obrasRes.json();

  let html = "<ul class='list-group'>";
  obras.forEach(o => {
    html += `<li class="list-group-item">
      <strong>${o.titulo}</strong><br>
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
