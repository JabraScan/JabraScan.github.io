import { obtenerResumenObras } from './contadoresGoogle.js'; // Asegúrate de que el nombre coincida con tu archivo de funciones

document.addEventListener("DOMContentLoaded", async () => {
  const canvas = document.getElementById("graficaObras");
  const errorBox = document.getElementById("error");

  try {
    const resumen = await obtenerResumenObras();

    if (!Array.isArray(resumen) || resumen.length === 0) {
      throw new Error("No se encontraron datos.");
    }

    // Extraer datos para la gráfica
    const etiquetas = resumen.map(item => item.obra || item.id);
    const visitasTotales = resumen.map(item => item.visitas || 0);
    const visitasCapitulos = resumen.map(item => item.visitasCapitulos || 0);

    // Crear gráfica con Chart.js
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: "Visitas totales",
            data: visitasTotales,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
            borderWidth: 1
          },
          {
            label: "Visitas capítulos",
            data: visitasCapitulos,
            backgroundColor: "rgba(255, 206, 86, 0.6)",
            borderColor: "rgba(255, 206, 86, 1)",
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Resumen de Obras"
          },
          legend: {
            position: "top"
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  } catch (error) {
    console.error("Error al poblar el HTML:", error);
    if (errorBox) {
      errorBox.textContent = "❌ Error al cargar datos: " + error.message;
      errorBox.classList.remove("hidden");
    }
  }
});
