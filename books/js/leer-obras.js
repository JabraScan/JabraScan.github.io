// leer-obras.js
fetch('../obras.xml')
  .then(response => response.text())
  .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
  .then(data => {
    const obras = data.querySelectorAll("obra");
    const carouselContainer = document.getElementById("carousel-track");

    obras.forEach(obra => {
      const nombreobra = obra.querySelector("nombreobra").textContent;
      const imagen = obra.querySelector("imagen").textContent;
      const valoracion = obra.querySelector("valoracion").textContent;
      const tipoobra = obra.querySelector("tipoobra").textContent;
      const Categoria = obra.querySelector("Categoria").textContent;

      const item = document.createElement("div");
      item.className = "carousel-item";
      item.innerHTML = `
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
      carouselContainer.appendChild(item);
    });
  })
  .catch(err => console.error("Error al cargar el XML:", err));
