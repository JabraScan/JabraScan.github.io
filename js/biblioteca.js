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

export cargarTiendaTest () {
  if (usuario_id === TARGET_USER) {
    const tienda = document.getElementById("demo-tienda");
      tienda.show();
    const avatar = document.getElementById("demo-avatar");
      avatar.show();
    return true;
  } else {
    return false;
  }  
}
