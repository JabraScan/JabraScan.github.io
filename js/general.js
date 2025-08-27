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
        })
        .catch(err => console.error("Error:", err));
    });
  });
});
