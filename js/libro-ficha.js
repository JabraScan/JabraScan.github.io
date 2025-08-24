document.addEventListener("DOMContentLoaded", function () {
    window.addEventListener('DOMContentLoaded', function () {
        const libroId = localStorage.getItem('libroSeleccionado');
    console.log(libroId);
        if (!libroId) {
            // Manejar error
            document.body.innerHTML = '<p>No se encontró el libro seleccionado.</p>';
            return;
        }
    
        // Cargar el XML y buscar el libro por ID
        fetch('../obras.xml')
            .then(response => response.text())
            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
            .then(data => {
                // Ajusta el selector al formato de tu XML
                const obra = Array.from(data.getElementsByTagName('obra'))
                    .find(obra => obra.querySelector('clave').textContent.trim() === libroId);
                if (!obra) {
                    document.body.innerHTML = '<p>Obra no encontrada.</p>';
                    return;
                }
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

          const DataBook = document.querySelector('.book-card');
            const headerDataBook = document.createElement("div");
                headerDataBook.className = "book-header";
                headerDataBook.innerHTML = `
                    <i class="fa-solid fa-book"></i> ${nombreobra.toUpperCase()}
	              `;

            const mainDataBook = document.createElement("div");
                mainDataBook.className = "book-main";
                mainDataBook.innerHTML = `
                      <div class="book-image">
                        <img src="../../img/${imagen}" alt="${nombreobra}"/>
                        <div class="book-genres">
                            <span><i class="fa-solid fa-tags"></i>${Categoria}</span>                
                        </div>
                        <div class="book-links">
                          <a href="#"><i class="fa-solid fa-book"></i> ${tipoobra}</a>
                          <a href="#"><i class="fa-solid fa-globe"></i> ${ubicacion}</a>
                          <a href="#"><i class="fa-solid fa-clock"></i> ${estado}</a>
                        </div>
                      </div>
					  <div class="book-info-container">
                      		<div class="book-info">
                            	<h2 id="nombre-obra">${nombreobra}</h2>
                            </div>
                            <div class="book-synopsis">
                              <b><i class="fa-solid fa-info-circle"></i> Sinopsis:</b>
                              <p id="sinopsis-obra">${sinopsis}</p>
                            </div>
                            <div class="book-buttons">
                              <button class="chapter-list"><i class="fa-solid fa-list"></i> Lista de capítulos</button>
                              <button class="read-first"><i class="fa-solid fa-play"></i> Empezar a leer</button>
                            </div>
                      </div>
	              `;
            DataBook.prepend(mainDataBook);
            DataBook.prepend(headerDataBook);

                            /*
							<div class="book-rating" id="book-rating">
                              <span class="stars" data-rating="4.5">
                                  <i class="fa-solid fa-star"></i>
                                  <i class="fa-solid fa-star"></i>
                                  <i class="fa-solid fa-star"></i>
                                  <i class="fa-solid fa-star"></i>
                                  <i class="fa-solid fa-star-half-stroke"></i>
                              </span>
                              <span class="rating-value">4.5/5</span>
                              <span class="rating-votes">(345 votos)</span>
                              <span class="rate-btns">
                                <button class="rate-star" data-value="1"><i class="fa-solid fa-star"></i></button>
                                <button class="rate-star" data-value="2"><i class="fa-solid fa-star"></i></button>
                                <button class="rate-star" data-value="3"><i class="fa-solid fa-star"></i></button>
                                <button class="rate-star" data-value="4"><i class="fa-solid fa-star"></i></button>
                                <button class="rate-star" data-value="5"><i class="fa-solid fa-star"></i></button>
                              </span>
							  */
        /*
            document.querySelector(".book-header").innerHTML = `<i class="fa-solid fa-book"></i> ${nombreobra.toUpperCase()}`;
            document.getElementById('imagen-obra').textContent = '../../img/${imagen}';
            document.getElementById('nombre-obra').innerHTML =  `
                        ${nombreobra}
                        <span class="book-author">por <b id="nombre-autor">${autor}</b></span>
                        `;
            document.getElementById('nombre-autor').textContent = autor;
            document.getElementById('sinopsis-obra').textContent = sinopsis;
            document.querySelector(".book-genres").innerHTML =`<span><i class="fa-solid fa-tags"></i>${Categoria}</span>`;
                
            const DataBook = document.getElementById('book-links');
                const itemDataBook = document.createElement("div");
                    itemDataBook.innerHTML =  `
                        <span><i class="fa-solid fa-globe"></i> ${tipoobra}</span>
                        <span>
                        <i class="fa-solid fa-book"></i> Divine Novel</a>${tipoobra}
                        `;
                DataBook.appendChild(itemDataBook);
        */
                /*
                document.getElementById('imagen-obra').textContent = libro.getElementsByTagName('imagen')[0].textContent;
                document.getElementById('nombre-obra').textContent = libro.getElementsByTagName('nombreobra')[0].textContent;
                document.getElementById('nombre-autor').textContent = libro.getElementsByTagName('titulo')[0].textContent;
                document.getElementById('sinopsis-obra').textContent = libro.getElementsByTagName('autor')[0].textContent;
                // ...otros campos
                */
            });
    });
    // Datos de ejemplo
    const chapters = Array.from({length: 80}, (_, i) => `Capítulo ${i+1}: Título del capítulo`);
    const latestChaptersCount = 6;
    
    // -------- ESTRELLAS Y VALORACIÓN --------
    function renderStars(el, rating) {
      let stars = '';
      for(let i=1; i<=5; i++) {
        if(rating >= i) stars += '<i class="fa-solid fa-star"></i>';
        else if(rating >= i-0.5) stars += '<i class="fa-solid fa-star-half-stroke"></i>';
        else stars += '<i class="fa-regular fa-star"></i>';
      }
      el.innerHTML = stars;
    }
    
    function getBookRating() {
      // Recupera de localStorage o simula backend
      return +(localStorage.getItem('dualCultivationRating') || 4.5);
    }
    function setBookRating(val) {
      localStorage.setItem('dualCultivationRating', val);
    }
    
    // Renderizar estrellas actuales
    const ratingContainer = document.querySelector('.stars');
    renderStars(ratingContainer, getBookRating());
    
    // Valoración solo una vez por usuario (localStorage)
    document.querySelectorAll('.rate-star').forEach(btn => {
      btn.addEventListener('click', function() {
        if(localStorage.getItem('dualCultivationRated')) {
          alert('¡Ya has valorado este libro!');
          return;
        }
        const val = parseInt(this.dataset.value);
        // Simula sumar nueva valoración…
        const newRating = ((getBookRating()*345 + val)/(345+1)).toFixed(2);
        setBookRating(newRating);
        localStorage.setItem('dualCultivationRated', 'yes');
        renderStars(ratingContainer, newRating);
        document.querySelector('.rating-value').textContent = `${newRating}/5`;
        document.querySelector('.rating-votes').textContent = '(346 votos)';
        document.querySelectorAll('.rate-star').forEach(b=>b.classList.remove('rated'));
        for(let i=0; i<val; i++) document.querySelectorAll('.rate-star')[i].classList.add('rated');
      });
    });
    
    // -------- CAPÍTULOS RECIENTES EN 2 COLUMNAS --------
    const latestChapters = chapters.slice(-latestChaptersCount).reverse();
    const halfLatest = Math.ceil(latestChapters.length / 2);
    const col1Latest = latestChapters.slice(0, halfLatest);
    const col2Latest = latestChapters.slice(halfLatest);
    
    document.getElementById('latest-chapters-columns').innerHTML = `
      <ul>${col1Latest.map(chap => `<li>${chap}</li>`).join('')}</ul>
      <ul>${col2Latest.map(chap => `<li>${chap}</li>`).join('')}</ul>
    `;
    
    // -------- LISTA COMPLETA & PAGINACIÓN --------
    const chaptersPerPage = 30;
    let currentPage = 1;
    const totalPages = Math.ceil(chapters.length/chaptersPerPage);
    
    function renderChapters(page) {
      const start = (page-1)*chaptersPerPage;
      const list = chapters.slice(start, start+chaptersPerPage);
      // Divide en 2 columnas
      const half = Math.ceil(list.length/2);
      let col1 = list.slice(0, half);
      let col2 = list.slice(half);
      document.getElementById('chapter-columns').innerHTML = `
        <ul>${col1.map(c=>`<li>${c}</li>`).join('')}</ul>
        <ul>${col2.map(c=>`<li>${c}</li>`).join('')}</ul>
      `;
      document.getElementById('pagination').innerHTML = `
        <button ${page==1?'disabled':''} onclick="changePage(1)">Primera</button>
        <button ${page==1?'disabled':''} onclick="changePage(${page-1})">Anterior</button>
        <span>Pág ${page}/${totalPages}</span>
        <button ${page==totalPages?'disabled':''} onclick="changePage(${page+1})">Siguiente</button>
        <button ${page==totalPages?'disabled':''} onclick="changePage(${totalPages})">Última</button>
      `;
    }
    window.changePage = function(p){ if(p<1||p>totalPages)return; currentPage=p; renderChapters(p);}
    renderChapters(currentPage);
    
    // --------- BOTONES (puedes poner tus rutas reales) ---------
    document.querySelector('.chapter-list').onclick = () => {
      document.querySelector('.book-chapters-list').scrollIntoView({behavior:'smooth'});
    };
    document.querySelector('.read-first').onclick = () => {
      alert('Ir a leer el primer capítulo (implementa tu enlace).');
    };
    document.querySelector('.library').onclick = () => {
      alert('Añadido a tu biblioteca (implementa tu lógica).');
    };
});
