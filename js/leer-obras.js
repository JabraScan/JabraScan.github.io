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
      const clave = obra.querySelector("clave").textContent;
      const nombreobra = obra.querySelector("nombreobra").textContent;
      const autor = obra.querySelector("autor").textContent;
      const sinopsis = obra.querySelector("sinopsis").textContent;
      const imagen = obra.querySelector("imagen").textContent;
      const valoracion = obra.querySelector("valoracion").textContent;
      const tipoobra = obra.querySelector("tipoobra").textContent;
      const Categoria = obra.querySelector("categoria").textContent;
      const indice = 0;

      const itemCarousel = document.createElement("div");
	      itemCarousel.className = "carousel-item";
	      itemCarousel.innerHTML = `
	        <img src="${imagen}" alt="${nombreobra}">
	        <div class="carousel-info-overlay">
	          <div class="carousel-info-title">${nombreobra}</div>
	          <div class="carousel-info-row">
	            <span class="carousel-info-label">Valoración:</span> ${valoracion}
	            <span class="carousel-info-label">Tipo:</span> ${tipoobra}
	            <span class="carousel-info-label">Categoría:</span> ${Categoria}
	          </div>
	        </div>
	      `;
      carouselContainer.appendChild(itemCarousel);
		
      const itemBook = document.createElement("article");
	      itemBook.className = "book-card";
	      itemBook.innerHTML = `
		        <a href="books/${clave}/index.html">
		          <img src="${imagen}" alt="${nombreobra}" loading="lazy"/>
		        </a>
		          <div class="book-info">
		            <h3>${nombreobra}</h3>
		            <p class="book-author"><div class="book-author-title">Autor:</div><div class="book-author-name">${autor}</div></p>
		            <p class="book-sinopsis tooltip">
			  			<b>Sinopsis:</b>
						<span class="tooltip-text">${sinopsis}</span>
		            	</br> ${sinopsis}
		            </p>
		          </div>
	      `;
      booklistContainer.appendChild(itemBook);
    });
  })
  .catch(err => console.error("Error al cargar el XML:", err));
});
