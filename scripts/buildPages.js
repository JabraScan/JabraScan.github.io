const fs = require('fs');
const crypto = require('crypto');

function normalizarFecha(fecha) {
  if (!fecha) return "";
  const p = fecha.split("/");
  return p.length === 3 ? `${p[2]}-${p[1].padStart(2,"0")}-${p[0].padStart(2,"0")}` : fecha;
}

function parseObras(xmlText) {
  const blocks = [...xmlText.matchAll(/<obra>([\s\S]*?)<\/obra>/g)].map(m => m[1]);
  return blocks.map(block => {
    const get = (tag) => block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() || "";
    const nombres = [...block.matchAll(/<nombreobra>([\s\S]*?)<\/nombreobra>/g)].map(x => x[1].trim()).filter(Boolean);
    const title = nombres[0] || "Obra";
    const clave = get("clave") || title.toLowerCase().replace(/\s+/g, "-");
    const author = get("autor");
    const description = get("sinopsis");
    const image = get("imagen") || "default.jpg";
    const dateCreated = normalizarFecha(get("fechaCreacion"));
    const categorias = (get("categoria") || "").split(",").map(c => c.trim()).filter(Boolean);

    const url = `https://jabrascan.net/books/${clave}.html`;

    const jsonld = {
      "@context": "https://schema.org",
      "@type": "Book",
      "@id": url,
      "url": url,
      "name": title,
      ...(author ? { "author": { "@type": "Person", "name": author } } : {}),
      ...(description ? { "description": description } : {}),
      ...(image ? { "image": image } : {}),
      ...(dateCreated ? { "dateCreated": dateCreated } : {}),
      ...(clave ? { "identifier": clave } : {}),
      ...(categorias.length ? { "genre": categorias } : {})
    };

    return { title, clave, author, description, image, url, jsonld };
  });
}

function renderTemplate(tpl, data) {
  return tpl
    .replace(/{{title}}/g, data.title)
    .replace(/{{description}}/g, data.description || "")
    .replace(/{{author}}/g, data.author || "")
    .replace(/{{image}}/g, data.image || "")
    .replace(/{{url}}/g, data.url)
    .replace(/{{clave}}/g, data.clave)
    .replace(/{{jsonld}}/g, JSON.stringify(data.jsonld, null, 2));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const xml = fs.readFileSync('obras.xml', 'utf8');
  const obras = parseObras(xml);
  const tpl = fs.readFileSync('books/templateObra.html', 'utf8');

  ensureDir('books');

  obras.forEach(obra => {
    const filePath = `books/${obra.clave}.html`;
    if (!fs.existsSync(filePath)) {
      const html = renderTemplate(tpl, obra);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`Generado: ${filePath}`);
    } else {
      console.log(`Ya existe: ${filePath}, no se regenera`);
    }
  });

  // Generar sitemap.xml
  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url><loc>https://jabrascan.net/</loc></url>\n` +
    obras.map(o => `  <url><loc>${o.url}</loc></url>`).join('\n') +
    `\n</urlset>\n`;

  fs.writeFileSync('sitemap.xml', sitemap, 'utf8');

  console.log(`Generadas/actualizadas ${obras.length} páginas en /books y sitemap.xml.`);
}

main();
