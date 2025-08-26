document.addEventListener("DOMContentLoaded", () => {
  //if (window.location.href.includes("lectorpdf.html")) 
  {
      let pdfDoc = null;
      let pageNum = 1;
    
      const canvas = document.getElementById("pdfCanvas");
      const ctx = canvas.getContext("2d");
      const pageInfo = document.getElementById("pageInfo");
      const body = document.body;
    
      const startReadingBtn = document.getElementById("readAloud");
      const stopReadingBtn = document.getElementById("stopReading");
      const pauseReadingBtn = document.getElementById("pauseReading");
      const resumeReadingBtn = document.getElementById("resumeReading");
      const toggleMode = document.getElementById("toggleMode");
    
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
          speechSynthesis.cancel();
          localStorage.setItem("ultimaPagina", num);
        });
      }
    
      // Navegación
      document.getElementById("prevPage").onclick = () => {
        if (pageNum > 1) {
          pageNum--;
          renderPage(pageNum);
        }
      };
    
      document.getElementById("nextPage").onclick = () => {
        if (pageNum < pdfDoc.numPages) {
          pageNum++;
          renderPage(pageNum);
        }
      };
    
      // Modo claro/oscuro
      toggleMode.onclick = () => {
        body.classList.toggle("dark-mode");
        body.classList.toggle("light-mode");
        toggleMode.textContent = body.classList.contains("dark-mode") ? "☀️" : "🌙";
        localStorage.setItem("modoNocturno", body.classList.contains("dark-mode") ? "true" : "false");
      };
    
      if (localStorage.getItem("modoNocturno") === "true") {
        body.classList.add("dark-mode");
        body.classList.remove("light-mode");
        toggleMode.textContent = "☀️";
      }
    
      // Botones de lectura
      function mostrarBotones({ play = false, pause = false, resume = false, stop = false }) {
        startReadingBtn.style.display = play ? "inline-block" : "none";
        pauseReadingBtn.style.display = pause ? "inline-block" : "none";
        resumeReadingBtn.style.display = resume ? "inline-block" : "none";
        stopReadingBtn.style.display = stop ? "inline-block" : "none";
      }
    
      startReadingBtn.onclick = () => {
        pdfDoc.getPage(pageNum).then(page => {
          page.getTextContent().then(textContent => {
            const text = textContent.items.map(item => item.str).join(" ");
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "es-ES";
    
            const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith("es"));
            if (voices.length > 0) {
              utterance.voice = voices.find(v => v.name.includes("Google") || v.name.includes("Helena")) || voices[0];
              utterance.rate = 0.95;
              utterance.pitch = 1.1;
              utterance.volume = 1;
              mostrarBotones({ pause: true, stop: true });
            }
    
            utterance.onend = () => {
              mostrarBotones({ play: true });
            };
    
            speechSynthesis.speak(utterance);
          });
        });
      };
    
      pauseReadingBtn.onclick = () => {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
          speechSynthesis.pause();
          mostrarBotones({ resume: true, stop: true });
        }
      };
    
      resumeReadingBtn.onclick = () => {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
          mostrarBotones({ pause: true, stop: true });
        }
      };
    
      stopReadingBtn.onclick = () => {
        speechSynthesis.cancel();
        mostrarBotones({ play: true });
      };
    
      window.addEventListener("resize", () => {
        if (pdfDoc) renderPage(pageNum);
      });
    
      // Cargar PDF desde enlace
      document.querySelectorAll(".pdf-link").forEach(link => {
        link.addEventListener("click", event => {
          event.preventDefault();
    
          const clave = event.currentTarget.getAttribute("data-pdf-obra");
          const capitulo = event.currentTarget.getAttribute("data-pdf-capitulo");
    
          localStorage.setItem("ultimaObra", clave);
          localStorage.setItem("ultimoCapitulo", capitulo);
    
          fetch("books.json")
            .then(response => response.json())
            .then(books => {
              const cap = books[clave]?.find(c => c.numCapitulo === capitulo);
              if (!cap) return;
    
              const pdfPath = `books/${clave}/${cap.NombreArchivo}`;
              pdfjsLib.getDocument(pdfPath).promise.then(doc => {
                pdfDoc = doc;
                pageNum = 1;
                renderPage(pageNum);
              });
            })
            .catch(error => console.error("Error al cargar el PDF:", error));
        });
      });
    
      // Cargar último capítulo automáticamente
      const ultimaObra = localStorage.getItem("ultimaObra");
      const ultimoCapitulo = localStorage.getItem("ultimoCapitulo");
      const ultimaPagina = parseInt(localStorage.getItem("ultimaPagina"), 10);
    
      if (ultimaObra && ultimoCapitulo) {
        fetch("books.json")
          .then(response => response.json())
          .then(books => {
            const cap = books[ultimaObra]?.find(c => c.numCapitulo === ultimoCapitulo);
            if (!cap) return;
    
            const pdfPath = `books/${ultimaObra}/${cap.NombreArchivo}`;
            pdfjsLib.getDocument(pdfPath).promise.then(doc => {
              pdfDoc = doc;
              pageNum = !isNaN(ultimaPagina) ? ultimaPagina : 1;
              renderPage(pageNum);
            });
          })
          .catch(error => console.error("Error al cargar el último capítulo:", error));
      }
  }
});


