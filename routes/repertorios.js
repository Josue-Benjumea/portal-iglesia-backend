const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../server');

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

// Crear un nuevo repertorio
router.post('/', verifyToken, (req, res) => {
  try {
    const { fecha_programada, canciones } = req.body;
    
    // Validar datos
    if (!fecha_programada || !canciones || !Array.isArray(canciones) || canciones.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    
    // Verificar que la fecha es válida
    const fechaObj = new Date(fecha_programada);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({ error: 'Formato de fecha inválido' });
    }
    
    // Formatear la fecha para asegurar consistencia en la base de datos
    const fechaFormateada = fechaObj.toISOString().split('T')[0];
    
    // Iniciar transacción
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Insertar el repertorio con la fecha formateada
      const stmtRepertorio = db.prepare('INSERT INTO repertorios (fecha_programada, usuario_id) VALUES (?, ?)');
      stmtRepertorio.run(fechaFormateada, req.user.id, function(err) {
        if (err) {
          console.error('Error al insertar repertorio:', err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        const repertorioId = this.lastID;
        console.log('Repertorio creado con ID:', repertorioId);
        
        // Insertar las canciones
        const stmtCancion = db.prepare('INSERT INTO canciones (repertorio_id, titulo, artista) VALUES (?, ?, ?)');
        
        let cancionesInsertadas = 0;
        let erroresInserciones = false;
        
        canciones.forEach(cancion => {
          stmtCancion.run(repertorioId, cancion.titulo, cancion.artista, function(err) {
            if (err) {
              erroresInserciones = true;
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            
            cancionesInsertadas++;
            
            // Si todas las canciones se han insertado, confirmar la transacción
            if (cancionesInsertadas === canciones.length && !erroresInserciones) {
              db.run('COMMIT');
              res.status(201).json({
                id: repertorioId,
                fecha_programada,
                canciones: canciones.length
              });
            }
          });
        });
        
        stmtCancion.finalize();
      });
      
      stmtRepertorio.finalize();
    });
  } catch (error) {
    db.run('ROLLBACK');
    res.status(500).json({ error: error.message });
  }
});

// Obtener repertorios pendientes
router.get('/pendientes', verifyToken, (req, res) => {
  try {
    // Obtener el ministerio del usuario
    db.get('SELECT ministerio FROM usuarios WHERE id = ?', [req.user.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      // Si es del ministerio de multimedia, obtener todos los repertorios pendientes
      if (user.ministerio === 'Ministerio de multimedia') {
        // Add ORDER BY id DESC to get newest first and ensure we're not getting cached results
        db.all(`
          SELECT r.id, r.fecha_programada, r.estado, u.nombre, u.apellido
          FROM repertorios r
          JOIN usuarios u ON r.usuario_id = u.id
          WHERE r.estado != 'listo'
          ORDER BY r.id DESC
        `, (err, repertorios) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Log the repertorios for debugging
          console.log('Repertorios recuperados:', JSON.stringify(repertorios, null, 2));
          
          res.json(repertorios);
        });
      } else {
        // Si es de otro ministerio, obtener solo sus repertorios
        db.all(`
          SELECT r.id, r.fecha_programada, r.estado
          FROM repertorios r
          WHERE r.usuario_id = ?
          ORDER BY r.id DESC
        `, [req.user.id], (err, repertorios) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.json(repertorios);
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener canciones de un repertorio
router.get('/:id/canciones', verifyToken, (req, res) => {
  try {
    const repertorioId = req.params.id;
    
    // Verificar si el repertorio existe
    db.get('SELECT * FROM repertorios WHERE id = ?', [repertorioId], (err, repertorio) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!repertorio) {
        return res.status(404).json({ error: 'Repertorio no encontrado' });
      }
      
      // Obtener las canciones del repertorio
      db.all('SELECT * FROM canciones WHERE repertorio_id = ?', [repertorioId], (err, canciones) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        res.json(canciones);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar el estado de un repertorio
router.put('/:id/estado', verifyToken, (req, res) => {
  try {
    const repertorioId = req.params.id;
    const { estado } = req.body;
    
    // Validar datos
    if (!estado || !['pendiente', 'en_proceso', 'listo'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    
    // Verificar si el repertorio existe
    db.get('SELECT * FROM repertorios WHERE id = ?', [repertorioId], (err, repertorio) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!repertorio) {
        return res.status(404).json({ error: 'Repertorio no encontrado' });
      }
      
      // Actualizar el estado del repertorio
      db.run('UPDATE repertorios SET estado = ? WHERE id = ?', [estado, repertorioId], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Repertorio no encontrado' });
        }
        
        res.json({
          id: repertorioId,
          estado
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;