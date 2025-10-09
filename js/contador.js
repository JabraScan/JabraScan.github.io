//import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
import { obtenerResumenObras } from './contadoresGoogle.js'; // Asegúrate de que el nombre coincida con tu archivo de funciones

/**
 * 📊 Renderiza la gráfica de resumen de obras en el canvas #graficaObras
 */
export async function renderResumenObras() {
  const canvas = document.getElementById("graficaObras");
  const errorBox = document.getElementById("error");

  try {
    const resumen = await obtenerResumenObras();

    if (!Array.isArray(resumen) || resumen.length === 0) {
      throw new Error("No se encontraron datos.");
    }
    // 🎯 Extraer datos para la gráfica
    const etiquetas = resumen.map(item => item.obra || item.id);
    //const visitasTotales = resumen.map(item => item.visitas || 0);
    //const visitasCapitulos = resumen.map(item => item.visitasCapitulos || 0);

    const visitasTotales = resumen.map(item => item.visitas || 0) + resumen.map(item => item.visitasCapitulos || 0);

    // 📈 Crear gráfica con Chart.js
    /*barras verticales
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: etiquetas,
        datasets: [
          {
            label: "Visitas",
            data: visitasTotales,
            backgroundColor: "rgba(54, 162, 235, 0.6)",
            borderColor: "rgba(54, 162, 235, 1)",
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
    });*/
    //barras horizontales
    new window.Chart(canvas, {
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
    console.error("❌ Error al renderizar resumen:", error);
    if (errorBox) {
      errorBox.textContent = "❌ Error al cargar datos: " + error.message;
      errorBox.classList.remove("hidden");
    }
  } finally {
    if (loader) loader.style.display = "none"; // ✅ Ocultar loader al terminar
  }
}
