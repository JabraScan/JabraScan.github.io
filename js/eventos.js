import { abrirLectorPDF } from './lector.js';

export function activarLinksPDF() {
  document.querySelectorAll('.pdf-link').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const clave = e.currentTarget.getAttribute("data-pdf-obra");
      const capitulo = e.currentTarget.getAttribute("data-pdf-capitulo");

      localStorage.setItem('ultimaObra', clave);
      localStorage.setItem('ultimoCapitulo', capitulo);
      localStorage.setItem("ultimaPagina", 1);

      // Cargar dinámicamente lectorpdf.html
        fetch('lectorpdf.html')
          .then(r => r.text())
          .then(html => {
            const main = document.querySelector('main');
            main.innerHTML = html;
        
            // Cargar el módulo dinámicamente
            import('./lector.js')
              .then(modulo => modulo.abrirLectorPDF())
              .catch(err => console.error('Error al cargar lector.js:', err));
          });
    });
  });
}
/*
export function activarPaginacion() {
  const botones = document.querySelectorAll('.pagina-btn');
  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      const pagina = btn.getAttribute('data-pagina');
      document.querySelectorAll('.chapter-page').forEach(div => {
        div.style.display = div.getAttribute('data-pagina') === pagina ? 'block' : 'none';
      });
    });
  });
}
*/
export function activarPaginacion() {
  const botones = document.querySelectorAll('.pagina-btn');
  const paginas = document.querySelectorAll('.chapter-page');
  const etiquetas = document.querySelectorAll('.pagination-label');
  let paginaActual = 1;
  const totalPaginas = paginas.length;

  const mostrarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;

    paginas.forEach(div => {
      div.style.display = div.getAttribute('data-pagina') === String(nuevaPagina) ? 'block' : 'none';
    });

    etiquetas.forEach(label => {
      label.style.display = label.getAttribute('data-pagina') === String(nuevaPagina) ? 'block' : 'none';
    });

    paginaActual = nuevaPagina;
  };

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.hasAttribute('data-prev')) {
        mostrarPagina(paginaActual - 1);
      } else if (btn.hasAttribute('data-next')) {
        mostrarPagina(paginaActual + 1);
      } else if (btn.hasAttribute('data-pagina')) {
        const nueva = parseInt(btn.getAttribute('data-pagina'));
        mostrarPagina(nueva);
      }
    });
  });

  // Mostrar la primera página al cargar
  mostrarPagina(1);
}

