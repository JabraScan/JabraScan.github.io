import { obtenerResumenObras } from './contadoresGoogle.js';
import { truncarTexto } from './utils.js';


/**
 * 📊 Renderiza dos gráficos horizontales:
 * - Uno con descripciones de obras
 * - Otro con iconos de obras
 */
export async function renderGraficosConIconos() {
  const canvasDescripcion = document.getElementById("graficaDescripcion");
  const canvasIcono = document.getElementById("graficaIcono");
  const errorBox = document.getElementById("error");
  const loader = document.getElementById("loader");

  if (loader) loader.style.display = "block";

  try {
    const [resumen, iconosRes] = await Promise.all([
      obtenerResumenObras(),
      fetch('./iconos.json').then(res => res.json())
    ]);

    if (!Array.isArray(resumen) || resumen.length === 0) {
      throw new Error("No se encontraron datos.");
    }

    // 🔍 Preparar datos
    const visitasTotales = resumen.map(item => (item.visitas || 0) + (item.visitasCapitulos || 0));

    const etiquetasDescripcion = resumen.map(item => {
      const info = iconosRes[item.obra] || iconosRes["Default"];
      return info.descripcion || item.obra || item.id;
    });

    const etiquetasIcono = resumen.map(item => {
      const info = iconosRes[item.obra] || iconosRes["Default"];
      return info.icono || "✨";
    });

    const etiquetasCombinadas =  `${icono} truncarTexto(${descripcion}, 30)`;

    // 📈 Gráfico con descripciones
    new window.Chart(canvasDescripcion, {
      type: "bar",
      data: {
        labels: etiquetasCombinadas,
        datasets: [{
          label: "Visitas totales",
          data: visitasTotales,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Visitas"
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
/*  // 📈 Gráfico con iconos
    new window.Chart(canvasIcono, {
      type: "bar",
      data: {
        labels: etiquetasIcono,
        datasets: [{
          label: "Visitas totales",
          data: visitasTotales,
          backgroundColor: "rgba(255, 159, 64, 0.6)",
          borderColor: "rgba(255, 159, 64, 1)",
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: "Visitas por obra (icono)"
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });*/
  } catch (error) {
    console.error("❌ Error al renderizar gráficos:", error);
    if (errorBox) {
      errorBox.textContent = "❌ Error al cargar datos: " + error.message;
      errorBox.classList.remove("hidden");
    }
  } finally {
    if (loader) loader.style.display = "none";
  }
}
