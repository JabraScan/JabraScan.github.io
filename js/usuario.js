// Verificar si Bootstrap CSS ya está cargado
const bootstrapCSS = Array.from(document.styleSheets)
  .some(sheet => sheet.href && sheet.href.includes("bootstrap"));

if (!bootstrapCSS) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
  document.head.appendChild(link);
}

// Verificar si Bootstrap JS ya está cargado
const bootstrapJS = Array.from(document.scripts)
  .some(script => script.src && script.src.includes("bootstrap"));

if (!bootstrapJS) {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
  document.body.appendChild(script);
}
