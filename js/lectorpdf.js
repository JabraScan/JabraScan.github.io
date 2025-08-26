/*
const urlParams = new URLSearchParams(window.location.search);
const pdfUrl = urlParams.get('pdf');

if (pdfUrl) {
  pdfjsLib.getDocument(pdfUrl).promise.then(doc => {
    pdfDoc = doc;
    pageNum = 1;
    renderPage(pageNum);
  });
} else {
  console.error("No se proporcionó ningún PDF en la URL.");
}
*/
document.addEventListener("DOMContentLoaded", () => {
  let pdfDoc = null;
  let pageNum = 1;
  const canvas = document.getElementById('pdfCanvas');
  const ctx = canvas.getContext('2d');
  
  const fontSelector = document.getElementById("fontSelector");
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const toggleMode = document.getElementById("toggleMode");
  const startReadingBtn = document.getElementById("readAloud");
  const stopReadingBtn = document.getElementById("stopReading");
  const pauseReadingBtn = document.getElementById("pauseReading");
  const resumeReadingBtn = document.getElementById("resumeReading");
  const pageInfo = document.getElementById("pageInfo");
  const body = document.body;
  
  // Renderizar página
  function renderPage(num) {
    pdfDoc.getPage(num).then(page => {
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
  
      canvas.height = viewport.height;
      canvas.width = viewport.width;
  
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      page.render(renderContext);
  
      pageInfo.textContent = `Página ${num} de ${pdfDoc.numPages}`;
      speechSynthesis.cancel(); // Detener lectura si se cambia de página
    });
  }
  // Navegación
  document.getElementById("prevPage").onclick = () => {
    if (pageNum <= 1) return;
    pageNum--;
    renderPage(pageNum);
  };
  
  document.getElementById("nextPage").onclick = () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    renderPage(pageNum);
  };
  
  // Cambiar fuente
  //fontSelector.onchange = () => {
  //  canvas.style.fontFamily = fontSelector.value;
  //};
  
  // Cambiar tamaño de letra
  //fontSizeSlider.oninput = () => {
  //  canvas.style.fontSize = `${fontSizeSlider.value}px`;
  //};
  
  // Modo diurno/nocturno
  toggleMode.onclick = () => {
    body.classList.toggle("dark-mode");
    body.classList.toggle("light-mode");
    toggleMode.textContent = body.classList.contains("dark-mode") ? "☀️" : "🌙";
  
    const isDark = document.body.classList.contains("dark-mode");
    localStorage.setItem("modoNocturno", isDark ? "true" : "false");
  };
}); //fin document.addEventListener("DOMContentLoaded", ()

// Función para mostrar/ocultar botones Lectura
function mostrarBotones({ play = false, pause = false, resume = false, stop = false }) {
  startReadingBtn.style.display = play ? "inline-block" : "none";
  pauseReadingBtn.style.display = pause ? "inline-block" : "none";
  resumeReadingBtn.style.display = resume ? "inline-block" : "none";
  stopReadingBtn.style.display = stop ? "inline-block" : "none";
}
// Lectura en voz alta
startReadingBtn.onclick = () => {
  pdfDoc.getPage(pageNum).then(page => {
    page.getTextContent().then(textContent => {
      const text = textContent.items.map(item => item.str).join(' ');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";

      const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith("es"));
      if (voices.length > 0) {
        //utterance.voice = voices[0];
        utterance.voice = voices.find(v => v.name.includes("Google") || v.name.includes("Helena"));
        utterance.rate = 0.95;   // velocidad (0.5 a 2)
        utterance.pitch = 1.1;   // tono (0 a 2)
        utterance.volume = 1;    // volumen (0 a 1)
        mostrarBotones({ pause: true, stop: true });
      }

      utterance.onend = () => {
        clearInterval(intervalo);
        actualizarBarra(true);
        mostrarBotones({ play: true });
      };
      speechSynthesis.speak(utterance);
    });
  });
};

// Detener lectura
stopReadingBtn.onclick = () => {
  speechSynthesis.cancel();
  mostrarBotones({ play: true });
};
// Pausar lectura
pauseReadingBtn.onclick = () => {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    mostrarBotones({ resume: true, stop: true });
  }
};
// Reanudar lectura
resumeReadingBtn.onclick = () => {
   if (speechSynthesis.paused) {
     speechSynthesis.resume();
     mostrarBotones({ pause: true, stop: true });
  }
};
//Redibujar al cambiar tamaño de ventana
window.addEventListener("resize", () => {
  if (pdfDoc) renderPage(pageNum);
});
//Cuando se carga la página, revisa si el usuario tenía activado el modo nocturno:
window.addEventListener("DOMContentLoaded", () => {
  const modoNocturno = localStorage.getItem("modoNocturno");

  if (modoNocturno === "true") {
    document.body.classList.add("dark-mode");
  }
});
// Cargar PDF desde enlace dinámico
document.querySelectorAll('.pdf-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    //obtener el nombre del fichero
    const clave = event.target.getAttribute('data-pdf-obra');
    const capitulo = event.target.getAttribute('data-pdf-capitulo');
    
    fetch("books.json")
      .then(response => {
        if (!response.ok) {
          throw new Error("No se pudo cargar el archivo JSON");
        }
        return response.json();
      })
      .then(books => {
        if (!books[clave]) {
          console.warn(`La obra "${clave}" no existe.`);
          return;
        }
  
        const cap = books[clave].find(c => c.numCapitulo === capitulo);
  
        if (!cap) {
          console.warn(`El capítulo "${capitulo}" no se encontró en "${clave}".`);
          return;
        }
      });
    
    const newUrl = `books/${clave}/${cap.NombreArchivo}`;
        console.log(newurl);
    if (newUrl) {
      pdfjsLib.getDocument(newUrl).promise.then(doc => {
        pdfDoc = doc;
        pageNum = 1;
        renderPage(pageNum);
      });
    }
  });
});

