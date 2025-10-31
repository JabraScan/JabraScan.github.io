  // Obtener la fecha actual
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1; // Enero = 0, Octubre = 9

  // Solo mostrar overlay si es 31 de octubre (Halloween)
  if (dia === 31 && mes === 10) {
    const overlay = document.createElement("div");
    overlay.id = "halloween-overlay";
    overlay.innerHTML = "<h1>👻 ¡Feliz Halloween! 🎃</h1>";
    document.body.appendChild(overlay);

    // Generar murciélagos
    for (let i = 0; i < 6; i++) {
      let bat = document.createElement("div");
      bat.className = "bat";
      bat.style.top = Math.random() * window.innerHeight + "px";
      bat.style.animationDuration = (5 + Math.random() * 10) + "s";
      overlay.appendChild(bat);
    }

    // Quitar overlay después de unos segundos
    setTimeout(() => {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity 2s ease";
      setTimeout(() => overlay.remove(), 2000);
    }, 5000); // visible 5 segundos
  }
