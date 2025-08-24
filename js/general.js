document.addEventListener("DOMContentLoaded", function () {
  // Evento para abrir el disclaimer en el main
    document.getElementById('disclaimer-link').addEventListener('click', function (e) {
      e.preventDefault();
      console.log("general");
      // Usar fetch para cargar el contenido de disclaimer.html
      fetch('disclaimer.html')
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al cargar el archivo: ' + response.statusText);
          }
          return response.text();
        })
        .then(data => {
          document.querySelector('main').innerHTML = data; // Cargar el contenido en el div
        })
        .catch(err => console.error('Error:', err));
    });
});
