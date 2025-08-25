const url = 'archivo.pdf'; // Cambia esto por la ruta real de tu PDF

let pdfDoc = null;
let pageNum = 1;
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');

const fontSelector = document.getElementById("fontSelector");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const toggleMode = document.getElementById("toggleMode");
const readAloudBtn = document.getElementById("readAloud");
const stopReadingBtn = document.getElementById("stopReading");
const pageInfo = document.getElementById("pageInfo");
const body = document.body;

// Cargar PDF
pdfjsLib.getDocument(url).promise.then(doc => {
  pdfDoc = doc;
  renderPage(pageNum);
});

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
fontSelector.onchange = () => {
  canvas.style.fontFamily = fontSelector.value;
};

// Cambiar tamaño de letra
fontSizeSlider.oninput = () => {
  canvas.style.fontSize = `${fontSizeSlider.value}px`;
};

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
        utterance.voice = voices[0];
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
