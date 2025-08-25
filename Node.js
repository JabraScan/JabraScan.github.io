const fs = require("fs");
const path = require("path");

const booksDir = path.join(__dirname, "books");
const booksData = {};

fs.readdirSync(booksDir).forEach(folder => {
  const folderPath = path.join(booksDir, folder);
  if (fs.statSync(folderPath).isDirectory()) {
    const pdfs = fs.readdirSync(folderPath).filter(file =>
      file.toLowerCase().endsWith(".pdf")
    );
    booksData[folder] = pdfs;
  }
});

fs.writeFileSync("books.json", JSON.stringify(booksData, null, 2), "utf-8");
console.log("Archivo books.json generado correctamente.");
