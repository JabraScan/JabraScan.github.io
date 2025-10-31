document.addEventListener("DOMContentLoaded", () => {
  // 📅 Obtener fecha actual
  const hoy = new Date();
  const dia = hoy.getDate();
  const mes = hoy.getMonth() + 1; // Enero = 0 → Octubre = 9

  // 🎃 Solo ejecutar si es 31 de octubre (Halloween)
  if (dia === 31 && mes === 10) {
    // 📱 Detectar si es móvil para reducir cantidad
    const isMobile = window.innerWidth < 600;

    // Si es móvil → 3 murciélagos, si no → 6 murciélagos
    const numMurcielagos = isMobile ? 3 : 6;

    // 🔄 Crear murciélagos
    for (let i = 0; i < numMurcielagos; i++) {
      let bat = document.createElement("div");
      bat.className = "bat";

      // Posición vertical aleatoria
      bat.style.top = Math.random() * window.innerHeight + "px";

      // Duración de animación aleatoria (5–15s)
      bat.style.animationDuration = (5 + Math.random() * 10) + "s";

      // Insertar en el body
      document.body.appendChild(bat);
    }
  }
});
