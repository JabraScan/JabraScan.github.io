document.addEventListener("DOMContentLoaded", function () {
  // Evento para abrir el disclaimer en el main
    document.getElementById('disclaimer-link').addEventListener('click', function (e) {
      e.preventDefault();
      // Usar fetch para cargar el contenido de disclaimer.html
      fetch('disclaimer.html')
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al cargar el archivo: ' + response.statusText);
          }
          return response.text();
        })
        .then(data => {
          document.getElementById('main').innerHTML = data; // Cargar el contenido en el div
        })
        .catch(err => console.error('Error:', err));
    });
});
