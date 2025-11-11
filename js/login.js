const WORKER_URL = "https://jabrascan.net";

// Acciones de login
function loginGoogle() {
  // 👉 Redirige al endpoint de login con Google en tu Worker
  window.location.href = `${WORKER_URL}/auth/google`;
}
function loginMeta() {
  // 👉 Redirige al endpoint de login con Meta (Facebook) en tu Worker
  window.location.href = `${WORKER_URL}/auth/meta`;
}

// UI helpers
function showLoginButton() {
  const loginWrapper = document.getElementById("login-wrapper");
  const userWrapper = document.getElementById("user-nick-wrapper");
  if (loginWrapper) loginWrapper.classList.remove("d-none"); // 👈 muestra el LI de login
  if (userWrapper) userWrapper.classList.add("d-none");      // 👈 oculta el LI de usuario
}

function showUserNick(nickname, avatar) {
  const loginWrapper = document.getElementById("login-wrapper");
  const userWrapper = document.getElementById("user-nick-wrapper");
  const nick = document.getElementById("user-nick");
  const avatarImg = document.getElementById("user-avatar"); // 👈 asegúrate de tener <img id="user-avatar">

  if (loginWrapper) loginWrapper.classList.add("d-none");    // 👈 oculta el LI de login
  if (userWrapper && nick) {
    nick.textContent = nickname;                             // 👈 muestra el nickname
    if (avatarImg) avatarImg.src = avatar;                   // 👈 muestra el avatar
    userWrapper.classList.remove("d-none");                  // 👈 muestra el LI de usuario
  }
}

// Captura token de la URL (?token=XYZ) y limpia la URL
function initSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");

  console.log("URL actual:", window.location.href);        // 👈 log 1
  console.log("Token capturado:", tokenFromUrl);           // 👈 log 2

  if (tokenFromUrl) {
    localStorage.setItem("jwt", tokenFromUrl);               // 👈 guarda el JWT en localStorage
    console.log("Token guardado en localStorage:", tokenFromUrl); // 👈 log 3

    // 🔎 Nuevo: ya no decodificamos el JWT porque solo lleva sub/iat/exp
    // Los datos del usuario se obtienen siempre desde /me
    window.history.replaceState({}, document.title, window.location.pathname); // 👈 limpia la URL
    window.location.href = "/"; // 👈 redirige al inicio
  }
}

// Estado de sesión al cargar index
async function checkSessionOnLoad() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    showLoginButton();
    return;
  }

  try {
    // Validar token con el backend en segundo plano
    const res = await fetch(`${WORKER_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Token inválido o expirado");
    const data = await res.json();

    // 🔎 Nuevo: ahora /me devuelve id, nickname y avatar
    const nickname = (data.usuario && data.usuario.nickname) || "Usuario";
    const avatar = (data.usuario && data.usuario.avatar) || "/img/default-avatar.png";

    // Guardar datos mínimos en localStorage
    localStorage.setItem("user_id", data.usuario.id);
    localStorage.setItem("user_nickname", nickname);
    localStorage.setItem("user_avatar", avatar);

    showUserNick(nickname, avatar); // 👈 pinta nickname y avatar en la UI
  } catch (e) {
    console.warn("Sesión no válida:", e.message);
    localStorage.clear(); // 👈 borra todo si el token no es válido
    showLoginButton();
  }
}

//cerrar sesion
function logout() {
  // Eliminar el token guardado
  localStorage.clear(); // 👈 borra jwt y datos de usuario
  // Mostrar el botón de login y ocultar el nombre del usuario
  showLoginButton();
  // Opcional: redirigir al inicio o a la página de login
  window.location.href = "/";
}

// Enganchar inicialización y logout al cargar DOM
document.addEventListener("DOMContentLoaded", () => {
  initSessionFromUrl();   // 👈 captura ?token=..., guarda jwt y redirige
  checkSessionOnLoad();   // 👈 llama a /me y actualiza UI (showUserNick / showLoginButton)

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault(); // 👈 evita que navegue al "#"
      logout();           // 👈 ejecuta tu función logout()
    });
  }
});
