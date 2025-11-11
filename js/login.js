const WORKER_URL = "https://logingooglemeta.jabrarexscan.workers.dev";

function loginGoogle() {
  window.location.href = `${WORKER_URL}/auth/google`;
}

function loginMeta() {
  window.location.href = `${WORKER_URL}/auth/meta`;
}

// Capturar token si viene en la URL (?token=XYZ)
const params = new URLSearchParams(window.location.search);
const token = params.get("token");

if (token) {
  localStorage.setItem("jwt", token);

  // Validar token y mostrar datos del usuario
  fetch(`${WORKER_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(data => {
    document.getElementById("userInfo").innerHTML =
      `Bienvenido <b>${data.usuario.nombre}</b> (${data.usuario.email})<br>
       <img src="${data.usuario.picture}" alt="avatar" style="border-radius:50%;margin-top:10px;">`;
  })
  .catch(err => console.error("Error validando token:", err));
}
