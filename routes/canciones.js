const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../server');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware para verificar el token JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

// Buscar canciones usando la API de Lyrics.ovh
router.get('/buscar', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Término de búsqueda requerido' });
    }
    
    // Realizar búsqueda en la API de Lyrics.ovh
    const response = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(q)}`);
    
    // Transformar los resultados al formato esperado por el frontend
    const resultados = response.data.data.map(item => ({
      id: item.id,
      title: item.title,
      artist: { name: item.artist.name },
      album: {
        title: item.album?.title || '',
        cover: item.album?.cover_medium || item.album?.cover || ''
      }
    }));
    
    res.json({ data: resultados });
  } catch (error) {
    console.error('Error al buscar canciones:', error.message);
    
    // Si hay un error con la API, devolver un mensaje amigable
    res.status(500).json({ 
      error: 'Error al buscar canciones. Por favor intente nuevamente más tarde.',
      details: error.message 
    });
  }
});

// Obtener letra de una canción usando la API de Lyrics.ovh
router.get('/letra', verifyToken, async (req, res) => {
  try {
    const { artista, titulo } = req.query;
    
    if (!artista || !titulo) {
      return res.status(400).json({ error: 'Artista y título son requeridos' });
    }
    
    // Realizar búsqueda de letra en la API de Lyrics.ovh
    const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(titulo)}`);
    
    // Verificar si se encontró la letra
    if (response.data && response.data.lyrics) {
      res.json({ lyrics: response.data.lyrics });
    } else {
      res.json({ lyrics: '' });
    }
  } catch (error) {
    console.error('Error al obtener letra de canción:', error.message);
    
    // Si hay un error con la API, devolver un mensaje amigable
    res.status(500).json({ 
      error: 'Error al obtener la letra de la canción. Por favor intente nuevamente más tarde.',
      details: error.message 
    });
  }
});

// Actualizar letra y diapositivas de una canción
router.put('/:id/letra', verifyToken, (req, res) => {
  try {
    const cancionId = req.params.id;
    const { letra, diapositivas } = req.body;
    
    // Verificar si la canción existe
    db.get('SELECT * FROM canciones WHERE id = ?', [cancionId], (err, cancion) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!cancion) {
        return res.status(404).json({ error: 'Canción no encontrada' });
      }
      
      // Actualizar la letra y diapositivas de la canción
      db.run(
        'UPDATE canciones SET letra = ?, diapositivas = ?, estado = ? WHERE id = ?',
        [letra, JSON.stringify(diapositivas), 'lista', cancionId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Canción no encontrada' });
          }
          
          res.json({
            id: cancionId,
            letra,
            diapositivas,
            estado: 'lista'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/backgrounds');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'bg-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
  }
});

// Upload background image for slides
router.post('/upload-background', verifyToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
    }
    
    // Return the path to the uploaded file
    const imagePath = `/uploads/backgrounds/${req.file.filename}`;
    res.json({ 
      success: true, 
      imagePath: imagePath 
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the existing route to handle enhanced slide properties
router.put('/:id/letra', verifyToken, (req, res) => {
  try {
    const cancionId = req.params.id;
    const { letra, diapositivas, recursos } = req.body;
    
    // Verificar si la canción existe
    db.get('SELECT * FROM canciones WHERE id = ?', [cancionId], (err, cancion) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!cancion) {
        return res.status(404).json({ error: 'Canción no encontrada' });
      }
      
      // Actualizar la letra, diapositivas y recursos de la canción
      db.run(
        'UPDATE canciones SET letra = ?, diapositivas = ?, recursos = ?, estado = ? WHERE id = ?',
        [letra, JSON.stringify(diapositivas), JSON.stringify(recursos || {}), 'lista', cancionId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Canción no encontrada' });
          }
          
          res.json({
            id: cancionId,
            letra,
            diapositivas,
            recursos,
            estado: 'lista'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;