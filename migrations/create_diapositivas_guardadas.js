const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');

// Crear tabla para almacenar diapositivas guardadas
db.run(`
  CREATE TABLE IF NOT EXISTS diapositivas_guardadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    artista TEXT NOT NULL,
    diapositivas TEXT,
    fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(titulo, artista)
  )
`, (err) => {
  if (err) {
    console.error('Error al crear la tabla diapositivas_guardadas:', err.message);
  } else {
    console.log('Tabla diapositivas_guardadas creada correctamente');
  }
  
  // Cerrar la conexión a la base de datos
  db.close();
});