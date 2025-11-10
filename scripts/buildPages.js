const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

function parseObras(xmlText) {
  const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
  const doc = parser.parse(xmlText);

  // Recoge todas las <obra>
  const obras = Array.isArray(doc.obras?.obra) ? doc.obras.obra : [doc.obras?.obra || doc.obra].filter(Boolean);

  return obras.map(o => {
    const clave = o.clave || "sin-clave";

    // Si hay múltiples <nombreobra>, fast-xml-parser devuelve array
    const titles = Array.isArray(o.nombreobra) ? o.nombreobra : [o.nombreobra].filter(Boolean);
    const titlePrincipal = titles[0] || "Obra sin título";
    const titlesAlternativos = titles.slice(1);

    const author = o.autor || "";
    const description = o.sinopsis || "";

    // Ajustar imágenes a /img/
    const imagenes = Array.isArray(o.imagen) ? o.imagen : (o.imagen ? [o.imagen] : []);
    const imagenesConRuta = imagenes.map(img => `/img/${img}`);
    return {
      // ...
      image: imagenesConRuta[0] || "",
      galeria: imagenesConRuta.map(img => `<img src="${img}" alt="Imagen de ${titlePrincipal}" style="max-width:150px;">`).join("\n")
    };

    const aprobadaAutor = (o.aprobadaAutor || "").toLowerCase() === "si";
    const discord = o.discord || "";

    const url = `https://jabrascan.net/books/${clave}.html`;

    return {
      clave,
      titlePrincipal,
      titlesAlternativos,
      author,
      description,
      image,
      url,
      aprobadaAutor,
      discord,
      tipoobra: o.tipoobra || "",
      categoria: o.categoria || "",
      fechaCreacion: o.fechaCreacion || "",
      ubicacion: o.ubicacion || "",
      traductor: o.traductor || "",
      wiki: o.wiki ? `<p><a href="${o.wiki}">Wiki</a></p>` : ""
    };
  });
}

function renderTemplate(tpl, data) {
  // Sustituye cada marcador {{...}} por el valor correspondiente
  let html = tpl
    .replace(/{{titlePrincipal}}/g, data.titlePrincipal)
    .replace(/{{description}}/g, data.description || "")
    .replace(/{{author}}/g, data.author || "")
    .replace(/{{image}}/g, data.image || "")
    .replace(/{{url}}/g, data.url)
    .replace(/{{clave}}/g, data.clave)
    .replace(/{{tipoobra}}/g, data.tipoobra)
    .replace(/{{categoria}}/g, data.categoria)
    .replace(/{{fechaCreacion}}/g, data.fechaCreacion)
    .replace(/{{ubicacion}}/g, data.ubicacion)
    .replace(/{{traductor}}/g, data.traductor)
    .replace(/{{wiki}}/g, data.wiki);

  // Bloque de aprobación/discord
  if (data.aprobadaAutor) {
    const extra = `<p><strong>Aprobado por el autor</strong></p>` +
                  (data.discord ? `<p><a href="${data.discord}">Discord</a></p>` : "");
    html = html.replace("{{aprobacion}}", extra);
  } else {
    html = html.replace("{{aprobacion}}", "");
  }

  // Galería de imágenes (si la añadimos en el template)
  html = html.replace(/{{galeria}}/g, data.galeria || "");

  return html;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const tplPath = 'books/templateObra.html';
  if (!fs.existsSync(tplPath)) {
    console.error(`No se encontró la plantilla en ${tplPath}`);
    process.exit(1);
  }
  const tpl = fs.readFileSync(tplPath, 'utf8');
  const xml = fs.readFileSync('obras.xml', 'utf8');

  const obras = parseObras(xml);

  ensureDir('books');

  obras.forEach(obra => {
    const filePath = `books/${obra.clave}.html`;
    // ✅ Solo crea si no existe
    //if (!fs.existsSync(filePath)) 
    {
      const html = renderTemplate(tpl, obra);
      fs.writeFileSync(filePath, html, 'utf8');
      //console.log(`Generado: ${filePath}`);
    } 
    //else {
    //  console.log(`Saltado (ya existe): ${filePath}`);
    //}
  });

  // Generar sitemap.xml (siempre se actualiza)
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>https://jabrascan.net/</loc></url>\n` +
    obras.map(o => `  <url><loc>${o.url}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync('sitemap.xml', sitemap, 'utf8');
  //console.log(`Sitemap actualizado con ${obras.length} URLs.`);
}

main();
