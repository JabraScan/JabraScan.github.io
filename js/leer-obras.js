document.addEventListener("DOMContentLoaded", function () {
	// leer-obras.js
	fetch('obras.xml')
	  .then(response => response.text())
	  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
	  .then(data => {
	    const obras = data.querySelectorAll("obra");
	    const carouselContainer = document.querySelector(".carousel-track");
	    const booklistContainer = document.querySelector(".book-list");
		  
	    obras.forEach(obra => {
	      const clave = obra.querySelector("clave").textContent.trim();
	      const nombreobra = obra.querySelector("nombreobra").textContent.trim();
	      const autor = obra.querySelector("autor").textContent.trim();
	      const sinopsis = obra.querySelector("sinopsis").textContent.trim();
	      const imagen = obra.querySelector("imagen").textContent.trim();
	      const valoracion = obra.querySelector("valoracion").textContent.trim();
	      const tipoobra = obra.querySelector("tipoobra").textContent.trim();
		  const Categoria = obra.querySelector("categoria").textContent.trim();
		  const estado = obra.querySelector("estado").textContent.trim();
		  const ubicacion = obra.querySelector("ubicacion").textContent.trim();
		  const traduccion = obra.querySelector("traductor").textContent.trim();
		  const contenido18 = obra.querySelector("adulto").textContent.trim();
	
		  const categoriaIndiv = Categoria.split(",").map(item => item.trim());
			let categoriaObj = '';
			categoriaIndiv.forEach(item => {
			  categoriaObj += '<span class="etiqueta">' + item + '</span>'; // Imprime cada item en la consola
			  // Puedes hacer lo que necesites con cada 'item' aquí
			});
			//indicador +18
		    const imagenContenedor = document.createElement("div");
				  imagenContenedor.classList.add("imagen-contenedor");
				
				  const img = document.createElement("img");
				  img.src = "../img/" + imagen;
				  img.alt = nombreobra;
				  imagenContenedor.appendChild(img);
				
				  if (contenido18 === "adulto") {
				    imagenContenedor.classList.add("adulto");
				    const indicador = document.createElement("div");
				    indicador.classList.add("indicador-adulto");
				    indicador.textContent = "+18";
				    imagenContenedor.appendChild(indicador);
				  }
	      const indice = 0;
	
	      const itemCarousel = document.createElement("div");
		      itemCarousel.className = "carousel-item";
		      itemCarousel.innerHTML = `
		        <div class="carousel-info-overlay">
		          <div class="carousel-info-title">${nombreobra}</div>
				  </br>
		          <!--<img src="../img/${imagen}" alt="${nombreobra}">-->
		          <div class="carousel-info-row">
		            <span class="carousel-info-label clave">${clave}</span>
		            <!--<span class="carousel-info-label">Valoración:</span> <span>${valoracion}</span>-->
		            <span class="carousel-info-label">Autor:</span> <span>${autor}</span>
		            <span class="carousel-info-label">Traducción:</span> <span>${traduccion}</span>
		          </div>
		          <div class="carousel-info-row">
		            <span class="carousel-info-label">Tipo:</span> <span>${tipoobra}</span>
		            <span class="carousel-info-label">Estado:</span> <span>${estado}</span>
		          </div>
		          <div class="carousel-info-row">
			   		<span class="carousel-info-label">Categoría:</span>
		          </div>
		          <div class="carousel-info-row-tags">
		            ${categoriaObj}
			   	  </div>
		        </div>
		      `;
	      itemCarousel.prepend(imagenContenedor);
	      carouselContainer.appendChild(itemCarousel);
			
	      const itemBook = document.createElement("article");
		      itemBook.className = "book-card-main libro-item";
			  itemBook.onclick = () => onLibroClick(obra.querySelector("clave").textContent.trim());
		      itemBook.innerHTML = `
					  <p class="clave">${clave}</p>
			          <img src="../img/${imagen}" alt="${nombreobra}" loading="lazy"/>
			          <div class="book-info-main">
			            <h3>${nombreobra}</h3>
						<div class="book-author-title">Autor:</div>
						<div class="book-author-name">${autor}</div>
			            <!--<p class="book-sinopsis tooltip">
				  			<b>Sinopsis:</b>
							<span class="tooltip-text">${sinopsis}</span>
			            	</br> ${sinopsis}
			            </p>-->
			          </div>
		      `;
	      booklistContainer.appendChild(itemBook);
	    });
	  })
	  .catch(err => console.error("Error al cargar el XML:", err));
	

});

		function onLibroClick(libroId) {
		    // Guarda el ID o nombre del libro seleccionado (ajusta según tu XML)
		    localStorage.setItem('libroSeleccionado', libroId);
		    // Redirige a la ficha
		    //window.location.href = 'books/libro-ficha.html';
			// Usar fetch para cargar el contenido de disclaimer.html
			console.log("obras");
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
