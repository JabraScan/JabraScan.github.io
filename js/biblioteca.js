import { onLibroClick } from'./leerobras.js';
import { activarLinksPDF } from './eventos.js';
import { actualizarEstrellas, crearBloqueValoracion, createImg, managerTabs, imgSrcFromBlob } from './utils.js';
import { setItem, getItem, removeItem } from "./storage.js";
import { cargarBibliotecaTest } from'./usuario.js';
// -------------------------
// Config y constantes
// -------------------------
const API_BASE = "https://jabrascan.net";
const FALLBACK_IMG = "/img/avatar/default.webp";
const usuario_id = getItem("user_id");
const nickname = getItem("user_nickname");
const avatar = getItem("user_avatar");
const token = getItem("jwt");

const TARGET_USER = '74cabb4e-0835-4a85-b40d-6f2316083957';

export function cargarTiendaTest () {
  if (usuario_id === TARGET_USER) {
    const tienda = document.getElementById("demo-tienda");
      tienda.show();
    const avatar = document.getElementById("demo-avatar");
      avatar.show();
    cargarTienda();
    return true;
  } else {
    return false;
  }  
}

function mostrarAvatarColeccion(idcoleccion) {
  return true;
}

async function cargarTienda() {
  if (!usuario_id && !token) return;

  const ENDPOINT = 'https://jabrascan.net/avatars/demo'; // tu endpoint agrupado
  const tienda = document.querySelector('#demo-tienda');
  const avatares = document.querySelector('#demo-avatar');
  if (!tienda || !avatares) return;

  tienda.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';
  avatares.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';

  try {
    const res = await authFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id }) // si necesitas enviar el id
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const colecciones = Array.isArray(data) ? data : (data.items || []);

    if (!colecciones.length) {
      tienda.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares a la venta.</div>';
      avatares.innerHTML = '<div class="text-center py-4 text-muted">No tienes avatares disponibles.</div>';
      return;
    }

    tienda.innerHTML = '';
    avatares.innerHTML = '';

    colecciones.forEach(grupo => {
      const card = document.createElement('div');
      card.className = 'card mb-3';

      const header = document.createElement('div');
      header.className = 'card-header d-flex justify-content-between align-items-center';
      header.textContent = grupo.coleccion;

      const btnMas = document.createElement('button');
      btnMas.type = 'button';
      btnMas.className = 'btn btn-sm btn-outline-primary';
      btnMas.textContent = '+';
      btnMas.addEventListener('click', () => {
        mostrarAvatarColeccion(grupo.avatares[0].idcoleccion);
      });
      header.appendChild(btnMas);

      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'card-body d-flex flex-row flex-wrap';

      grupo.avatares.slice(0, 3).forEach(item => {
        const img = document.createElement('img');
        imgSrcFromBlob(img, item.avatar_path, FALLBACK_IMG);
        img.alt = item.descripcion || '';
        img.className = 'img-thumbnail me-2 mb-2';
        img.style.width = '80px';
        img.style.height = '80px';
        body.appendChild(img);
      });

      card.appendChild(body);

      // decidir si va a tienda o avatares
      if (grupo.avatares.some(a => a.adquirido === 'adquirido')) {
        avatares.appendChild(card);
      } else {
        tienda.appendChild(card);
      }
    });
  } catch (err) {
    avatares.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
    tienda.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
  }
}

