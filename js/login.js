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
  const btn = document.querySelector(".btn-login");
  const nick = document.getElementById("user-nick");
  if (btn) btn.style.display = "";
  if (nick) {
    nick.style.display = "none";
    nick.textContent = "";
  }
}

function showUserNick(name) {
  const btn = document.querySelector(".btn-login");
  const nick = document.getElementById("user-nick");
  if (btn) btn.style.display = "none";
  if (nick) {
    nick.style.display = "";
    nick.textContent = name;
  }
}

// Captura token de la URL (?token=XYZ) y limpia la URL
(function initSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  if (tokenFromUrl) {
    localStorage.setItem("jwt", tokenFromUrl);
    window.history.replaceState({}, document.title, window.location.pathname);
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
