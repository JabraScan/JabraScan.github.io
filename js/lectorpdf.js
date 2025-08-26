//document.addEventListener("DOMContentLoaded", () => {
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
		    
					const claveParam = event.currentTarget.getAttribute("data-pdf-obra");
					const capituloParam = event.currentTarget.getAttribute("data-pdf-capitulo");
					
					let clave, capitulo, ultimaPagina;
					
					// Si vienen parámetros, los usamos y guardamos en localStorage
					if (claveParam && capituloParam) {
					    console.log("Abrir desde enlace");
					    clave = claveParam;
					    capitulo = capituloParam;
					
					    localStorage.setItem("ultimaObra", clave);
					    localStorage.setItem("ultimoCapitulo", capitulo);
					
					} else {
						// Si no vienen parámetros, cargamos desde localStorage
			    		console.log("Abrir desde localStorage");
							clave = localStorage.getItem("ultimaObra");
			      			capitulo = localStorage.getItem("ultimoCapitulo");
			      			ultimaPagina = parseInt(localStorage.getItem("ultimaPagina"), 10);
					}
		    
		          fetch("books.json")
		            .then(response => response.json())
		            .then(books => {
		              const cap = encodeURIComponent(books[clave]?.find(c => c.numCapitulo === capitulo));
		              if (!cap) return;
					//actualizar h1
					const h1 = document.querySelector("header h1");
					  h1.textContent = cap.tituloObra;
					  //h1.onclick = () => onLibroClick(ultimaObra);
		            //abrir archivo			
						//seleccionar pagina activa
		              const pdfPath = `books/${clave}/${cap.NombreArchivo}`;
		
						 if (ultimaObra && ultimoCapitulo) {
							 //abrir archivo y seleccionar la pagina activa
							jsLib.getDocument(pdfPath).promise.then(doc => {
								pdfDoc = doc;
								pageNum = !isNaN(ultimaPagina) ? ultimaPagina : 1;
								renderPage(pageNum);
				            });
						 } else {				
							//abrir archivo en la primera pagina
							pdfjsLib.getDocument(pdfPath).promise.then(doc => {
								pdfDoc = doc;
								pageNum = 1;
								renderPage(pageNum);
							});
						 }
		            })
		            .catch(error => console.error("Error al cargar el PDF:", error));
        	});
      });

	  /*
      // Cargar último capítulo automáticamente
      const ultimaObra = localStorage.getItem("ultimaObra");
      const ultimoCapitulo = localStorage.getItem("ultimoCapitulo");
      const ultimaPagina = parseInt(localStorage.getItem("ultimaPagina"), 10);
    
      if (ultimaObra && ultimoCapitulo) {
console.log("abrir automaticamente");
        fetch("books.json")
          .then(response => response.json())
          .then(books => {
            const cap = books[ultimaObra]?.find(c => c.numCapitulo === ultimoCapitulo);
            if (!cap) return;
			//actualizar h1
			const h1 = document.querySelector("header h1");
			  h1.textContent = cap.tituloObra;
			  //h1.onclick = () => onLibroClick(ultimaObra);
            //abrir archivo
            const pdfPath = `books/${ultimaObra}/encodeURIComponent(${cap.NombreArchivo})`;
            pdfjsLib.getDocument(pdfPath).promise.then(doc => {
              pdfDoc = doc;
              pageNum = !isNaN(ultimaPagina) ? ultimaPagina : 1;
              renderPage(pageNum);
            });
          })
          .catch(error => console.error("Error al cargar el último capítulo:", error));
      }*/
  }
//});
		function onLibroClick(libroId) {
		    // Guarda el ID o nombre del libro seleccionado (ajusta según tu XML)
		    localStorage.setItem('libroSeleccionado', libroId);
		    // Redirige a la ficha
		    //window.location.href = 'books/libro-ficha.html';
			// Usar fetch para cargar el contenido de disclaimer.html
			fetch('books/libro-ficha.html')
				.then(response => {
					if (!response.ok) {
						throw new Error('Error al cargar el archivo: ' + response.statusText);
					}
					return response.text();
				})
				.then(data => {
					// Cargar el contenido en <main>
					const mainElement = document.querySelector('main');
					mainElement.innerHTML = data;
					cargarlibro(libroId);
				})
				.catch(err => console.error('Error:', err));
		}







