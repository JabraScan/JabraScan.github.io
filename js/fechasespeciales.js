document.addEventListener("DOMContentLoaded", () => {
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1; // Enero = 0 → Octubre = 9

  // 🎉 Configuración de festividades
  const festividades = [
    { dia:  1, mes:  1, fondo: "./img_especial/new_year.webp"      }, // 🎆 Año Nuevo
    { dia: 14, mes:  2, fondo: "./img_especial/valentin.webp"      }, // ❤️ San Valentín (opcional)
    { dia: 17, mes:  3, fondo: "./img_especial/san_patricio.webp"  }, // 🍀 San Patricio
    { dia: 22, mes:  4, fondo: "./img_especial/diatierra.webp"     }, // 🌍 Día de la Tierra
    { dia: 31, mes: 10, fondo: "./img_especial/halloween.webp"     }, // 🎃 Halloween
    { dia: 25, mes: 12, fondo: "./img_especial/navidad.webp"       }, // 🎄 Navidad
    { dia: 31, mes: 12, fondo: "./img_especial/nochevieja.webp"    }  // 🍾 Nochevieja
  ];
  // 🎨 Configuración de animaciones de iconos para el título
  const iconosFestivos = {
    "1-1":  ["🎆", "✨", "🎇"],       // Año Nuevo
    "14-2": ["❤️", "💖", "💕"],      // San Valentín
    "17-3": ["🍀", "🌿", "☘️"],      // San Patricio
    "22-4": ["🌍", "🌎", "🌏"],      // Día de la Tierra
    "31-10":["🎃", "👻", "🦇"],      // Halloween
    "25-12":["🎄", "❄️", "☃️"],      // Navidad
    "31-12":["🍾", "🥂", "🎉"]       // Nochevieja
  };


  // 🔎 Buscar si hoy coincide con alguna festividad
  const fiesta = festividades.find(f => f.dia === dia && f.mes === mes);

  if (fiesta) {
    // 🌌 Cambiar fondo
    document.body.style.backgroundImage = `url('${fiesta.fondo}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    // 🎭 Animar título con iconos
    const clave = `${dia}-${mes}`;
    if (iconosFestivos[clave]) {
      let i = 0;
      setInterval(() => {
        const icono = iconosFestivos[clave][i % iconosFestivos[clave].length];
        document.title = `${icono} ${tituloBase}`;
        i++;
      }, 1000); // cambia cada segundo
    }
  }
});
