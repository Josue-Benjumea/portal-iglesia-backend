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

// Update the route that updates repertoire status
router.put('/:id/estado', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!estado) {
      return res.status(400).json({ error: 'Estado es requerido' });
    }
    
    // Update the repertoire status
    db.run(
      'UPDATE repertorios SET estado = ? WHERE id = ?',
      [estado, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Repertorio no encontrado' });
        }
        
        res.json({ 
          id, 
          estado,
          mensaje: 'Estado del repertorio actualizado correctamente' 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

     // Update the route that gets ready repertoires
        router.get('/listos', verifyToken, (req, res) => {
          try {
            // Modify the SQL query to correctly filter by estado='listo'
            db.all(`
              SELECT r.*, u.nombre, u.apellido 
              FROM repertorios r
              JOIN usuarios u ON r.usuario_id = u.id
              WHERE r.estado = 'listo'
              ORDER BY r.fecha_programada DESC
            `, [], (err, rows) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              res.json(rows);
            });
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
        });
      

      
// Ruta para eliminar un repertorio
router.delete('/:id', verifyToken, async (req, res) => {
  const repertorioId = req.params.id;
  
  try {
    // Primero, verificamos si el repertorio existe
    const repertorio = await db.get('SELECT * FROM repertorios WHERE id = ?', [repertorioId]);
    
    if (!repertorio) {
      return res.status(404).json({ error: 'Repertorio no encontrado' });
    }
    
    // Obtenemos todas las canciones con sus diapositivas
    const canciones = await db.all('SELECT id, titulo, artista, diapositivas FROM canciones WHERE repertorio_id = ?', [repertorioId]);
    
    // Verificamos si canciones es un array y tiene elementos
    if (Array.isArray(canciones) && canciones.length > 0) {
      // Para cada canción, guardamos sus diapositivas en la tabla de diapositivas_guardadas
      for (const cancion of canciones) {
        if (cancion.diapositivas) {
          try {
            // Verificamos si ya existe una entrada para esta canción
            const existente = await db.get(
              'SELECT id FROM diapositivas_guardadas WHERE titulo = ? AND artista = ?', 
              [cancion.titulo, cancion.artista]
            );
            
            if (existente) {
              // Actualizamos las diapositivas existentes
              await db.run(
                'UPDATE diapositivas_guardadas SET diapositivas = ? WHERE id = ?',
                [cancion.diapositivas, existente.id]
              );
            } else {
              // Insertamos nuevas diapositivas
              await db.run(
                'INSERT INTO diapositivas_guardadas (titulo, artista, diapositivas) VALUES (?, ?, ?)',
                [cancion.titulo, cancion.artista, cancion.diapositivas]
              );
            }
          } catch (error) {
            console.error(`Error al guardar diapositivas para canción ${cancion.id}:`, error);
          }
        }
      }
    }
    
    // Eliminamos el repertorio
    await db.run('DELETE FROM repertorios WHERE id = ?', [repertorioId]);
    
    res.json({ message: 'Repertorio eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar repertorio:', error);
    res.status(500).json({ error: error.message });
  }
});

      // Obtener una canción específica de un repertorio
router.get('/:repertorioId/canciones/:cancionId', verifyToken, (req, res) => {
  try {
    const { repertorioId, cancionId } = req.params;
    
    // Verificar si el repertorio existe
    db.get('SELECT * FROM repertorios WHERE id = ?', [repertorioId], (err, repertorio) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!repertorio) {
        return res.status(404).json({ error: 'Repertorio no encontrado' });
      }
      
      // Obtener la canción específica
      db.get('SELECT * FROM canciones WHERE repertorio_id = ? AND id = ?', [repertorioId, cancionId], (err, cancion) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!cancion) {
          return res.status(404).json({ error: 'Canción no encontrada' });
        }
        
        res.json(cancion);
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;