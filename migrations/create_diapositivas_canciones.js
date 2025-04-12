const db = require('../server');

// Crear tabla para almacenar diapositivas de canciones
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS diapositivas_canciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cancion_id INTEGER NOT NULL,
      titulo TEXT NOT NULL,
      artista TEXT NOT NULL,
      letra TEXT,
      diapositivas TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(titulo, artista)
    )
  `);
  
  console.log('Tabla diapositivas_canciones creada correctamente');
});