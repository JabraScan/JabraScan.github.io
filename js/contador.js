import { obtenerResumenObras } from './contadoresGoogle.js';
import { truncarTexto } from './utils.js';

/**
 * 📊 Renderiza dos gráficos horizontales:
 * - Uno con descripciones de obras
 * - Otro con iconos de obras
 */
export async function renderResumenObras() {
  const canvasDescripcion = document.getElementById("graficaObras");
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
    // Crear etiquetas combinadas icono + Obra
    const etiquetasCombinadas = [];   // 🧠 Guardar etiquetas truncadas para el grafico
    const etiquetasCompletas = [];    // 🧠 Guardar etiquetas completas para el tooltip
      resumen.forEach(item => {
        const info = iconosRes[item.obra] || iconosRes["Default"];
        const icono = info.icono || "✨";
        const descripcion = info.descripcion || item.obra || item.id;
        const etiqueta = `${icono} ${truncarTexto(descripcion, 22)}`;
        etiquetasCombinadas.push(etiqueta);
        etiquetasCompletas.push(`${icono} ${descripcion}`);
      });
    // 📈 Gráfico con descripciones
    new Chart(canvasDescripcion, {
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
        maintainAspectRatio: false, // 🔧 Permite que el gráfico se estire verticalmente
        plugins: {
          title: {
            display: true,
            text: "Visitas"
          },
          legend: {
            display: false
          },
          // 🧠 Mostrar tooltip con título completo + visitas
          tooltip: {
            callbacks: {
              label: function(context) {
                const index = context.dataIndex;
                const visitas = context.dataset.data[index];
                return `${etiquetasCompletas[index]}: ${visitas} visitas`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
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
