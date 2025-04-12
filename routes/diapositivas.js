const express = require('express');
const router = express.Router();
const db = require('../server'); // Use the db from server.js
const verifyToken = require('../middleware/auth');

// Obtener diapositivas guardadas por título y artista
router.get('/diapositivas-guardadas', verifyToken, (req, res) => {
  try {
    const { titulo, artista } = req.query;
    
    if (!titulo || !artista) {
      return res.status(400).json({ error: 'Se requieren título y artista' });
    }
    
    db.get(
      'SELECT * FROM diapositivas_guardadas WHERE titulo = ? AND artista = ?',
      [titulo, artista],
      (err, diapositivas) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!diapositivas) {
          return res.status(404).json({ error: 'No se encontraron diapositivas guardadas' });
        }

        // Parse the diapositivas JSON string
        if (diapositivas.diapositivas) {
            try {
              diapositivas.diapositivas = JSON.parse(diapositivas.diapositivas);
            } catch (e) {
              console.error('Error parsing diapositivas JSON:', e);
            }
          }
        
        res.json(diapositivas);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new route to save diapositivas directly to diapositivas_guardadas
router.post('/guardar', verifyToken, async (req, res) => {
  try {
    const { titulo, artista, diapositivas } = req.body;
    
    if (!titulo || !artista || !diapositivas) {
      return res.status(400).json({ error: 'Se requieren título, artista y diapositivas' });
    }
    
    // Check if this song already exists in diapositivas_guardadas
    db.get(
      'SELECT id FROM diapositivas_guardadas WHERE titulo = ? AND artista = ?',
      [titulo, artista],
      async (err, existingDiapositiva) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        try {
          if (existingDiapositiva) {
            // Update existing record
            await db.run(
              'UPDATE diapositivas_guardadas SET diapositivas = ? WHERE id = ?',
              [JSON.stringify(diapositivas), existingDiapositiva.id]
            );
          } else {
            // Insert new record
            await db.run(
              'INSERT INTO diapositivas_guardadas (titulo, artista, diapositivas) VALUES (?, ?, ?)',
              [titulo, artista, JSON.stringify(diapositivas)]
            );
          }
          
          res.json({ message: 'Diapositivas guardadas correctamente' });
        } catch (error) {
          console.error('Error al guardar diapositivas:', error);
          res.status(500).json({ error: error.message });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;