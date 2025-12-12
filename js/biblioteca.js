import { onLibroClick } from'./leerobras.js';
import { activarLinksPDF } from './eventos.js';
import { actualizarEstrellas, crearBloqueValoracion, createImg, managerTabs, imgSrcFromBlob } from './utils.js';
import { setItem, getItem, removeItem } from "./storage.js";
import { authFetch } from'./usuario.js';
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
const TARGET_USER_TAVO = 'dcffc6ac-c4e5-4ab7-86da-5e55c982ad97';

function mostrarAvatarColeccion(idcoleccion) {
  return true;
}

  // Función asincrónica para comprar un avatar
  async function comprarAvatar(avatarId) {
    if (!token) return;              // Si no hay token, no se puede autenticar
    if (!avatarId) return;           // Si no se pasa un id de avatar, se detiene

    const url = `${API_BASE}/usuarios/buy/avatar`;
    // Se realiza la petición al servidor usando authFetch
    const resp = await authFetch(url, {
      method: "POST",                                // Método POST para enviar datos
      headers: { "Content-Type": "application/json" }, // Se especifica que el cuerpo es JSON
      body: JSON.stringify({ idavatar: avatarId })     // Se envía el id del avatar en el cuerpo
    });
    // Si la respuesta no es correcta (status distinto de 200-299), se detiene
    if (!resp.ok) return;  
    // Se devuelve la respuesta procesada
    return await resp.json();
  }
//------------------------------------------------------------------------
      function avatarPieEstablecer (itemid) {
        //console.log(item.id);
          let footer = document.createElement('div');
            footer.className = 'card-footer mt-auto bg-transparent border-0 small text-muted d-flex justify-content-center align-items-center';
            const btnSet = document.createElement('button');
              btnSet.type = 'button';
              btnSet.className = 'btn btn-sm btn-outline-primary';
              btnSet.textContent = '+Establecer';
              // Evitar que el click burbujee y llamar a establecerAvatar con el id
              btnSet.addEventListener('click', (ev) => {
                ev.stopPropagation();
                //establecerAvatar(itemid);
              });
            footer.appendChild(btnSet);

          return footer
      }

    function avatarPieComprar(item) {
          //console.log(item);

          // --- Avatar no adquirido: mostrar precio y botón Comprar (si hay precio numérico)
          //if (typeof item.precio === 'number' && Number.isFinite(item.precio)) {
          if (item.precio != null) {
            let footer = document.createElement('div');
              footer.className = 'card-footer mt-auto bg-transparent border-0 small text-muted d-flex justify-content-center align-items-center';
              const buyBtn = document.createElement('button');
                buyBtn.type = 'button';
                buyBtn.className = 'btn btn-sm btn-outline-primary ms-2';
                buyBtn.setAttribute('aria-label', `Comprar avatar por ${item.precio}`);
                // El botón contiene el icono y el importe en lugar del texto "Comprar"
                buyBtn.innerHTML = '💰 ' + String(item.precio);
                // Evitar burbujeo y llamar a comprarAvatar con el id
                //buyBtn.addEventListener('click', (ev) => {
                //  ev.stopPropagation();
                //  comprarAvatar(item.id); 
                //});
                  buyBtn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();                        
                    const data = await comprarAvatar(item.id);
                    // Si la compra fue correcta, mover el card
                    if (data && data.ok) {
                      // Localizar el card actual
                      const card = buyBtn.closest(".ficha-avatar");
                      if (card) {
                        // Quitar el footer con el botón de compra
                          let nuevofooter = card.querySelector(".card-footer");
                            if (nuevofooter) nuevofooter.remove();
                        //establecemos nuevo contenido
                          nuevofooter = avatarPieEstablecer(item.id);
                            if (nuevofooter) card.appendChild(nuevofooter);
                        // Mover el card al contenedor de avatares
                        const avatarResultado = document.getElementById("avatarResultado");
                          avatarResultado.querySelector(".row.g-2").appendChild(card);
                        //Actualizar nuevo saldo puntos
                        const saldoptos = document.getElementById("user_puntos");
                          saldoptos.innerHTML = data.saldo || 0;
                      }
                    }
                  });
                footer.appendChild(buyBtn);
                return footer;
            }
        return null;
    }

async function cargarTiendaAvatar() {
  if (!usuario_id && !token) return;

  const ENDPOINT = `${API_BASE}/avatars/demo`;
  const tienda = document.querySelector('#demo-tienda');
  const avatares = document.querySelector('#demo-avatar');
  if (!tienda || !avatares) return;

  tienda.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';
  avatares.innerHTML = '<div class="text-center py-4">Cargando avatares…</div>';

  try {
    const res = await authFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const data = await res.json();
    const colecciones = Array.isArray(data) ? data : [];

    if (!colecciones.length) {
      tienda.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares a la venta.</div>';
      avatares.innerHTML = '<div class="text-center py-4 text-muted">No tienes avatares disponibles.</div>';
      return;
    }

    tienda.innerHTML = '';
    avatares.innerHTML = '';
    const rowTienda = document.createElement('div');
    rowTienda.className = 'row g-3';
    const rowAvatar = document.createElement('div');
    rowAvatar.className = 'row g-3';

    // Función auxiliar para crear una card de colección
    function crearCardColeccion(grupo, items, destino) {
      if (!items?.length) return;

      const col = document.createElement('div');
      col.className = 'col-sm-6 col-md-4 col-lg-3';

      const card = document.createElement('div');
      card.className = 'card h-100';

      const header = document.createElement('div');
      header.className = 'card-header d-flex justify-content-between align-items-center';
      header.textContent = grupo.coleccion;

      const btnMas = document.createElement('button');
      btnMas.type = 'button';
      btnMas.className = 'btn btn-sm btn-outline-primary';
      btnMas.textContent = '+';
      btnMas.addEventListener('click', () => {
        const idcol = items[0]?.idcoleccion;
        if (idcol) mostrarAvatarColeccion(idcol);
      });
      header.appendChild(btnMas);
      card.appendChild(header);

      const body = document.createElement('div');
      body.className = 'card-body d-flex flex-row flex-wrap';

      items.forEach(item => {
        const img = document.createElement('img');
        imgSrcFromBlob(img, item.avatar_path, FALLBACK_IMG);
        img.alt = item.descripcion || '';
        img.className = 'img-thumbnail me-2 mb-2';
        img.style.width = '80px';
        img.style.height = '80px';
        body.appendChild(img);
      });

      card.appendChild(body);
      col.appendChild(card);
      destino.appendChild(col);
    }

    // Recorrer colecciones y crear cards según corresponda
    colecciones.forEach(grupo => {
      crearCardColeccion(grupo, grupo.noAdquiridos, rowTienda);
      crearCardColeccion(grupo, grupo.adquiridos, rowAvatar);
    });

    tienda.appendChild(rowTienda);
    avatares.appendChild(rowAvatar);

  } catch (err) {
    console.error("Error en cargarTiendaAvatar:", err);
    avatares.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
    tienda.innerHTML = '<div class="text-center py-4 text-muted">No hay avatares disponibles.</div>';
  }
}


export function cargarTiendaTest () {
  if (usuario_id === TARGET_USER || usuario_id === TARGET_USER_TAVO) {
    // Mostrar el <li> padre del botón "DemoTienda"
      document.getElementById("demotienda-tab")
              .closest("li")
              .classList.remove("d-none");
    // Mostrar el <li> padre del botón "Demoavatars"
      document.getElementById("demoavatar-tab")
              .closest("li")
              .classList.remove("d-none");
    console.log("typeof cargarTiendaAvatar:", typeof cargarTiendaAvatar);
    cargarTiendaAvatar();
    return true;
  } else {
    return false;
  }  
}
