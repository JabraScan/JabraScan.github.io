fetch('/books/CDMNQTMHC.json')
  .then(res => res.json())
  .then(data => {
    const clave = 'CDMNQTMHC';
    const lista = document.getElementById('lista-capitulos');
    const capitulos = data[clave];

    capitulos.slice().reverse().forEach(cap => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>Capítulo ${cap.numCapitulo}:</strong> ${cap.nombreCapitulo} 
        <em>(${cap.Fecha})</em> 
        <a href="/pdfs/${clave}/${cap.NombreArchivo}" target="_blank">📖 Leer PDF</a>
      `;
      lista.appendChild(li);
    });
  });
