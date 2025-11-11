//const WORKER_URL = "https://logingooglemeta.jabrarexscan.workers.dev";
const WORKER_URL = "https://jabrascan.net";

// Acciones de login
function loginGoogle() {
  window.location.href = `${WORKER_URL}/auth/google`;
}
function loginMeta() {
  window.location.href = `${WORKER_URL}/auth/meta`;
}

// UI helpers
function showLoginButton() {
  const loginWrapper = document.getElementById("login-wrapper");
  const userWrapper = document.getElementById("user-nick-wrapper");
  if (loginWrapper) loginWrapper.classList.remove("d-none"); // 👈 muestra el LI de login
  if (userWrapper) userWrapper.classList.add("d-none");      // 👈 oculta el LI de usuario
}

function showUserNick(name) {
  const loginWrapper = document.getElementById("login-wrapper");
  const userWrapper = document.getElementById("user-nick-wrapper");
  const nick = document.getElementById("user-nick");

  if (loginWrapper) loginWrapper.classList.add("d-none");    // 👈 oculta el LI de login
  if (userWrapper && nick) {
    nick.textContent = name;
    userWrapper.classList.remove("d-none");                  // 👈 muestra el LI de usuario
  }
}

// Captura token de la URL (?token=XYZ) y limpia la URL
(function initSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");

  console.log("URL actual:", window.location.href);        // 👈 log 1
  console.log("Token capturado:", tokenFromUrl);           // 👈 log 2

  if (tokenFromUrl) {
    localStorage.setItem("jwt", tokenFromUrl);
    console.log("Token guardado en localStorage:", tokenFromUrl); // 👈 log 3

    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.href = "/index.html"; // o "/" según tu hosting
  }
})();

// Estado de sesión al cargar index
(async function checkSessionOnLoad() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    showLoginButton();
    return;
  }

  try {
    const res = await fetch(`${WORKER_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Token inválido o expirado");
    const data = await res.json();
    const name =
      (data.usuario && (data.usuario.nombre || data.usuario.name)) || "Usuario";
    showUserNick(name);
  } catch (e) {
    console.warn("Sesión no válida:", e.message);
    localStorage.removeItem("jwt");
    showLoginButton();
  }
})();

//cerrar sesion
function logout() {
  // Eliminar el token guardado
  localStorage.removeItem("jwt");
  // Mostrar el botón de login y ocultar el nombre del usuario
  showLoginButton();
  // Opcional: redirigir al inicio o a la página de login
  window.location.href = "/index.html";
}
