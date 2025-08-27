document.addEventListener("DOMContentLoaded", () => {
  // Busca todos los enlaces que tengan data-target con la ruta del HTML
  document.querySelectorAll("[data-target]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const url = link.getAttribute("data-target");

      fetch(url)
        .then(res => {
          if (!res.ok) throw new Error(`Error al cargar ${url}: ${res.statusText}`);
          return res.text();
        })
        .then(html => {
          document.querySelector("main").innerHTML = html;
          // 🚀 Aquí invocas la inicialización específica
          if (url === "ultimosCapitulos.html") {
            initUltimosCapitulos();
            console.log(url);
          }
          // other
        })
        .catch(err => console.error("Error:", err));
    });
  });
  //fin enlaces data-target
  // --- 2. Span "Seguir leyendo" ---
    const ultimaObra = localStorage.getItem("ultimaObra");
    const ultimoCapitulo = localStorage.getItem("ultimoCapitulo");
    const ultimaPagina = parseInt(localStorage.getItem("ultimaPagina"), 10);
  console.log(ultimaObra);
  console.log(ultimoCapitulo);
    if (ultimaObra && ultimoCapitulo) {
      const spanSeguir = document.getElementById("btnSeguir");
      if (spanSeguir) {
        //spanSeguir.style.display = "inline-block";
        spanSeguir.addEventListener("click", () => {
          console.log(`Reanudar: ${ultimaObra} / Cap. ${ultimoCapitulo} / Página ${ultimaPagina}`);
          spanSeguir.classList.add("active");
          // Aquí tu lógica para continuar leyendo
          abrirLectorPDF();
        });
      }
    }
  //fin boton seguir leyendo
});
