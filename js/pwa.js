// pwa.js
let deferredPrompt = null;

export function initPWA() {
  const installBtn = document.getElementById('btnInstalarPWA');

  // 1. Detección para Android / PC (Evento nativo)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
      installBtn.style.display = 'inline-flex';
    }
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      // Si el navegador soporta la instalación directa (Android/PC)
      if (deferredPrompt) {
        installBtn.style.display = 'none';
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('El usuario aceptó instalar la PWA');
        }
        deferredPrompt = null;
        return;
      }

      // 2. Guía específica para iOS (Safari)
      const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

      if (isIosDevice && !isInStandaloneMode) {
        alert("Para instalar JabraScan en tu dispositivo iOS:\n\n1. Toca el botón de 'Compartir' en la barra de Safari.\n2. Desplaza y selecciona 'Añadir a la pantalla de inicio'.");
      }
    });
  }

  // 3. Forzar visibilidad del botón en iOS al cargar
  const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;

  if (isIosDevice && !isInStandaloneMode && installBtn) {
    installBtn.style.display = 'inline-flex';
  }
}