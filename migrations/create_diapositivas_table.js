const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Create the diapositivas table
db.serialize(() => {
  // First check if the table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='diapositivas'", (err, row) => {
    if (err) {
      console.error('Error checking for diapositivas table:', err.message);
      return;
    }
    
    // If the table doesn't exist, create it
    if (!row) {
      console.log('Creating diapositivas table...');
      
      db.run(`
        CREATE TABLE diapositivas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cancion_id INTEGER NOT NULL,
          contenido TEXT,
          estilo TEXT,
          orden INTEGER,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating diapositivas table:', err.message);
        } else {
          console.log('Diapositivas table created successfully');
        }
      });
    } else {
      console.log('Diapositivas table already exists');
    }
  });
  
  // Also check for diapositivas_canciones table
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='diapositivas_canciones'", (err, row) => {
    if (err) {
      console.error('Error checking for diapositivas_canciones table:', err.message);
      return;
    }
    
    // If the table doesn't exist, create it
    if (!row) {
      console.log('Creating diapositivas_canciones table...');
      
      db.run(`
        CREATE TABLE diapositivas_canciones (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cancion_id INTEGER NOT NULL,
          titulo TEXT NOT NULL,
          artista TEXT NOT NULL,
          letra TEXT,
          diapositivas TEXT,
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating diapositivas_canciones table:', err.message);
        } else {
          console.log('Diapositivas_canciones table created successfully');
        }
      });
    } else {
      console.log('Diapositivas_canciones table already exists');
    }
  });
});

// Close the database connection when done
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}, 1000);