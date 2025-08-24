document.addEventListener("DOMContentLoaded", function () {
  // Evento para abrir el disclaimer en el main
    document.getElementById('disclaimer-link').addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('main').innerHTML = "disclaimer.html";
    });
});
