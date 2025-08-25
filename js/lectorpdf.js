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

let pdfDoc = null;
let pageNum = 1;
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');

const fontSelector = document.getElementById("fontSelector");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const toggleMode = document.getElementById("toggleMode");
const readAloudBtn = document.getElementById("readAloud");
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
};

// Lectura en voz alta
readAloudBtn.onclick = () => {
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
      }

      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    });
  });
};

// Detener lectura
stopReadingBtn.onclick = () => {
  speechSynthesis.cancel();
};
// Pausar lectura
pauseReadingBtn.onclick = () => {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
  }
};
// Reanudar lectura
resumeReadingBtn.onclick = () => {
   if (speechSynthesis.paused) {
    speechSynthesis.resume();
  }
};

// Cargar PDF desde enlace dinámico
document.querySelectorAll('.pdf-link').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    const newUrl = event.target.getAttribute('data-pdf');
    if (newUrl) {
      pdfjsLib.getDocument(newUrl).promise.then(doc => {
        pdfDoc = doc;
        pageNum = 1;
        renderPage(pageNum);
      });
    }
  });
});






