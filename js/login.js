//import { imgSrcFromBlob } from './utils.js';
const WORKER_URL = "https://jabrascan.net";
const FALLBACK_IMG = "/img/avatar/default.webp";

//Funcion duplicada de utils
      function imgSrcFromBlobCopia(img, path, fallback) {
        // variable que guardará la object URL creada (si procede) para poder revocarla
          let currentObjectUrl = null;
      
          /**
           * cleanup
           * - Revoca la object URL si existe.
           * - Elimina los listeners de load/error del elemento img.
           * - Se usa tanto en onLoad como en onError para centralizar la limpieza.
           */
          function cleanup() {
            if (currentObjectUrl) {
              try { URL.revokeObjectURL(currentObjectUrl); } catch (e) { /* ignore */ }
              currentObjectUrl = null;
            }
            img.removeEventListener('error', onError);
              img.removeEventListener('load', onLoad);
          }
          /**
           * onError (manejador centralizado)
           * - Se ejecuta cuando falla la carga del src actual.
           * - Revoca object URL y quita listeners mediante cleanup().
           * - Si existe `fallback` y no es el src actual, intenta asignarlo una vez.
           * - El intento de fallback instala sus propios listeners con { once: true }
           *   para evitar recursión y para limpiar correctamente si falla también.
           */
          function onError() {
            cleanup();
            // Intentar fallback solo si está definido y no es el src actual
              if (fallback && img.src !== fallback) {
                // listeners para el intento de fallback (se ejecutan una sola vez)
                function fallbackLoad() {
                  // éxito con fallback: nada más que limpiar (cleanup ya fue llamado)
                }
                function fallbackError() {
                  // si falla el fallback, no intentamos más; solo quitamos listeners
                  img.removeEventListener('load', fallbackLoad);
                }
          
                img.addEventListener('load', fallbackLoad, { once: true });
                  img.addEventListener('error', fallbackError, { once: true });
                // asignar fallback (se tratará como URL/string en esta versión)
                  img.src = fallback;
              }
          }
        /**
         * onLoad (manejador centralizado)
         * - Se ejecuta cuando la imagen carga correctamente.
         * - Llama a cleanup para revocar object URL y quitar listeners.
         */
          function onLoad() {
            cleanup();
          }
        // Normalizar String objects (new String(...)) a primitivo
        if (path instanceof String) path = path.valueOf();
        // 0) Si path es una URL/data/ruta absoluta -> asignar directamente
        //    (esto debe comprobarse antes de interpretar cadenas como listas de bytes)
          if (typeof path === 'string' && ( /^(https?:)?\/\//i.test(path) || path.startsWith('/') || path.startsWith('data:') )) {
            img.addEventListener('error', onError, { once: true });
              img.addEventListener('load', onLoad, { once: true });
              img.src = path;
            return;
          }
        // --- convertir distintos formatos a Uint8Array cuando proceda ---
        let u8 = null;
        // 1) cadena que representa una lista de bytes "82,73,70,70,..." (solo dígitos y comas)
          if (typeof path === 'string' && /^\s*\d+(?:\s*,\s*\d+)+\s*$/.test(path)) {
            const nums = path.split(',').map(s => Number(s.trim()));
              u8 = new Uint8Array(nums);
          }
        // 2) Array<number>
          else if (Array.isArray(path)) {
            u8 = new Uint8Array(path);
          }
        // 3) Uint8Array ya listo
          else if (path instanceof Uint8Array) {
            u8 = path;
          }
        // 4) ArrayBuffer
          else if (path instanceof ArrayBuffer) {
            u8 = new Uint8Array(path);
          }
        // 5) cualquier TypedArray (Int8Array, Float32Array, etc.)
          else if (ArrayBuffer.isView(path)) {
            u8 = new Uint8Array(path.buffer);
          }
        // 6) Blob -> crear object URL y asignar (gestión centralizada de errores)
          else if (path instanceof Blob) {
            const url = URL.createObjectURL(path);
              currentObjectUrl = url;
            img.addEventListener('error', onError, { once: true });
              img.addEventListener('load', onLoad, { once: true });
              img.src = url;
            return;
          }
        // 7) string que no es lista de bytes -> tratar como URL/data URL (fallback)
          else if (typeof path === 'string') {
            img.addEventListener('error', onError, { once: true });
              img.addEventListener('load', onLoad, { once: true });
              img.src = path;
            return;
          }
        // 8) fallback: forzar a string y asignar
          else {
            img.addEventListener('error', onError, { once: true });
              img.addEventListener('load', onLoad, { once: true });
              img.src = String(path);
            return;
          }
        // Si no se ha obtenido u8 por alguna razón, usar fallback o forzar string
          if (!u8) {
            if (fallback) {
              img.addEventListener('error', onError, { once: true });
                img.addEventListener('load', onLoad, { once: true });
                img.src = fallback;
            } else {
              img.addEventListener('error', onError, { once: true });
                img.addEventListener('load', onLoad, { once: true });
                img.src = String(path);
            }
            return;
          }
        // --- en este punto tenemos u8 (Uint8Array) con los bytes de la imagen ---
        // detectar MIME básico por las cabeceras más comunes
          let mime = 'application/octet-stream';
            if (u8.length >= 4 && u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46) {
              // "RIFF" -> suele indicar WebP (RIFF + WEBP)
              mime = 'image/webp';
            } else if (u8.length >= 8 && u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
              // PNG signature
              mime = 'image/png';
            } else if (u8.length >= 3 && u8[0] === 0xFF && u8[1] === 0xD8 && u8[2] === 0xFF) {
              // JPEG start of image
              mime = 'image/jpeg';
            }
        // crear Blob con el MIME detectado y generar object URL
          const blob = new Blob([u8], { type: mime });
          const url = URL.createObjectURL(blob);
            currentObjectUrl = url;
        // instalar listeners centralizados y asignar src
          img.addEventListener('error', onError, { once: true });
            img.addEventListener('load', onLoad, { once: true });
          img.src = url;
      }

// --- UI helpers (se esperan elementos en el DOM de login.html) ---
function showLoginButton() {
  const loginWrapper = document.getElementById("login-wrapper");
  const userWrapper = document.getElementById("user-nick-wrapper");
  if (loginWrapper) loginWrapper.classList.remove("d-none");
  if (userWrapper) userWrapper.classList.add("d-none");
}

function showUserNick(nickname, avatar) {
  const loginWrapper = document.getElementById("login-wrapper");
  const userWrapper = document.getElementById("user-nick-wrapper");
  const nick = document.getElementById("user-nick");
  const avatarImg = document.getElementById("user-avatar");

  if (loginWrapper) loginWrapper.classList.add("d-none");
  if (userWrapper && nick) {
    nick.textContent = nickname;
    if (avatarImg) imgSrcFromBlobCopia(avatarImg, avatar, FALLBACK_IMG);
    userWrapper.classList.remove("d-none");
  }
}

// --- login actions (se mantienen simples: redirigen al Worker) ---
function loginGoogle() {
  window.location.href = `${WORKER_URL}/auth/google`;
}
function loginMeta() {
  window.location.href = `${WORKER_URL}/auth/meta`;
}
function loginTwitter() {
  window.location.href = `${WORKER_URL}/auth/twitter`;
}

// --- captura token de la URL sin recargar y notifica la app ---
function initSessionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("token");
  if (!tokenFromUrl) return false;

  localStorage.setItem("jwt", tokenFromUrl);
  // limpia la query string sin recargar
  window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
  // notifica al resto de la SPA que hay token nuevo
  document.dispatchEvent(new CustomEvent("auth:tokenSaved", { detail: { token: tokenFromUrl } }));
  return true;
}

// --- utilidades ---
function normalizeAvatarUrl(avatar) {
  if (!avatar) return FALLBACK_IMG;
  try {
    return new URL(avatar, window.location.origin).href;
  } catch {
    return avatar;
  }
}

async function fetchWithTimeout(url, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// --- comprobar sesión y actualizar UI --- 
async function checkSessionOnLoad() {
  const token = localStorage.getItem("jwt");
  if (!token) {
    showLoginButton();
    // notifica que no hay sesión activa
    document.dispatchEvent(new CustomEvent("auth:unauthenticated"));
    return;
  }

  try {
    const res = await fetchWithTimeout(`${WORKER_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }, 8000);

    if (!res.ok) throw new Error("Token inválido o expirado");
    const data = await res.json();

    const usuario = data && data.usuario ? data.usuario : {};
    const nickname = usuario.nickname || "Usuario";
    const avatar = normalizeAvatarUrl(usuario.avatar || "/img/avatar/default.png");
    const userId = usuario.id || "";

    if (userId) localStorage.setItem("user_id", userId);
    localStorage.setItem("user_nickname", nickname);
    localStorage.setItem("user_avatar", avatar);

    showUserNick(nickname, avatar);
    // notifica que la auth está lista y pasa el usuario
    document.dispatchEvent(new CustomEvent("auth:ready", { detail: { user: usuario } }));
  } catch (e) {
    // sesión inválida: limpiar y notificar
    localStorage.removeItem("jwt");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_nickname");
    localStorage.removeItem("user_avatar");
    showLoginButton();
    document.dispatchEvent(new CustomEvent("auth:unauthenticated", { detail: { reason: e.message || e } }));
  }
}

// --- logout --- 
function logout() {
  localStorage.removeItem("jwt");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_nickname");
  localStorage.removeItem("user_avatar");

  showLoginButton();
  // notifica a la SPA que el usuario ha cerrado sesión
  document.dispatchEvent(new CustomEvent("auth:loggedOut"));
}

// --- enganchar eventos del DOM y del sistema ---
  document.addEventListener("DOMContentLoaded", async () => {
    // botones de login (si existen en login.html)
    const googleBtn = document.getElementById("login-google");
    if (googleBtn) googleBtn.addEventListener("click", (e) => { e.preventDefault(); loginGoogle(); });
  
    const metaBtn = document.getElementById("login-meta");
    if (metaBtn) metaBtn.addEventListener("click", (e) => { e.preventDefault(); loginMeta(); });
  
    const twitterBtn = document.getElementById("login-twitter");
    if (twitterBtn) twitterBtn.addEventListener("click", (e) => { e.preventDefault(); loginTwitter(); });
  
    const logoutLink = document.getElementById("logout-link");
    if (logoutLink) {
      logoutLink.addEventListener("click", (e) => { e.preventDefault(); logout(); });
    }
  
    // si la URL trae token, guárdalo y notifica
    initSessionFromUrl();
  
    // validar sesión y pintar UI en base a /me
    await checkSessionOnLoad();
  });
// --- enganchar eventos del DOM y del sistema ---
document.addEventListener("DOMContentLoaded", async function () {
  var items = [
    { id: "btnGoogle"     , fn: loginGoogle  , preventDefault: true },
    { id: "btnMeta"       , fn: loginMeta    , preventDefault: true },
    { id: "btnTwitter"    , fn: loginTwitter , preventDefault: true },
    { id: "login-google"  , fn: loginGoogle  , preventDefault: true },
    { id: "login-meta"    , fn: loginMeta    , preventDefault: true },
    { id: "login-twitter" , fn: loginTwitter , preventDefault: true },
    { id: "logout-link"   , fn: logout       , preventDefault: true }
  ];
  var handlers = {};
    items.forEach(function (it) {
      var el = document.getElementById(it.id);
      if (!el) return;
  
      // crear y guardar la misma referencia de handler para poder eliminarla luego
      if (!handlers[it.id]) {
        handlers[it.id] = function (e) {
          if (it.preventDefault) e.preventDefault();
          it.fn(e);
        };
      }
    el.removeEventListener("click", handlers[it.id]);
    el.addEventListener("click", handlers[it.id]);
  });
  initSessionFromUrl();
  await checkSessionOnLoad();
});


// Si otra parte de la app guarda el token en localStorage (ej. otro iframe o flujo), reaccionamos
window.addEventListener("storage", (e) => {
  if (e.key === "jwt") {
    // revalidar y actualizar UI
    checkSessionOnLoad().catch(() => {});
  }
});

// Exponer funciones útiles (opcional)
window.appAuth = {
  initSessionFromUrl,
  checkSessionOnLoad,
  loginGoogle,
  loginMeta,
  loginTwitter,
  logout
};
