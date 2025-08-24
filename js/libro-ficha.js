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