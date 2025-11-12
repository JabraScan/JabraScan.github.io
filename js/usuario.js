// Evitar cargar dos veces
if (!window.usuarioJSLoaded) {
  window.usuarioJSLoaded = true;

  // -------------------------
  // Verificar Bootstrap
  // -------------------------
  const bootstrapCSS = Array.from(document.styleSheets)
    .some(sheet => sheet.href && sheet.href.includes("bootstrap"));
  if (!bootstrapCSS) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
    document.head.appendChild(link);
  }

  const bootstrapJS = Array.from(document.scripts)
    .some(script => script.src && script.src.includes("bootstrap"));
  if (!bootstrapJS) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
    document.body.appendChild(script);
  }

  // -------------------------
  // API Worker
  // -------------------------
  const API_BASE = "https://jabrascan.net";
  const usuario_id = localStorage.getItem("usuario_id");

  async function cargarPerfil() {
    if (!usuario_id) return;
    const res = await fetch(`${API_BASE}/usuarios/get?usuario_id=${usuario_id}`);
    const data = await res.json();
    document.getElementById("usuario_id").textContent = data.usuario_id;
    document.getElementById("nick").textContent = data.nick || "(sin nick)";
    document.getElementById("avatar").src = data.avatar || "https://via.placeholder.com/80";
  }

  async function cargarBiblioteca() {
    if (!usuario_id) return;
    const res = await fetch(`${API_BASE}/biblioteca/list?usuario_id=${usuario_id}`);
    const data = await res.json();
    let html = "<ul class='list-group'>";
    data.forEach(o => {
      html += `<li class="list-group-item">
        <strong>${o.nombreobra}</strong> (Estado: ${o.estado})<br>
        Última lectura: ${o.fechaUltimaLectura || "-"}
      </li>`;
    });
    html += "</ul>";
    document.getElementById("bibliotecaResultado").innerHTML = html;
  }

  async function cargarObras() {
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

  // Inicializar
  document.addEventListener("DOMContentLoaded", () => {
    cargarPerfil();
    cargarBiblioteca();
    cargarObras();
  });

  // Exponer funciones
  window.usuarioAPI = { cargarPerfil, cargarBiblioteca, cargarObras };
}
