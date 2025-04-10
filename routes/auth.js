const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { cedula, nombre, apellido, email, password, ministerio } = req.body;
    
    // Validar datos
    if (!cedula || !nombre || !apellido || !email || !password || !ministerio) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Verificar si el usuario ya existe
    db.get('SELECT * FROM usuarios WHERE cedula = ? OR email = ?', [cedula, email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (user) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }
      
      // Encriptar la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insertar el nuevo usuario
      const stmt = db.prepare('INSERT INTO usuarios (cedula, nombre, apellido, email, password, ministerio) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run(cedula, nombre, apellido, email, hashedPassword, ministerio, function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Crear token JWT
        const token = jwt.sign({ id: this.lastID }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // Obtener el usuario recién creado
        db.get('SELECT id, cedula, nombre, apellido, email, ministerio FROM usuarios WHERE id = ?', [this.lastID], (err, user) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          res.status(201).json({
            token,
            user
          });
        });
      });
      stmt.finalize();
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inicio de sesión
router.post('/login', (req, res) => {
  try {
    const { cedula, password } = req.body;
    
    // Validar datos
    if (!cedula || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Buscar el usuario
    db.get('SELECT * FROM usuarios WHERE cedula = ?', [cedula], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!user) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }
      
      // Verificar la contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }
      
      // Crear token JWT
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      // Excluir la contraseña de la respuesta
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        token,
        user: userWithoutPassword
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener perfil del usuario
router.get('/profile', verifyToken, (req, res) => {
  db.get('SELECT id, cedula, nombre, apellido, email, ministerio FROM usuarios WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  });
});

module.exports = router;