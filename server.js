const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const sqlite3 = require('sqlite3').verbose();

// Cargar variables de entorno
dotenv.config();

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['https://iglesiacri.com', 'https://iglesiacri.com/portal', 'http://localhost:4200'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar la base de datos SQLite
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite');
    initializeDatabase();
  }
});

// Inicializar la base de datos
function initializeDatabase() {
  // Add this near the beginning of your server.js file, after initializing the database
  
  // Ensure required tables exist
  db.serialize(() => {
    // Check and create diapositivas table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS diapositivas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cancion_id INTEGER NOT NULL,
        contenido TEXT,
        estilo TEXT,
        orden INTEGER,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cancion_id) REFERENCES canciones(id) ON DELETE CASCADE
      )
    `);
    
    // Check and create diapositivas_canciones table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS diapositivas_canciones (
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
    `);
    
    // Add this new block to create the diapositivas_guardadas table
    db.run(`
      CREATE TABLE IF NOT EXISTS diapositivas_guardadas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        artista TEXT NOT NULL,
        diapositivas TEXT,
        fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(titulo, artista)
      )
    `);
  });

  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cedula TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    ministerio TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Tabla de repertorios
  db.run(`CREATE TABLE IF NOT EXISTS repertorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_programada DATE NOT NULL,
    usuario_id INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
  )`);
  
  // Tabla de canciones
  db.run(`CREATE TABLE IF NOT EXISTS canciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repertorio_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    artista TEXT NOT NULL,
    letra TEXT,
    diapositivas TEXT,
    estado TEXT DEFAULT 'pendiente',
    FOREIGN KEY (repertorio_id) REFERENCES repertorios (id)
  )`);
  
  console.log('Base de datos inicializada');
}

// Exportar la conexión a la base de datos para usarla en las rutas
module.exports = db;

// Rutas
const authRoutes = require('./routes/auth');
const repertorioRoutes = require('./routes/repertorios');
const cancionRoutes = require('./routes/canciones');
const diapositivasRoutes = require('./routes/diapositivas');

app.use('/api/auth', authRoutes);
app.use('/api/repertorios', repertorioRoutes);
app.use('/api/canciones', cancionRoutes);
app.use('/api/diapositivas', diapositivasRoutes);

// Servir archivos estáticos en producción
if (process.env.NODE_ENV === 'production') {
  // Asegúrate de que esta ruta sea correcta para tu caso
  app.use(express.static(path.join(__dirname, './front/dist/frontend/browser')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, './front/dist/frontend/browser/index.csr.html'));
  });
}

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});