document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1; // Enero = 0 → Octubre = 9

  // 🎉 Configuración de festividades
  const festividades = [
    { dia:  1, mes:  1, fondo: "./img_especial/new_year.webp"      }, // 🎆 Año Nuevo
    { dia: 14, mes:  2, fondo: "./img_especial/valentin.webp"      }, // ❤️ San Valentín (opcional)
    { dia: 17, mes:  3, fondo: "./img_especial/san_patricio.webp"  }, // 🍀 San Patricio
    { dia: 31, mes: 10, fondo: "./img_especial/halloween.webp"     }, // 🎃 Halloween
    { dia: 25, mes: 12, fondo: "./img_especial/navidad.webp"       }, // 🎄 Navidad
    { dia: 31, mes: 12, fondo: "./img_especial/nochevieja.webp"    }  // 🍾 Nochevieja
  ];


  // 🔎 Buscar si hoy coincide con alguna festividad
  const fiesta = festividades.find(f => f.dia === dia && f.mes === mes);

  if (fiesta) {
    // 🌌 Cambiar fondo
    document.body.style.backgroundImage = `url('${fiesta.fondo}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
  }
});
